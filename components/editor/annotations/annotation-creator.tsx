"use client"

import React from "react"

import {useToast} from "@/hooks/use-toast"
import {useAddAnnotationMutation, useGetDocumentEditorQuery} from "@/lib/store/api"
import type {Annotation} from "@/lib/types"
import {
  calculateAnnotationBounds,
  createAnnotation,
  getAnnotationCursorStyle,
  getAnnotationPreviewColor,
  getAnnotationUserSelectStyle,
  isWithinAnnotation,
  screenToPdfCoordinates,
  screenToPdfDimensions,
  validateAnnotationCreation,
} from "@/lib/utils/annotations"

interface AnnotationCreatorProps {
  scale: number
  pageWidth: number
  pageHeight: number
  documentId: string
  children?: React.ReactNode
}

export function AnnotationCreator({scale, documentId, children}: AnnotationCreatorProps) {
  const {data: editor} = useGetDocumentEditorQuery(documentId, {skip: !documentId})
  const activeTool = editor?.activeTool || {type: "select"}
  const currentPage = editor?.currentPage || 1
  const currentVersionId = editor?.currentVersionId || null
  const isDiffMode = editor?.isDiffMode || false
  const isTextEditMode = activeTool.type === "text_edit"
  const isSelectMode = activeTool.type === "select"
  const [addAnnotation] = useAddAnnotationMutation()
  const {toast} = useToast()
  const [isCreating, setIsCreating] = React.useState(false)
  const [startPos, setStartPos] = React.useState<{x: number; y: number} | null>(null)
  const [currentPos, setCurrentPos] = React.useState<{x: number; y: number} | null>(null)

  const isAnnotationTool = activeTool.type !== "select" && activeTool.type !== "text_edit"
  const isReadOnly = isDiffMode || isTextEditMode || isSelectMode

  // Memoize cursor and user select styles to avoid recalculation
  const cursorStyle = React.useMemo(
    () => getAnnotationCursorStyle(activeTool.type, isCreating, isReadOnly),
    [activeTool.type, isCreating, isReadOnly],
  )

  const userSelectStyle = React.useMemo(() => getAnnotationUserSelectStyle(activeTool.type), [activeTool.type])

  // Memoize preview color to avoid recalculation
  const previewColor = React.useMemo(
    () =>
      activeTool.type !== "text_edit" ? getAnnotationPreviewColor(activeTool.type as Annotation["type"]) : "#666666",
    [activeTool.type],
  )

  const handleMouseDown = (event: React.MouseEvent) => {
    if (!isAnnotationTool || isReadOnly) {
      return
    }

    // Don't start creating if clicking on existing annotations
    const target = event.target as HTMLElement
    if (isWithinAnnotation(target)) {
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
    if (isWithinAnnotation(target)) {
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
    if (isWithinAnnotation(target)) {
      setIsCreating(false)
      setStartPos(null)
      setCurrentPos(null)
      return
    }

    // Calculate annotation bounds
    const bounds = calculateAnnotationBounds(startPos, currentPos)

    // Validate annotation creation
    const validation = validateAnnotationCreation(bounds, currentVersionId)
    if (!validation.isValid) {
      console.warn("Annotation creation failed:", validation.error)
      setIsCreating(false)
      setStartPos(null)
      setCurrentPos(null)
      return
    }

    // Convert screen coordinates to PDF coordinates
    const pdfCoords = screenToPdfCoordinates(bounds.x, bounds.y, {scale})
    const pdfDims = screenToPdfDimensions(bounds.width, bounds.height, {scale})

    const annotation = createAnnotation(activeTool.type as Annotation["type"], {
      versionId: currentVersionId!,
      pageNumber: currentPage,
      x: pdfCoords.x,
      y: pdfCoords.y,
      width: pdfDims.width,
      height: pdfDims.height,
      content: "",
    })

    try {
      await addAnnotation(annotation).unwrap()

      // Show success toast
      toast({
        title: "Annotation Created",
        description: `Successfully created ${activeTool.type} annotation.`,
        duration: 2000,
      })
    } catch (error) {
      console.error("Failed to add annotation:", error)
      toast({
        title: "Error",
        description: "Failed to create annotation. Please try again.",
        variant: "destructive",
        duration: 3000,
      })
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
    if (!isCreating || !startPos || !currentPos || isReadOnly) {
      return
    }

    return calculateAnnotationBounds(startPos, currentPos)
  }, [isCreating, startPos, currentPos, isReadOnly])

  return (
    <div
      className={`relative w-full h-full ${isAnnotationTool ? "no-text-selection" : "allow-text-selection"}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      style={{
        cursor: cursorStyle,
        userSelect: userSelectStyle,
        WebkitUserSelect: userSelectStyle,
        MozUserSelect: userSelectStyle,
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
            borderColor: previewColor,
            backgroundColor: `${previewColor}20`,
          }}
        />
      )}
    </div>
  )
}
