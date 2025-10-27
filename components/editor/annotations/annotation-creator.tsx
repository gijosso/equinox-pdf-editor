"use client"

import React from "react"

import {useAddAnnotationMutation, useGetDocumentEditorQuery} from "@/lib/store/api"
import type {AnnotationType} from "@/lib/types"
import {createAnnotation} from "@/lib/utils/annotations"

interface AnnotationCreatorProps {
  scale: number
  pageWidth: number
  pageHeight: number
  children: React.ReactNode
  documentId: string
}

export function AnnotationCreator({scale, children, documentId}: AnnotationCreatorProps) {
  const {data: editor} = useGetDocumentEditorQuery(documentId, {skip: !documentId})
  const activeTool = editor?.activeTool || {type: "select"}
  const currentPage = editor?.currentPage || 1
  const currentVersionId = editor?.currentVersionId || null
  const [addAnnotation] = useAddAnnotationMutation()
  const [isCreating, setIsCreating] = React.useState(false)
  const [startPos, setStartPos] = React.useState<{x: number; y: number} | null>(null)
  const [currentPos, setCurrentPos] = React.useState<{x: number; y: number} | null>(null)

  const isAnnotationTool = activeTool.type !== "select"

  const handleMouseDown = (event: React.MouseEvent) => {
    if (!isAnnotationTool) {
      return
    }

    // Don't start creating if clicking on existing annotations
    const target = event.target as HTMLElement
    if (target.closest("[data-annotation]")) {
      return
    }

    // Prevent text selection when annotation tools are active
    event.preventDefault()

    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    setIsCreating(true)
    setStartPos({x, y})
    setCurrentPos({x, y})
  }

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!isCreating || !startPos) {
      return
    }

    // Don't update if hovering over existing annotations
    const target = event.target as HTMLElement
    if (target.closest("[data-annotation]")) {
      return
    }

    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    setCurrentPos({x, y})
  }

  const handleMouseUp = async (event: React.MouseEvent) => {
    if (!isCreating || !startPos || !currentPos) {
      setIsCreating(false)
      setStartPos(null)
      setCurrentPos(null)
      return
    }

    // Don't create annotation if releasing over existing annotations
    const target = event.target as HTMLElement
    if (target.closest("[data-annotation]")) {
      setIsCreating(false)
      setStartPos(null)
      setCurrentPos(null)
      return
    }

    // Calculate annotation bounds
    const x = Math.min(startPos.x, currentPos.x)
    const y = Math.min(startPos.y, currentPos.y)
    const width = Math.abs(currentPos.x - startPos.x)
    const height = Math.abs(currentPos.y - startPos.y)

    // Only create annotation if it has minimum size and we have a valid version
    if (width > 5 && height > 5 && currentVersionId) {
      // Convert screen coordinates to PDF coordinates
      const pdfX = x / scale
      const pdfY = y / scale
      const pdfWidth = width / scale
      const pdfHeight = height / scale

      const annotation = createAnnotation(activeTool.type as AnnotationType, {
        versionId: currentVersionId,
        pageNumber: currentPage,
        x: pdfX,
        y: pdfY,
        width: pdfWidth,
        height: pdfHeight,
        content: "",
      })

      try {
        await addAnnotation(annotation).unwrap()
      } catch (error) {
        console.error("Failed to add annotation:", error)
      }
    }

    setIsCreating(false)
    setStartPos(null)
    setCurrentPos(null)
  }

  const handleMouseLeave = () => {
    setIsCreating(false)
    setStartPos(null)
    setCurrentPos(null)
  }

  // Calculate preview rectangle
  const previewRect = React.useMemo(() => {
    if (!isCreating || !startPos || !currentPos) {
      return
    }
    null

    const x = Math.min(startPos.x, currentPos.x)
    const y = Math.min(startPos.y, currentPos.y)
    const width = Math.abs(currentPos.x - startPos.x)
    const height = Math.abs(currentPos.y - startPos.y)

    return {x, y, width, height}
  }, [isCreating, startPos, currentPos])

  return (
    <div
      className={`relative w-full h-full ${isAnnotationTool ? "no-text-selection" : "allow-text-selection"}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      style={{
        cursor: isAnnotationTool ? "crosshair" : "default",
        userSelect: isAnnotationTool ? "none" : "auto",
        WebkitUserSelect: isAnnotationTool ? "none" : "auto",
        MozUserSelect: isAnnotationTool ? "none" : "auto",
      }}
    >
      {children}

      {previewRect && (
        <div
          className="absolute border-2 border-dashed pointer-events-none"
          style={{
            left: previewRect.x,
            top: previewRect.y,
            width: previewRect.width,
            height: previewRect.height,
            borderColor: getPreviewColor(activeTool.type),
            backgroundColor: `${getPreviewColor(activeTool.type)}20`,
          }}
        />
      )}
    </div>
  )
}

function getPreviewColor(toolType: string): string {
  switch (toolType) {
    case "highlight":
      return "#ffeb3b"
    case "note":
      return "#FFCD45"
    case "redaction":
      return "#000000"
    default:
      return "#666666"
  }
}
