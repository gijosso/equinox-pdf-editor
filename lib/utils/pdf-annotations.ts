import {PDFDocument, type PDFPage, rgb} from "pdf-lib"

import type {Annotation} from "@/lib/types"

export interface PDFAnnotationDrawingOptions {
  page: PDFPage
  annotation: Annotation
  pageWidth: number
  pageHeight: number
}

export function drawPDFAnnotation(options: PDFAnnotationDrawingOptions): void {
  const {page, annotation, pageHeight} = options

  // Convert PDF coordinates to page coordinates
  const x = annotation.x
  const y = pageHeight - annotation.y - annotation.height // PDF coordinates are bottom-up
  const width = annotation.width
  const height = annotation.height

  switch (annotation.type) {
    case "highlight":
      drawHighlightAnnotation(page, x, y, width, height, annotation.color)
      break
    case "redaction":
      drawRedactionAnnotation(page, x, y, width, height)
      break
    case "note":
      drawNoteAnnotation(page, x, y, width, height, annotation.content, annotation.fontSize)
      break
  }
}

function drawHighlightAnnotation(
  page: PDFPage,
  x: number,
  y: number,
  width: number,
  height: number,
  color?: string,
): void {
  page.drawRectangle({
    x,
    y,
    width,
    height,
    color: color ? hexToRgb(color) : rgb(1, 1, 0), // Default yellow
    opacity: 0.3,
  })
}

function drawRedactionAnnotation(page: PDFPage, x: number, y: number, width: number, height: number): void {
  page.drawRectangle({
    x,
    y,
    width,
    height,
    color: rgb(0, 0, 0),
  })
}

function drawNoteAnnotation(
  page: PDFPage,
  x: number,
  y: number,
  width: number,
  height: number,
  content?: string,
  fontSize?: number,
): void {
  // Draw note rectangle
  page.drawRectangle({
    x,
    y,
    width,
    height,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
    color: rgb(1, 1, 0.8), // Light yellow background
  })

  // Add note text if available
  if (content) {
    try {
      page.drawText(content, {
        x: x + 2,
        y: y + 2,
        size: fontSize || 10,
        color: rgb(0, 0, 0),
      })
    } catch (textError) {
      console.warn("Could not draw note text:", textError)
    }
  }
}

function hexToRgb(hex: string) {
  return rgb(
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  )
}

export function drawPDFAnnotations(pdfDoc: PDFDocument, annotations: Annotation[]): void {
  const pages = pdfDoc.getPages()

  annotations.forEach(annotation => {
    const page = pages[annotation.pageNumber - 1]
    if (!page) {
      return
    }

    const {width: pageWidth, height: pageHeight} = page.getSize()

    drawPDFAnnotation({
      page,
      annotation,
      pageWidth,
      pageHeight,
    })
  })
}
