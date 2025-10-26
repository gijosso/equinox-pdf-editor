import type {PDFDocument, PDFVersion} from "../types"
import {db} from "./database"
import {DatabaseError, DocumentNotFoundError, type Result} from "./documents"
import {documentService} from "./documents"
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

  async getCurrentVersionBlob(
    documentId: string,
    currentVersionId: string,
  ): Promise<Result<PDFVersion, DatabaseError>> {
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

        // Get the version blob
        const versionResult = await versionService.getVersion(currentVersionId)
        if (!versionResult.success) {
          throw versionResult.error
        }

        if (!versionResult.data) {
          throw new DatabaseError("Current version not found")
        }

        if (!versionResult.data.blob) {
          throw new DatabaseError("No blob found in current version")
        }

        return {success: true, data: versionResult.data}
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
}
