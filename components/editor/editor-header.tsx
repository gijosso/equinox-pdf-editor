"use client"

import {ArrowLeft, FileText, History, PanelRight, Save} from "lucide-react"
import {useRouter} from "next/navigation"
import React from "react"

import {Button} from "@/components/ui/button"
import {useAppDispatch, useAppSelector} from "@/lib/store/hooks"
import {
  selectActiveDocumentAnnotations,
  selectActiveDocumentSidebarOpen,
  selectDocumentById,
} from "@/lib/store/selectors"
import {toggleSidebar} from "@/lib/store/slices"

import {SaveVersionDialog} from "./save-version-dialog"
import {VersionHistoryDialog} from "./version-history-dialog"

export function EditorHeader() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const {activeDocumentId} = useAppSelector(state => state.editor)
  const sidebarOpen = useAppSelector(selectActiveDocumentSidebarOpen)
  const annotations = useAppSelector(selectActiveDocumentAnnotations)
  const currentDocument = useAppSelector(selectDocumentById(activeDocumentId || ""))
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
            <h1 className="text-lg font-semibold text-foreground">
              {currentDocument?.name || (activeDocumentId ? "Loading..." : "PDF Editor")}
            </h1>
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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => activeDocumentId && dispatch(toggleSidebar(activeDocumentId))}
          >
            <PanelRight className={`h-5 w-5 ${sidebarOpen ? "text-primary" : ""}`} />
          </Button>
        </div>
      </header>

      <SaveVersionDialog open={showSaveDialog} onOpenChange={setShowSaveDialog} />
      <VersionHistoryDialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog} />
    </>
  )
}
