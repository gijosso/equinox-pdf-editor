import {atomicService} from "@/lib/db/atomic"
import type {Annotation, PDFVersion} from "@/lib/types"

import {generateVersionId} from "./file"
import {generateAnnotationId} from "./id"

export interface SaveVersionOptions {
  documentId: string
  message: string
  annotations: Annotation[]
}

export interface SaveVersionResult {
  success: boolean
  versionNumber?: number
  error?: string
}

/**
 * Save a new version with committed annotations
 * This function copies all annotations from the previous version with consistent IDs
 * so they can be compared across versions for diffing
 */
export async function saveVersion(options: SaveVersionOptions): Promise<SaveVersionResult> {
  const {documentId, message, annotations} = options

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

    const newVersion: PDFVersion = {
      id: generateVersionId(),
      documentId,
      versionNumber: nextVersionNumber,
      message: message.trim(),
      createdAt: new Date().toISOString(),
    }

    const updateResult = await atomicService.updateDocumentWithVersion(documentId, {}, newVersion)

    if (!updateResult.success) {
      throw new Error(updateResult.error.message)
    }

    const annotationsToAdd: Annotation[] = []

    for (const historyAnnotation of annotations) {
      const annotationWithOriginalId: Annotation = {
        ...historyAnnotation,
        id: generateAnnotationId(),
        versionId: newVersion.id,
        originalId: historyAnnotation.id, // Mark this as the original for future copies
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        committedVersionId: historyAnnotation.committedVersionId || document.currentVersionId,
      }
      annotationsToAdd.push(annotationWithOriginalId)
    }

    // Add all annotations to the new version
    if (annotationsToAdd.length > 0) {
      const addAnnotationsResult = await atomicService.addAnnotationsToVersion(newVersion.id, annotationsToAdd)
      if (!addAnnotationsResult.success) {
        throw new Error(addAnnotationsResult.error.message)
      }
    }

    return {success: true, versionNumber: nextVersionNumber}
  } catch (error) {
    console.error("Failed to save version:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}
