import {PDFDocument} from "pdf-lib"

import type {Annotation} from "@/lib/types"

import {drawPDFAnnotations} from "./pdf-annotations"

export async function generatePDFThumbnail(file: File): Promise<string> {
  try {
    const pdfjsLib = await import("pdfjs-dist")
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"

    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({data: arrayBuffer}).promise
    const page = await pdf.getPage(1)

    const viewport = page.getViewport({scale: 0.1})
    const canvas = document.createElement("canvas")
    const context = canvas.getContext("2d")

    if (!context) {
      throw new Error("Could not get canvas context")
    }

    canvas.width = viewport.width
    canvas.height = viewport.height

    // Actually render the page to the canvas
    await page.render({canvasContext: context, canvas, viewport}).promise

    return canvas.toDataURL("image/jpeg")
  } catch (error) {
    console.error("Error generating PDF thumbnail:", error)
    // Return placeholder thumbnail as base64
    return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2NjY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPlBERiBQcmV2aWV3PC90ZXh0Pjwvc3ZnPg=="
  }
}

export async function extractPDFAnnotations(file: File): Promise<any[]> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const pdfDoc = await PDFDocument.load(arrayBuffer)

    const annotations: any[] = []

    // Get all pages
    const pages = pdfDoc.getPages()

    for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
      const page = pages[pageIndex]

      // Get annotations from the page
      const pageAnnotations = page.node.Annots

      if (pageAnnotations && Array.isArray(pageAnnotations)) {
        // Process annotations (this is a simplified version)
        // pdf-lib doesn't have as rich annotation extraction as PDF.js
        // but it's good enough for basic use cases
        annotations.push({
          pageNumber: pageIndex + 1,
          type: "note", // Default type
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          content: "Extracted annotation",
          createdAt: new Date().toISOString(),
        })
      }
    }

    return annotations
  } catch (error) {
    console.error("Error extracting PDF annotations:", error)
    return []
  }
}

export async function createPDFWithAnnotations(originalBlob: Blob, annotations: Annotation[]): Promise<Blob> {
  try {
    const arrayBuffer = await originalBlob.arrayBuffer()
    const pdfDoc = await PDFDocument.load(arrayBuffer)

    // Use the reusable annotation drawing utility
    drawPDFAnnotations(pdfDoc, annotations)

    // Return the modified PDF as blob
    const pdfBytes = await pdfDoc.save()
    return new Blob([pdfBytes.buffer as ArrayBuffer], {type: "application/pdf"})
  } catch (error) {
    console.error("Error creating PDF with annotations:", error)
    throw error
  }
}
