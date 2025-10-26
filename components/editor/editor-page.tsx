"use client"

import {Loader2} from "lucide-react"
import React from "react"

import {useGetDocumentEditorQuery, useGetDocumentQuery, useSaveDocumentEditorMutation} from "@/lib/store/api"

import {ErrorBoundaryWithSuspense} from "../error-boundary"
import {EditorLoading} from "../loading"
import {EditorHeader} from "./editor-header"
import {PDFViewer} from "./pdf-viewer-dynamic"
import {Sidebar} from "./sidebar/sidebar"
import {Toolbar} from "./toolbar/toolbar"

interface EditorPageProps {
  documentId: string
}

export function EditorPage({documentId}: EditorPageProps) {
  const [saveDocumentEditor] = useSaveDocumentEditorMutation()
  const {data: documentMetadata, isLoading, error} = useGetDocumentQuery(documentId, {skip: !documentId})
  const {data: editor} = useGetDocumentEditorQuery(documentId, {skip: !documentId})

  React.useEffect(() => {
    // Initialize editor state when document is loaded
    if (documentMetadata && !editor) {
      const initialEditor = {
        documentId,
        currentVersionId: documentMetadata.currentVersionId,
        isEditing: false,
        selectedAnnotations: [],
        viewport: {x: 0, y: 0, zoom: 1},
        activeTool: {type: "select" as const},
        sidebarOpen: true,
        hasUnsavedChanges: false,
        currentPage: 1,
        totalPages: 1,
        searchQuery: "",
        searchResults: [],
        currentSearchIndex: 0,
        history: [],
        historyIndex: 0,
        isDiffMode: false,
        compareVersionIds: [],
      }

      saveDocumentEditor({documentId, editor: initialEditor})
    }

    // Update current version when document metadata changes
    if (documentMetadata && editor && editor.currentVersionId !== documentMetadata.currentVersionId) {
      const updatedEditor = {
        ...editor,
        currentVersionId: documentMetadata.currentVersionId,
      }
      saveDocumentEditor({documentId, editor: updatedEditor})
    }
  }, [documentId, documentMetadata, editor, saveDocumentEditor])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
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
  const {data: editor} = useGetDocumentEditorQuery(documentId, {
    skip: !documentId,
  })

  const sidebarOpen = editor?.sidebarOpen || false

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
        <div
          className={`h-full border-l border-border bg-card transition-all duration-300 ease-in-out ${
            sidebarOpen ? "w-80" : "w-0"
          } overflow-hidden shrink-0`}
        >
          <div className={`h-full w-80 transition-opacity duration-200 ${sidebarOpen ? "opacity-100" : "opacity-0"}`}>
            <Sidebar documentId={documentId} />
          </div>
        </div>
      </div>
    </div>
  )
}
