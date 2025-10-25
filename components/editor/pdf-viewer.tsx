"use client"

interface PDFViewerProps {
  documentId: string
}

export function PDFViewer({documentId}: PDFViewerProps) {
  // if (loading) {
  //   return (
  //     <div className="flex h-full items-center justify-center">
  //       <div className="text-center">
  //         <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
  //         <p className="text-muted-foreground">Loading PDF...</p>
  //       </div>
  //     </div>
  //   )
  // }

  // if (error) {
  //   return (
  //     <div className="flex h-full items-center justify-center">
  //       <div className="text-center">
  //         <p className="text-red-600 mb-2">Error: {error}</p>
  //         <p className="text-sm text-muted-foreground">Failed to load PDF document</p>
  //       </div>
  //     </div>
  //   )
  // }

  // if (!blob) {
  //   return (
  //     <div className="flex h-full items-center justify-center">
  //       <div className="text-center">
  //         <p className="text-muted-foreground">No PDF loaded</p>
  //       </div>
  //     </div>
  //   )
  // }

  return <div className="h-full w-full flex items-center justify-center">PDF Viewer</div>
}
