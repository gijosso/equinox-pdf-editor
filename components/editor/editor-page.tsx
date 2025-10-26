"use client"

import {Loader2} from "lucide-react"

import {useEditorData} from "@/hooks/use-editor-data"

import {ErrorBoundaryWithSuspense} from "../error-boundary"
import {EditorLoading} from "../loading"
import {Editor} from "./editor"

interface EditorPageProps {
  documentId: string
}

export function EditorPage({documentId}: EditorPageProps) {
  const {loading, error} = useEditorData({documentId})

  if (loading) {
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
          <p className="text-red-600 mb-2">Error: {error}</p>
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
