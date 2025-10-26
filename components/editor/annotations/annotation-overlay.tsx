"use client"

import React from "react"

import {useAppDispatch, useAppSelector} from "@/lib/store/hooks"
import {selectEditorState} from "@/lib/store/selectors/editor"
import {updateAnnotation} from "@/lib/store/slices/editor"
import type {Annotation} from "@/lib/types"

import {AnnotationHighlight} from "./annotation-highlight"
import {AnnotationNote} from "./annotation-note"
import {AnnotationRedaction} from "./annotation-redaction"

interface AnnotationOverlayProps {
  scale: number
  pageWidth: number
  pageHeight: number
}

export function AnnotationOverlay({scale}: AnnotationOverlayProps) {
  const dispatch = useAppDispatch()
  const {annotations, currentPage, documentId, activeTool} = useAppSelector(selectEditorState)

  // Filter annotations for current page
  const pageAnnotations = React.useMemo(
    () => annotations?.filter(annotation => annotation.pageNumber === currentPage) || [],
    [annotations, currentPage],
  )

  // Check if select tool is active - if so, make annotations transparent to mouse events
  const isSelectToolActive = activeTool.type === "select"

  const handleUpdateAnnotation = React.useCallback(
    (annotation: Annotation) => {
      dispatch(updateAnnotation({documentId: documentId || "", id: annotation.id, updates: annotation}))
    },
    [dispatch, documentId],
  )

  if (pageAnnotations.length === 0) {
    return null
  }

  return (
    <div className={`absolute inset-0 z-10 ${isSelectToolActive ? "pointer-events-none" : ""}`}>
      {pageAnnotations.map(annotation => {
        // Convert PDF coordinates to screen coordinates
        const screenX = annotation.x * scale
        const screenY = annotation.y * scale
        const screenWidth = annotation.width * scale
        const screenHeight = annotation.height * scale

        const annotationProps = {
          annotation,
          x: screenX,
          y: screenY,
          width: screenWidth,
          height: screenHeight,
          scale,
          onUpdate: handleUpdateAnnotation,
        }

        switch (annotation.type) {
          case "highlight":
            return <AnnotationHighlight key={annotation.id} {...annotationProps} />
          case "note":
            return <AnnotationNote key={annotation.id} {...annotationProps} />
          case "redaction":
            return <AnnotationRedaction key={annotation.id} {...annotationProps} />
          default:
            return null
        }
      })}
    </div>
  )
}
