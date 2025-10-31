"use client"

import React from "react"

import type {Annotation, Edit} from "@/lib/types"
import {getAnnotationStyleConfig, isWithinAnnotationInteraction, updateAnnotationContent} from "@/lib/utils/annotations"

import {AnnotationBase} from "./annotation-base"

interface AnnotationNoteProps {
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

export function AnnotationNote({
  annotation,
  x,
  y,
  width,
  height,
  scale,
  onUpdate,
  locked = false,
  documentId,
}: AnnotationNoteProps) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [editContent, setEditContent] = React.useState(annotation.content || "")
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const styleConfig = getAnnotationStyleConfig("note", locked)
  const color = annotation.color || styleConfig.color

  const handleDoubleClick = () => {
    // Don't allow editing locked annotations
    if (locked) {
      return
    }

    setIsEditing(true)
    setEditContent(annotation.content || "")
  }

  const handleSave = React.useCallback(() => {
    const updatedAnnotation = updateAnnotationContent(annotation, editContent, {
      editType: "annotation_text_changed",
    })
    onUpdate?.(updatedAnnotation, "annotation_text_changed")
    setIsEditing(false)
  }, [annotation, editContent, onUpdate])

  const handleCancel = () => {
    setIsEditing(false)
    setEditContent(annotation.content || "")
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && e.ctrlKey) {
      e.preventDefault()
      handleSave()
    } else if (e.key === "Escape") {
      e.preventDefault()
      handleCancel()
    }
  }

  // Handle clicks outside to save
  React.useEffect(() => {
    if (!isEditing) {
      return
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement

      // Don't save if clicking on annotation elements
      if (isWithinAnnotationInteraction(target)) {
        return
      }

      handleSave()
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isEditing, editContent, annotation, onUpdate, handleSave])

  // Focus textarea when editing
  React.useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()
    }
  }, [isEditing])

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
        className="w-full h-full relative cursor-pointer"
        style={{
          backgroundColor: color,
          borderRadius: styleConfig.borderRadius,
          boxShadow: styleConfig.boxShadow,
        }}
        onDoubleClick={handleDoubleClick}
      >
        {!isEditing && (
          <div className="absolute top-2 left-2 right-2 bottom-2 text-xs text-gray-800 overflow-hidden whitespace-pre-wrap">
            {annotation.content || "Double-click to add note..."}
          </div>
        )}

        {isEditing && (
          <textarea
            ref={textareaRef}
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
            onKeyDown={handleKeyDown}
            className="absolute top-2 left-2 right-2 bottom-2 w-auto h-auto resize-none border-none outline-none bg-transparent text-xs text-gray-800 p-0"
            placeholder="Enter note text..."
            autoFocus
          />
        )}

        <div
          className="absolute bottom-0 right-0 w-0 h-0"
          style={{
            borderLeft: "8px solid transparent",
            borderBottom: "8px solid rgba(0,0,0,0.1)",
          }}
        />
      </div>
    </AnnotationBase>
  )
}
