"use client"

import React from "react"

import {useGetDocumentEditorQuery, useGetDocumentQuery, useSaveDocumentEditorMutation} from "@/lib/store/api"
import type {DocumentEditor, EditorTool} from "@/lib/types"

import {ErrorBoundaryWithSuspense} from "../error-boundary"
import {EditorLoading} from "../loading"
import {EditorHeader} from "./editor-header"
import {PDFViewer} from "./pdf-viewer"
import {Sidebar} from "./sidebar/sidebar"
import {Toolbar} from "./toolbar/toolbar"

interface EditorPageProps {
  documentId: string
}

export function EditorPage({documentId}: EditorPageProps) {
  const [saveDocumentEditor] = useSaveDocumentEditorMutation()
  const {data: document, isLoading, error} = useGetDocumentQuery(documentId, {skip: !documentId})
  const {data: editor} = useGetDocumentEditorQuery(documentId, {skip: !documentId})

  const initialEditor = React.useMemo(
    () => ({
      documentId,
      currentVersionId: document?.currentVersionId || null,
      isEditing: false,
      selectedAnnotations: [],
      viewport: {x: 0, y: 0, zoom: 1},
      activeTool: {type: "select" as EditorTool["type"]},
      sidebarOpen: true,
      currentPage: 1,
      totalPages: 1,
      searchQuery: "",
      searchResults: [],
      currentSearchIndex: 0,
      history: [],
      historyIndex: 0,
      isDiffMode: false,
      compareVersionIds: [],
      annotationsViewMode: "all" as DocumentEditor["annotationsViewMode"],
      textEditsViewMode: "all" as DocumentEditor["textEditsViewMode"],
    }),
    [documentId, document?.currentVersionId],
  )

  React.useEffect(() => {
    if (document && !editor) {
      saveDocumentEditor({documentId, editor: initialEditor})
    }

    if (document && editor && editor.currentVersionId !== document.currentVersionId) {
      const updatedEditor = {
        ...editor,
        currentVersionId: document.currentVersionId,
      }
      saveDocumentEditor({documentId, editor: updatedEditor})
    }
  }, [documentId, document, editor, saveDocumentEditor, initialEditor])

  if (isLoading) {
    return null
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-red-600 mb-2">
            Error: {error ? (error as any)?.message || "Failed to load document" : null}
          </p>
          <p className="text-sm text-muted-foreground">Failed to load document</p>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundaryWithSuspense suspenseFallback={<EditorLoading />}>
      <Editor documentId={documentId} />
    </ErrorBoundaryWithSuspense>
  )
}

interface EditorProps {
  documentId: string
}

export function Editor({documentId}: EditorProps) {
  const {data: editor} = useGetDocumentEditorQuery(documentId, {skip: !documentId})
  const sidebarOpen = editor?.sidebarOpen || false
  const sidebarClasses = React.useMemo(
    () =>
      `h-full border-l border-border bg-card transition-all duration-300 ease-in-out ${
        sidebarOpen ? "w-80" : "w-0"
      } overflow-hidden shrink-0`,
    [sidebarOpen],
  )

  const sidebarContentClasses = React.useMemo(
    () => `h-full w-80 transition-opacity duration-200 ${sidebarOpen ? "opacity-100" : "opacity-0"}`,
    [sidebarOpen],
  )

  return (
    <div className="flex h-screen flex-col bg-background">
      <EditorHeader documentId={documentId} />
      <Toolbar documentId={documentId} />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 min-w-0 transition-all duration-300 ease-in-out">
          {documentId ? (
            <PDFViewer documentId={documentId} />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <p className="text-muted-foreground">No document selected</p>
              </div>
            </div>
          )}
        </div>
        <div className={sidebarClasses}>
          <div className={sidebarContentClasses}>
            <Sidebar documentId={documentId} />
          </div>
        </div>
      </div>
    </div>
  )
}
