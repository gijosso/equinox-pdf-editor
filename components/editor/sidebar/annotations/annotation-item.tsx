"use client"

import {Trash2} from "lucide-react"
import React from "react"

import {Button} from "@/components/ui/button"
import {useDeleteAnnotationMutation, useEditorActions} from "@/lib/store/api"
import type {Annotation} from "@/lib/types"
import {formatDate} from "@/lib/utils"
import {isAnnotationLocked} from "@/lib/utils/annotations"

import {ANNOTATIONS_CONFIGS} from "./annotation-configs"

interface AnnotationItemProps {
  documentId: string
  versionId: string
  annotation: Annotation
}

export const AnnotationItem = React.memo(({documentId, versionId, annotation}: AnnotationItemProps) => {
  const [deleteAnnotation] = useDeleteAnnotationMutation()
  const {setCurrentPage, editor} = useEditorActions(documentId)
  const isDiffMode = editor?.isDiffMode || false

  // Memoize handlers to prevent unnecessary re-renders
  const handleSetCurrentPage = React.useCallback(
    async (pageNumber: number) => {
      await setCurrentPage(pageNumber)
    },
    [setCurrentPage],
  )

  const handleDelete = React.useCallback(async () => {
    try {
      await deleteAnnotation({id: annotation.id, versionId}).unwrap()
    } catch (error) {
      console.error("Failed to delete annotation:", error)
    }
  }, [deleteAnnotation, annotation.id, versionId])

  const annotationConfig = React.useMemo(() => ANNOTATIONS_CONFIGS[annotation.type], [annotation.type])
  const isLocked = React.useMemo(() => isAnnotationLocked(annotation) || isDiffMode, [annotation, isDiffMode])

  const formattedDate = React.useMemo(() => {
    const isUpdated = annotation.updatedAt !== annotation.createdAt
    const dateToFormat = isUpdated ? annotation.updatedAt : annotation.createdAt
    const isToday = new Date(dateToFormat).toDateString() === new Date().toDateString()

    return {
      isUpdated,
      formatted: formatDate(
        dateToFormat,
        isToday
          ? {hour: "2-digit", minute: "2-digit"}
          : {weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"},
      ),
    }
  }, [annotation.updatedAt, annotation.createdAt])

  return (
    <div className={`rounded-lg border border-border p-3 h-24 ${isLocked ? "bg-muted opacity-75" : "bg-background"}`}>
      <div className="flex items-center justify-between gap-2 h-full">
        <div className="flex items-center gap-2 flex-1 min-w-0 max-w-full h-full">
          {annotationConfig.icon}
          <div className="flex-1 min-w-0 max-w-full h-full flex flex-col justify-between">
            <div>
              <button
                onClick={() => handleSetCurrentPage(annotation.pageNumber || 1)}
                className="text-sm font-medium capitalize text-foreground"
              >
                {annotationConfig.label}
              </button>
              <p className="text-xs text-muted-foreground">Page {annotation.pageNumber || 1}</p>
            </div>
            <div className="text-sm text-muted-foreground">
              <div className="block overflow-hidden text-ellipsis whitespace-nowrap italic max-w-48">
                {annotation.content}
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              {formattedDate.isUpdated ? (
                <div>Updated: {formattedDate.formatted}</div>
              ) : (
                <div>Created: {formattedDate.formatted}</div>
              )}
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className={`h-6 w-6 shrink-0 ${isLocked ? "opacity-50 cursor-not-allowed" : ""}`}
          onClick={handleDelete}
          disabled={isLocked}
          title={
            isLocked
              ? isDiffMode
                ? "Cannot delete during diff mode"
                : "Cannot delete locked annotation"
              : "Delete annotation"
          }
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
})

AnnotationItem.displayName = "AnnotationItem"
