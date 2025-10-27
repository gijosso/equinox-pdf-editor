"use client"

import type {Annotation, Edit} from "@/lib/types"
import {getAnnotationStyleConfig} from "@/lib/utils/annotations"

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
  const styleConfig = getAnnotationStyleConfig("highlight", locked)
  const color = annotation.color || styleConfig.color

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
          opacity: styleConfig.opacity,
          borderRadius: styleConfig.borderRadius,
        }}
        title={annotation.content || "Highlight"}
      />
    </BaseAnnotation>
  )
}
