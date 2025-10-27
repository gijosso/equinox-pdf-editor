"use client"

import React from "react"
import {Rnd, RndResizeCallback} from "react-rnd"

import {useEditorActions} from "@/lib/store/api"
import type {Annotation, Edit} from "@/lib/types"
import {
  screenToPdfCoordinates,
  screenToPdfDimensions,
  updateAnnotationDimensions,
  updateAnnotationPosition,
} from "@/lib/utils/annotations"

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

export function BaseAnnotation({
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
  const isDiffMode = editor?.isDiffMode || false
  const isTextEditMode = editor?.activeTool?.type === "text_edit"
  const isSelectMode = editor?.activeTool?.type === "select"
  const isReadOnly = isDiffMode || isTextEditMode || isSelectMode

  const handleDragStop = (e: any, d: any) => {
    // Don't allow dragging locked annotations
    if (locked) {
      return
    }

    // Convert screen coordinates to PDF coordinates
    const pdfCoords = screenToPdfCoordinates(d.x, d.y, {scale})

    const updatedAnnotation = updateAnnotationPosition(annotation, pdfCoords.x, pdfCoords.y, {
      editType: "annotation_moved",
    })

    onUpdate?.(updatedAnnotation, "annotation_moved")
  }

  const handleResizeStop: RndResizeCallback = (_e, _direction, ref, _delta, position) => {
    // Don't allow resizing locked annotations
    if (locked) {
      return
    }

    // Convert screen coordinates to PDF coordinates
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
      disableDragging={locked || isReadOnly} // Disable dragging for locked annotations or when select tool is active
      enableResizing={
        locked || isReadOnly
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
        locked
          ? "opacity-50 cursor-not-allowed pointer-events-none"
          : isReadOnly
            ? "pointer-events-none" // Make transparent to mouse events when select tool is active
            : "group hover:cursor-grab active:cursor-grabbing z-20 hover:shadow-md transition-shadow"
      } // Visual indication for locked annotations
      style={{
        zIndex: isReadOnly ? 1 : 20, // Lower z-index when select tool is active
      }}
      data-annotation={annotation.id}
    >
      <div className="w-full h-full relative">{children}</div>
    </Rnd>
  )
}
