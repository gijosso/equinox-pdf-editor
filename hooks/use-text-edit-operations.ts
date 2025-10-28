"use client"

import React from "react"

import {useToast} from "@/hooks/use-toast"
import {useAddTextEditMutation} from "@/lib/store/api"
import type {TextEditOperation, TextSelection} from "@/lib/types"

interface UseTextEditOperationsProps {
  currentVersionId: string | null
}

export function useTextEditOperations({currentVersionId}: UseTextEditOperationsProps) {
  const [addTextEdit] = useAddTextEditMutation()
  const {toast} = useToast()

  const saveTextEdit = React.useCallback(
    async (operation: TextEditOperation) => {
      if (!currentVersionId) {
        return
      }

      const {newText, type, selection, fontInfo} = operation
      const finalText = (newText || "").trim()

      if (type !== "delete" && !finalText) {
        toast({
          title: "Input Required",
          description: "Please enter text for insert or replace operations.",
          variant: "destructive",
          duration: 3000,
        })
        return
      }

      try {
        await addTextEdit({
          versionId: currentVersionId,
          pageNumber: selection.pageNumber,
          originalText: selection.text,
          newText: finalText,
          x: selection.startX,
          y: selection.startY,
          width: selection.endX - selection.startX,
          height: selection.endY - selection.startY,
          fontFamily: fontInfo?.fontFamily,
          fontSize: fontInfo?.fontSize,
          fontWeight: fontInfo?.fontWeight,
          color: fontInfo?.color,
          operation: type,
        }).unwrap()

        // Show success toast
        toast({
          title: "Text Edit Created",
          description: `Successfully ${type}d text: "${finalText || selection.text}"`,
          duration: 3000,
        })

        return true // Success
      } catch (error) {
        console.error("Failed to save text edit:", error)
        toast({
          title: "Error",
          description: "Failed to save text edit. Please try again.",
          variant: "destructive",
          duration: 3000,
        })
        return false // Failure
      }
    },
    [currentVersionId, addTextEdit, toast],
  )

  const deleteTextEdit = React.useCallback(
    async (textSelection: TextSelection) => {
      if (!currentVersionId) {
        return false
      }

      try {
        await addTextEdit({
          versionId: currentVersionId,
          pageNumber: textSelection.pageNumber,
          originalText: textSelection.text,
          newText: "",
          x: textSelection.startX,
          y: textSelection.startY,
          width: textSelection.endX - textSelection.startX,
          height: textSelection.endY - textSelection.startY,
          fontFamily: textSelection.fontInfo.fontFamily,
          fontSize: textSelection.fontInfo.fontSize,
          fontWeight: textSelection.fontInfo.fontWeight,
          color: textSelection.fontInfo.color,
          operation: "delete",
        }).unwrap()

        // Show success toast
        toast({
          title: "Text Deleted",
          description: `Deleted text: "${textSelection.text}"`,
          duration: 2000,
        })

        return true // Success
      } catch (error) {
        console.error("Failed to delete text:", error)
        toast({
          title: "Error",
          description: "Failed to delete text. Please try again.",
          variant: "destructive",
          duration: 3000,
        })
        return false // Failure
      }
    },
    [currentVersionId, addTextEdit, toast],
  )

  return {
    saveTextEdit,
    deleteTextEdit,
  }
}
