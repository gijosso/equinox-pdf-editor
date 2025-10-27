"use client"

import {formatDistanceToNow} from "date-fns"
import {Edit, History, Maximize2, Move, Plus, Trash2, Type} from "lucide-react"
import React from "react"

import {ScrollArea} from "@/components/ui/scroll-area"
import {useGetDocumentEditorQuery, useGetEditsByVersionQuery} from "@/lib/store/api"
import type {Edit as EditType} from "@/lib/types"

type EditActionType = EditType["type"]

interface EditActionConfig {
  icon: React.ReactNode
  color: string
  description: string
}

const EDIT_ACTION_CONFIG: Record<EditActionType, EditActionConfig> = {
  annotation_added: {
    icon: <Plus className="h-4 w-4" />,
    color: "text-green-500",
    description: "Added annotation",
  },
  annotation_updated: {
    icon: <Edit className="h-4 w-4" />,
    color: "text-blue-500",
    description: "Updated annotation",
  },
  annotation_deleted: {
    icon: <Trash2 className="h-4 w-4" />,
    color: "text-red-500",
    description: "Deleted annotation",
  },
  annotation_moved: {
    icon: <Move className="h-4 w-4" />,
    color: "text-purple-500",
    description: "Moved annotation",
  },
  annotation_resized: {
    icon: <Maximize2 className="h-4 w-4" />,
    color: "text-orange-500",
    description: "Resized annotation",
  },
  annotation_text_changed: {
    icon: <Type className="h-4 w-4" />,
    color: "text-cyan-500",
    description: "Changed annotation text",
  },
} as const

interface SidebarEditHistoryProps {
  documentId: string
}

export function SidebarEditHistory({documentId}: SidebarEditHistoryProps) {
  const {data: editor} = useGetDocumentEditorQuery(documentId, {skip: !documentId})
  const currentVersionId = editor?.currentVersionId || null
  const {data: edits = []} = useGetEditsByVersionQuery(currentVersionId || "", {skip: !currentVersionId})
  const scrollAreaRef = React.useRef<HTMLDivElement>(null)
  const reversedEdits = React.useMemo(() => [...edits].reverse(), [edits])

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
            {reversedEdits.map((edit: EditType) => {
              const config = EDIT_ACTION_CONFIG[edit.type]
              return (
                <div key={edit.id} className="rounded-lg border border-border bg-background p-3">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 ${config.color}`}>{config.icon}</div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{config.description}</p>
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
