"use client"

import type {Annotation} from "@/lib/types"

import {BaseAnnotation} from "./base-annotation"

interface AnnotationHighlightProps {
  annotation: Annotation
  x: number
  y: number
  width: number
  height: number
  scale: number
  onUpdate?: (annotation: Annotation) => void
}

export function AnnotationHighlight({annotation, x, y, width, height, scale, onUpdate}: AnnotationHighlightProps) {
  const color = annotation.color || "#ffeb3b"
  const opacity = 0.3

  return (
    <BaseAnnotation annotation={annotation} x={x} y={y} width={width} height={height} scale={scale} onUpdate={onUpdate}>
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
