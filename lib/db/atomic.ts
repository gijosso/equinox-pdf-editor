import type {Annotation, DocumentEditor, PDFDocument, PDFVersion, TextEdit, VersionEditor} from "../types"
import {DatabaseError, DocumentNotFoundError, type Result, withDatabaseErrorHandling} from "../utils/error-handling"
import {annotationService} from "./annotations"
import {db} from "./database"
import {documentService} from "./documents"
import {editorService} from "./editor"
import {textEditService} from "./text-edits"
import {versionService} from "./versions"

export const atomicService = {
  async addDocumentWithVersion(
    document: PDFDocument,
    version: PDFVersion,
  ): Promise<Result<{documentId: string; versionId: string}, DatabaseError>> {
    return withDatabaseErrorHandling(
      async () => {
        return await db.transaction("rw", [db.documents, db.versions], async () => {
          const documentResult = await documentService.addDocument(document)
          if (!documentResult.success) {
            throw documentResult.error
          }

          const versionResult = await versionService.addVersion(version)
          if (!versionResult.success) {
            throw versionResult.error
          }

          return {documentId: documentResult.data, versionId: versionResult.data}
        })
      },
      {operation: "addDocumentWithVersion", documentId: document.id, versionId: version.id},
    )
  },

  async updateDocumentWithVersion(
    documentId: string,
    documentUpdates: Partial<PDFDocument>,
    version: PDFVersion,
  ): Promise<Result<{documentId: string; versionId: string}, DatabaseError>> {
    return withDatabaseErrorHandling(
      async () => {
        return await db.transaction("rw", [db.documents, db.versions], async () => {
          const versionResult = await versionService.addVersion(version)
          if (!versionResult.success) {
            throw versionResult.error
          }

          // Update document to point to the new version and set it as latest
          const documentResult = await documentService.updateDocument(documentId, {
            ...documentUpdates,
            currentVersionId: version.id,
            latestVersionId: version.id, // New version becomes the latest
          })
          if (!documentResult.success) {
            throw documentResult.error
          }

          return {documentId, versionId: versionResult.data}
        })
      },
      {operation: "updateDocumentWithVersion", documentId, versionId: version.id},
    )
  },

  async deleteDocumentWithVersions(documentId: string): Promise<Result<void, DatabaseError>> {
    return withDatabaseErrorHandling(
      async () => {
        return await db.transaction("rw", [db.documents, db.versions], async () => {
          const documentResult = await documentService.getDocument(documentId)
          if (!documentResult.success) {
            throw documentResult.error
          }
          if (!documentResult.data) {
            throw new DocumentNotFoundError(documentId)
          }

          const versionsResult = await versionService.deleteVersionsByDocument(documentId)
          if (!versionsResult.success) {
            throw versionsResult.error
          }

          const deleteResult = await documentService.deleteDocument(documentId)
          if (!deleteResult.success) {
            throw deleteResult.error
          }
        })
      },
      {operation: "deleteDocumentWithVersions", documentId},
    )
  },

  async getDocumentWithNextVersionNumber(
    documentId: string,
  ): Promise<Result<{document: PDFDocument; nextVersionNumber: number}, DatabaseError>> {
    return withDatabaseErrorHandling(
      async () => {
        return await db.transaction("r", [db.documents, db.versions], async () => {
          const [documentResult, nextVersionResult] = await Promise.all([
            documentService.getDocument(documentId),
            versionService.getNextVersionNumber(documentId),
          ])

          if (!documentResult.success) {
            throw documentResult.error
          }

          if (!documentResult.data) {
            throw new DocumentNotFoundError(documentId)
          }

          if (!nextVersionResult.success) {
            throw nextVersionResult.error
          }

          return {
            document: documentResult.data,
            nextVersionNumber: nextVersionResult.data,
          }
        })
      },
      {operation: "getDocumentWithNextVersionNumber", documentId},
    )
  },

  async getCurrentVersionBlob(documentId: string, currentVersionId: string): Promise<Result<Blob, DatabaseError>> {
    return withDatabaseErrorHandling(
      async () => {
        return await db.transaction("r", [db.documents, db.versions], async () => {
          // Verify document still exists and has the same currentVersionId
          const documentResult = await documentService.getDocument(documentId)
          if (!documentResult.success || !documentResult.data) {
            throw new DocumentNotFoundError(documentId)
          }

          if (documentResult.data.currentVersionId !== currentVersionId) {
            throw new DatabaseError("Document current version has changed")
          }

          // Get the document blob separately
          const blobResult = await documentService.getDocumentBlob(documentId)
          if (!blobResult.success) {
            throw new DatabaseError("Failed to get document blob")
          }

          if (!blobResult.data) {
            throw new DatabaseError("No blob found in document")
          }

          return blobResult.data
        })
      },
      {operation: "getCurrentVersionBlob", documentId, currentVersionId},
    )
  },

  async addAnnotationsToVersion(versionId: string, annotations: Annotation[]): Promise<Result<void, DatabaseError>> {
    return withDatabaseErrorHandling(
      async () => {
        return await db.transaction("rw", [db.annotations], async () => {
          for (const annotation of annotations) {
            const result = await annotationService.addAnnotation(annotation)
            if (!result.success) {
              throw result.error
            }
          }
        })
      },
      {operation: "addAnnotationsToVersion", versionId},
    )
  },

  async addTextEditsToVersion(versionId: string, textEdits: TextEdit[]): Promise<Result<void, DatabaseError>> {
    return withDatabaseErrorHandling(
      async () => {
        return await db.transaction("rw", [db.textEdits], async () => {
          for (const te of textEdits) {
            const result = await textEditService.addTextEdit({
              versionId,
              pageNumber: te.pageNumber,
              originalText: te.originalText,
              newText: te.newText,
              x: te.x,
              y: te.y,
              width: te.width,
              height: te.height,
              fontFamily: te.fontFamily,
              fontSize: te.fontSize,
              fontWeight: te.fontWeight,
              color: te.color,
              operation: te.operation,
              originalId: te.originalId,
              committedVersionId: te.committedVersionId,
            })
            if (!result.success) {
              throw result.error
            }
          }
        })
      },
      {operation: "addTextEditsToVersion", versionId},
    )
  },

  /**
   * Update annotations for a version atomically (replace all)
   */
  async updateVersionAnnotations(versionId: string, annotations: Annotation[]): Promise<Result<void, DatabaseError>> {
    return withDatabaseErrorHandling(
      async () => {
        return await db.transaction("rw", [db.annotations], async () => {
          // Delete existing annotations
          const deleteResult = await annotationService.deleteAnnotationsByVersion(versionId)
          if (!deleteResult.success) {
            throw deleteResult.error
          }

          // Add new annotations
          for (const annotation of annotations) {
            const result = await annotationService.addAnnotation(annotation)
            if (!result.success) {
              throw result.error
            }
          }
        })
      },
      {operation: "updateVersionAnnotations", versionId},
    )
  },

  async saveDocumentEditor(documentId: string, editor: DocumentEditor): Promise<Result<void, DatabaseError>> {
    return withDatabaseErrorHandling(
      async () => {
        return await db.transaction("rw", [db.editorStates], async () => {
          const result = await editorService.saveDocumentEditor(documentId, editor)
          if (!result.success) {
            throw result.error
          }
        })
      },
      {operation: "saveDocumentEditor", documentId},
    )
  },

  async saveVersionEditor(versionId: string, editor: VersionEditor): Promise<Result<void, DatabaseError>> {
    return withDatabaseErrorHandling(
      async () => {
        return await db.transaction("rw", [db.versionEditorStates], async () => {
          const result = await editorService.saveVersionEditor(versionId, editor)
          if (!result.success) {
            throw result.error
          }
        })
      },
      {operation: "saveVersionEditor", versionId},
    )
  },

  async loadDocumentEditor(documentId: string): Promise<Result<DocumentEditor | undefined, DatabaseError>> {
    return withDatabaseErrorHandling(
      async () => {
        return await db.transaction("r", [db.editorStates], async () => {
          const result = await editorService.loadDocumentEditor(documentId)
          if (!result.success) {
            throw result.error
          }
          return result.data
        })
      },
      {operation: "loadDocumentEditor", documentId},
    )
  },

  async loadVersionEditor(versionId: string): Promise<Result<VersionEditor | undefined, DatabaseError>> {
    return withDatabaseErrorHandling(
      async () => {
        return await db.transaction("r", [db.versionEditorStates], async () => {
          const result = await editorService.loadVersionEditor(versionId)
          if (!result.success) {
            throw result.error
          }
          return result.data
        })
      },
      {operation: "loadVersionEditor", versionId},
    )
  },
}
