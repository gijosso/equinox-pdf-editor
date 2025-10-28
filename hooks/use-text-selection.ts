"use client"

import React from "react"

import type {TextSelection} from "@/lib/types"
import {extractFontInfoFromElement} from "@/lib/utils/font-preservation"

interface UseTextSelectionProps {
  isTextEditMode: boolean
  currentVersionId: string | null
  currentPage: number
  scale: number
  isDialogOpen: boolean
}

export function useTextSelection({
  isTextEditMode,
  currentVersionId,
  currentPage,
  scale,
  isDialogOpen,
}: UseTextSelectionProps) {
  const [textSelection, setTextSelection] = React.useState<TextSelection | null>(null)

  const handleSelectionComplete = React.useCallback(() => {
    if (!isTextEditMode || !currentVersionId || isDialogOpen) {
      return
    }

    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) {
      setTextSelection(null)
      return
    }

    const range = selection.getRangeAt(0)
    const container = range.commonAncestorContainer.parentElement

    if (!container?.closest(".react-pdf__Page__textContent")) {
      setTextSelection(null)
      return
    }

    const rect = range.getBoundingClientRect()
    const pageElement = container.closest(".react-pdf__Page")
    if (!pageElement) {
      return
    }

    const pageRect = pageElement.getBoundingClientRect()
    const selectedText = selection.toString().trim()
    if (!selectedText) {
      return
    }

    setTextSelection({
      pageNumber: currentPage,
      startX: (rect.left - pageRect.left) / scale,
      startY: (rect.top - pageRect.top) / scale,
      endX: (rect.right - pageRect.left) / scale,
      endY: (rect.bottom - pageRect.top) / scale,
      text: selectedText,
      fontInfo: extractFontInfoFromElement(container),
      textSpans: [],
    })
  }, [isTextEditMode, currentVersionId, currentPage, scale, isDialogOpen])

  // Set up event listeners for text selection
  React.useEffect(() => {
    if (!isTextEditMode) {
      setTextSelection(null)
      return
    }

    const handleComplete = () => setTimeout(handleSelectionComplete, 50)

    document.addEventListener("mouseup", handleComplete)
    document.addEventListener("dblclick", handleComplete)

    return () => {
      document.removeEventListener("mouseup", handleComplete)
      document.removeEventListener("dblclick", handleComplete)
    }
  }, [isTextEditMode, handleSelectionComplete])

  const clearSelection = React.useCallback(() => {
    setTextSelection(null)
    window.getSelection()?.removeAllRanges()
  }, [])

  return {
    textSelection,
    setTextSelection,
    clearSelection,
  }
}
