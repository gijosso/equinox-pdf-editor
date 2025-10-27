import {PDFDocument, type PDFPage, StandardFonts, rgb} from "pdf-lib"

import type {Annotation, PDFVersion} from "@/lib/types"

export interface ChangeLogOptions {
  documentName: string
  versions: Array<{
    version: PDFVersion
    annotations: Annotation[]
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
  const {width, height} = changeLogPage.getSize()

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
    const {version, annotations} = options.versions[index]

    // Calculate space needed for this version
    const versionHeaderHeight = 20
    const descriptionHeight = version.message ? 12 : 0
    const annotationsHeight = calculateAnnotationsHeight(annotations)
    const versionSpacing = 15
    const totalVersionHeight = versionHeaderHeight + descriptionHeight + annotationsHeight + versionSpacing

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
    yPosition = drawAnnotationsSummary(changeLogPage, annotations, yPosition, font, boldFont)
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

/**
 * Calculates the height needed for annotations summary
 */
function calculateAnnotationsHeight(annotations: Annotation[]): number {
  if (annotations.length === 0) {
    return 10 // Height for "No annotations" message
  }

  const annotationsByPage = groupAnnotationsByPage(annotations)
  let totalHeight = 0

  Object.entries(annotationsByPage).forEach(([pageNum, pageAnnotations]) => {
    totalHeight += 10 // Page header height
    totalHeight += pageAnnotations.length * 9 // Annotation items height
  })

  return totalHeight
}

function groupAnnotationsByPage(annotations: Annotation[]): Record<number, Annotation[]> {
  return annotations.reduce(
    (acc, annotation) => {
      const pageNum = annotation.pageNumber // Already 1-based
      if (!acc[pageNum]) acc[pageNum] = []
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

/**
 * Formats annotation text for display
 */
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
    copiedPages.forEach((page, index) => {
      pdfDoc.addPage(page)
    })
  } catch (error) {
    console.error("Error loading original PDF:", error)
    throw new Error("Failed to load original PDF")
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

export function generateExportFilename(documentName: string): string {
  const timestamp = new Date().toISOString().split("T")[0]
  return `${documentName.replace(/\.pdf$/i, "")}_change_log_${timestamp}.pdf`
}
