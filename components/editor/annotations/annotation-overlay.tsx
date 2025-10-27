"use client"

import React from "react"

import {useGetAnnotationsByVersionQuery, useGetDocumentEditorQuery, useUpdateAnnotationMutation} from "@/lib/store/api"
import type {Annotation, Edit} from "@/lib/types"
import {isAnnotationLocked} from "@/lib/utils/annotations"

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

  const handleUpdateAnnotation = React.useCallback(
    async (annotation: Annotation, editType?: Edit["type"]) => {
      if (!currentVersionId) {
        return
      }

      // Don't allow updating committed annotations
      if (isAnnotationLocked(annotation)) {
        console.warn("Cannot update committed annotation:", annotation.id)
        return
      }

      try {
        await updateAnnotation({
          id: annotation.id,
          versionId: currentVersionId,
          updates: annotation,
          editType: editType || "annotation_updated", // Use specific edit type or fallback to generic
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
    <div className="absolute inset-0" style={{zIndex: editor?.activeTool?.type === "select" ? 1 : 10}}>
      {pageAnnotations.map(annotation => {
        // Convert PDF coordinates to screen coordinates
        const screenX = annotation.x * scale
        const screenY = annotation.y * scale
        const screenWidth = annotation.width * scale
        const screenHeight = annotation.height * scale

        const isLocked = isAnnotationLocked(annotation)
        const annotationProps = {
          annotation,
          x: screenX,
          y: screenY,
          width: screenWidth,
          height: screenHeight,
          scale,
          onUpdate: handleUpdateAnnotation,
          locked: isLocked,
          documentId,
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
