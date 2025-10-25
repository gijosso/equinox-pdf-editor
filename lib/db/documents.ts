import type {PDFDocument} from "../types"
import {db} from "./database"

export type Result<T, E = Error> = {success: true; data: T} | {success: false; error: E}

export class DatabaseError extends Error {
  constructor(
    message: string,
    public code?: string,
  ) {
    super(message)
    this.name = "DatabaseError"
  }
}

export class DocumentNotFoundError extends DatabaseError {
  constructor(id: string) {
    super(`Document with id "${id}" not found`, "DOCUMENT_NOT_FOUND")
  }
}

export const documentService = {
  async addDocument(doc: PDFDocument): Promise<Result<string, DatabaseError>> {
    try {
      const id = await db.documents.add(doc)
      return {success: true, data: id}
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(`Failed to add document: ${error instanceof Error ? error.message : "Unknown error"}`),
      }
    }
  },

  async getDocument(id: string): Promise<Result<PDFDocument | undefined, DatabaseError>> {
    try {
      const document = await db.documents.get(id)
      return {success: true, data: document}
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(`Failed to get document: ${error instanceof Error ? error.message : "Unknown error"}`),
      }
    }
  },

  async getAllDocuments(): Promise<Result<PDFDocument[], DatabaseError>> {
    try {
      let query = db.documents.orderBy("updatedAt").reverse()

      const documents = await query.toArray()
      // Return metadata only (without blob) for list views
      const metadataOnly = documents.map(doc => ({
        id: doc.id,
        name: doc.name,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        currentVersionId: doc.currentVersionId,
        fileHash: doc.fileHash,
        thumbnail: doc.thumbnail,
      }))
      return {success: true, data: metadataOnly}
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(
          `Failed to get all documents: ${error instanceof Error ? error.message : "Unknown error"}`,
        ),
      }
    }
  },

  async getDocumentsCount(): Promise<Result<number, DatabaseError>> {
    try {
      const count = await db.documents.count()
      return {success: true, data: count}
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(
          `Failed to get documents count: ${error instanceof Error ? error.message : "Unknown error"}`,
        ),
      }
    }
  },

  async updateDocument(id: string, updates: Partial<PDFDocument>): Promise<Result<void, DatabaseError>> {
    try {
      const document = await db.documents.get(id)
      if (!document) {
        return {success: false, error: new DocumentNotFoundError(id)}
      }

      await db.documents.update(id, updates)
      return {success: true, data: undefined}
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(
          `Failed to update document: ${error instanceof Error ? error.message : "Unknown error"}`,
        ),
      }
    }
  },

  async deleteDocument(id: string): Promise<Result<void, DatabaseError>> {
    try {
      const document = await db.documents.get(id)
      if (!document) {
        return {success: false, error: new DocumentNotFoundError(id)}
      }

      await db.documents.delete(id)
      return {success: true, data: undefined}
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(
          `Failed to delete document: ${error instanceof Error ? error.message : "Unknown error"}`,
        ),
      }
    }
  },

  async getDocumentByHash(fileHash: string): Promise<Result<PDFDocument | undefined, DatabaseError>> {
    try {
      const document = await db.documents.where("fileHash").equals(fileHash).first()
      if (!document) {
        return {success: true, data: undefined}
      }

      // Return metadata only
      const metadata: PDFDocument = {
        id: document.id,
        name: document.name,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
        currentVersionId: document.currentVersionId,
        fileHash: document.fileHash,
        thumbnail: document.thumbnail,
      }
      return {success: true, data: metadata}
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(
          `Failed to get document by hash: ${error instanceof Error ? error.message : "Unknown error"}`,
        ),
      }
    }
  },
}
