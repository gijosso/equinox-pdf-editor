"use client"

import React from "react"

import {useEditorActions, useGetTextEditsByVersionQuery} from "@/lib/store/api"
import type {DocumentEditor} from "@/lib/types"

import {TextEditList, TextEditViewControls} from "./text-edits"

interface SidebarTextEditsProps {
  documentId: string
}

export function SidebarTextEdits({documentId}: SidebarTextEditsProps) {
  const {editor, setTextEditsViewMode} = useEditorActions(documentId)
  const currentVersionId = editor?.currentVersionId || null
  const viewMode = editor?.textEditsViewMode || "all"
  const {
    data: textEdits = [],
    isLoading,
    error,
  } = useGetTextEditsByVersionQuery(currentVersionId || "", {
    skip: !currentVersionId,
  })

  const handleViewModeChange = React.useCallback(
    async (newViewMode: DocumentEditor["textEditsViewMode"]) => {
      await setTextEditsViewMode(newViewMode)
    },
    [setTextEditsViewMode],
  )

  if (isLoading) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-border h-18 p-4">
          <p className="text-sm text-muted-foreground">Loading text edits...</p>
        </div>
        <div className="flex-1 overflow-auto bg-muted">
          <div className="p-4 text-center text-muted-foreground">Loading...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-border h-18 p-4">
          <p className="text-sm text-muted-foreground">Error loading text edits</p>
        </div>
        <div className="flex-1 overflow-auto bg-muted">
          <div className="p-4 text-center text-destructive">Failed to load text edits</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border h-18 p-4">
        <p className="text-sm text-muted-foreground">{textEdits.length} total</p>
        <TextEditViewControls viewMode={viewMode} onViewModeChange={handleViewModeChange} />
      </div>
      {currentVersionId && (
        <TextEditList documentId={documentId} versionId={currentVersionId} textEdits={textEdits} viewMode={viewMode} />
      )}
    </div>
  )
}
