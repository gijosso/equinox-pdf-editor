"use client"

import {Loader2} from "lucide-react"
import React from "react"

import {useGetDocumentWithVersionsQuery} from "@/lib/store/api"
import {useAppDispatch, useAppSelector} from "@/lib/store/hooks"
import {selectEditorState} from "@/lib/store/selectors"
import {openDocument} from "@/lib/store/slices/editor"

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
  const dispatch = useAppDispatch()
  const {isLoading, error} = useGetDocumentWithVersionsQuery(documentId)

  React.useEffect(() => {
    dispatch(openDocument(documentId))
  }, [dispatch, documentId])

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
      <Editor />
    </ErrorBoundaryWithSuspense>
  )
}

export function Editor() {
  const {documentId, sidebarOpen} = useAppSelector(selectEditorState)

  return (
    <div className="flex h-screen flex-col bg-background">
      <EditorHeader />
      <Toolbar />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 min-w-0 transition-all duration-300 ease-in-out">
          {documentId ? (
            <PDFViewer />
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
