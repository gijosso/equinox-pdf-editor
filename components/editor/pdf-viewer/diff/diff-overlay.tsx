"use client"

import React from "react"

import type {Annotation, AnnotationDiff, TextEdit} from "@/lib/types"

import {DIFF_OVERLAY_CONFIG} from "./diff-overlay-configs"

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
  annotationDiffs: AnnotationDiff[]
  untouchedAnnotations: Annotation[]
  textEditDiffs?: ({annotationType: AnnotationDiff["type"]} & TextEdit)[]
  untouchedTextEdits?: ({annotationType: AnnotationDiff["type"]} & TextEdit)[]
  pageNumber: number
  scale: number
  viewportWidth: number
  viewportHeight: number
}

function DiffOverlayImpl({
  annotationDiffs,
  untouchedAnnotations,
  textEditDiffs = [],
  untouchedTextEdits = [],
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
  const pageTextEditDiffs = React.useMemo(
    () => textEditDiffs.filter(e => e.pageNumber === pageNumber),
    [textEditDiffs, pageNumber],
  )
  const pageUntouchedTextEdits = React.useMemo(
    () => untouchedTextEdits.filter(e => e.pageNumber === pageNumber),
    [untouchedTextEdits, pageNumber],
  )

  if (
    pageAnnotationDiffs.length === 0 &&
    pageUntouchedAnnotations.length === 0 &&
    pageTextEditDiffs.length === 0 &&
    pageUntouchedTextEdits.length === 0
  ) {
    return null
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-10" style={{width: viewportWidth, height: viewportHeight}}>
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

      {pageTextEditDiffs.map((edit, idx) => (
        <AnnotationDiffHighlight
          key={`textedit-${idx}`}
          annotation={
            {
              id: edit.id,
              versionId: edit.versionId,
              type: "note",
              pageNumber: edit.pageNumber,
              createdAt: edit.createdAt,
              updatedAt: edit.updatedAt,
              content: edit.newText || edit.originalText,
              x: edit.x,
              y: edit.y,
              width: Math.max(edit.width, 20),
              height: edit.height + 5,
            } as any
          }
          type={edit.annotationType}
          scale={scale}
        />
      ))}

      {pageUntouchedTextEdits.map((te, idx) => (
        <UntouchedAnnotationHighlight
          key={`textedit-untouched-${idx}`}
          annotation={
            {
              id: te.id,
              versionId: te.versionId,
              type: "note",
              pageNumber: te.pageNumber,
              createdAt: te.createdAt,
              updatedAt: te.updatedAt,
              content: te.newText || te.originalText,
              x: te.x,
              y: te.y,
              width: Math.max(te.width, 20),
              height: te.height + 5,
            } as any
          }
          scale={scale}
        />
      ))}
    </div>
  )
}

export const DiffOverlay = React.memo(DiffOverlayImpl)
