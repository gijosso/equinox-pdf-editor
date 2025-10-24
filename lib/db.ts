import Dexie, {type Table} from "dexie"

import type {PDFDocument, PDFVersion} from "./types"

// Result type for better error handling
export type Result<T, E = Error> = {success: true; data: T} | {success: false; error: E}

// Database error types
export class DatabaseError extends Error {
  constructor(
    message: string,
    public operation: string,
    public originalError?: unknown,
  ) {
    super(message)
    this.name = "DatabaseError"
  }
}

export class DocumentNotFoundError extends DatabaseError {
  constructor(documentId: string) {
    super(`Document with id ${documentId} not found`, "getDocument")
    this.name = "DocumentNotFoundError"
  }
}

export class VersionNotFoundError extends DatabaseError {
  constructor(versionId: string) {
    super(`Version with id ${versionId} not found`, "getVersion")
    this.name = "VersionNotFoundError"
  }
}

export class PDFDatabase extends Dexie {
  documents!: Table<PDFDocument, string>
  versions!: Table<PDFVersion, string>

  constructor() {
    super("PDFVersioningDB")

    this.version(1).stores({
      documents: "id, name, createdAt, updatedAt, currentVersionId, fileHash",
      versions: "id, documentId, versionNumber, createdAt",
    })
  }
}

export const db = new PDFDatabase()

export const dbHelpers = {
  async addDocument(doc: PDFDocument): Promise<Result<string, DatabaseError>> {
    try {
      const id = await db.documents.add(doc)
      return {success: true, data: id}
    } catch (error) {
      console.error("Failed to add document:", error)
      return {
        success: false,
        error: new DatabaseError("Failed to add document to database", "addDocument", error),
      }
    }
  },

  async getDocument(id: string): Promise<Result<PDFDocument | undefined, DatabaseError>> {
    try {
      const document = await db.documents.get(id)
      return {success: true, data: document}
    } catch (error) {
      console.error("Failed to get document:", error)
      return {
        success: false,
        error: new DatabaseError("Failed to retrieve document from database", "getDocument", error),
      }
    }
  },

  async getAllDocuments(): Promise<Result<PDFDocument[], DatabaseError>> {
    try {
      const documents = await db.documents.orderBy("updatedAt").reverse().toArray()
      return {success: true, data: documents}
    } catch (error) {
      console.error("Failed to get all documents:", error)
      return {
        success: false,
        error: new DatabaseError("Failed to retrieve documents from database", "getAllDocuments", error),
      }
    }
  },

  async updateDocument(id: string, updates: Partial<PDFDocument>): Promise<Result<void, DatabaseError>> {
    try {
      const updateCount = await db.documents.update(id, updates)
      if (updateCount === 0) {
        return {
          success: false,
          error: new DocumentNotFoundError(id),
        }
      }
      return {success: true, data: undefined}
    } catch (error) {
      console.error("Failed to update document:", error)
      return {
        success: false,
        error: new DatabaseError("Failed to update document in database", "updateDocument", error),
      }
    }
  },

  async deleteDocument(id: string): Promise<Result<void, DatabaseError>> {
    try {
      // First check if document exists
      const document = await db.documents.get(id)
      if (!document) {
        return {
          success: false,
          error: new DocumentNotFoundError(id),
        }
      }

      // Get all versions for this document
      const versions = await db.versions.where("documentId").equals(id).toArray()

      // Delete versions first (foreign key constraint)
      if (versions.length > 0) {
        await db.versions.bulkDelete(versions.map(v => v.id))
      }

      // Then delete the document
      await db.documents.delete(id)
      return {success: true, data: undefined}
    } catch (error) {
      console.error("Failed to delete document:", error)
      return {
        success: false,
        error: new DatabaseError("Failed to delete document from database", "deleteDocument", error),
      }
    }
  },

  async addVersion(version: PDFVersion): Promise<Result<string, DatabaseError>> {
    try {
      const id = await db.versions.add(version)
      return {success: true, data: id}
    } catch (error) {
      console.error("Failed to add version:", error)
      return {
        success: false,
        error: new DatabaseError("Failed to add version to database", "addVersion", error),
      }
    }
  },

  async getVersion(id: string): Promise<Result<PDFVersion | undefined, DatabaseError>> {
    try {
      const version = await db.versions.get(id)
      return {success: true, data: version}
    } catch (error) {
      console.error("Failed to get version:", error)
      return {
        success: false,
        error: new DatabaseError("Failed to retrieve version from database", "getVersion", error),
      }
    }
  },

  async getVersionsByDocument(documentId: string): Promise<Result<PDFVersion[], DatabaseError>> {
    try {
      const versions = await db.versions.where("documentId").equals(documentId).sortBy("versionNumber")
      return {success: true, data: versions}
    } catch (error) {
      console.error("Failed to get versions by document:", error)
      return {
        success: false,
        error: new DatabaseError("Failed to retrieve versions from database", "getVersionsByDocument", error),
      }
    }
  },

  async deleteVersion(id: string): Promise<Result<void, DatabaseError>> {
    try {
      // First check if version exists
      const version = await db.versions.get(id)
      if (!version) {
        return {
          success: false,
          error: new VersionNotFoundError(id),
        }
      }

      await db.versions.delete(id)
      return {success: true, data: undefined}
    } catch (error) {
      console.error("Failed to delete version:", error)
      return {
        success: false,
        error: new DatabaseError("Failed to delete version from database", "deleteVersion", error),
      }
    }
  },

  async getDocumentByHash(fileHash: string): Promise<Result<PDFDocument | undefined, DatabaseError>> {
    try {
      const document = await db.documents.where("fileHash").equals(fileHash).first()
      return {success: true, data: document}
    } catch (error) {
      console.error("Failed to get document by hash:", error)
      return {
        success: false,
        error: new DatabaseError("Failed to retrieve document by hash from database", "getDocumentByHash", error),
      }
    }
  },
}
