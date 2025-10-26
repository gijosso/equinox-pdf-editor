import {atomicService} from "@/lib/db/atomic"
import type {Annotation, PDFVersion} from "@/lib/types"

import {createPDFWithAnnotations} from "./pdf"
import {createVersionWithXFDF} from "./xfdf"

export interface SaveVersionOptions {
  documentId: string
  message: string
  annotations: Annotation[]
  updateDocumentWithVersion: (args: {
    documentId: string
    documentUpdates: Record<string, any>
    version: PDFVersion
  }) => Promise<any>
}

export interface SaveVersionResult {
  success: boolean
  versionNumber?: number
  error?: string
}

/**
 * Save a new version with committed annotations
 * This function handles the complete flow of creating a new version
 * with annotations committed to the PDF blob
 */
export async function saveVersion(options: SaveVersionOptions): Promise<SaveVersionResult> {
  const {documentId, message, annotations, updateDocumentWithVersion} = options

  if (!documentId || !message.trim()) {
    return {success: false, error: "Document ID and message are required"}
  }

  try {
    const documentWithVersionResult = await atomicService.getDocumentWithNextVersionNumber(documentId)
    if (!documentWithVersionResult.success) {
      throw new Error(documentWithVersionResult.error.message)
    }

    const {document, nextVersionNumber} = documentWithVersionResult.data
    if (!document?.currentVersionId) {
      throw new Error("No current version found")
    }

    const currentVersionResult = await atomicService.getCurrentVersionBlob(documentId, document.currentVersionId)
    if (!currentVersionResult.success) {
      throw new Error(currentVersionResult.error.message)
    }

    const currentVersion = currentVersionResult.data

    const [newPdfBlob, {xfdf, version: versionData}] = await Promise.all([
      createPDFWithAnnotations(currentVersion.blob, annotations || []),
      createVersionWithXFDF(documentId, nextVersionNumber, message.trim(), annotations || []),
    ])

    const version = {
      ...versionData,
      blob: newPdfBlob, // Use the new PDF with annotations committed
      xfdf, // XFDF string with annotations
    }

    await updateDocumentWithVersion({
      documentId,
      documentUpdates: {}, // No document updates needed
      version,
    })

    return {success: true, versionNumber: nextVersionNumber}
  } catch (error) {
    console.error("Failed to save version:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}
