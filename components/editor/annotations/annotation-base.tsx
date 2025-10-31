"use client"

import {Trash2} from "lucide-react"
import React from "react"
import {Rnd, RndResizeCallback} from "react-rnd"

import {useToast} from "@/hooks/use-toast"
import {useDeleteAnnotationMutation, useEditorActions} from "@/lib/store/api"
import type {Annotation, Edit} from "@/lib/types"
import {
  screenToPdfCoordinates,
  screenToPdfDimensions,
  updateAnnotationDimensions,
  updateAnnotationPosition,
} from "@/lib/utils/annotations"

import {Button} from "../../ui/button"

interface BaseAnnotationProps {
  annotation: Annotation
  x: number
  y: number
  width: number
  height: number
  scale: number
  children: React.ReactNode
  onUpdate?: (annotation: Annotation, editType?: Edit["type"]) => void
  locked?: boolean
  documentId: string
}

export function AnnotationBase({
  annotation,
  x,
  y,
  width,
  height,
  scale,
  children,
  onUpdate,
  locked = false,
  documentId,
}: BaseAnnotationProps) {
  const {editor} = useEditorActions(documentId)
  const [deleteAnnotation] = useDeleteAnnotationMutation()
  const {toast} = useToast()
  const isDiffMode = editor?.isDiffMode || false
  const isTextEditMode = editor?.activeTool?.type === "text_edit"
  const isSelectMode = editor?.activeTool?.type === "select"
  const isReadOnly = isDiffMode || isTextEditMode || isSelectMode
  const [isDeleting, setIsDeleting] = React.useState(false)

  const handleDelete = React.useCallback(async () => {
    if (!editor?.currentVersionId || isDeleting) {
      return
    }

    setIsDeleting(true)
    try {
      await deleteAnnotation({id: annotation.id, versionId: editor.currentVersionId}).unwrap()
      toast({
        title: "Annotation Deleted",
        description: "Annotation has been successfully deleted.",
        duration: 2000,
      })
    } catch (error) {
      console.error("Failed to delete annotation:", error)
      toast({
        title: "Error",
        description: "Failed to delete annotation. Please try again.",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setIsDeleting(false)
    }
  }, [deleteAnnotation, annotation.id, editor?.currentVersionId, toast, isDeleting])

  const handleDragStop = (e: any, d: any) => {
    // Don't allow dragging locked annotations or if delete is in progress
    if (locked || isDeleting) {
      return
    }

    const pdfCoords = screenToPdfCoordinates(d.x, d.y, {scale})

    const updatedAnnotation = updateAnnotationPosition(annotation, pdfCoords.x, pdfCoords.y, {
      editType: "annotation_moved",
    })

    onUpdate?.(updatedAnnotation, "annotation_moved")
  }

  const handleResizeStop: RndResizeCallback = (_e, _direction, ref, _delta, position) => {
    if (locked) {
      return
    }

    const pdfCoords = screenToPdfCoordinates(position.x, position.y, {scale})
    const pdfDims = screenToPdfDimensions(
      parseFloat(ref.style.width.replace("px", "")),
      parseFloat(ref.style.height.replace("px", "")),
      {scale},
    )

    const updatedAnnotation = updateAnnotationDimensions(
      annotation,
      pdfCoords.x,
      pdfCoords.y,
      pdfDims.width,
      pdfDims.height,
      {editType: "annotation_resized"},
    )

    onUpdate?.(updatedAnnotation, "annotation_resized")
  }

  return (
    <Rnd
      position={{x, y}}
      size={{width, height}}
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      minWidth={10}
      minHeight={10}
      bounds="parent"
      disableDragging={locked || isReadOnly || isDeleting} // Disable dragging for locked annotations or when select tool is active
      enableResizing={
        locked || isReadOnly || isDeleting
          ? false
          : {
              // Disable resizing for locked annotations or when select tool is active
              top: true,
              right: true,
              bottom: true,
              left: true,
              topRight: true,
              bottomRight: true,
              bottomLeft: true,
              topLeft: true,
            }
      }
      className={
        locked || isReadOnly
          ? "opacity-50 cursor-not-allowed pointer-events-none"
          : "group hover:cursor-grab active:cursor-grabbing z-20 hover:shadow-md transition-shadow"
      } // Visual indication for locked annotations
      style={{
        zIndex: locked || isReadOnly ? 1 : 20, // Lower z-index when select tool is active
      }}
      data-annotation={annotation.id}
    >
      <div className="w-full h-full relative">
        {children}

        {/* Delete button - only show when not read-only and not locked */}
        {!isReadOnly && !locked && (
          <div className="absolute -top-8 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1 z-30">
            <Button size="sm" variant="destructive" className="h-6 w-6 p-0" onClick={handleDelete}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </Rnd>
  )
}
