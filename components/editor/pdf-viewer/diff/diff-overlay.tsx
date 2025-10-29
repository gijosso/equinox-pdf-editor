"use client"

import React from "react"

import type {Annotation, AnnotationDiff, TextDiff, TextSpan} from "@/lib/types"

import {DIFF_OVERLAY_CONFIG} from "./diff-overlay-configs"

interface DiffHighlightProps {
  span: TextSpan
  type: AnnotationDiff["type"]
  scale: number
}

function DiffHighlight({span, type, scale}: DiffHighlightProps) {
  const config = DIFF_OVERLAY_CONFIG[type]
  return (
    <div
      className={`absolute pointer-events-none border rounded-sm ${config.highlightClasses}`}
      style={{left: span.x * scale, top: span.y * scale, width: span.width * scale, height: span.height * scale}}
    >
      <div
        className={`absolute -top-2 -left-2 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold text-white ${config.iconClasses}`}
      >
        {config.icon}
      </div>
    </div>
  )
}

interface AnnotationDiffHighlightProps {
  annotation: AnnotationDiff["annotation"]
  type: AnnotationDiff["type"]
  scale: number
}

function AnnotationDiffHighlight({annotation, type, scale}: AnnotationDiffHighlightProps) {
  const config = DIFF_OVERLAY_CONFIG[type]
  return (
    <div
      className={`absolute pointer-events-none border-2 rounded bg-transparent ${config.outlineClasses}`}
      style={{
        left: annotation.x * scale,
        top: annotation.y * scale,
        width: annotation.width * scale,
        height: annotation.height * scale,
      }}
    >
      <div
        className={`absolute -top-3 -left-3 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm ${config.iconClasses}`}
      >
        {config.icon}
      </div>
    </div>
  )
}

interface UntouchedAnnotationHighlightProps {
  annotation: Annotation
  scale: number
}

function UntouchedAnnotationHighlight({annotation, scale}: UntouchedAnnotationHighlightProps) {
  const config = DIFF_OVERLAY_CONFIG.untouched
  return (
    <div
      className={`absolute pointer-events-none border-2 rounded bg-transparent ${config.outlineClasses}`}
      style={{
        left: annotation.x * scale,
        top: annotation.y * scale,
        width: annotation.width * scale,
        height: annotation.height * scale,
      }}
    >
      <div
        className={`absolute -top-3 -left-3 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm ${config.iconClasses}`}
      >
        {config.icon}
      </div>
    </div>
  )
}

interface DiffOverlayProps {
  textDiffs: TextDiff[]
  annotationDiffs: AnnotationDiff[]
  untouchedAnnotations: Annotation[]
  pageNumber: number
  scale: number
  viewportWidth: number
  viewportHeight: number
}

export function DiffOverlay({
  textDiffs,
  annotationDiffs,
  untouchedAnnotations,
  pageNumber,
  scale,
  viewportWidth,
  viewportHeight,
}: DiffOverlayProps) {
  const pageAnnotationDiffs = React.useMemo(
    () => annotationDiffs.filter(diff => diff.annotation.pageNumber === pageNumber),
    [annotationDiffs, pageNumber],
  )
  const pageUntouchedAnnotations = React.useMemo(
    () => untouchedAnnotations.filter(annotation => annotation.pageNumber === pageNumber),
    [untouchedAnnotations, pageNumber],
  )
  const pageTextDiffs = React.useMemo(
    () =>
      textDiffs.filter(diff => {
        if (diff.type === "equal") return false
        return diff.spans?.some(span => span.pageNumber === pageNumber)
      }),
    [textDiffs, pageNumber],
  )

  if (pageTextDiffs.length === 0 && pageAnnotationDiffs.length === 0 && pageUntouchedAnnotations.length === 0) {
    return null
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-10" style={{width: viewportWidth, height: viewportHeight}}>
      {pageTextDiffs.map((diff, diffIndex) => {
        if (!diff.spans) return null
        return diff.spans
          .filter(span => span.pageNumber === pageNumber)
          .map((span, spanIndex) => (
            <DiffHighlight
              key={`text-${diffIndex}-${spanIndex}`}
              span={span}
              type={diff.type === "insert" ? "added" : diff.type === "delete" ? "removed" : "modified"}
              scale={scale}
            />
          ))
      })}

      {pageAnnotationDiffs.map((diff, diffIndex) => (
        <AnnotationDiffHighlight
          key={`annotation-${diffIndex}`}
          annotation={diff.annotation}
          type={diff.type}
          scale={scale}
        />
      ))}

      {pageUntouchedAnnotations.map((annotation, index) => (
        <UntouchedAnnotationHighlight key={`untouched-${index}`} annotation={annotation} scale={scale} />
      ))}
    </div>
  )
}
