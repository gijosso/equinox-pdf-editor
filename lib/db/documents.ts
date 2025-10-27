import type {PDFDocument} from "../types"
import {DatabaseError, DocumentNotFoundError, type Result, withDatabaseErrorHandling} from "../utils/error-handling"
import {db} from "./database"

export {type Result} from "../utils/error-handling"

export const documentService = {
  async addDocument(doc: PDFDocument): Promise<Result<string, DatabaseError>> {
    return withDatabaseErrorHandling(
      async () => {
        const id = await db.documents.add(doc)
        return id
      },
      {operation: "addDocument", documentId: doc.id},
    )
  },

  async getDocument(id: string): Promise<Result<PDFDocument | undefined, DatabaseError>> {
    return withDatabaseErrorHandling(
      async () => {
        const document = await db.documents.get(id)
        if (!document) {
          return undefined
        }
        // Return metadata only (without blob)
        return {
          id: document.id,
          name: document.name,
          createdAt: document.createdAt,
          updatedAt: document.updatedAt,
          currentVersionId: document.currentVersionId,
          latestVersionId: document.latestVersionId,
          fileHash: document.fileHash,
          thumbnail: document.thumbnail,
        }
      },
      {operation: "getDocument", documentId: id},
    )
  },

  async getDocumentBlob(id: string): Promise<Result<Blob | undefined, DatabaseError>> {
    return withDatabaseErrorHandling(
      async () => {
        const document = await db.documents.get(id)
        if (!document) {
          return undefined
        }
        return (document as any).blob
      },
      {operation: "getDocumentBlob", documentId: id},
    )
  },

  async getAllDocuments(): Promise<Result<PDFDocument[], DatabaseError>> {
    return withDatabaseErrorHandling(
      async () => {
        const documents = await db.documents.orderBy("updatedAt").reverse().toArray()
        // Return metadata only (without blob) for list views
        return documents.map(doc => ({
          id: doc.id,
          name: doc.name,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
          currentVersionId: doc.currentVersionId,
          latestVersionId: doc.latestVersionId,
          fileHash: doc.fileHash,
          thumbnail: doc.thumbnail,
        }))
      },
      {operation: "getAllDocuments"},
    )
  },

  async updateDocument(id: string, updates: Partial<PDFDocument>): Promise<Result<void, DatabaseError>> {
    return withDatabaseErrorHandling(
      async () => {
        const document = await db.documents.get(id)
        if (!document) {
          throw new DocumentNotFoundError(id)
        }
        await db.documents.update(id, updates)
      },
      {operation: "updateDocument", documentId: id},
    )
  },

  async deleteDocument(id: string): Promise<Result<void, DatabaseError>> {
    return withDatabaseErrorHandling(
      async () => {
        const document = await db.documents.get(id)
        if (!document) {
          throw new DocumentNotFoundError(id)
        }
        await db.documents.delete(id)
      },
      {operation: "deleteDocument", documentId: id},
    )
  },

  async getDocumentByHash(fileHash: string): Promise<Result<PDFDocument | undefined, DatabaseError>> {
    return withDatabaseErrorHandling(
      async () => {
        const document = await db.documents.where("fileHash").equals(fileHash).first()
        if (!document) {
          return undefined
        }
        // Return metadata only (without blob)
        return {
          id: document.id,
          name: document.name,
          createdAt: document.createdAt,
          updatedAt: document.updatedAt,
          currentVersionId: document.currentVersionId,
          latestVersionId: document.latestVersionId,
          fileHash: document.fileHash,
          thumbnail: document.thumbnail,
        }
      },
      {operation: "getDocumentByHash", fileHash},
    )
  },
}
