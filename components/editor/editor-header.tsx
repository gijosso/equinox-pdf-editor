"use client"

import {ArrowLeft, FileText, History, PanelRight, Save} from "lucide-react"
import {useRouter} from "next/navigation"
import React from "react"

import {Button} from "@/components/ui/button"
import {usePDFBlob} from "@/hooks/use-pdf-blob"
import {
  useGetAnnotationsByVersionQuery,
  useGetDocumentEditorQuery,
  useGetDocumentQuery,
  useGetVersionsByDocumentQuery,
  useSaveDocumentEditorMutation,
} from "@/lib/store/api"

import {ExportPDFButton} from "./export-pdf-button"
import {SaveVersionDialog} from "./save-version-dialog"
import {VersionHistoryDialog} from "./version-history-dialog"

interface EditorHeaderProps {
  documentId: string
}

export function EditorHeader({documentId}: EditorHeaderProps) {
  const router = useRouter()
  const [saveDocumentEditor] = useSaveDocumentEditorMutation()

  // Get editor state from API
  const {data: editor} = useGetDocumentEditorQuery(documentId, {
    skip: !documentId,
  })
  const currentVersionId = editor?.currentVersionId || null
  const sidebarOpen = editor?.sidebarOpen || false

  const {data: annotations = []} = useGetAnnotationsByVersionQuery(currentVersionId || "", {
    skip: !currentVersionId,
  })
  const {data: document} = useGetDocumentQuery(documentId, {skip: !documentId})
  const {data: versions = []} = useGetVersionsByDocumentQuery(documentId, {skip: !documentId})
  const {refreshBlob} = usePDFBlob(documentId)

  // Find current version number
  const currentVersion = versions.find(v => v.id === document?.currentVersionId)
  const versionNumber = currentVersion?.versionNumber
  const [showSaveDialog, setShowSaveDialog] = React.useState(false)
  const [showHistoryDialog, setShowHistoryDialog] = React.useState(false)

  const handleToggleSidebar = async () => {
    if (!editor || !documentId) {
      return
    }

    const updatedEditor = {
      ...editor,
      sidebarOpen: !editor.sidebarOpen,
    }

    try {
      await saveDocumentEditor({documentId, editor: updatedEditor}).unwrap()
    } catch (error) {
      console.error("Failed to toggle sidebar:", error)
    }
  }

  return (
    <>
      <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold text-foreground">{document?.name}</h1>
            <span className="text-sm text-muted-foreground">v{versionNumber}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowHistoryDialog(true)}>
            <History className="mr-2 h-4 w-4" />
            History
          </Button>
          {currentVersionId && document && <ExportPDFButton documentId={documentId} versionId={currentVersionId} />}
          <Button
            variant="default"
            size="sm"
            onClick={() => setShowSaveDialog(true)}
            disabled={annotations.length === 0}
          >
            <Save className="mr-2 h-4 w-4" />
            Save Version
          </Button>
          <Button variant="ghost" size="icon" onClick={handleToggleSidebar}>
            <PanelRight className={`h-5 w-5 ${sidebarOpen ? "text-primary" : ""}`} />
          </Button>
        </div>
      </header>

      <SaveVersionDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        onVersionSaved={refreshBlob}
        documentId={documentId}
      />
      <VersionHistoryDialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog} documentId={documentId} />
    </>
  )
}
