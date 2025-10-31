import {annotationService} from "@/lib/db/annotations"
import {atomicService} from "@/lib/db/atomic"
import {textEditService} from "@/lib/db/text-edits"
import type {Annotation, PDFVersion, TextEdit} from "@/lib/types"
import {DatabaseError, ErrorHandler} from "@/lib/utils/error-handling"
import {generateTextEditId} from "@/lib/utils/id"

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
        throw ErrorHandler.handle(documentWithVersionResult.error, {
          operation: "getDocumentWithNextVersionNumber",
          documentId,
        })
      }

      const {document, nextVersionNumber} = documentWithVersionResult.data
      if (!document?.currentVersionId) {
        throw new DatabaseError("No current version found", {documentId})
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
        throw ErrorHandler.handle(updateVersionAnnotationsResult.error, {
          operation: "updateVersionAnnotations",
          versionId: document.currentVersionId,
        })
      }

      const updateResult = await atomicService.updateDocumentWithVersion(documentId, {}, newVersion)

      if (!updateResult.success) {
        throw ErrorHandler.handle(updateResult.error, {operation: "updateDocument", documentId})
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
          throw ErrorHandler.handle(addAnnotationsResult.error, {operation: "addAnnotations", versionId: newVersion.id})
        }
      }

      // Duplicate text edits from the current version to the new version, preserving originalId
      const textEditsResult = await textEditService.getTextEditsByVersion(document.currentVersionId)
      if (!textEditsResult.success) {
        throw ErrorHandler.handle(textEditsResult.error, {
          operation: "getTextEditsByVersion",
          versionId: document.currentVersionId,
        })
      }

      const textEditsToAdd: TextEdit[] = textEditsResult.data.map(te => ({
        ...te,
        id: generateTextEditId(),
        versionId: newVersion.id,
        originalId: te.originalId || te.id,
        committedVersionId: te.committedVersionId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }))

      if (textEditsToAdd.length > 0) {
        const addTextEditsResult = await atomicService.addTextEditsToVersion(newVersion.id, textEditsToAdd)
        if (!addTextEditsResult.success) {
          throw ErrorHandler.handle(addTextEditsResult.error, {
            operation: "addTextEdits",
            versionId: newVersion.id,
          })
        }
      }

      // Update the document's latest version ID
      const updateDocumentResult = await documentService.updateDocument(documentId, {latestVersionId: newVersion.id})

      if (!updateDocumentResult.success) {
        throw ErrorHandler.handle(updateDocumentResult.error, {operation: "updateDocument", documentId})
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
