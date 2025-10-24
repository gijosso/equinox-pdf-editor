import Dexie, {type Table} from "dexie"

import type {PDFDocument, PDFVersion} from "./types"

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
  async addDocument(doc: PDFDocument): Promise<string> {
    return await db.documents.add(doc)
  },

  async getDocument(id: string): Promise<PDFDocument | undefined> {
    return await db.documents.get(id)
  },

  async getAllDocuments(): Promise<PDFDocument[]> {
    return await db.documents.orderBy("updatedAt").reverse().toArray()
  },

  async updateDocument(id: string, updates: Partial<PDFDocument>): Promise<void> {
    await db.documents.update(id, updates)
  },

  async deleteDocument(id: string): Promise<void> {
    const versions = await db.versions.where("documentId").equals(id).toArray()
    await db.versions.bulkDelete(versions.map(v => v.id))
    await db.documents.delete(id)
  },

  async addVersion(version: PDFVersion): Promise<string> {
    return await db.versions.add(version)
  },

  async getVersion(id: string): Promise<PDFVersion | undefined> {
    return await db.versions.get(id)
  },

  async getVersionsByDocument(documentId: string): Promise<PDFVersion[]> {
    return await db.versions.where("documentId").equals(documentId).sortBy("versionNumber")
  },

  async deleteVersion(id: string): Promise<void> {
    await db.versions.delete(id)
  },

  async getDocumentByHash(fileHash: string): Promise<PDFDocument | undefined> {
    return await db.documents.where("fileHash").equals(fileHash).first()
  },
}
