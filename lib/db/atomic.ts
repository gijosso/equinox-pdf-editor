import type {Annotation, DocumentEditor, PDFDocument, PDFVersion, VersionEditor} from "../types"
import {annotationService} from "./annotations"
import {db} from "./database"
import {DatabaseError, DocumentNotFoundError, type Result} from "./documents"
import {documentService} from "./documents"
import {editorService} from "./editor"
import {versionService} from "./versions"

export const atomicService = {
  async addDocumentWithVersion(
    document: PDFDocument,
    version: PDFVersion,
  ): Promise<Result<{documentId: string; versionId: string}, DatabaseError>> {
    try {
      return await db.transaction("rw", [db.documents, db.versions], async () => {
        const documentResult = await documentService.addDocument(document)
        if (!documentResult.success) {
          throw documentResult.error
        }

        const versionResult = await versionService.addVersion(version)
        if (!versionResult.success) {
          throw versionResult.error
        }

        return {success: true, data: {documentId: documentResult.data, versionId: versionResult.data}}
      })
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof DatabaseError
            ? error
            : new DatabaseError(
                `Failed to add document with version: ${error instanceof Error ? error.message : "Unknown error"}`,
              ),
      }
    }
  },

  async updateDocumentWithVersion(
    documentId: string,
    documentUpdates: Partial<PDFDocument>,
    version: PDFVersion,
  ): Promise<Result<{documentId: string; versionId: string}, DatabaseError>> {
    try {
      return await db.transaction("rw", [db.documents, db.versions], async () => {
        const versionResult = await versionService.addVersion(version)
        if (!versionResult.success) {
          throw versionResult.error
        }

        // Update document to point to the new version
        const documentResult = await documentService.updateDocument(documentId, {
          ...documentUpdates,
          currentVersionId: version.id,
        })
        if (!documentResult.success) {
          throw documentResult.error
        }

        return {success: true, data: {documentId, versionId: versionResult.data}}
      })
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof DatabaseError
            ? error
            : new DatabaseError(
                `Failed to update document with version: ${error instanceof Error ? error.message : "Unknown error"}`,
              ),
      }
    }
  },

  async deleteDocumentWithVersions(documentId: string): Promise<Result<void, DatabaseError>> {
    try {
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

        return {success: true, data: undefined}
      })
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof DatabaseError
            ? error
            : new DatabaseError(
                `Failed to delete document with versions: ${error instanceof Error ? error.message : "Unknown error"}`,
              ),
      }
    }
  },

  async getDocumentWithNextVersionNumber(
    documentId: string,
  ): Promise<Result<{document: PDFDocument; nextVersionNumber: number}, DatabaseError>> {
    try {
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
          success: true,
          data: {
            document: documentResult.data,
            nextVersionNumber: nextVersionResult.data,
          },
        }
      })
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof DatabaseError
            ? error
            : new DatabaseError(
                `Failed to get document with next version number: ${error instanceof Error ? error.message : "Unknown error"}`,
              ),
      }
    }
  },

  async getCurrentVersionBlob(documentId: string, currentVersionId: string): Promise<Result<Blob, DatabaseError>> {
    try {
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

        return {success: true, data: blobResult.data}
      })
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof DatabaseError
            ? error
            : new DatabaseError(
                `Failed to get current version blob: ${error instanceof Error ? error.message : "Unknown error"}`,
              ),
      }
    }
  },

  /**
   * Add annotations to a version atomically
   */
  async addAnnotationsToVersion(versionId: string, annotations: Annotation[]): Promise<Result<void, DatabaseError>> {
    try {
      return await db.transaction("rw", [db.annotations], async () => {
        for (const annotation of annotations) {
          const result = await annotationService.addAnnotation(annotation)
          if (!result.success) {
            throw result.error
          }
        }
        return {success: true, data: undefined}
      })
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof DatabaseError
            ? error
            : new DatabaseError(
                `Failed to add annotations to version: ${error instanceof Error ? error.message : "Unknown error"}`,
              ),
      }
    }
  },

  /**
   * Update annotations for a version atomically (replace all)
   */
  async updateVersionAnnotations(versionId: string, annotations: Annotation[]): Promise<Result<void, DatabaseError>> {
    try {
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
        return {success: true, data: undefined}
      })
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof DatabaseError
            ? error
            : new DatabaseError(
                `Failed to update version annotations: ${error instanceof Error ? error.message : "Unknown error"}`,
              ),
      }
    }
  },

  /**
   * Save document editor atomically
   */
  async saveDocumentEditor(documentId: string, editor: DocumentEditor): Promise<Result<void, DatabaseError>> {
    try {
      return await db.transaction("rw", [db.editorStates], async (): Promise<Result<void, DatabaseError>> => {
        const result = await editorService.saveDocumentEditor(documentId, editor)
        if (!result.success) {
          return result
        }
        return {success: true, data: undefined}
      })
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof DatabaseError
            ? error
            : new DatabaseError(
                `Failed to save document editor: ${error instanceof Error ? error.message : "Unknown error"}`,
              ),
      }
    }
  },

  /**
   * Save version editor atomically
   */
  async saveVersionEditor(versionId: string, editor: VersionEditor): Promise<Result<void, DatabaseError>> {
    try {
      return await db.transaction("rw", [db.versionEditorStates], async (): Promise<Result<void, DatabaseError>> => {
        const result = await editorService.saveVersionEditor(versionId, editor)
        if (!result.success) {
          return result
        }
        return {success: true, data: undefined}
      })
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof DatabaseError
            ? error
            : new DatabaseError(
                `Failed to save version editor: ${error instanceof Error ? error.message : "Unknown error"}`,
              ),
      }
    }
  },

  /**
   * Load complete editor for a document
   */
  async loadDocumentEditor(documentId: string): Promise<Result<DocumentEditor | undefined, DatabaseError>> {
    try {
      return await db.transaction(
        "r",
        [db.editorStates],
        async (): Promise<Result<DocumentEditor | undefined, DatabaseError>> => {
          const result = await editorService.loadDocumentEditor(documentId)
          if (!result.success) {
            return result
          }
          return {success: true, data: result.data}
        },
      )
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof DatabaseError
            ? error
            : new DatabaseError(
                `Failed to load document editor: ${error instanceof Error ? error.message : "Unknown error"}`,
              ),
      }
    }
  },

  /**
   * Load version editor
   */
  async loadVersionEditor(versionId: string): Promise<Result<VersionEditor | undefined, DatabaseError>> {
    try {
      return await db.transaction(
        "r",
        [db.versionEditorStates],
        async (): Promise<Result<VersionEditor | undefined, DatabaseError>> => {
          const result = await editorService.loadVersionEditor(versionId)
          if (!result.success) {
            return result
          }
          return {success: true, data: result.data}
        },
      )
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof DatabaseError
            ? error
            : new DatabaseError(
                `Failed to load version editor: ${error instanceof Error ? error.message : "Unknown error"}`,
              ),
      }
    }
  },
}
