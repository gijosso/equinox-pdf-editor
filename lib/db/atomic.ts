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
        const documentResult = await documentService.updateDocument(documentId, documentUpdates)
        if (!documentResult.success) {
          throw documentResult.error
        }

        const versionResult = await versionService.addVersion(version)
        if (!versionResult.success) {
          throw versionResult.error
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
}
