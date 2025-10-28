"use client"

import {X} from "lucide-react"
import React from "react"
import {Document, Page} from "react-pdf"
import "react-pdf/dist/Page/AnnotationLayer.css"
import "react-pdf/dist/Page/TextLayer.css"

import {LazySearchHighlights} from "@/components/lazy"
import {usePDFBlob} from "@/hooks/use-pdf-blob"
import {annotationService} from "@/lib/db/annotations"
import {setupPDFWorker} from "@/lib/pdf-worker-setup"
import {
  useEditorActions,
  useGetDocumentEditorQuery,
  useGetVersionsByDocumentQuery,
  useSaveDocumentEditorMutation,
} from "@/lib/store/api"
import type {AnnotationDiff, TextDiff} from "@/lib/types"
import {areAnnotationsDifferent} from "@/lib/utils/annotations"

import {Button} from "../ui/button"
import {AnnotationCreator} from "./annotations/annotation-creator"
import {AnnotationOverlay} from "./annotations/annotation-overlay"
import {DiffLegend, DiffOverlay, VersionComparisonBar} from "./diff-overlay"
import {TextEditOverlay} from "./text-edit-overlay"
import {TextEditor} from "./text-editor"

interface PDFViewerProps {
  documentId: string
}

export function PDFViewer({documentId}: PDFViewerProps) {
  // Ensure PDF.js worker is set up
  React.useEffect(() => {
    setupPDFWorker()
  }, [])

  const [saveDocumentEditor] = useSaveDocumentEditorMutation()
  const {data: editor} = useGetDocumentEditorQuery(documentId, {skip: !documentId})
  const {setDiffMode} = useEditorActions(documentId)

  const currentPage = editor?.currentPage || 1
  const viewport = editor?.viewport || {x: 0, y: 0, zoom: 1}
  const isDiffMode = editor?.isDiffMode || false
  const isAnnotationTool = editor?.activeTool?.type !== "select" && editor?.activeTool?.type !== "text_edit"
  const isTextEditTool = editor?.activeTool?.type === "text_edit"
  const compareVersionIds = editor?.compareVersionIds || []
  const {blobUrl, loading, error} = usePDFBlob(documentId)
  const [pageDimensions, setPageDimensions] = React.useState<{width: number; height: number} | null>(null)
  const [textDiffs, setTextDiffs] = React.useState<TextDiff[]>([])
  const [annotationDiffs, setAnnotationDiffs] = React.useState<AnnotationDiff[]>([])

  // Get versions for diff comparison
  const {data: versions = []} = useGetVersionsByDocumentQuery(documentId, {skip: !documentId || !isDiffMode})
  const version1 = React.useMemo(() => versions.find(v => v.id === compareVersionIds[0]), [versions, compareVersionIds])
  const version2 = React.useMemo(() => versions.find(v => v.id === compareVersionIds[1]), [versions, compareVersionIds])

  // Track the last processed version comparison to avoid infinite re-renders
  const lastProcessedComparison = React.useRef<string | null>(null)

  // Calculate diffs when in diff mode
  React.useEffect(() => {
    if (!isDiffMode || !compareVersionIds[0] || !compareVersionIds[1]) {
      setTextDiffs([])
      setAnnotationDiffs([])
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

        // Since we're using annotation-only commits, PDF content is preserved
        // No text diffs needed as the original PDF content remains unchanged
        setTextDiffs([])
      } catch (error) {
        console.error("Error calculating diffs:", error)
        setTextDiffs([])
        setAnnotationDiffs([])
      }
    }

    calculateDiffs()
  }, [isDiffMode, compareVersionIds, version1, version2])

  const onDocumentLoadSuccess = React.useCallback(
    ({numPages}: {numPages: number}) => {
      if (editor) {
        saveDocumentEditor({
          documentId,
          editor: {
            ...editor,
            totalPages: numPages,
            currentPage: 1,
            viewport: {x: 0, y: 0, zoom: 1},
            // Don't reset diff mode - preserve it from persisted state
          },
        })
      }
    },
    [documentId, saveDocumentEditor, editor],
  )

  const onPageLoadSuccess = React.useCallback((page: any) => {
    setPageDimensions({
      width: page.width,
      height: page.height,
    })
  }, [])

  const handleCloseDiff = React.useCallback(async () => {
    await setDiffMode(false, [])
  }, [setDiffMode])

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-muted-foreground">Loading PDF...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-destructive">Error loading PDF: {error}</div>
      </div>
    )
  }

  if (!blobUrl) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-muted-foreground">No PDF available</div>
      </div>
    )
  }

  return (
    <>
      {isDiffMode && compareVersionIds.length === 2 && version1 && version2 && (
        <div className="flex justify-between items-center border-b border-border px-2 bg-muted/50">
          <VersionComparisonBar version1Number={version1.versionNumber} version2Number={version2.versionNumber} />
          <div className="flex items-center gap-4">
            <DiffLegend />
            <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Read-only mode</div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleCloseDiff}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      <div className="flex justify-center items-center">
        <div className="flex-1 overflow-auto">
          <div className="flex justify-center items-center relative min-h-full w-full min-w-0">
            <div className="relative">
              <Document file={blobUrl} onLoadSuccess={onDocumentLoadSuccess} className="h-full w-full">
                <TextEditor scale={viewport.zoom} documentId={documentId}>
                  <AnnotationCreator
                    scale={viewport.zoom}
                    pageWidth={pageDimensions?.width || 0}
                    pageHeight={pageDimensions?.height || 0}
                    documentId={documentId}
                  >
                    <div className="relative">
                      <Page
                        pageNumber={currentPage}
                        renderTextLayer={true}
                        className="border border-border"
                        scale={viewport.zoom}
                        onLoadSuccess={onPageLoadSuccess}
                      />

                      <LazySearchHighlights scale={viewport.zoom} documentId={documentId} />

                      {pageDimensions && (
                        <AnnotationOverlay
                          scale={viewport.zoom}
                          pageWidth={pageDimensions.width}
                          pageHeight={pageDimensions.height}
                          documentId={documentId}
                          className={isDiffMode || !isAnnotationTool ? "z-0" : "z-10"}
                        />
                      )}

                      {pageDimensions && (
                        <TextEditOverlay
                          scale={viewport.zoom}
                          pageNumber={currentPage}
                          documentId={documentId}
                          className={isDiffMode || !isTextEditTool ? "z-0" : "z-10"}
                        />
                      )}

                      {isDiffMode && compareVersionIds.length === 2 && (
                        <DiffOverlay
                          pageNumber={currentPage}
                          textDiffs={textDiffs}
                          annotationDiffs={annotationDiffs}
                          scale={viewport.zoom}
                          viewportWidth={pageDimensions?.width || 0}
                          viewportHeight={pageDimensions?.height || 0}
                        />
                      )}
                    </div>
                  </AnnotationCreator>
                </TextEditor>
              </Document>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
