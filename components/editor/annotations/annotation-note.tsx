"use client"

import React from "react"

import type {Annotation} from "@/lib/types"

import {BaseAnnotation} from "./base-annotation"

interface AnnotationNoteProps {
  annotation: Annotation
  x: number
  y: number
  width: number
  height: number
  scale: number
  onUpdate?: (annotation: Annotation) => void
}

export function AnnotationNote({annotation, x, y, width, height, scale, onUpdate}: AnnotationNoteProps) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [editContent, setEditContent] = React.useState(annotation.content || "")
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const color = annotation.color || "#FFCD45" // Default PDF sticky note color

  const handleDoubleClick = () => {
    setIsEditing(true)
    setEditContent(annotation.content || "")
  }

  const handleSave = () => {
    const updatedAnnotation = {
      ...annotation,
      content: editContent,
      updatedAt: new Date().toISOString(),
    }
    onUpdate?.(updatedAnnotation)
    setIsEditing(false)
  }

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
    if (!isEditing) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement

      // Don't save if clicking on annotation elements
      if (
        target.closest("[data-annotation]") ||
        target.closest("[data-rnd-drag-handle]") ||
        target.closest("[data-rnd-resize-handle]")
      ) {
        return
      }

      handleSave()
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isEditing, editContent, annotation, onUpdate])

  // Focus textarea when editing
  React.useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()
    }
  }, [isEditing])

  return (
    <BaseAnnotation annotation={annotation} x={x} y={y} width={width} height={height} scale={scale} onUpdate={onUpdate}>
      <div
        className="w-full h-full relative cursor-pointer"
        style={{
          backgroundColor: color,
          borderRadius: "2px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
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
    </BaseAnnotation>
  )
}
