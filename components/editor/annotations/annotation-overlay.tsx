"use client"

import React from "react"

import {useGetAnnotationsByVersionQuery, useGetDocumentEditorQuery, useUpdateAnnotationMutation} from "@/lib/store/api"
import type {Annotation, Edit} from "@/lib/types"
import {isAnnotationLocked, pdfToScreenCoordinates, pdfToScreenDimensions} from "@/lib/utils/annotations"

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
  const isDiffMode = editor?.isDiffMode || false
  const isTextEditMode = editor?.activeTool?.type === "text_edit"
  const isSelectMode = editor?.activeTool?.type === "select"
  const isReadOnly = isDiffMode || isTextEditMode || isSelectMode
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

  // Memoize coordinate calculations for better performance
  const annotationComponents = React.useMemo(() => {
    return pageAnnotations.map(annotation => {
      // Convert PDF coordinates to screen coordinates
      const screenCoords = pdfToScreenCoordinates(annotation.x, annotation.y, {scale})
      const screenDims = pdfToScreenDimensions(annotation.width, annotation.height, {scale})

      const isLocked = isAnnotationLocked(annotation) || isReadOnly

      const annotationProps = {
        annotation,
        x: screenCoords.x,
        y: screenCoords.y,
        width: screenDims.width,
        height: screenDims.height,
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
    })
  }, [pageAnnotations, scale, isReadOnly, handleUpdateAnnotation, documentId])

  if (pageAnnotations.length === 0) {
    return null
  }

  return (
    <div className="absolute inset-0" style={{zIndex: isReadOnly ? 1 : 10}}>
      {annotationComponents}
    </div>
  )
}
