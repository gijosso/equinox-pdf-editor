"use client"

import {useAppSelector} from "@/lib/store/hooks"
import {selectActiveDocumentIsDiffMode, selectActiveDocumentSidebarOpen} from "@/lib/store/selectors"

import {EditorHeader} from "./editor-header"
import {EditorToolbar} from "./editor-toolbar"
import {PDFViewer} from "./pdf-viewer-dynamic"
import {Sidebar} from "./sidebar"

export function EditorLayout() {
  const sidebarOpen = useAppSelector(selectActiveDocumentSidebarOpen)
  const activeDocumentId = useAppSelector(state => state.editor.activeDocumentId)

  return (
    <div className="flex h-screen flex-col bg-background">
      <EditorHeader />
      <EditorToolbar />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 min-w-0 transition-all duration-300 ease-in-out">
          {activeDocumentId ? (
            <PDFViewer documentId={activeDocumentId} />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <p className="text-muted-foreground">No document selected</p>
              </div>
            </div>
          )}
        </div>
        <div
          className={`h-full border-l border-border bg-card transition-all duration-300 ease-in-out ${
            sidebarOpen ? "w-80" : "w-0"
          } overflow-hidden shrink-0`}
        >
          <Sidebar />
        </div>
      </div>
    </div>
  )
}
