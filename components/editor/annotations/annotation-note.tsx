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
  const [editText, setEditText] = React.useState(annotation.text || annotation.content || "")
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const color = annotation.color || "#FFCD45" // Default PDF sticky note color

  const handleDoubleClick = () => {
    setIsEditing(true)
    setEditText(annotation.text || annotation.content || "")
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditText(e.target.value)
  }

  const handleSave = () => {
    const updatedAnnotation = {
      ...annotation,
      text: editText,
      content: editText,
      updatedAt: new Date().toISOString(),
    }
    onUpdate?.(updatedAnnotation)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditText(annotation.text || annotation.content || "")
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

  // Handle clicks outside the textarea to save
  React.useEffect(() => {
    if (!isEditing) return

    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement

      // Don't save if clicking on the textarea itself or its container
      if (textareaRef.current?.contains(target)) {
        return
      }

      // Don't save if clicking on resize handles or drag areas
      if (
        target.closest("[data-rnd-drag-handle]") ||
        target.closest("[data-rnd-resize-handle]") ||
        target.closest("[data-annotation]")
      ) {
        return
      }

      // Don't save if clicking on toolbar or other UI elements
      if (
        target.closest("[data-toolbar]") ||
        target.closest("[data-sidebar]") ||
        target.closest("button") ||
        target.closest("input") ||
        target.closest("textarea")
      ) {
        return
      }

      // Save when clicking on PDF or other areas
      handleSave()
    }

    document.addEventListener("mousedown", handleMouseDown)

    return () => {
      document.removeEventListener("mousedown", handleMouseDown)
    }
  }, [isEditing, editText, annotation, onUpdate])

  // Focus textarea when entering edit mode
  React.useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()
    }
  }, [isEditing])

  return (
    <BaseAnnotation annotation={annotation} x={x} y={y} width={width} height={height} scale={scale} onUpdate={onUpdate}>
      <div
        className="w-full h-full relative"
        style={{
          backgroundColor: color,
          borderRadius: "2px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }}
        onDoubleClick={handleDoubleClick}
      >
        {!isEditing && (annotation.text || annotation.content) && (
          <div className="absolute top-4 left-1 right-1 bottom-1 text-xs text-gray-800 overflow-hidden whitespace-pre-wrap">
            {annotation.text || annotation.content}
          </div>
        )}

        {isEditing && (
          <div className="absolute top-4 left-1 right-1 bottom-1 bg-transparent z-10">
            <textarea
              ref={textareaRef}
              value={editText}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              className="w-full h-full resize-none border-none outline-none bg-transparent text-xs text-gray-800 p-0 rounded"
              placeholder="Enter note text..."
              autoFocus
            />
          </div>
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
