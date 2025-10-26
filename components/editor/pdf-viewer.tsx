"use client"

import {Document, Page, pdfjs} from "react-pdf"
import "react-pdf/dist/Page/AnnotationLayer.css"
import "react-pdf/dist/Page/TextLayer.css"

import {LazySearchHighlights} from "@/components/lazy"
import {usePDFBlob} from "@/hooks/use-pdf-blob"
import {useAppDispatch, useAppSelector} from "@/lib/store/hooks"
import {selectEditorState} from "@/lib/store/selectors/editor"
import {setCurrentPage, setTotalPages} from "@/lib/store/slices/editor"

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"

export function PDFViewer() {
  const dispatch = useAppDispatch()
  const {documentId, currentPage, viewport} = useAppSelector(selectEditorState)
  const {blob, blobUrl, loading, error} = usePDFBlob()

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
              onLoadSuccess={({numPages}) => dispatch(setTotalPages({documentId, totalPages: numPages}))}
              onLoadError={error => console.error("PDF load error:", error)}
              className="shadow-lg"
            >
              <div className="relative">
                <Page
                  pageNumber={currentPage}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  className="border border-border"
                  scale={viewport.zoom}
                />

                <LazySearchHighlights scale={viewport.zoom} />
              </div>
            </Document>
          </div>
        </div>
      </div>
    </div>
  )
}
