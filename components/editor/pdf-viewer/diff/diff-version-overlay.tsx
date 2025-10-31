"use client"

import React from "react"

import {annotationService} from "@/lib/db/annotations"
import {textEditService} from "@/lib/db/text-edits"
import {useEditorActions, useGetVersionsByDocumentQuery} from "@/lib/store/api"
import type {Annotation, AnnotationDiff, TextDiff, TextEdit} from "@/lib/types"
import {areAnnotationsDifferent} from "@/lib/utils/annotations"

import {DiffOverlay} from "./diff-overlay"

interface VersionDiffOverlayProps {
  documentId: string
  scale: number
  pageWidth: number
  pageHeight: number
  renderHeader?: boolean
  renderOverlay?: boolean
}

export function DiffVersionOverlay({
  documentId,
  scale,
  pageWidth,
  pageHeight,
  renderHeader = false,
  renderOverlay = false,
}: VersionDiffOverlayProps) {
  const {setDiffMode, editor} = useEditorActions(documentId)
  const isDiffMode = editor?.isDiffMode || false
  const compareVersionIds = editor?.compareVersionIds || []
  const currentPage = editor?.currentPage || 1

  // Get versions for diff comparison
  const {data: versions = []} = useGetVersionsByDocumentQuery(documentId, {skip: !documentId || !isDiffMode})
  const [oldestVersion, latestVersion] = React.useMemo(() => {
    const v1 = versions.find(v => v.id === compareVersionIds[0])
    const v2 = versions.find(v => v.id === compareVersionIds[1])
    return [v1, v2]
  }, [versions, compareVersionIds])

  const [textDiffs, setTextDiffs] = React.useState<TextDiff[]>([])
  const [annotationDiffs, setAnnotationDiffs] = React.useState<AnnotationDiff[]>([])
  const [untouchedAnnotations, setUntouchedAnnotations] = React.useState<Annotation[]>([])
  const [textEditDiffs, setTextEditDiffs] = React.useState<Array<{type: AnnotationDiff["type"]; edit: TextEdit}>>([])
  const [untouchedTextEdits, setUntouchedTextEdits] = React.useState<TextEdit[]>([])

  // Track the last processed version comparison to avoid infinite re-renders
  const lastProcessedComparison = React.useRef<string | null>(null)

  React.useEffect(() => {
    if (!isDiffMode || !oldestVersion || !latestVersion) {
      setTextDiffs([])
      setAnnotationDiffs([])
      setUntouchedAnnotations([])
      lastProcessedComparison.current = null
      return
    }

    const comparisonKey = `${oldestVersion.id}-${latestVersion.id}`

    // Skip if we've already processed this comparison
    if (lastProcessedComparison.current === comparisonKey) {
      return
    }

    if (!oldestVersion || !latestVersion) {
      setTextDiffs([])
      setAnnotationDiffs([])
      setUntouchedAnnotations([])
      return
    }

    // Mark this comparison as being processed
    lastProcessedComparison.current = comparisonKey

    const calculateDiffs = async () => {
      try {
        const [annotations1Result, annotations2Result] = await Promise.all([
          annotationService.getAnnotationsByVersion(oldestVersion.id),
          annotationService.getAnnotationsByVersion(latestVersion.id),
        ])

        const annotations1 = annotations1Result.success ? annotations1Result.data : []
        const annotations2 = annotations2Result.success ? annotations2Result.data : []

        const calculatedAnnotationDiffs: AnnotationDiff[] = []
        const calculatedUntouchedAnnotations: Annotation[] = []

        // Find added annotations (new originalIds in version2)
        annotations2.forEach(ann2 => {
          const found = annotations1.find(ann1 => ann1.originalId === ann2.originalId)
          if (!found) {
            calculatedAnnotationDiffs.push({
              id: ann2.id,
              type: "added",
              annotation: ann2,
            })
          } else if (areAnnotationsDifferent(found, ann2)) {
            calculatedAnnotationDiffs.push({
              id: ann2.id,
              type: "modified",
              annotation: ann2,
              oldAnnotation: found,
            })
          } else {
            calculatedUntouchedAnnotations.push(ann2)
          }
        })

        // Find removed annotations (originalIds that exist in version1 but not in version2)
        annotations1.forEach(ann1 => {
          const found = annotations2.find(ann2 => ann2.originalId === ann1.originalId)
          if (!found) {
            calculatedAnnotationDiffs.push({
              id: ann1.id,
              type: "removed",
              annotation: ann1,
            })
          }
        })

        setAnnotationDiffs(calculatedAnnotationDiffs)
        setUntouchedAnnotations(calculatedUntouchedAnnotations)

        // Text edit diffs using originalId
        const [textEdits1Result, textEdits2Result] = await Promise.all([
          textEditService.getTextEditsByVersion(oldestVersion.id),
          textEditService.getTextEditsByVersion(latestVersion.id),
        ])

        const textEdits1 = textEdits1Result.success ? textEdits1Result.data : []
        const textEdits2 = textEdits2Result.success ? textEdits2Result.data : []

        const calculatedTextEditDiffs: Array<{type: AnnotationDiff["type"]; edit: TextEdit}> = []
        const calculatedUntouchedTextEdits: TextEdit[] = []

        textEdits2.forEach(e2 => {
          const found = textEdits1.find(e1 => (e1.originalId || e1.id) === (e2.originalId || e2.id))
          if (!found) {
            calculatedTextEditDiffs.push({type: "added", edit: e2})
          } else if (
            found.x !== e2.x ||
            found.y !== e2.y ||
            found.width !== e2.width ||
            found.height !== e2.height ||
            found.newText !== e2.newText ||
            found.originalText !== e2.originalText ||
            found.operation !== e2.operation
          ) {
            calculatedTextEditDiffs.push({type: "modified", edit: e2})
          } else {
            calculatedUntouchedTextEdits.push(e2)
          }
        })

        textEdits1.forEach(e1 => {
          const found = textEdits2.find(e2 => (e2.originalId || e2.id) === (e1.originalId || e1.id))
          if (!found) {
            calculatedTextEditDiffs.push({type: "removed", edit: e1})
          }
        })

        setTextEditDiffs(calculatedTextEditDiffs)
        setUntouchedTextEdits(calculatedUntouchedTextEdits)

        // Since we're using annotation-only commits, PDF content is preserved
        // No text diffs needed as the original PDF content remains unchanged
        setTextDiffs([])
      } catch (error) {
        console.error("Error calculating diffs:", error)
        setTextDiffs([])
        setAnnotationDiffs([])
        setUntouchedAnnotations([])
        setTextEditDiffs([])
        setUntouchedTextEdits([])
      }
    }

    calculateDiffs()
  }, [isDiffMode, oldestVersion, latestVersion])

  const handleCloseDiff = React.useCallback(async () => {
    await setDiffMode(false, [])
  }, [setDiffMode])

  // Header bar should only render when diff mode is active and renderHeader is true
  const showHeader = renderHeader && isDiffMode && compareVersionIds.length === 2 && oldestVersion && latestVersion

  // Diff overlay should only render when diff mode is active, page dimensions are available, and renderOverlay is true
  const showDiffOverlay =
    renderOverlay &&
    isDiffMode &&
    compareVersionIds.length === 2 &&
    oldestVersion &&
    latestVersion &&
    pageWidth > 0 &&
    pageHeight > 0

  if (!showHeader && !showDiffOverlay) {
    return null
  }

  return (
    <DiffOverlay
      pageNumber={currentPage}
      textDiffs={textDiffs}
      annotationDiffs={annotationDiffs}
      untouchedAnnotations={untouchedAnnotations}
      textEditDiffs={textEditDiffs}
      untouchedTextEdits={untouchedTextEdits}
      scale={scale}
      viewportWidth={pageWidth}
      viewportHeight={pageHeight}
    />
  )
}
