import Dexie, {Table} from "dexie"

import {PDFDocument, PDFDocumentWithBlob, PDFVersion} from "../types"

export class Database extends Dexie {
  documents!: Table<PDFDocumentWithBlob, string>
  versions!: Table<PDFVersion, string>

  constructor() {
    super("PDFEditorDB")
    this.version(1).stores({
      documents: "id, name, createdAt, updatedAt, currentVersionId, fileHash, [name+updatedAt]",
      versions: "id, documentId, versionNumber, createdAt, [documentId+createdAt]",
    })
  }
}

export const db = new Database()
