"use client"

import {Loader2, X} from "lucide-react"
import React from "react"
import {Document, Page} from "react-pdf"
import "react-pdf/dist/Page/AnnotationLayer.css"
import "react-pdf/dist/Page/TextLayer.css"

import {LazySearchHighlights} from "@/components/lazy"
import {Button} from "@/components/ui/button"
import {usePDFBlob} from "@/hooks/use-pdf-blob"
import {useEditorActions, useSaveDocumentEditorMutation} from "@/lib/store/api"

import {AnnotationCreator, AnnotationOverlay} from "../annotations"
import {TextEditOverlay} from "../text-edit"
import {TextEditor} from "../text-edit/text-editor"
import {DiffLegend, VersionComparisonBar, VersionDiffOverlay} from "./diff"

interface PDFViewerProps {
  documentId: string
}

export function PDFViewer({documentId}: PDFViewerProps) {
  // Ensure PDF.js worker is set up (client-only)
  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const {pdfjs} = await import("react-pdf")
        if (!cancelled) {
          pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"
        }
      } catch (error) {
        console.error("Failed to setup PDF worker:", error)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const {setDiffMode, editor} = useEditorActions(documentId)
  const [saveDocumentEditor] = useSaveDocumentEditorMutation()

  const currentPage = editor?.currentPage || 1
  const viewport = editor?.viewport || {x: 0, y: 0, zoom: 1}
  const isDiffMode = editor?.isDiffMode || false
  const isAnnotationTool = editor?.activeTool?.type !== "select" && editor?.activeTool?.type !== "text_edit"
  const isTextEditTool = editor?.activeTool?.type === "text_edit"
  const {blobUrl, loading, error} = usePDFBlob(documentId)
  const [pageDimensions, setPageDimensions] = React.useState<{width: number; height: number} | null>(null)

  // Avoid resetting editor state after initial document load
  const didInitRef = React.useRef(false)

  const onDocumentLoadSuccess = React.useCallback(
    ({numPages}: {numPages: number}) => {
      if (didInitRef.current) {
        return
      }
      didInitRef.current = true
      if (editor) {
        saveDocumentEditor({
          documentId,
          editor: {
            ...editor,
            totalPages: numPages,
            // Do not force-reset currentPage/viewport to prevent visible jumps
          },
        })
      }
    },
    [documentId, saveDocumentEditor, editor],
  )

  const handleCloseDiff = React.useCallback(async () => {
    await setDiffMode(false, [])
  }, [setDiffMode])

  const onPageLoadSuccess = React.useCallback((page: any) => {
    setPageDimensions(prev => prev ?? {width: page.width, height: page.height})
  }, [])

  if (loading) {
    return (
      <div className="flex w-full h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex w-full h-full items-center justify-center">
        <div className="text-destructive">Error loading PDF: {error}</div>
      </div>
    )
  }

  if (!blobUrl) {
    return (
      <div className="flex w-full h-full items-center justify-center">
        <div className="text-muted-foreground">No PDF available</div>
      </div>
    )
  }

  return (
    <>
      {isDiffMode && (
        <div className="flex justify-between items-center border-b border-border px-2 bg-muted/50">
          <VersionComparisonBar documentId={documentId} />
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
        <div className="flex flex-1 overflow-auto">
          <div className="flex justify-center items-center relative min-h-full w-full">
            <Document file={blobUrl} onLoadSuccess={onDocumentLoadSuccess}>
              <TextEditor scale={viewport.zoom} documentId={documentId}>
                <AnnotationCreator
                  scale={viewport.zoom}
                  pageWidth={pageDimensions?.width || 0}
                  pageHeight={pageDimensions?.height || 0}
                  documentId={documentId}
                >
                  <div
                    className="relative"
                    style={
                      pageDimensions
                        ? {
                            width: pageDimensions.width * viewport.zoom,
                            height: pageDimensions.height * viewport.zoom,
                          }
                        : undefined
                    }
                  >
                    <Page
                      pageNumber={currentPage}
                      width={pageDimensions ? pageDimensions.width * viewport.zoom : undefined}
                      scale={viewport.zoom}
                      onLoadSuccess={onPageLoadSuccess}
                      renderTextLayer
                      renderAnnotationLayer={false}
                      className="h-full w-full"
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

                    {/* Diff overlay on the PDF page */}
                    {pageDimensions && (
                      <VersionDiffOverlay
                        documentId={documentId}
                        scale={viewport.zoom}
                        pageWidth={pageDimensions.width}
                        pageHeight={pageDimensions.height}
                        renderHeader={false}
                        renderOverlay={true}
                      />
                    )}
                  </div>
                </AnnotationCreator>
              </TextEditor>
            </Document>
          </div>
        </div>
      </div>
    </>
  )
}
