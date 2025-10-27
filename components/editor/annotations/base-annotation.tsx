"use client"

import React from "react"
import {Rnd, RndResizeCallback} from "react-rnd"

import type {Annotation} from "@/lib/types"

interface BaseAnnotationProps {
  annotation: Annotation
  x: number
  y: number
  width: number
  height: number
  scale: number
  children: React.ReactNode
  onUpdate?: (annotation: Annotation) => void
  locked?: boolean
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
}: BaseAnnotationProps) {
  const handleDragStop = (e: any, d: any) => {
    // Don't allow dragging locked annotations
    if (locked) {
      return
    }

    // Convert screen coordinates to PDF coordinates
    const pdfX = d.x / scale
    const pdfY = d.y / scale

    const updatedAnnotation = {
      ...annotation,
      x: pdfX,
      y: pdfY,
      updatedAt: new Date().toISOString(),
    }

    onUpdate?.(updatedAnnotation)
  }

  const handleResizeStop: RndResizeCallback = (_e, _direction, ref, _delta, position) => {
    // Don't allow resizing locked annotations
    if (locked) {
      return
    }

    // Convert screen coordinates to PDF coordinates
    const pdfX = position.x / scale
    const pdfY = position.y / scale
    const pdfWidth = parseFloat(ref.style.width.replace("px", "")) / scale
    const pdfHeight = parseFloat(ref.style.height.replace("px", "")) / scale

    const updatedAnnotation = {
      ...annotation,
      x: pdfX,
      y: pdfY,
      width: pdfWidth,
      height: pdfHeight,
      updatedAt: new Date().toISOString(),
    }

    onUpdate?.(updatedAnnotation)
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
      disableDragging={locked} // Disable dragging for locked annotations
      enableResizing={
        locked
          ? false
          : {
              // Disable resizing for locked annotations
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
          : "group hover:cursor-grab active:cursor-grabbing z-20"
      } // Visual indication for locked annotations
      style={{
        zIndex: 20,
      }}
      data-annotation={annotation.id}
    >
      <div className="w-full h-full relative">{children}</div>
    </Rnd>
  )
}
