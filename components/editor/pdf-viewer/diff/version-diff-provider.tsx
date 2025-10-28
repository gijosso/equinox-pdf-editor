"use client"

import React from "react"

import {annotationService} from "@/lib/db/annotations"
import {useEditorActions, useGetVersionsByDocumentQuery} from "@/lib/store/api"
import type {Annotation, AnnotationDiff, PDFVersion, TextDiff} from "@/lib/types"
import {areAnnotationsDifferent} from "@/lib/utils/annotations"

interface VersionDiffProviderProps {
  documentId: string
  isDiffMode: boolean
  compareVersionIds: string[]
  children: (args: {
    version1: PDFVersion | undefined
    version2: PDFVersion | undefined
    textDiffs: TextDiff[]
    annotationDiffs: AnnotationDiff[]
    untouchedAnnotations: Annotation[]
    handleCloseDiff: () => Promise<void>
  }) => React.ReactNode
}

export function VersionDiffProvider({documentId, isDiffMode, compareVersionIds, children}: VersionDiffProviderProps) {
  const {setDiffMode} = useEditorActions(documentId)

  // Get versions for diff comparison
  const {data: versions = []} = useGetVersionsByDocumentQuery(documentId, {skip: !documentId || !isDiffMode})
  const version1 = React.useMemo(() => versions.find(v => v.id === compareVersionIds[0]), [versions, compareVersionIds])
  const version2 = React.useMemo(() => versions.find(v => v.id === compareVersionIds[1]), [versions, compareVersionIds])

  const [textDiffs, setTextDiffs] = React.useState<TextDiff[]>([])
  const [annotationDiffs, setAnnotationDiffs] = React.useState<AnnotationDiff[]>([])
  const [untouchedAnnotations, setUntouchedAnnotations] = React.useState<Annotation[]>([])

  // Track the last processed version comparison to avoid infinite re-renders
  const lastProcessedComparison = React.useRef<string | null>(null)

  // Calculate diffs when in diff mode
  React.useEffect(() => {
    if (!isDiffMode || !compareVersionIds[0] || !compareVersionIds[1]) {
      setTextDiffs([])
      setAnnotationDiffs([])
      setUntouchedAnnotations([])
      lastProcessedComparison.current = null
      return
    }

    const comparisonKey = `${compareVersionIds[0]}-${compareVersionIds[1]}`

    // Skip if we've already processed this comparison
    if (lastProcessedComparison.current === comparisonKey) {
      return
    }

    if (!version1 || !version2) {
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
          annotationService.getAnnotationsByVersion(version1.id),
          annotationService.getAnnotationsByVersion(version2.id),
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

        // Since we're using annotation-only commits, PDF content is preserved
        // No text diffs needed as the original PDF content remains unchanged
        setTextDiffs([])
      } catch (error) {
        console.error("Error calculating diffs:", error)
        setTextDiffs([])
        setAnnotationDiffs([])
        setUntouchedAnnotations([])
      }
    }

    calculateDiffs()
  }, [isDiffMode, compareVersionIds, version1, version2])

  const handleCloseDiff = React.useCallback(async () => {
    await setDiffMode(false, [])
  }, [setDiffMode])

  return <>{children({version1, version2, textDiffs, annotationDiffs, untouchedAnnotations, handleCloseDiff})}</>
}
