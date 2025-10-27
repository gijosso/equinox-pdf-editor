"use client"

import type {Annotation} from "@/lib/types"

import {BaseAnnotation} from "./base-annotation"

interface AnnotationRedactionProps {
  annotation: Annotation
  x: number
  y: number
  width: number
  height: number
  scale: number
  onUpdate?: (annotation: Annotation) => void
  locked?: boolean
}

export function AnnotationRedaction({
  annotation,
  x,
  y,
  width,
  height,
  scale,
  onUpdate,
  locked = false,
}: AnnotationRedactionProps) {
  const color = annotation.color || "#000000"

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
    >
      <div
        className="w-full h-full hover:opacity-80 transition-opacity"
        style={{
          backgroundColor: color,
          borderRadius: "2px",
        }}
        title="Redacted content"
      >
        <div
          className="w-full h-full opacity-30"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)",
          }}
        />
      </div>
    </BaseAnnotation>
  )
}
