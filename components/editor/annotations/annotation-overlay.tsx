"use client"

import React from "react"

import {useGetAnnotationsByVersionQuery, useGetDocumentEditorQuery, useUpdateAnnotationMutation} from "@/lib/store/api"
import type {Annotation} from "@/lib/types"

import {AnnotationHighlight} from "./annotation-highlight"
import {AnnotationNote} from "./annotation-note"
import {AnnotationRedaction} from "./annotation-redaction"

interface AnnotationOverlayProps {
  scale: number
  pageWidth: number
  pageHeight: number
  documentId: string
}

export function AnnotationOverlay({scale, documentId}: AnnotationOverlayProps) {
  const {data: editor} = useGetDocumentEditorQuery(documentId, {skip: !documentId})
  const currentVersionId = editor?.currentVersionId || null
  const activeTool = editor?.activeTool || {type: "select"}
  const currentPage = editor?.currentPage || 1
  const [updateAnnotation] = useUpdateAnnotationMutation()

  const {data: annotations = []} = useGetAnnotationsByVersionQuery(currentVersionId || "", {
    skip: !currentVersionId,
  })

  // Filter annotations for current page
  const pageAnnotations = React.useMemo(
    () => annotations.filter(annotation => annotation.pageNumber === currentPage) || [],
    [annotations, currentPage],
  )

  // Check if select tool is active - if so, make annotations transparent to mouse events
  const isSelectToolActive = activeTool.type === "select"

  const handleUpdateAnnotation = React.useCallback(
    async (annotation: Annotation) => {
      if (!currentVersionId) {
        return
      }

      try {
        await updateAnnotation({
          id: annotation.id,
          versionId: currentVersionId,
          updates: annotation,
        }).unwrap()
      } catch (error) {
        console.error("Failed to update annotation:", error)
      }
    },
    [updateAnnotation, currentVersionId],
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
