"use client"

import React from "react"
import {Document, Page, pdfjs} from "react-pdf"
import "react-pdf/dist/Page/AnnotationLayer.css"
import "react-pdf/dist/Page/TextLayer.css"

import {LazySearchHighlights} from "@/components/lazy"
import {usePDFBlob} from "@/hooks/use-pdf-blob"
import {useGetDocumentEditorQuery, useSaveDocumentEditorMutation} from "@/lib/store/api"

import {AnnotationCreator} from "./annotations/annotation-creator"
import {AnnotationOverlay} from "./annotations/annotation-overlay"

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"

interface PDFViewerProps {
  documentId: string
}

export function PDFViewer({documentId}: PDFViewerProps) {
  const [saveDocumentEditor] = useSaveDocumentEditorMutation()
  const {data: editor} = useGetDocumentEditorQuery(documentId, {
    skip: !documentId,
  })

  const currentPage = editor?.currentPage || 1
  const totalPages = editor?.totalPages || 1
  const viewport = editor?.viewport || {x: 0, y: 0, zoom: 1}
  const {blob, blobUrl, loading, error} = usePDFBlob(documentId)
  const [pageDimensions, setPageDimensions] = React.useState<{width: number; height: number} | null>(null)

  const handleSetCurrentPage = async (page: number) => {
    if (!editor || !documentId) return

    const updatedEditor = {
      ...editor,
      currentPage: page,
    }

    try {
      await saveDocumentEditor({documentId, editor: updatedEditor}).unwrap()
    } catch (error) {
      console.error("Failed to set current page:", error)
    }
  }

  const handleSetTotalPages = async (pages: number) => {
    if (!editor || !documentId) return

    const updatedEditor = {
      ...editor,
      totalPages: pages,
    }

    try {
      await saveDocumentEditor({documentId, editor: updatedEditor}).unwrap()
    } catch (error) {
      console.error("Failed to set total pages:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Loading PDF...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-2">Error: {error}</p>
          <p className="text-sm text-muted-foreground">Failed to load PDF document</p>
        </div>
      </div>
    )
  }

  if (!blob || !blobUrl) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">No PDF loaded</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex-1 overflow-auto">
        <div className="flex justify-center items-center relative min-h-full w-full min-w-0">
          <div className="relative">
            <Document
              file={blobUrl}
              onLoadSuccess={({numPages}) => handleSetTotalPages(numPages)}
              onLoadError={error => console.error("PDF load error:", error)}
              className="shadow-lg"
            >
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
                    renderAnnotationLayer={true}
                    className="border border-border"
                    scale={viewport.zoom}
                    onLoadSuccess={page => {
                      setPageDimensions({
                        width: page.width,
                        height: page.height,
                      })
                    }}
                  />

                  <LazySearchHighlights scale={viewport.zoom} documentId={documentId} />

                  {pageDimensions && (
                    <AnnotationOverlay
                      scale={viewport.zoom}
                      pageWidth={pageDimensions.width}
                      pageHeight={pageDimensions.height}
                      documentId={documentId}
                    />
                  )}
                </div>
              </AnnotationCreator>
            </Document>
          </div>
        </div>
      </div>
    </div>
  )
}
