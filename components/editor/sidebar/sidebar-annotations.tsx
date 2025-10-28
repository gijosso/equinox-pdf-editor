"use client"

import React from "react"

import {useEditorActions, useGetAnnotationsByVersionQuery} from "@/lib/store/api"

import {AnnotationList, AnnotationViewControls} from "./annotations"

interface SidebarAnnotationsProps {
  documentId: string
}

export function SidebarAnnotations({documentId}: SidebarAnnotationsProps) {
  const {editor, setAnnotationsViewMode} = useEditorActions(documentId)
  const currentVersionId = editor?.currentVersionId || null

  const {
    data: annotations = [],
    isLoading,
    error,
  } = useGetAnnotationsByVersionQuery(currentVersionId || "", {
    skip: !currentVersionId,
  })

  const viewMode = editor?.annotationsViewMode || "all"

  const handleViewModeChange = React.useCallback(
    async (newViewMode: "all" | "grouped") => {
      await setAnnotationsViewMode(newViewMode)
    },
    [setAnnotationsViewMode],
  )

  if (isLoading) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-border h-18 p-4">
          <p className="text-sm text-muted-foreground">Loading annotations...</p>
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
          <p className="text-sm text-muted-foreground">Error loading annotations</p>
        </div>
        <div className="flex-1 overflow-auto bg-muted">
          <div className="p-4 text-center text-destructive">Failed to load annotations</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border h-18 p-4">
        <p className="text-sm text-muted-foreground">{annotations.length} total</p>
        <AnnotationViewControls viewMode={viewMode} onViewModeChange={handleViewModeChange} />
      </div>
      {currentVersionId && (
        <AnnotationList
          documentId={documentId}
          versionId={currentVersionId}
          annotations={annotations}
          viewMode={viewMode}
        />
      )}
    </div>
  )
}
