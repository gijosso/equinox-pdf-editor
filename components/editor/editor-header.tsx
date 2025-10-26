"use client"

import {ArrowLeft, FileText, History, PanelRight, Save} from "lucide-react"
import {useRouter} from "next/navigation"
import React from "react"

import {Button} from "@/components/ui/button"
import {usePDFBlob} from "@/hooks/use-pdf-blob"
import {useGetDocumentQuery, useGetVersionsByDocumentQuery} from "@/lib/store/api"
import {useAppDispatch, useAppSelector} from "@/lib/store/hooks"
import {selectAnnotations, selectEditorState} from "@/lib/store/selectors"
import {toggleSidebar} from "@/lib/store/slices"

import {SaveVersionDialog} from "./save-version-dialog"
import {VersionHistoryDialog} from "./version-history-dialog"

export function EditorHeader() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const annotations = useAppSelector(selectAnnotations)
  const {documentId, sidebarOpen} = useAppSelector(selectEditorState)
  const {data: documentMetadata} = useGetDocumentQuery(documentId || "", {skip: !documentId})
  const {data: versions = []} = useGetVersionsByDocumentQuery(documentId || "", {skip: !documentId})
  const {refreshBlob} = usePDFBlob()

  // Find current version number
  const currentVersion = versions.find(v => v.id === documentMetadata?.currentVersionId)
  const versionNumber = currentVersion?.versionNumber
  const [showSaveDialog, setShowSaveDialog] = React.useState(false)
  const [showHistoryDialog, setShowHistoryDialog] = React.useState(false)

  return (
    <>
      <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold text-foreground">{documentMetadata?.name}</h1>
            <span className="text-sm text-muted-foreground">v{versionNumber}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowHistoryDialog(true)}>
            <History className="mr-2 h-4 w-4" />
            History
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => setShowSaveDialog(true)}
            disabled={annotations.length === 0}
          >
            <Save className="mr-2 h-4 w-4" />
            Save Version
          </Button>
          <Button variant="ghost" size="icon" onClick={() => documentId && dispatch(toggleSidebar(documentId))}>
            <PanelRight className={`h-5 w-5 ${sidebarOpen ? "text-primary" : ""}`} />
          </Button>
        </div>
      </header>

      <SaveVersionDialog open={showSaveDialog} onOpenChange={setShowSaveDialog} onVersionSaved={refreshBlob} />
      <VersionHistoryDialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog} />
    </>
  )
}
