"use client"

import React from "react"
import {Document, Page} from "react-pdf"
import "react-pdf/dist/Page/AnnotationLayer.css"
import "react-pdf/dist/Page/TextLayer.css"

import {LazySearchHighlights} from "@/components/lazy"
import {usePDFBlob} from "@/hooks/use-pdf-blob"
import {setupPDFWorker} from "@/lib/pdf-worker-setup"
import {useGetDocumentEditorQuery, useGetVersionsByDocumentQuery, useSaveDocumentEditorMutation} from "@/lib/store/api"
import type {TextDiff} from "@/lib/types"

import {AnnotationCreator} from "./annotations/annotation-creator"
import {AnnotationOverlay} from "./annotations/annotation-overlay"
import {DiffLegend, DiffOverlay} from "./diff-overlay"

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
  const totalPages = editor?.totalPages || 1
  const viewport = editor?.viewport || {x: 0, y: 0, zoom: 1}
  const isDiffMode = editor?.isDiffMode || false
  const compareVersionIds = editor?.compareVersionIds || []
  const {blob, blobUrl, loading, error} = usePDFBlob(documentId)
  const [pageDimensions, setPageDimensions] = React.useState<{width: number; height: number} | null>(null)
  const [textDiffs, setTextDiffs] = React.useState<TextDiff[]>([])

  // Get versions for diff comparison
  const {data: versions = []} = useGetVersionsByDocumentQuery(documentId, {
    skip: !documentId || !isDiffMode,
  })

  // Calculate text diffs when in diff mode
  React.useEffect(() => {
    if (!isDiffMode || !compareVersionIds[0] || !compareVersionIds[1]) {
      setTextDiffs([])
      return
    }

    const version1 = versions.find(v => v.id === compareVersionIds[0])
    const version2 = versions.find(v => v.id === compareVersionIds[1])

    if (!version1 || !version2) {
      setTextDiffs([])
      return
    }

    // Since we're using annotation-only commits, PDF content is preserved
    // No text diffs needed as the original PDF content remains unchanged
    setTextDiffs([])
  }, [isDiffMode, compareVersionIds[0], compareVersionIds[1]])

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
            isDiffMode: false,
            compareVersionIds: [],
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

  const handlePageChange = React.useCallback(
    (pageNumber: number) => {
      if (editor) {
        saveDocumentEditor({
          documentId,
          editor: {
            ...editor,
            currentPage: pageNumber,
          },
        })
      }
    },
    [documentId, saveDocumentEditor, editor],
  )

  const handleViewportChange = React.useCallback(
    (newViewport: {x: number; y: number; zoom: number}) => {
      if (editor) {
        saveDocumentEditor({
          documentId,
          editor: {
            ...editor,
            viewport: newViewport,
          },
        })
      }
    },
    [documentId, saveDocumentEditor, editor],
  )

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
    <div className="relative h-full w-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-auto">
        <div className="flex justify-center items-center relative min-h-full w-full min-w-0">
          <div className="relative">
            <Document file={blobUrl} onLoadSuccess={onDocumentLoadSuccess} className="h-full w-full">
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
                    onLoadSuccess={onPageLoadSuccess}
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

                  {isDiffMode && compareVersionIds.length === 2 && (
                    <DiffOverlay
                      pageNumber={currentPage}
                      textDiffs={textDiffs}
                      scale={viewport.zoom}
                      viewportWidth={pageDimensions?.width || 0}
                      viewportHeight={pageDimensions?.height || 0}
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
