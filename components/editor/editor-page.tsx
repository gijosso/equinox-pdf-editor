"use client"

import {Loader2} from "lucide-react"
import React from "react"

import {useGetDocumentWithVersionsQuery} from "@/lib/store/api"
import {useAppDispatch} from "@/lib/store/hooks"
import {openDocument} from "@/lib/store/slices/editor"

import {ErrorBoundaryWithSuspense} from "../error-boundary"
import {EditorLoading} from "../loading"
import {Editor} from "./editor"

interface EditorPageProps {
  documentId: string
}

export function EditorPage({documentId}: EditorPageProps) {
  const dispatch = useAppDispatch()
  const {isLoading, error} = useGetDocumentWithVersionsQuery(documentId)

  // Dispatch openDocument to set the active document in Redux state
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
