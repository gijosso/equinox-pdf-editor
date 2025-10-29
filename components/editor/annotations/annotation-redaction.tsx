"use client"

import type {Annotation, Edit} from "@/lib/types"
import {getAnnotationStyleConfig} from "@/lib/utils/annotations"

import {AnnotationBase} from "./annotation-base"

interface AnnotationRedactionProps {
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

export function AnnotationRedaction({
  annotation,
  x,
  y,
  width,
  height,
  scale,
  onUpdate,
  locked = false,
  documentId,
}: AnnotationRedactionProps) {
  const styleConfig = getAnnotationStyleConfig("redaction", locked)
  const color = annotation.color || styleConfig.color

  return (
    <AnnotationBase
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
        className="w-full h-full hover:opacity-80 transition-opacity"
        style={{
          backgroundColor: color,
          borderRadius: styleConfig.borderRadius,
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
    </AnnotationBase>
  )
}
