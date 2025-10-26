import type {Annotation, AnnotationType} from "@/lib/types"

import type {XFDFAnnotation} from "./xfdf"

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
  quadPoints?: number[]
}

export function createHighlightAnnotation(options: AnnotationCreationOptions): Annotation {
  const id = `highlight-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  const now = new Date().toISOString()

  return {
    id,
    versionId: options.versionId,
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

export function createNoteAnnotation(options: AnnotationCreationOptions): Annotation {
  const id = `note-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  const now = new Date().toISOString()

  return {
    id,
    versionId: options.versionId,
    type: "note",
    xfdfType: "text",
    pageNumber: options.pageNumber,
    x: options.x,
    y: options.y,
    width: options.width || 20, // Default note size
    height: options.height || 20,
    content: "", // Always start with empty content
    fontSize: options.fontSize || 12,
    createdAt: now,
    updatedAt: now,
  }
}

export function createRedactionAnnotation(options: AnnotationCreationOptions): Annotation {
  const id = `redaction-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  const now = new Date().toISOString()

  return {
    id,
    versionId: options.versionId,
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

export function convertXFDFAnnotationsToAnnotations(
  xfdfAnnotations: XFDFAnnotation[],
  versionId: string,
): Annotation[] {
  return xfdfAnnotations.map(xfdfAnnotation => {
    // Map XFDF type to our annotation type
    let annotationType: AnnotationType
    switch (xfdfAnnotation.type) {
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
        console.warn(`Unknown XFDF annotation type: ${xfdfAnnotation.type}`)
        annotationType = "note" // Default fallback
    }

    return {
      id: xfdfAnnotation.id,
      versionId: versionId,
      type: annotationType,
      pageNumber: xfdfAnnotation.pageNumber,
      x: xfdfAnnotation.x,
      y: xfdfAnnotation.y,
      width: xfdfAnnotation.width,
      height: xfdfAnnotation.height,
      content: xfdfAnnotation.content || "",
      color: xfdfAnnotation.color,
      fontSize: xfdfAnnotation.fontSize,
      xfdfType: xfdfAnnotation.type,
      quadPoints: xfdfAnnotation.quadPoints,
      createdAt: xfdfAnnotation.createdAt,
      updatedAt: xfdfAnnotation.updatedAt,
    }
  })
}

export function parseXFDFAnnotation(xfdfElement: Element, versionId: string): Annotation | null {
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
      versionId: versionId,
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
