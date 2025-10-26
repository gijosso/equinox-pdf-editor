"use client"

import dynamic from "next/dynamic"
import React from "react"

interface PDFViewerProps {
  documentId: string
}

// Dynamically import the PDF viewer to avoid SSR issues
const PDFViewerInternal = dynamic(() => import("./pdf-viewer").then(mod => ({default: mod.PDFViewer})), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="text-muted-foreground">Loading PDF viewer...</p>
      </div>
    </div>
  ),
}) as React.ComponentType<PDFViewerProps>

export function PDFViewer({documentId}: PDFViewerProps) {
  return <PDFViewerInternal documentId={documentId} />
}
