import Dexie, {Table} from "dexie"

import {PDFDocument, PDFVersion} from "../types"

export class Database extends Dexie {
  documents!: Table<PDFDocument, string>
  versions!: Table<PDFVersion, string>
  pdfBlobs!: Table<{id: string; blob: Blob}, string>

  constructor() {
    super("PDFEditorDB")
    this.version(1).stores({
      documents: "id, name, createdAt, updatedAt, currentVersionId, fileHash, [name+updatedAt]",
      versions: "id, documentId, versionNumber, createdAt, [documentId+createdAt]",
      pdfBlobs: "id", // Store PDF blobs separately
    })
  }
}

export const db = new Database()
