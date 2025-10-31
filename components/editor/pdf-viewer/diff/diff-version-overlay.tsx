"use client"

import React from "react"

import {annotationService} from "@/lib/db/annotations"
import {textEditService} from "@/lib/db/text-edits"
import {useEditorActions, useGetVersionsByDocumentQuery} from "@/lib/store/api"
import type {Annotation, AnnotationDiff, TextEdit} from "@/lib/types"
import {areAnnotationsDifferent} from "@/lib/utils/annotations"

import {DiffItem, DiffOverlay} from "./diff-overlay"

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
  const {editor} = useEditorActions(documentId)
  const isDiffMode = editor?.isDiffMode || false
  const compareVersionIds = React.useMemo(() => editor?.compareVersionIds || [], [editor?.compareVersionIds])
  const currentPage = editor?.currentPage || 1

  // Get versions for diff comparison
  const {data: versions = []} = useGetVersionsByDocumentQuery(documentId, {skip: !documentId || !isDiffMode})
  const [oldestVersion, latestVersion] = React.useMemo(() => {
    const [a, b] = [
      versions.find(v => v.id === compareVersionIds[0]),
      versions.find(v => v.id === compareVersionIds[1]),
    ]
    if (!a || !b) {
      return [undefined, undefined]
    }
    return a.versionNumber <= b.versionNumber ? [a, b] : [b, a]
  }, [versions, compareVersionIds])

  const [diffItems, setDiffItems] = React.useState<DiffItem[]>([])

  // Track the last processed version comparison to avoid infinite re-renders
  const lastProcessedComparison = React.useRef<string | null>(null)

  // Helpers
  const buildAnnotationItems = React.useCallback((diffs: AnnotationDiff[], untouched: Annotation[]) => {
    const items: DiffItem[] = []
    for (const d of diffs) {
      const a = d.annotation
      items.push({
        id: a.id,
        pageNumber: a.pageNumber,
        x: a.x,
        y: a.y,
        width: a.width,
        height: a.height,
        annotationType: d.type,
      })
    }
    for (const a of untouched) {
      items.push({
        id: a.id,
        pageNumber: a.pageNumber,
        x: a.x,
        y: a.y,
        width: a.width,
        height: a.height,
        annotationType: "untouched",
      })
    }
    return items
  }, [])

  const buildTextEditItems = React.useCallback((edits: ({annotationType: AnnotationDiff["type"]} & TextEdit)[]) => {
    const items: DiffItem[] = []
    for (const te of edits) {
      items.push({
        id: te.id,
        pageNumber: te.pageNumber,
        x: te.x,
        y: te.y,
        width: Math.max(te.width, 20),
        height: te.height + 5,
        annotationType: te.annotationType,
      })
    }
    return items
  }, [])

  React.useEffect(() => {
    if (!isDiffMode || !oldestVersion || !latestVersion) {
      setDiffItems([])
      lastProcessedComparison.current = null
      return
    }

    const comparisonKey = `${oldestVersion.id}-${latestVersion.id}`

    // Skip if we've already processed this comparison
    if (lastProcessedComparison.current === comparisonKey) {
      return
    }

    if (!oldestVersion || !latestVersion) {
      setDiffItems([])
      return
    }

    // Mark this comparison as being processed
    lastProcessedComparison.current = comparisonKey

    const calculateDiffs = async () => {
      try {
        const [ann1Res, ann2Res] = await Promise.all([
          annotationService.getAnnotationsByVersion(oldestVersion.id),
          annotationService.getAnnotationsByVersion(latestVersion.id),
        ])
        const annotations1 = ann1Res.success ? ann1Res.data : []
        const annotations2 = ann2Res.success ? ann2Res.data : []

        const annDiffs: AnnotationDiff[] = []
        const annUntouched: Annotation[] = []
        for (const a2 of annotations2) {
          const a1 = annotations1.find(x => x.originalId === a2.originalId)
          if (!a1) {
            annDiffs.push({id: a2.id, type: "added", annotation: a2})
          } else if (areAnnotationsDifferent(a1, a2)) {
            annDiffs.push({id: a2.id, type: "modified", annotation: a2, oldAnnotation: a1})
          } else {
            annUntouched.push(a2)
          }
        }
        for (const a1 of annotations1) {
          const existsLater = annotations2.find(a2 => a2.originalId === a1.originalId)
          if (!existsLater) {
            annDiffs.push({id: a1.id, type: "removed", annotation: a1})
          }
        }

        let itemsFromAnnotations: DiffItem[] = buildAnnotationItems(annDiffs, annUntouched)

        // Text edit diffs using originalId
        const [te1Res, te2Res] = await Promise.all([
          textEditService.getTextEditsByVersion(oldestVersion.id),
          textEditService.getTextEditsByVersion(latestVersion.id),
        ])
        const textEdits1 = te1Res.success ? te1Res.data : []
        const textEdits2 = te2Res.success ? te2Res.data : []

        const teDiffs: ({annotationType: AnnotationDiff["type"]} & TextEdit)[] = []
        const teUntouched: ({annotationType: AnnotationDiff["type"]} & TextEdit)[] = []

        for (const e2 of textEdits2) {
          const e1 = textEdits1.find(x => (x.originalId || x.id) === (e2.originalId || e2.id))
          if (!e1) {
            teDiffs.push({...e2, annotationType: "added"})
          } else if (
            e1.x !== e2.x ||
            e1.y !== e2.y ||
            e1.width !== e2.width ||
            e1.height !== e2.height ||
            e1.newText !== e2.newText ||
            e1.originalText !== e2.originalText ||
            e1.operation !== e2.operation
          ) {
            teDiffs.push({...e2, annotationType: "modified"})
          } else {
            teUntouched.push({...e2, annotationType: "untouched"})
          }
        }
        for (const e1 of textEdits1) {
          const existsLater = textEdits2.find(e2 => (e2.originalId || e2.id) === (e1.originalId || e1.id))
          if (!existsLater) {
            teDiffs.push({
              ...e1,
              annotationType: "removed",
              versionId: latestVersion.id,
              id: e1.id,
            })
          }
        }

        const textEditItems = buildTextEditItems(teDiffs).concat(buildTextEditItems(teUntouched))
        const mergedItems = itemsFromAnnotations.concat(textEditItems)

        setDiffItems(mergedItems)
      } catch (error) {
        console.error("Error calculating diffs:", error)
        setDiffItems([])
      }
    }

    calculateDiffs()
  }, [isDiffMode, oldestVersion, latestVersion, compareVersionIds, buildAnnotationItems, buildTextEditItems])

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
      diffItems={diffItems}
      scale={scale}
      viewportWidth={pageWidth}
      viewportHeight={pageHeight}
    />
  )
}
