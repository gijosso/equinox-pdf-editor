import Dexie, {Table} from "dexie"

import {PDFDocument, PDFVersion} from "../types"

export class Database extends Dexie {
  documents!: Table<PDFDocument, string>
  versions!: Table<PDFVersion, string>
  constructor() {
    super("PDFEditorDB")
    this.version(1).stores({
      documents: "id, name, createdAt, updatedAt, currentVersionId, fileHash",
      versions: "id, documentId, versionNumber, createdAt",
    })
  }
}

export const db = new Database()
