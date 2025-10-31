"use client"

import {Trash2} from "lucide-react"
import React from "react"

import {useToast} from "@/hooks/use-toast"
import {useDeleteTextEditMutation, useGetDocumentEditorQuery, useGetTextEditsByPageQuery} from "@/lib/store/api"
import type {TextEdit} from "@/lib/types"
import {getTextEditClasses} from "@/lib/utils/text-edit-styling"

import {Button} from "../../ui/button"

interface TextEditOverlayProps {
  scale: number
  pageNumber: number
  documentId: string
  className?: string
}

interface TextEditDisplayProps {
  textEdit: TextEdit
  scale: number
  onDelete: (textEditId: string) => void
  isReadOnly?: boolean
}

function TextEditDisplay({textEdit, scale, onDelete, isReadOnly = false}: TextEditDisplayProps) {
  const classes = getTextEditClasses(textEdit.operation)

  const style: React.CSSProperties = {
    position: "absolute",
    left: textEdit.x * scale,
    top: textEdit.y * scale,
    width: textEdit.width * scale,
    height: textEdit.height * scale,
    fontSize: (textEdit.fontSize || 12) * scale,
    fontFamily: textEdit.fontFamily || "inherit",
    fontWeight: textEdit.fontWeight || "normal",
    color: textEdit.color || "#000000",
    zIndex: 10,
    minWidth: "20px",
    minHeight: "16px",
  }

  const onDeleteClick = React.useCallback(() => {
    onDelete(textEdit.id)
  }, [onDelete, textEdit.id])

  return (
    <div
      className={`relative group ${classes.container} border rounded shadow-sm ${isReadOnly ? "pointer-events-none" : ""}`}
      style={style}
    >
      <div className="relative w-full h-full flex items-center justify-center">
        {textEdit.newText ? (
          <span className={`${classes.text} font-medium opacity-50 whitespace-nowrap`}>{textEdit.newText}</span>
        ) : (
          <span className={`${classes.text} font-medium italic line-through opacity-50 whitespace-nowrap`}>
            {textEdit.originalText}
          </span>
        )}

        {!isReadOnly && (
          <div className="absolute -top-8 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1 z-30">
            <Button size="sm" variant="destructive" className="h-6 w-6 p-0" onClick={onDeleteClick}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

function TextEditOverlayImpl({scale, pageNumber, documentId, className}: TextEditOverlayProps) {
  const {data: editor} = useGetDocumentEditorQuery(documentId, {skip: !documentId})
  const currentVersionId = editor?.currentVersionId || null
  const activeTool = editor?.activeTool || {type: "select"}
  const isDiffMode = editor?.isDiffMode || false
  const isTextEditMode = activeTool.type === "text_edit"
  const isReadOnly = isDiffMode || !isTextEditMode
  const {toast} = useToast()

  const {data: textEdits = []} = useGetTextEditsByPageQuery(
    {versionId: currentVersionId || "", pageNumber},
    {skip: !currentVersionId},
  )

  const [deleteTextEdit] = useDeleteTextEditMutation()

  const handleDelete = React.useCallback(
    async (textEditId: string) => {
      if (!currentVersionId) {
        return
      }

      try {
        await deleteTextEdit({id: textEditId, versionId: currentVersionId}).unwrap()
        toast({
          title: "Text Edit Deleted",
          description: "Text edit has been successfully deleted.",
          duration: 2000,
        })
      } catch (error) {
        console.error("Failed to delete text edit:", error)
        toast({
          title: "Error",
          description: "Failed to delete text edit. Please try again.",
          variant: "destructive",
          duration: 3000,
        })
      }
    },
    [deleteTextEdit, currentVersionId, toast],
  )

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {textEdits.map(textEdit => (
        <div key={textEdit.id} className={`${isReadOnly ? "pointer-events-none" : "pointer-events-auto"}`}>
          <TextEditDisplay textEdit={textEdit} scale={scale} onDelete={handleDelete} isReadOnly={isReadOnly} />
        </div>
      ))}
    </div>
  )
}

export const TextEditOverlay = React.memo(TextEditOverlayImpl)
