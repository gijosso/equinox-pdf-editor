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
}

export function BaseAnnotation({annotation, x, y, width, height, scale, children, onUpdate}: BaseAnnotationProps) {
  const handleDragStop = (e: any, d: any) => {
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
      enableResizing={{
        top: true,
        right: true,
        bottom: true,
        left: true,
        topRight: true,
        bottomRight: true,
        bottomLeft: true,
        topLeft: true,
      }}
      disableDragging={false}
      className="group hover:cursor-grab active:cursor-grabbing z-20"
      style={{
        zIndex: 20,
      }}
      data-annotation={annotation.id}
    >
      <div className="w-full h-full relative">{children}</div>
    </Rnd>
  )
}
