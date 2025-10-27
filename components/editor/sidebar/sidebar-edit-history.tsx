"use client"

import {formatDistanceToNow} from "date-fns"
import {Edit, History, Maximize2, Move, Plus, RotateCcw, Trash2, Type} from "lucide-react"
import React from "react"

import {Button} from "@/components/ui/button"
import {ScrollArea} from "@/components/ui/scroll-area"
import {useGetDocumentEditorQuery, useGetEditsByVersionQuery} from "@/lib/store/api"
import type {Edit as EditType} from "@/lib/types"

interface SidebarEditHistoryProps {
  documentId: string
}

export function SidebarEditHistory({documentId}: SidebarEditHistoryProps) {
  const {data: editor} = useGetDocumentEditorQuery(documentId, {skip: !documentId})
  const currentVersionId = editor?.currentVersionId || null

  const {data: edits = []} = useGetEditsByVersionQuery(currentVersionId || "", {
    skip: !currentVersionId,
  })

  // Ref for the scroll area (keeping for potential future use)
  const scrollAreaRef = React.useRef<HTMLDivElement>(null)

  const getActionIcon = (type: EditType["type"]) => {
    switch (type) {
      case "annotation_added":
        return <Plus className="h-4 w-4" />
      case "annotation_updated":
        return <Edit className="h-4 w-4" />
      case "annotation_deleted":
        return <Trash2 className="h-4 w-4" />
      case "annotation_moved":
        return <Move className="h-4 w-4" />
      case "annotation_resized":
        return <Maximize2 className="h-4 w-4" />
      case "annotation_text_changed":
        return <Type className="h-4 w-4" />
      default:
        return <History className="h-4 w-4" />
    }
  }

  const getActionColor = (type: EditType["type"]) => {
    switch (type) {
      case "annotation_added":
        return "text-green-500"
      case "annotation_updated":
        return "text-blue-500"
      case "annotation_deleted":
        return "text-red-500"
      case "annotation_moved":
        return "text-purple-500"
      case "annotation_resized":
        return "text-orange-500"
      case "annotation_text_changed":
        return "text-cyan-500"
      default:
        return "text-muted-foreground"
    }
  }

  const getActionDescription = (edit: EditType) => {
    switch (edit.type) {
      case "annotation_added":
        return "Added annotation"
      case "annotation_updated":
        return "Updated annotation"
      case "annotation_deleted":
        return "Deleted annotation"
      case "annotation_moved":
        return "Moved annotation"
      case "annotation_resized":
        return "Resized annotation"
      case "annotation_text_changed":
        return "Changed annotation text"
      default:
        return "Modified annotation"
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center border-b border-border h-18 p-4">
        <p className="text-sm text-muted-foreground">{edits.length} edits</p>
      </div>
      <ScrollArea ref={scrollAreaRef} className="flex-1 overflow-auto bg-muted">
        {edits.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <History className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">No edits yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Your changes will be tracked here</p>
          </div>
        ) : (
          <div className="space-y-1 p-4">
            {edits
              .slice()
              .reverse()
              .map((edit: EditType) => {
                return (
                  <div key={edit.id} className="rounded-lg border border-border bg-background p-3">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 ${getActionColor(edit.type)}`}>{getActionIcon(edit.type)}</div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{getActionDescription(edit)}</p>
                        <p className="text-xs text-muted-foreground">Annotation ID: {edit.annotationId}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(edit.timestamp), {addSuffix: true})}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
