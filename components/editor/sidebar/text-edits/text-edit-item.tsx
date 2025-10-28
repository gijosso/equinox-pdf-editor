"use client"

import {Trash2} from "lucide-react"
import React from "react"

import {Button} from "@/components/ui/button"
import {useDeleteTextEditMutation, useEditorActions} from "@/lib/store/api"
import type {TextEdit} from "@/lib/types"
import {formatDate} from "@/lib/utils"

import {TEXT_EDIT_CONFIGS} from "./text-edit-configs"

interface TextEditItemProps {
  documentId: string
  versionId: string
  textEdit: TextEdit
}

export const TextEditItem = React.memo(({documentId, versionId, textEdit}: TextEditItemProps) => {
  const [deleteTextEdit] = useDeleteTextEditMutation()
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
      await deleteTextEdit({id: textEdit.id, versionId}).unwrap()
    } catch (error) {
      console.error("Failed to delete text edit:", error)
    }
  }, [deleteTextEdit, textEdit.id, versionId])

  const isLocked = isDiffMode

  const formattedDate = React.useMemo(() => {
    const isUpdated = textEdit.updatedAt !== textEdit.createdAt
    const dateToFormat = isUpdated ? textEdit.updatedAt : textEdit.createdAt
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
  }, [textEdit.updatedAt, textEdit.createdAt])

  return (
    <div className={`rounded-lg border border-border p-3 h-24 ${isLocked ? "bg-muted opacity-75" : "bg-background"}`}>
      <div className="flex items-center justify-between gap-2 h-full">
        <div className="flex items-center gap-2 flex-1 min-w-0 max-w-full h-full">
          {textEdit.operation ? TEXT_EDIT_CONFIGS[textEdit.operation]?.icon : null}
          <div className="flex-1 min-w-0 max-w-full h-full flex flex-col justify-between">
            <div>
              <button
                onClick={() => handleSetCurrentPage(textEdit.pageNumber)}
                className="text-sm font-medium capitalize text-foreground"
              >
                {textEdit.operation ? TEXT_EDIT_CONFIGS[textEdit.operation].label : null}
              </button>
              <p className="text-xs text-muted-foreground">Page {textEdit.pageNumber}</p>
            </div>
            <div className="text-sm text-muted-foreground">
              <div className="block overflow-hidden text-ellipsis whitespace-nowrap italic max-w-48">
                {textEdit.operation === "delete" ? (
                  <span className="line-through text-red-600">{textEdit.originalText}</span>
                ) : textEdit.operation === "insert" ? (
                  <span className="text-green-600">{textEdit.newText}</span>
                ) : (
                  <>
                    <span className="line-through text-red-600">{textEdit.originalText}</span>
                    <span className="mx-1">{"->"}</span>
                    <span className="text-green-600">{textEdit.newText}</span>
                  </>
                )}
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
          title={isLocked ? "Cannot delete during diff mode" : "Delete text edit"}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
})

TextEditItem.displayName = "TextEditItem"
