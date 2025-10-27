"use client"

import {Download} from "lucide-react"
import React from "react"

import {Button} from "@/components/ui/button"
import {useToast} from "@/hooks/use-toast"
import {useExportPDFMutation} from "@/lib/store/api"

interface ExportPDFButtonProps {
  documentId: string
  versionId: string
}

export function ExportPDFButton({documentId, versionId}: ExportPDFButtonProps) {
  const [exportPDF, {isLoading}] = useExportPDFMutation()
  const {toast} = useToast()

  const handleExport = React.useCallback(async () => {
    try {
      const result = await exportPDF({
        documentId,
        versionId,
      }).unwrap()

      // Create download link using the provided URL
      const link = document.createElement("a")
      link.href = result.downloadUrl
      link.download = result.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Clean up the object URL after a short delay
      setTimeout(() => {
        URL.revokeObjectURL(result.downloadUrl)
      }, 1000)

      toast({
        title: "Export Successful",
        description: `Annotated PDF "${result.filename}" has been downloaded.`,
      })
    } catch (error) {
      console.error("Export failed:", error)
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export annotated PDF",
        variant: "destructive",
      })
    }
  }, [exportPDF, documentId, versionId, toast])

  return (
    <Button onClick={handleExport} disabled={isLoading} variant="outline" size="sm" className="gap-2">
      <Download className="h-4 w-4" />
      {isLoading ? "Exporting..." : "Export PDF"}
    </Button>
  )
}
