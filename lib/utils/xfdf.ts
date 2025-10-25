/**
 * XFDF (XML Forms Data Format) utilities for PDF annotations
 * XFDF is the standard format for PDF annotations and form data
 */
import {Builder} from "xml2js"

import {extractPDFAnnotations} from "./pdf"

export interface XFDFAnnotation {
  id: string
  type: "highlight" | "note" | "draw" | "erase" | "text" | "redaction"
  pageNumber: number
  x: number
  y: number
  width: number
  height: number
  content?: string
  color?: string
  createdAt: string
}

export interface XFDFDocument {
  annotations: XFDFAnnotation[]
  metadata: {
    documentId: string
    versionNumber: number
    createdAt: string
    message: string
  }
}

/**
 * Extract annotations from a PDF file and convert to XFDF format
 * This creates the initial XFDF version with any existing PDF annotations
 */
export async function fileToXFDF(file: File): Promise<string> {
  try {
    // Use pdf-lib to extract annotations
    const extractedAnnotations = await extractPDFAnnotations(file)

    // Create XFDF with extracted annotations
    const metadata = {
      documentId: `doc-${Date.now()}`,
      versionNumber: 1,
      createdAt: new Date().toISOString(),
      message: `Extracted from ${file.name} (${extractedAnnotations.length} annotations)`,
    }

    return annotationsToXFDF(extractedAnnotations, metadata)
  } catch (error) {
    console.error("Error extracting annotations from PDF:", error)
    // Return empty XFDF on error
    const metadata = {
      documentId: `doc-${Date.now()}`,
      versionNumber: 1,
      createdAt: new Date().toISOString(),
      message: `Failed to extract from ${file.name}`,
    }
    return annotationsToXFDF([], metadata)
  }
}

/**
 * Convert JavaScript annotations to XFDF format
 * This is used to create destructive versions with all current annotations
 */
export function annotationsToXFDF(
  annotations: any[],
  metadata: {
    documentId: string
    versionNumber: number
    createdAt: string
    message: string
  },
): string {
  const xfdfDoc: XFDFDocument = {
    annotations: annotations.map(annotation => ({
      id: annotation.id,
      type: annotation.type,
      pageNumber: annotation.pageNumber,
      x: annotation.x,
      y: annotation.y,
      width: annotation.width,
      height: annotation.height,
      content: annotation.content || "",
      color: annotation.color || "#ffeb3b",
      createdAt: annotation.createdAt || new Date().toISOString(),
    })),
    metadata,
  }

  return generateXFDFString(xfdfDoc)
}

/**
 * Convert XFDF string back to JavaScript annotations
 * This loads annotations from a version for editing
 */
export function xfdfToAnnotations(xfdfString: string): {annotations: XFDFAnnotation[]; metadata: any} {
  try {
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xfdfString, "text/xml")

    const annotations: XFDFAnnotation[] = []
    const annotationElements = xmlDoc.getElementsByTagName("annotation")

    for (let i = 0; i < annotationElements.length; i++) {
      const element = annotationElements[i]
      const annotation: XFDFAnnotation = {
        id: element.getAttribute("id") || "",
        type: (element.getAttribute("type") as any) || "note",
        pageNumber: parseInt(element.getAttribute("pageNumber") || "1"),
        x: parseFloat(element.getAttribute("x") || "0"),
        y: parseFloat(element.getAttribute("y") || "0"),
        width: parseFloat(element.getAttribute("width") || "0"),
        height: parseFloat(element.getAttribute("height") || "0"),
        content: element.getAttribute("content") || "",
        color: element.getAttribute("color") || "#ffeb3b",
        createdAt: element.getAttribute("createdAt") || new Date().toISOString(),
      }
      annotations.push(annotation)
    }

    const metadata = {
      documentId: xmlDoc.getElementsByTagName("documentId")[0]?.textContent || "",
      versionNumber: parseInt(xmlDoc.getElementsByTagName("versionNumber")[0]?.textContent || "1"),
      createdAt: xmlDoc.getElementsByTagName("createdAt")[0]?.textContent || new Date().toISOString(),
      message: xmlDoc.getElementsByTagName("message")[0]?.textContent || "",
    }

    return {annotations, metadata}
  } catch (error) {
    console.error("Error parsing XFDF:", error)
    return {annotations: [], metadata: {}}
  }
}

/**
 * Generate XFDF XML string using xml2js
 */
function generateXFDFString(xfdfDoc: XFDFDocument): string {
  const builder = new Builder({headless: true})

  const xfdfObject = {
    xfdf: {
      $: {xmlns: "http://ns.adobe.com/xfdf", "xml:space": "preserve"},
      metadata: {
        documentId: xfdfDoc.metadata.documentId,
        versionNumber: xfdfDoc.metadata.versionNumber,
        createdAt: xfdfDoc.metadata.createdAt,
        message: xfdfDoc.metadata.message,
      },
      annotations: {
        annotation: xfdfDoc.annotations.map(annotation => ({
          $: {
            id: annotation.id,
            type: annotation.type,
            pageNumber: annotation.pageNumber.toString(),
            x: annotation.x.toString(),
            y: annotation.y.toString(),
            width: annotation.width.toString(),
            height: annotation.height.toString(),
            content: annotation.content || "",
            color: annotation.color || "#ffeb3b",
            createdAt: annotation.createdAt,
          },
        })),
      },
    },
  }

  return builder.buildObject(xfdfObject)
}

/**
 * Create a version with XFDF annotations
 * This creates a destructive version containing all current annotations
 */
export function createVersionWithXFDF(
  documentId: string,
  versionNumber: number,
  message: string,
  annotations: any[],
): {xfdf: string; version: any} {
  const metadata = {
    documentId,
    versionNumber,
    createdAt: new Date().toISOString(),
    message,
  }

  const xfdf = annotationsToXFDF(annotations, metadata)

  const version = {
    id: `version-${Date.now()}`,
    documentId,
    versionNumber,
    message,
    createdAt: metadata.createdAt,
    xfdf, // Store as XFDF string instead of JS objects
    textContent: "", // Optional: extracted text content
  }

  return {xfdf, version}
}

/**
 * Load annotations from XFDF version
 * This loads all annotations from a version for editing
 */
export function loadAnnotationsFromVersion(xfdfString: string): any[] {
  const {annotations} = xfdfToAnnotations(xfdfString)
  return annotations.map(annotation => ({
    id: annotation.id,
    type: annotation.type,
    pageNumber: annotation.pageNumber,
    x: annotation.x,
    y: annotation.y,
    width: annotation.width,
    height: annotation.height,
    content: annotation.content,
    color: annotation.color,
    createdAt: annotation.createdAt,
  }))
}
