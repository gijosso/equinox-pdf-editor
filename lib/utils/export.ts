import {PDFDocument, type PDFPage, StandardFonts, rgb} from "pdf-lib"

import type {Annotation, PDFVersion, TextEdit} from "@/lib/types"
import {PDFProcessingError} from "@/lib/utils/error-handling"

export interface ChangeLogOptions {
  documentName: string
  versions: Array<{
    version: PDFVersion
    annotations: Annotation[]
    textEdits: TextEdit[]
  }>
}

export interface ChangeLogResult {
  page: PDFPage
  height: number
}

export async function createChangeLogPage(pdfDoc: PDFDocument, options: ChangeLogOptions): Promise<ChangeLogResult> {
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  // Add change log page
  const changeLogPage = pdfDoc.addPage([595, 842]) // A4 size
  const {height} = changeLogPage.getSize()

  // Title
  changeLogPage.drawText("Document Change Log", {
    x: 50,
    y: height - 50,
    size: 18,
    font: boldFont,
    color: rgb(0, 0, 0),
  })

  changeLogPage.drawText(`Document: ${options.documentName}`, {
    x: 50,
    y: height - 80,
    size: 10,
    font: font,
    color: rgb(0.3, 0.3, 0.3),
  })

  changeLogPage.drawText(`Export Date: ${new Date().toLocaleDateString()}`, {
    x: 50,
    y: height - 100,
    size: 10,
    font: font,
    color: rgb(0.3, 0.3, 0.3),
  })

  // Version summary with proper spacing
  let yPosition = height - 130
  const minYPosition = 50 // Minimum Y position to prevent content going off page

  for (let index = 0; index < options.versions.length; index++) {
    const {version, annotations, textEdits} = options.versions[index]

    // Calculate space needed for this version
    const versionHeaderHeight = 20
    const descriptionHeight = version.message ? 12 : 0
    const currentVersionAnnotations = annotations.filter(
      annotation => annotation.committedVersionId === version.id && annotation.originalId === annotation.id,
    )
    const annotationsHeight = calculateAnnotationsHeight(currentVersionAnnotations)
    const textEditsHeight = calculateTextEditsHeight(textEdits)

    const versionSpacing = 15
    const totalVersionHeight =
      versionHeaderHeight + descriptionHeight + annotationsHeight + textEditsHeight + versionSpacing

    // Check if we have enough space for this version
    if (yPosition - totalVersionHeight < minYPosition) {
      console.warn(`Change log truncated: Only showing ${index} of ${options.versions.length} versions`)
      break
    }

    // Version header
    changeLogPage.drawText(`Version ${index + 1} - ${new Date(version.createdAt).toLocaleDateString()}`, {
      x: 50,
      y: yPosition,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    })
    yPosition -= versionHeaderHeight

    // Version description
    if (version.message) {
      changeLogPage.drawText(`Description: ${version.message}`, {
        x: 70,
        y: yPosition,
        size: 9,
        font: font,
        color: rgb(0.2, 0.2, 0.2),
      })
      yPosition -= descriptionHeight
    }

    // Annotations summary
    yPosition = drawAnnotationsSummary(changeLogPage, currentVersionAnnotations, yPosition, font, boldFont)

    // Text edits summary
    if (textEdits.length > 0) {
      yPosition = drawTextEditsSummary(changeLogPage, textEdits, yPosition, font, boldFont)
    }

    yPosition -= versionSpacing
  }

  return {page: changeLogPage, height}
}

function drawAnnotationsSummary(
  page: PDFPage,
  annotations: Annotation[],
  yPosition: number,
  font: any,
  boldFont: any,
): number {
  let currentY = yPosition

  if (annotations.length > 0) {
    const annotationsByPage = groupAnnotationsByPage(annotations)
    currentY = drawAnnotationsByPage(page, annotationsByPage, currentY, font, boldFont)
  } else {
    currentY = drawNoAnnotationsMessage(page, currentY, font)
  }

  return currentY
}

function calculateAnnotationsHeight(annotations: Annotation[]): number {
  if (annotations.length === 0) {
    return 10 // Height for "No annotations" message
  }

  const annotationsByPage = groupAnnotationsByPage(annotations)
  let totalHeight = 0

  Object.entries(annotationsByPage).forEach(([_pageNum, pageAnnotations]) => {
    totalHeight += 10 // Page header height
    totalHeight += pageAnnotations.length * 9 // Annotation items height
  })

  return totalHeight
}

function groupAnnotationsByPage(annotations: Annotation[]): Record<number, Annotation[]> {
  return annotations.reduce(
    (acc, annotation) => {
      const pageNum = annotation.pageNumber // Already 1-based
      if (!acc[pageNum]) {
        acc[pageNum] = []
      }
      acc[pageNum].push(annotation)
      return acc
    },
    {} as Record<number, Annotation[]>,
  )
}

function drawAnnotationsByPage(
  page: PDFPage,
  annotationsByPage: Record<number, Annotation[]>,
  yPosition: number,
  font: any,
  boldFont: any,
): number {
  let currentY = yPosition

  Object.entries(annotationsByPage).forEach(([pageNum, pageAnnotations]) => {
    currentY = drawPageHeader(page, pageNum, currentY, boldFont)
    currentY = drawPageAnnotations(page, pageAnnotations, currentY, font)
  })

  return currentY
}

function drawPageHeader(page: PDFPage, pageNum: string, yPosition: number, boldFont: any): number {
  page.drawText(`Page ${pageNum}:`, {
    x: 70,
    y: yPosition,
    size: 8,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2),
  })
  return yPosition - 10
}

function drawPageAnnotations(page: PDFPage, annotations: Annotation[], yPosition: number, font: any): number {
  let currentY = yPosition

  annotations.forEach(annotation => {
    const annotationText = formatAnnotationText(annotation)
    page.drawText(annotationText, {
      x: 90,
      y: currentY,
      size: 7,
      font: font,
      color: rgb(0.4, 0.4, 0.4),
    })
    currentY -= 9
  })

  return currentY
}

function formatAnnotationText(annotation: Annotation): string {
  const annotationType = getAnnotationTypeLabel(annotation.type)
  const content = formatAnnotationContent(annotation.content)
  return `  • ${annotationType}${content}`
}

function getAnnotationTypeLabel(type: string): string {
  switch (type) {
    case "highlight":
      return "Highlight"
    case "note":
      return "Note"
    case "redaction":
      return "Redaction"
    default:
      return "Unknown"
  }
}

function formatAnnotationContent(content?: string): string {
  if (!content) {
    return ""
  }
  const truncatedContent = content.length > 50 ? `${content.substring(0, 50)}...` : content
  return ` - "${truncatedContent}"`
}

function drawNoAnnotationsMessage(page: PDFPage, yPosition: number, font: any): number {
  page.drawText("• No annotations", {
    x: 70,
    y: yPosition,
    size: 8,
    font: font,
    color: rgb(0.5, 0.5, 0.5),
  })
  return yPosition - 10
}

export async function addOriginalPages(pdfDoc: PDFDocument, originalPdfBytes: ArrayBuffer): Promise<void> {
  try {
    // Load the original PDF
    const originalPdf = await PDFDocument.load(originalPdfBytes)

    // Copy all pages from original PDF to maintain correct page numbering
    const pageIndices = originalPdf.getPageIndices()
    const copiedPages = await pdfDoc.copyPages(originalPdf, pageIndices)

    // Add pages to new document
    copiedPages.forEach(page => {
      pdfDoc.addPage(page)
    })
  } catch (error) {
    console.error("Error loading original PDF:", error)
    throw new PDFProcessingError("Failed to load original PDF")
  }
}

export async function createPlaceholderPage(pdfDoc: PDFDocument): Promise<void> {
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const placeholderPage = pdfDoc.addPage([595, 842])
  const {height} = placeholderPage.getSize()

  placeholderPage.drawText("Original PDF could not be loaded", {
    x: 50,
    y: height / 2,
    size: 16,
    font: font,
    color: rgb(0.5, 0.5, 0.5),
  })
}

export function generateExportFilename(documentName: string, versionNumber: number): string {
  return `${documentName.replace(/\.pdf$/i, "")}_v${versionNumber}.pdf`
}

export async function applyTextEditsToPDF(pdfDoc: PDFDocument, textEdits: TextEdit[]): Promise<void> {
  if (textEdits.length === 0) {
    return
  }

  // Group text edits by page number
  const textEditsByPage = groupTextEditsByPage(textEdits)

  // Apply text edits to each page
  for (const [pageNumberStr, pageTextEdits] of Object.entries(textEditsByPage)) {
    const pageNumber = parseInt(pageNumberStr, 10)
    const page = pdfDoc.getPage(pageNumber - 1) // PDF pages are 0-indexed

    for (const textEdit of pageTextEdits) {
      await applyTextEditToPage(page, textEdit)
    }
  }
}

async function applyTextEditToPage(page: PDFPage, textEdit: TextEdit): Promise<void> {
  const {height} = page.getSize()

  // Convert PDF coordinates to page coordinates
  // PDF coordinates: (0,0) is bottom-left, (width, height) is top-right
  const x = textEdit.x
  const y = height - textEdit.y - textEdit.height // Flip Y coordinate

  // Determine what to draw based on operation type
  if (textEdit.operation === "delete") {
    // For delete operations, draw a strikethrough or remove text visually
    await drawDeletedText(page, textEdit, x, y)
  } else if (textEdit.operation === "insert" || textEdit.operation === "replace") {
    // For insert/replace operations, draw the new text
    await drawNewText(page, textEdit, x, y)
  }
}

async function drawDeletedText(page: PDFPage, textEdit: TextEdit, x: number, y: number): Promise<void> {
  const font = await page.doc.embedFont(StandardFonts.Helvetica)
  const fontSize = textEdit.fontSize || 12

  // Draw original text with strikethrough
  page.drawText(textEdit.originalText, {
    x,
    y,
    size: fontSize,
    font,
    color: rgb(0.7, 0.7, 0.7), // Grayed out
  })

  // Draw strikethrough line
  const textWidth = font.widthOfTextAtSize(textEdit.originalText, fontSize)
  page.drawLine({
    start: {x, y: y + fontSize / 2},
    end: {x: x + textWidth, y: y + fontSize / 2},
    thickness: 1,
    color: rgb(0.5, 0.5, 0.5),
  })
}

async function drawNewText(page: PDFPage, textEdit: TextEdit, x: number, y: number): Promise<void> {
  const font = await page.doc.embedFont(StandardFonts.Helvetica)
  const fontSize = textEdit.fontSize || 12
  const fontColor = textEdit.color ? parseColor(textEdit.color) : rgb(0, 0, 0)

  // Draw new text
  page.drawText(textEdit.newText || "", {
    x,
    y,
    size: fontSize,
    font,
    color: fontColor,
  })

  // For replace operations, also show what was replaced (with strikethrough)
  if (textEdit.operation === "replace" && textEdit.originalText) {
    const newTextWidth = font.widthOfTextAtSize(textEdit.newText || "", fontSize)
    const originalTextWidth = font.widthOfTextAtSize(textEdit.originalText, fontSize)

    // Draw original text below with strikethrough
    page.drawText(textEdit.originalText, {
      x: x + newTextWidth + 5, // Offset to the right
      y: y - fontSize - 2, // Below the new text
      size: fontSize * 0.8, // Slightly smaller
      font,
      color: rgb(0.7, 0.7, 0.7), // Grayed out
    })

    // Draw strikethrough for original text
    page.drawLine({
      start: {x: x + newTextWidth + 5, y: y - fontSize - 2 + (fontSize * 0.8) / 2},
      end: {x: x + newTextWidth + 5 + originalTextWidth, y: y - fontSize - 2 + (fontSize * 0.8) / 2},
      thickness: 1,
      color: rgb(0.5, 0.5, 0.5),
    })
  }
}

function parseColor(colorStr: string): any {
  // Handle hex colors
  if (colorStr.startsWith("#")) {
    const hex = colorStr.slice(1)
    const r = parseInt(hex.slice(0, 2), 16) / 255
    const g = parseInt(hex.slice(2, 4), 16) / 255
    const b = parseInt(hex.slice(4, 6), 16) / 255
    return rgb(r, g, b)
  }

  // Handle rgb() format
  if (colorStr.startsWith("rgb(")) {
    const values = colorStr
      .slice(4, -1)
      .split(",")
      .map(v => parseInt(v.trim(), 10))
    return rgb(values[0] / 255, values[1] / 255, values[2] / 255)
  }

  // Default to black
  return rgb(0, 0, 0)
}

function calculateTextEditsHeight(textEdits: TextEdit[]): number {
  if (textEdits.length === 0) {
    return 0
  }

  const textEditsByPage = groupTextEditsByPage(textEdits)
  let totalHeight = 15 // Header height

  for (const pageTextEdits of Object.values(textEditsByPage)) {
    totalHeight += 12 // Page header
    totalHeight += pageTextEdits.length * 12 // Each text edit line (slightly taller for readability)
  }

  return totalHeight
}

function groupTextEditsByPage(textEdits: TextEdit[]): Record<number, TextEdit[]> {
  return textEdits.reduce(
    (acc, textEdit) => {
      if (!acc[textEdit.pageNumber]) {
        acc[textEdit.pageNumber] = []
      }
      acc[textEdit.pageNumber].push(textEdit)
      return acc
    },
    {} as Record<number, TextEdit[]>,
  )
}

function drawTextEditsSummary(
  page: PDFPage,
  textEdits: TextEdit[],
  yPosition: number,
  font: any,
  boldFont: any,
): number {
  let currentY = yPosition

  if (textEdits.length > 0) {
    page.drawText("Text Edits:", {
      x: 70,
      y: currentY,
      size: 10,
      font: boldFont,
      color: rgb(0, 0, 0),
    })
    currentY -= 12

    const textEditsByPage = groupTextEditsByPage(textEdits)
    currentY = drawTextEditsByPage(page, textEditsByPage, currentY, font)
  }

  return currentY
}

function drawTextEditsByPage(
  page: PDFPage,
  textEditsByPage: Record<number, TextEdit[]>,
  yPosition: number,
  font: any,
): number {
  let currentY = yPosition

  for (const [pageNumber, pageTextEdits] of Object.entries(textEditsByPage)) {
    page.drawText(`Page ${pageNumber}:`, {
      x: 90,
      y: currentY,
      size: 9,
      font: font,
      color: rgb(0.2, 0.2, 0.2),
    })
    currentY -= 10

    for (const textEdit of pageTextEdits) {
      const editText = `"${textEdit.originalText}" -> "${textEdit.newText}"`
      page.drawText(editText, {
        x: 110,
        y: currentY,
        size: 8,
        font: font,
        color: rgb(0.3, 0.3, 0.3),
      })
      currentY -= 10
    }
  }

  return currentY
}
