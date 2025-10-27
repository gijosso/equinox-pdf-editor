"use client"

import type {Annotation, Edit} from "@/lib/types"

import {BaseAnnotation} from "./base-annotation"

interface AnnotationHighlightProps {
  annotation: Annotation
  x: number
  y: number
  width: number
  height: number
  scale: number
  onUpdate?: (annotation: Annotation, editType?: Edit["type"]) => void
  locked?: boolean
  documentId: string
}

export function AnnotationHighlight({
  annotation,
  x,
  y,
  width,
  height,
  scale,
  onUpdate,
  locked = false,
  documentId,
}: AnnotationHighlightProps) {
  const color = annotation.color || "#ffeb3b"
  const opacity = locked ? 0.1 : 0.3 // Reduced opacity for locked annotations

  return (
    <BaseAnnotation
      annotation={annotation}
      x={x}
      y={y}
      width={width}
      height={height}
      scale={scale}
      onUpdate={onUpdate}
      locked={locked}
      documentId={documentId}
    >
      <div
        className="w-full h-full hover:opacity-50 transition-opacity"
        style={{
          backgroundColor: color,
          opacity,
          borderRadius: "2px",
        }}
        title={annotation.content || "Highlight"}
      />
    </BaseAnnotation>
  )
}
