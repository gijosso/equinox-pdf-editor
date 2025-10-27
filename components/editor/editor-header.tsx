"use client"

import {ArrowLeft, FileText, History, Lock, PanelRight, Save} from "lucide-react"
import {useRouter} from "next/navigation"
import React from "react"

import {Button} from "@/components/ui/button"
import {usePDFBlob} from "@/hooks/use-pdf-blob"
import {useEditorActions, useGetDocumentQuery, useGetVersionsByDocumentQuery, useHasEditsQuery} from "@/lib/store/api"

import {ExportPDFButton} from "./export-pdf-button"
import {SaveVersionDialog} from "./save-version-dialog"
import {VersionHistoryDialog} from "./version-history-dialog"

interface EditorHeaderProps {
  documentId: string
}

export function EditorHeader({documentId}: EditorHeaderProps) {
  const router = useRouter()
  const {editor, setSidebarOpen} = useEditorActions(documentId)
  const [showSaveDialog, setShowSaveDialog] = React.useState(false)
  const [showHistoryDialog, setShowHistoryDialog] = React.useState(false)
  const currentVersionId = editor?.currentVersionId || null
  const sidebarOpen = editor?.sidebarOpen || false

  const {data: document} = useGetDocumentQuery(documentId, {skip: !documentId})
  const {data: hasEdits = false} = useHasEditsQuery(currentVersionId || "", {skip: !currentVersionId})
  const {data: versions = []} = useGetVersionsByDocumentQuery(documentId, {skip: !documentId})
  const {refreshBlob} = usePDFBlob(documentId)
  const currentVersion = React.useMemo(
    () => versions.find(v => v.id === document?.currentVersionId),
    [versions, document?.currentVersionId],
  )
  const versionNumber = React.useMemo(() => currentVersion?.versionNumber, [currentVersion?.versionNumber])
  const isViewingHistoricalVersion = React.useMemo(
    () => Boolean(editor && document && editor.currentVersionId !== document.latestVersionId),
    [editor, document],
  )

  const handleToggleSidebar = React.useCallback(async () => {
    await setSidebarOpen(!sidebarOpen)
  }, [setSidebarOpen, sidebarOpen])

  const handleGoBack = React.useCallback(() => {
    router.push("/")
  }, [router])

  const handleShowHistory = React.useCallback(() => {
    setShowHistoryDialog(true)
  }, [])

  const handleShowSave = React.useCallback(() => {
    setShowSaveDialog(true)
  }, [])

  return (
    <>
      <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleGoBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold text-foreground">{document?.name}</h1>
            <span className="text-sm text-muted-foreground">v{versionNumber}</span>
            {isViewingHistoricalVersion && (
              <div className="flex items-center gap-1 rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" />
                Read-only
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleShowHistory}>
            <History className="mr-2 h-4 w-4" />
            History
          </Button>
          {currentVersionId && document && <ExportPDFButton documentId={documentId} versionId={currentVersionId} />}
          <Button
            variant="default"
            size="sm"
            onClick={handleShowSave}
            disabled={!hasEdits || isViewingHistoricalVersion}
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
