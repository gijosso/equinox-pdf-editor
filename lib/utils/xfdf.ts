/**
 * XFDF (XML Forms Data Format) utilities for PDF annotations
 * XFDF is the standard format for PDF annotations and form data
 */
import {Builder} from "xml2js"

import {extractPDFAnnotations} from "./pdf"

export interface XFDFAnnotation {
  id: string
  type: "highlight" | "text" | "redaction" // Standard XFDF types
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
  createdAt: string
  updatedAt: string
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

export async function fileToXFDF(file: File): Promise<string> {
  try {
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
      type: annotation.xfdfType || annotation.type, // Use xfdfType if available
      pageNumber: annotation.pageNumber,
      x: annotation.x,
      y: annotation.y,
      width: annotation.width,
      height: annotation.height,
      content: annotation.content || "",
      text: annotation.text || "",
      color: annotation.color || "#ffeb3b",
      fontSize: annotation.fontSize || 12,
      quadPoints: annotation.quadPoints,
      createdAt: annotation.createdAt || new Date().toISOString(),
      updatedAt: annotation.updatedAt || annotation.createdAt || new Date().toISOString(),
    })),
    metadata,
  }

  return generateXFDFString(xfdfDoc)
}

export function xfdfToAnnotations(xfdfString: string): {annotations: XFDFAnnotation[]; metadata: any} {
  try {
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xfdfString, "text/xml")

    const annotations: XFDFAnnotation[] = []

    // Parse different annotation types
    const textElements = xmlDoc.getElementsByTagName("text")
    const highlightElements = xmlDoc.getElementsByTagName("highlight")
    const redactionElements = xmlDoc.getElementsByTagName("redaction")
    const annotationElements = xmlDoc.getElementsByTagName("annotation")

    // Parse sticky notes (text annotations)
    for (let i = 0; i < textElements.length; i++) {
      const element = textElements[i]
      const rect = element.getAttribute("rect")?.split(",").map(Number) || [0, 0, 0, 0]
      const annotation: XFDFAnnotation = {
        id: element.getAttribute("name") || element.getAttribute("id") || "",
        type: "text",
        pageNumber: parseInt(element.getAttribute("page") || "0") + 1, // Convert from 0-based to 1-based
        x: rect[0],
        y: rect[1],
        width: rect[2] - rect[0],
        height: rect[3] - rect[1],
        content: element.getElementsByTagName("contents")[0]?.textContent || "",
        text: element.getElementsByTagName("contents")[0]?.textContent || "",
        color: element.getAttribute("color") || "#FFCD45",
        createdAt: parseXFDFDate(element.getAttribute("creationdate") || element.getAttribute("date") || ""),
        updatedAt: parseXFDFDate(
          element.getAttribute("updatedAt") ||
            element.getAttribute("creationdate") ||
            element.getAttribute("date") ||
            "",
        ),
      }
      annotations.push(annotation)
    }

    // Parse highlight annotations
    for (let i = 0; i < highlightElements.length; i++) {
      const element = highlightElements[i]
      const rect = element.getAttribute("rect")?.split(",").map(Number) || [0, 0, 0, 0]
      const annotation: XFDFAnnotation = {
        id: element.getAttribute("name") || element.getAttribute("id") || "",
        type: "highlight",
        pageNumber: parseInt(element.getAttribute("page") || "0") + 1,
        x: rect[0],
        y: rect[1],
        width: rect[2] - rect[0],
        height: rect[3] - rect[1],
        content: element.getElementsByTagName("contents")[0]?.textContent || "",
        color: element.getAttribute("color") || "#ffeb3b",
        quadPoints: element.getAttribute("quadpoints")?.split(",").map(Number),
        createdAt: parseXFDFDate(element.getAttribute("creationdate") || element.getAttribute("date") || ""),
        updatedAt: parseXFDFDate(
          element.getAttribute("updatedAt") ||
            element.getAttribute("creationdate") ||
            element.getAttribute("date") ||
            "",
        ),
      }
      annotations.push(annotation)
    }

    // Parse redaction annotations
    for (let i = 0; i < redactionElements.length; i++) {
      const element = redactionElements[i]
      const rect = element.getAttribute("rect")?.split(",").map(Number) || [0, 0, 0, 0]
      const annotation: XFDFAnnotation = {
        id: element.getAttribute("name") || element.getAttribute("id") || "",
        type: "redaction",
        pageNumber: parseInt(element.getAttribute("page") || "0") + 1,
        x: rect[0],
        y: rect[1],
        width: rect[2] - rect[0],
        height: rect[3] - rect[1],
        content: element.getElementsByTagName("contents")[0]?.textContent || "",
        color: element.getAttribute("color") || "#000000",
        createdAt: parseXFDFDate(element.getAttribute("creationdate") || element.getAttribute("date") || ""),
        updatedAt: parseXFDFDate(
          element.getAttribute("updatedAt") ||
            element.getAttribute("creationdate") ||
            element.getAttribute("date") ||
            "",
        ),
      }
      annotations.push(annotation)
    }

    // Parse generic annotations (fallback)
    for (let i = 0; i < annotationElements.length; i++) {
      const element = annotationElements[i]
      const annotation: XFDFAnnotation = {
        id: element.getAttribute("id") || "",
        type: (element.getAttribute("type") as "highlight" | "text" | "redaction") || "text",
        pageNumber: parseInt(element.getAttribute("pageNumber") || "1"),
        x: parseFloat(element.getAttribute("x") || "0"),
        y: parseFloat(element.getAttribute("y") || "0"),
        width: parseFloat(element.getAttribute("width") || "0"),
        height: parseFloat(element.getAttribute("height") || "0"),
        content: element.getAttribute("content") || "",
        text: element.getAttribute("text") || "",
        color: element.getAttribute("color") || "#ffeb3b",
        fontSize: parseInt(element.getAttribute("fontSize") || "12"),
        quadPoints: element.getAttribute("quadPoints")?.split(",").map(Number),
        createdAt: element.getAttribute("createdAt") || new Date().toISOString(),
        updatedAt: element.getAttribute("updatedAt") || element.getAttribute("createdAt") || new Date().toISOString(),
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
 * Parse XFDF date format (D:YYYYMMDDHHmmSSOHH'mm') to ISO string
 */
function parseXFDFDate(xfdfDate: string): string {
  if (!xfdfDate || !xfdfDate.startsWith("D:")) {
    return new Date().toISOString()
  }

  try {
    // Extract date parts: D:YYYYMMDDHHmmSSOHH'mm'
    const dateStr = xfdfDate.substring(2) // Remove "D:"
    const year = parseInt(dateStr.substring(0, 4))
    const month = parseInt(dateStr.substring(4, 6)) - 1 // JavaScript months are 0-based
    const day = parseInt(dateStr.substring(6, 8))
    const hours = parseInt(dateStr.substring(8, 10))
    const minutes = parseInt(dateStr.substring(10, 12))
    const seconds = parseInt(dateStr.substring(12, 14))

    const date = new Date(year, month, day, hours, minutes, seconds)
    return date.toISOString()
  } catch (error) {
    console.error("Error parsing XFDF date:", error)
    return new Date().toISOString()
  }
}

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
        annotation: xfdfDoc.annotations.map(annotation => {
          const baseAttributes = {
            id: annotation.id,
            page: (annotation.pageNumber - 1).toString(), // XFDF uses 0-based page numbering
            createdAt: annotation.createdAt,
            updatedAt: annotation.updatedAt || annotation.createdAt,
          }

          // Generate annotation-specific XFDF elements
          switch (annotation.type) {
            case "text": // Sticky note
              return {
                $: {
                  ...baseAttributes,
                  rect: `${annotation.x},${annotation.y},${annotation.x + annotation.width},${annotation.y + annotation.height}`,
                  color: annotation.color || "#FFCD45", // Default sticky note color
                  flags: "print,nozoom,norotate",
                  name: annotation.id,
                  title: "PDF Editor",
                  subject: "Note",
                  date: formatXFDFDate(new Date()),
                  creationdate: formatXFDFDate(new Date(annotation.createdAt)),
                  icon: "Comment",
                  statemodel: "Review",
                },
                contents: annotation.text || annotation.content || "",
              }

            case "highlight":
              return {
                $: {
                  ...baseAttributes,
                  rect: `${annotation.x},${annotation.y},${annotation.x + annotation.width},${annotation.y + annotation.height}`,
                  color: annotation.color || "#ffeb3b",
                  flags: "print,nozoom,norotate",
                  name: annotation.id,
                  title: "PDF Editor",
                  subject: "Highlight",
                  date: formatXFDFDate(new Date()),
                  creationdate: formatXFDFDate(new Date(annotation.createdAt)),
                  quadpoints: annotation.quadPoints?.join(",") || "",
                },
                contents: annotation.content || "",
              }

            case "redaction":
              return {
                $: {
                  ...baseAttributes,
                  rect: `${annotation.x},${annotation.y},${annotation.x + annotation.width},${annotation.y + annotation.height}`,
                  color: annotation.color || "#000000",
                  flags: "print,nozoom,norotate",
                  name: annotation.id,
                  title: "PDF Editor",
                  subject: "Redaction",
                  date: formatXFDFDate(new Date()),
                  creationdate: formatXFDFDate(new Date(annotation.createdAt)),
                },
                contents: annotation.content || "",
              }

            default:
              // Fallback to generic annotation
              return {
                $: {
                  ...baseAttributes,
                  type: annotation.type,
                  x: annotation.x.toString(),
                  y: annotation.y.toString(),
                  width: annotation.width.toString(),
                  height: annotation.height.toString(),
                  content: annotation.content || "",
                  color: annotation.color || "#ffeb3b",
                },
              }
          }
        }),
      },
    },
  }

  return builder.buildObject(xfdfObject)
}

function formatXFDFDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  const seconds = String(date.getSeconds()).padStart(2, "0")

  // Get timezone offset
  const offset = date.getTimezoneOffset()
  const offsetHours = Math.floor(Math.abs(offset) / 60)
  const offsetMinutes = Math.abs(offset) % 60
  const offsetSign = offset <= 0 ? "+" : "-"

  return `D:${year}${month}${day}${hours}${minutes}${seconds}${offsetSign}${String(offsetHours).padStart(2, "0")}'${String(offsetMinutes).padStart(2, "0")}'`
}

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
