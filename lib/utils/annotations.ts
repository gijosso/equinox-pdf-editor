import type {Annotation, AnnotationType, PDFVersion} from "@/lib/types"

import {generateAnnotationId} from "./id"

export interface AnnotationCreationOptions {
  versionId: string
  pageNumber: number
  x: number
  y: number
  width: number
  height: number
  content?: string
  text?: string
  color?: string
  fontSize?: number
}

export function createHighlightAnnotation(options: AnnotationCreationOptions): Annotation {
  const id = generateAnnotationId()
  const now = new Date().toISOString()

  return {
    id,
    versionId: options.versionId,
    type: "highlight",
    pageNumber: options.pageNumber,
    x: options.x,
    y: options.y,
    width: options.width,
    height: options.height,
    content: options.content || "",
    text: options.text || "",
    color: options.color || "#ffeb3b", // Default yellow highlight
    createdAt: now,
    updatedAt: now,
    committedVersionId: undefined, // New annotations don't have a committed version yet
  }
}

export function createNoteAnnotation(options: AnnotationCreationOptions): Annotation {
  const id = generateAnnotationId()
  const now = new Date().toISOString()

  return {
    id,
    versionId: options.versionId,
    type: "note",
    pageNumber: options.pageNumber,
    x: options.x,
    y: options.y,
    width: options.width || 20, // Default note size
    height: options.height || 20,
    content: "", // Always start with empty content
    fontSize: options.fontSize || 12,
    createdAt: now,
    updatedAt: now,
    committedVersionId: undefined, // New annotations don't have a committed version yet
  }
}

export function createRedactionAnnotation(options: AnnotationCreationOptions): Annotation {
  const id = generateAnnotationId()
  const now = new Date().toISOString()

  return {
    id,
    versionId: options.versionId,
    type: "redaction",
    pageNumber: options.pageNumber,
    x: options.x,
    y: options.y,
    width: options.width,
    height: options.height,
    content: options.content || "",
    color: options.color || "#000000", // Default black redaction
    createdAt: now,
    updatedAt: now,
    committedVersionId: undefined, // New annotations don't have a committed version yet
  }
}

export function createAnnotation(type: AnnotationType, options: AnnotationCreationOptions): Annotation {
  switch (type) {
    case "highlight":
      return createHighlightAnnotation(options)
    case "note":
      return createNoteAnnotation(options)
    case "redaction":
      return createRedactionAnnotation(options)
    default:
      throw new Error(`Unknown annotation type: ${type}`)
  }
}

export function validateAnnotation(annotation: Partial<Annotation>): boolean {
  if (!annotation.id || !annotation.type || !annotation.pageNumber) {
    return false
  }

  if (typeof annotation.x !== "number" || typeof annotation.y !== "number") {
    return false
  }

  if (typeof annotation.width !== "number" || typeof annotation.height !== "number") {
    return false
  }

  if (annotation.width <= 0 || annotation.height <= 0) {
    return false
  }

  return true
}

export function getDefaultAnnotationColor(type: AnnotationType): string {
  switch (type) {
    case "highlight":
      return "#ffeb3b" // Yellow
    case "note":
      return "#FFE066" // Modern vibrant sticky note color
    case "redaction":
      return "#000000" // Black
    default:
      return "#ffeb3b"
  }
}

export function isAnnotationLocked(annotation: Annotation): boolean {
  if (!annotation.committedVersionId) {
    return false
  }

  return annotation.committedVersionId !== annotation.versionId
}
