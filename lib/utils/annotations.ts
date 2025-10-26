/**
 * Standardized annotation creation utilities
 * Creates annotations with proper XFDF format and shapes
 */
import type {Annotation, AnnotationType} from "@/lib/types"

export interface AnnotationCreationOptions {
  pageNumber: number
  x: number
  y: number
  width: number
  height: number
  content?: string
  text?: string
  color?: string
  fontSize?: number
  quadPoints?: number[]
}

/**
 * Create a text highlight annotation
 * Highlights selected text with a colored background
 */
export function createHighlightAnnotation(options: AnnotationCreationOptions): Annotation {
  const id = `highlight-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  const now = new Date().toISOString()

  return {
    id,
    type: "highlight",
    xfdfType: "highlight",
    pageNumber: options.pageNumber,
    x: options.x,
    y: options.y,
    width: options.width,
    height: options.height,
    content: options.content || "",
    text: options.text || "",
    color: options.color || "#ffeb3b", // Default yellow highlight
    quadPoints: options.quadPoints || [
      options.x,
      options.y + options.height, // Bottom-left
      options.x + options.width,
      options.y + options.height, // Bottom-right
      options.x,
      options.y, // Top-left
      options.x + options.width,
      options.y, // Top-right
    ],
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * Create a text note annotation
 * Adds a sticky note with text content
 */
export function createNoteAnnotation(options: AnnotationCreationOptions): Annotation {
  const id = `note-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  const now = new Date().toISOString()

  return {
    id,
    type: "note",
    xfdfType: "text",
    pageNumber: options.pageNumber,
    x: options.x,
    y: options.y,
    width: options.width || 20, // Default note size
    height: options.height || 20,
    content: "", // Always start with empty content
    text: "", // Always start with empty text
    fontSize: options.fontSize || 12,
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * Create a redaction annotation
 * Blackens out sensitive content
 */
export function createRedactionAnnotation(options: AnnotationCreationOptions): Annotation {
  const id = `redaction-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  const now = new Date().toISOString()

  return {
    id,
    type: "redaction",
    xfdfType: "redaction",
    pageNumber: options.pageNumber,
    x: options.x,
    y: options.y,
    width: options.width,
    height: options.height,
    content: options.content || "",
    color: options.color || "#000000", // Default black redaction
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * Create annotation based on type
 */
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

/**
 * Validate annotation data
 */
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

/**
 * Get default colors for annotation types
 */
export function getDefaultAnnotationColor(type: AnnotationType): string {
  switch (type) {
    case "highlight":
      return "#ffeb3b" // Yellow
    case "note":
      return "#FFCD45" // PDF standard sticky note yellow
    case "redaction":
      return "#000000" // Black
    default:
      return "#ffeb3b"
  }
}

/**
 * Convert annotation to XFDF format
 */
export function annotationToXFDF(annotation: Annotation): string {
  const xfdfAttributes = {
    id: annotation.id,
    type: annotation.xfdfType,
    pageNumber: annotation.pageNumber.toString(),
    x: annotation.x.toString(),
    y: annotation.y.toString(),
    width: annotation.width.toString(),
    height: annotation.height.toString(),
    content: annotation.content || "",
    createdAt: annotation.createdAt,
  }

  // Add type-specific attributes
  if (annotation.color) {
    ;(xfdfAttributes as any).color = annotation.color
  }

  if (annotation.text) {
    ;(xfdfAttributes as any).text = annotation.text
  }

  if (annotation.fontSize) {
    ;(xfdfAttributes as any).fontSize = annotation.fontSize.toString()
  }

  if (annotation.quadPoints && annotation.quadPoints.length === 8) {
    ;(xfdfAttributes as any).quadPoints = annotation.quadPoints.join(",")
  }

  // Create XFDF annotation element
  const attributes = Object.entries(xfdfAttributes)
    .map(([key, value]) => `${key}="${value}"`)
    .join(" ")

  return `<annotation ${attributes} />`
}

/**
 * Parse XFDF annotation back to Annotation object
 */
export function parseXFDFAnnotation(xfdfElement: Element): Annotation | null {
  try {
    const id = xfdfElement.getAttribute("id")
    const xfdfType = xfdfElement.getAttribute("type") as "highlight" | "text" | "redaction"
    const pageNumber = parseInt(xfdfElement.getAttribute("pageNumber") || "1")
    const x = parseFloat(xfdfElement.getAttribute("x") || "0")
    const y = parseFloat(xfdfElement.getAttribute("y") || "0")
    const width = parseFloat(xfdfElement.getAttribute("width") || "0")
    const height = parseFloat(xfdfElement.getAttribute("height") || "0")
    const content = xfdfElement.getAttribute("content") || ""
    const text = xfdfElement.getAttribute("text") || ""
    const color = xfdfElement.getAttribute("color") || ""
    const fontSize = parseInt(xfdfElement.getAttribute("fontSize") || "12")
    const createdAt = xfdfElement.getAttribute("createdAt") || new Date().toISOString()

    const quadPointsStr = xfdfElement.getAttribute("quadPoints")
    const quadPoints = quadPointsStr ? quadPointsStr.split(",").map(Number) : undefined

    if (!id || !xfdfType || !pageNumber) {
      return null
    }

    // Map XFDF type to our annotation type
    let annotationType: AnnotationType
    switch (xfdfType) {
      case "highlight":
        annotationType = "highlight"
        break
      case "text":
        annotationType = "note"
        break
      case "redaction":
        annotationType = "redaction"
        break
      default:
        return null
    }

    return {
      id,
      type: annotationType,
      xfdfType,
      pageNumber,
      x,
      y,
      width,
      height,
      content,
      text,
      color,
      fontSize,
      quadPoints,
      createdAt,
      updatedAt: createdAt, // Use createdAt as updatedAt for imported annotations
    }
  } catch (error) {
    console.error("Error parsing XFDF annotation:", error)
    return null
  }
}
