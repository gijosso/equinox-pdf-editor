import type {Annotation, AnnotationType, Edit} from "@/lib/types"
import {ValidationError} from "@/lib/utils/error-handling"

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
    originalId: id,
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
    originalId: id,
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
    originalId: id,
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
      throw new ValidationError(`Unknown annotation type: ${type}`, "type", type)
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
  return !!annotation.committedVersionId
}

export function areAnnotationsDifferent(ann1: Annotation, ann2: Annotation) {
  return (
    ann1.x !== ann2.x ||
    ann1.y !== ann2.y ||
    ann1.width !== ann2.width ||
    ann1.height !== ann2.height ||
    ann1.content !== ann2.content ||
    ann1.text !== ann2.text ||
    ann1.color !== ann2.color ||
    ann1.fontSize !== ann2.fontSize ||
    ann1.type !== ann2.type ||
    ann1.pageNumber !== ann2.pageNumber
  )
}

export interface CoordinateConversionOptions {
  scale: number
}

export function screenToPdfCoordinates(
  screenX: number,
  screenY: number,
  options: CoordinateConversionOptions,
): {x: number; y: number} {
  return {
    x: screenX / options.scale,
    y: screenY / options.scale,
  }
}

export function pdfToScreenCoordinates(
  pdfX: number,
  pdfY: number,
  options: CoordinateConversionOptions,
): {x: number; y: number} {
  return {
    x: pdfX * options.scale,
    y: pdfY * options.scale,
  }
}

export function screenToPdfDimensions(
  screenWidth: number,
  screenHeight: number,
  options: CoordinateConversionOptions,
): {width: number; height: number} {
  return {
    width: screenWidth / options.scale,
    height: screenHeight / options.scale,
  }
}

export function pdfToScreenDimensions(
  pdfWidth: number,
  pdfHeight: number,
  options: CoordinateConversionOptions,
): {width: number; height: number} {
  return {
    width: pdfWidth * options.scale,
    height: pdfHeight * options.scale,
  }
}

export interface AnnotationBounds {
  x: number
  y: number
  width: number
  height: number
}

export function calculateAnnotationBounds(
  startPos: {x: number; y: number},
  currentPos: {x: number; y: number},
): AnnotationBounds {
  const x = Math.min(startPos.x, currentPos.x)
  const y = Math.min(startPos.y, currentPos.y)
  const width = Math.abs(currentPos.x - startPos.x)
  const height = Math.abs(currentPos.y - startPos.y)

  return {x, y, width, height}
}

export function isValidAnnotationSize(bounds: AnnotationBounds, minSize: number = 5): boolean {
  return bounds.width > minSize && bounds.height > minSize
}

export interface AnnotationUpdateOptions {
  editType?: Edit["type"]
  updateTimestamp?: boolean
}

export function updateAnnotationPosition(
  annotation: Annotation,
  newX: number,
  newY: number,
  options: AnnotationUpdateOptions = {},
): Annotation {
  return {
    ...annotation,
    x: newX,
    y: newY,
    updatedAt: options.updateTimestamp !== false ? new Date().toISOString() : annotation.updatedAt,
  }
}

export function updateAnnotationDimensions(
  annotation: Annotation,
  newX: number,
  newY: number,
  newWidth: number,
  newHeight: number,
  options: AnnotationUpdateOptions = {},
): Annotation {
  return {
    ...annotation,
    x: newX,
    y: newY,
    width: newWidth,
    height: newHeight,
    updatedAt: options.updateTimestamp !== false ? new Date().toISOString() : annotation.updatedAt,
  }
}

export function updateAnnotationContent(
  annotation: Annotation,
  newContent: string,
  options: AnnotationUpdateOptions = {},
): Annotation {
  return {
    ...annotation,
    content: newContent,
    updatedAt: options.updateTimestamp !== false ? new Date().toISOString() : annotation.updatedAt,
  }
}

export interface AnnotationStyleConfig {
  color: string
  opacity: number
  borderRadius: string
  boxShadow?: string
}

const styleConfigCache = new Map<string, AnnotationStyleConfig>()

export function getAnnotationStyleConfig(type: AnnotationType, locked: boolean = false): AnnotationStyleConfig {
  const cacheKey = `${type}-${locked}`

  if (styleConfigCache.has(cacheKey)) {
    return styleConfigCache.get(cacheKey)!
  }

  const baseConfig = {
    highlight: {
      color: "#ffeb3b",
      opacity: locked ? 0.3 : 0.4,
      borderRadius: "2px",
    },
    note: {
      color: "#FFCD45",
      opacity: 1,
      borderRadius: "2px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
    },
    redaction: {
      color: "#000000",
      opacity: 1,
      borderRadius: "2px",
    },
  }

  const config = baseConfig[type]
  styleConfigCache.set(cacheKey, config)
  return config
}

export function getAnnotationPreviewColor(type: AnnotationType): string {
  const colors = {
    highlight: "#ffeb3b",
    note: "#FFCD45",
    redaction: "#000000",
  }
  return colors[type] || "#666666"
}

export function isWithinAnnotation(target: HTMLElement): boolean {
  return !!target.closest("[data-annotation]")
}

export function isWithinAnnotationInteraction(target: HTMLElement): boolean {
  return !!(
    target.closest("[data-annotation]") ||
    target.closest("[data-rnd-drag-handle]") ||
    target.closest("[data-rnd-resize-handle]")
  )
}

export function getAnnotationCursorStyle(
  toolType: string,
  isCreating: boolean = false,
  isReadOnly: boolean = false,
): string {
  if (isReadOnly) return "default"
  if (isCreating) return "crosshair"
  if (toolType === "select") return "default"
  if (toolType === "text_edit") return "text"
  return "crosshair"
}

export function getAnnotationUserSelectStyle(toolType: string): "auto" | "none" {
  return toolType === "select" || toolType === "text_edit" ? "auto" : "none"
}

export function validateAnnotationCreation(
  bounds: AnnotationBounds,
  currentVersionId: string | null,
  minSize: number = 5,
): {isValid: boolean; error?: string} {
  if (!currentVersionId) {
    return {isValid: false, error: "No current version ID"}
  }

  if (!isValidAnnotationSize(bounds, minSize)) {
    return {isValid: false, error: "Annotation too small"}
  }

  return {isValid: true}
}
