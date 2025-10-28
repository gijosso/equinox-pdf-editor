"use client"

import React from "react"

import {useTextEditOperations} from "@/hooks/use-text-edit-operations"
import {useTextSelection} from "@/hooks/use-text-selection"
import {useGetDocumentEditorQuery} from "@/lib/store/api"
import type {TextEditOperation} from "@/lib/types"

import {TextEditDialog} from "."

interface TextEditorProps {
  scale: number
  documentId: string
  children?: React.ReactNode
}

export function TextEditor({scale, documentId, children}: TextEditorProps) {
  const {data: editor} = useGetDocumentEditorQuery(documentId, {skip: !documentId})
  const activeTool = editor?.activeTool || {type: "select"}
  const currentPage = editor?.currentPage || 1
  const currentVersionId = editor?.currentVersionId || null
  const isTextEditMode = activeTool.type === "text_edit"
  const isDiffMode = editor?.isDiffMode || false
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)

  // Use custom hooks for text selection and operations
  const {textSelection, setTextSelection, clearSelection} = useTextSelection({
    isTextEditMode,
    currentVersionId,
    currentPage,
    scale,
    isDialogOpen,
  })

  const {saveTextEdit, deleteTextEdit} = useTextEditOperations({
    currentVersionId,
  })

  // Handle text selection completion
  React.useEffect(() => {
    if (textSelection) {
      setIsDialogOpen(true)
    }
  }, [textSelection])

  // Handle save operation
  const handleSaveOperation = React.useCallback(
    async (operation: TextEditOperation) => {
      const success = await saveTextEdit(operation)
      if (success) {
        setTextSelection(null)
        setIsDialogOpen(false)
      }
    },
    [saveTextEdit, setTextSelection],
  )

  // Handle delete operation
  const handleDeleteOperation = React.useCallback(async () => {
    if (!textSelection) return

    const success = await deleteTextEdit(textSelection)
    if (success) {
      clearSelection()
      setIsDialogOpen(false)
    }
  }, [textSelection, deleteTextEdit, clearSelection])

  // Handle cancel operation
  const handleCancelEdit = React.useCallback(() => {
    clearSelection()
    setIsDialogOpen(false)
  }, [clearSelection])

  return (
    <div className={`relative w-full h-full allow-text-selection ${isDiffMode ? "pointer-events-none" : ""}`}>
      {children}

      {textSelection && (
        <div
          className="absolute pointer-events-none animate-pulse bg-transparent border-2 border-blue-500 rounded-lg shadow-[0_0_0_1px_rgba(59,130,246,0.3)]"
          style={{
            left: textSelection.startX * scale,
            top: textSelection.startY * scale,
            width: (textSelection.endX - textSelection.startX) * scale,
            height: (textSelection.endY - textSelection.startY) * scale,
            zIndex: 20,
          }}
        />
      )}

      <TextEditDialog
        isOpen={isDialogOpen}
        selection={textSelection}
        onDelete={handleDeleteOperation}
        onSave={handleSaveOperation}
        onCancel={handleCancelEdit}
      />
    </div>
  )
}
