import {annotationService} from "@/lib/db/annotations"
import {atomicService} from "@/lib/db/atomic"
import type {Annotation, PDFVersion} from "@/lib/types"

import {documentService} from "../db"
import {areAnnotationsDifferent} from "../utils/annotations"
import {generateVersionId} from "../utils/file"
import {generateAnnotationId} from "../utils/id"

export interface VersionCommitOptions {
  documentId: string
  message: string
  annotations: Annotation[]
}

export interface VersionCommitResult {
  success: boolean
  versionId?: string
  versionNumber?: number
  error?: string
}

export class VersionManagerService {
  private static instance: VersionManagerService

  static getInstance(): VersionManagerService {
    if (!VersionManagerService.instance) {
      VersionManagerService.instance = new VersionManagerService()
    }
    return VersionManagerService.instance
  }

  async commitVersion(options: VersionCommitOptions): Promise<VersionCommitResult> {
    const {documentId, message, annotations} = options

    try {
      if (!documentId || !message.trim()) {
        return {success: false, error: "Document ID and message are required"}
      }

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

      // Add committed version ID to the annotations of the current version to lock them
      const updateVersionAnnotationsResult = await atomicService.updateVersionAnnotations(
        document.currentVersionId,
        annotations.map(annotation => ({
          ...annotation,
          committedVersionId: annotation.versionId,
        })),
      )

      if (!updateVersionAnnotationsResult.success) {
        throw new Error(updateVersionAnnotationsResult.error.message)
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
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
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

      // Update the document's latest version ID
      const updateDocumentResult = await documentService.updateDocument(documentId, {latestVersionId: newVersion.id})

      if (!updateDocumentResult.success) {
        throw new Error(updateDocumentResult.error.message)
      }

      return {success: true, versionId: newVersion.id, versionNumber: nextVersionNumber}
    } catch (error) {
      console.error("Failed to commit version:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }
    }
  }

  async getVersionAnnotationHistory(versionId: string): Promise<Annotation[]> {
    const result = await annotationService.getAnnotationsByVersion(versionId)
    return result.success ? result.data : []
  }

  async compareAnnotationChanges(
    versionId1: string,
    versionId2: string,
  ): Promise<{
    added: Annotation[]
    removed: Annotation[]
    modified: Array<{old: Annotation; new: Annotation}>
  }> {
    const [annotations1, annotations2] = await Promise.all([
      this.getVersionAnnotationHistory(versionId1),
      this.getVersionAnnotationHistory(versionId2),
    ])

    const added: Annotation[] = []
    const removed: Annotation[] = []
    const modified: Array<{old: Annotation; new: Annotation}> = []

    // Find added annotations (new originalIds in version2)
    annotations2.forEach(ann2 => {
      const found = annotations1.find(ann1 => ann1.originalId === ann2.originalId)
      if (!found) {
        added.push(ann2)
      } else if (areAnnotationsDifferent(found, ann2)) {
        modified.push({old: found, new: ann2})
      }
    })

    // Find removed annotations (originalIds that exist in version1 but not in version2)
    annotations1.forEach(ann1 => {
      const found = annotations2.find(ann2 => ann2.originalId === ann1.originalId)
      if (!found) {
        removed.push(ann1)
      }
    })

    return {added, removed, modified}
  }
}

export const versionManager = VersionManagerService.getInstance()
