"use client"

import {X} from "lucide-react"
import React from "react"
import {Document, Page} from "react-pdf"
import "react-pdf/dist/Page/AnnotationLayer.css"
import "react-pdf/dist/Page/TextLayer.css"

import {LazySearchHighlights} from "@/components/lazy"
import {usePDFBlob} from "@/hooks/use-pdf-blob"
import {setupPDFWorker} from "@/lib/pdf-worker-setup"
import {useGetDocumentEditorQuery, useSaveDocumentEditorMutation} from "@/lib/store/api"

import {Button} from "../ui/button"
import {AnnotationCreator} from "./annotations/annotation-creator"
import {AnnotationOverlay} from "./annotations/annotation-overlay"
import {DiffLegend, DiffOverlay, VersionComparisonBar} from "./diff-overlay"
import {TextEditOverlay} from "./text-edit-overlay"
import {TextEditor} from "./text-editor"
import {VersionDiffProvider} from "./version-diff-provider"

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

  const currentPage = editor?.currentPage || 1
  const viewport = editor?.viewport || {x: 0, y: 0, zoom: 1}
  const isDiffMode = editor?.isDiffMode || false
  const isAnnotationTool = editor?.activeTool?.type !== "select" && editor?.activeTool?.type !== "text_edit"
  const isTextEditTool = editor?.activeTool?.type === "text_edit"
  const compareVersionIds = editor?.compareVersionIds || []
  const {blobUrl, loading, error} = usePDFBlob(documentId)
  const [pageDimensions, setPageDimensions] = React.useState<{width: number; height: number} | null>(null)

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
      <VersionDiffProvider documentId={documentId} isDiffMode={isDiffMode} compareVersionIds={compareVersionIds}>
        {({version1, version2, textDiffs, annotationDiffs, untouchedAnnotations, handleCloseDiff}) => (
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
                                untouchedAnnotations={untouchedAnnotations}
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
        )}
      </VersionDiffProvider>
    </>
  )
}
