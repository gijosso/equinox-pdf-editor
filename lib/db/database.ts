import Dexie, {Table} from "dexie"

import {Annotation, EditorRecord, PDFDocument, PDFVersion, VersionEditorRecord} from "../types"

export class Database extends Dexie {
  documents!: Table<PDFDocument, string>
  versions!: Table<PDFVersion, string>
  annotations!: Table<Annotation, string>
  editorStates!: Table<EditorRecord, string>
  versionEditorStates!: Table<VersionEditorRecord, string>

  constructor() {
    super("PDFEditorDB")
    this.version(1).stores({
      documents: "id, name, createdAt, updatedAt, currentVersionId, fileHash, [name+updatedAt]",
      versions: "id, documentId, versionNumber, createdAt, blob, [documentId+createdAt], [documentId+versionNumber]",
      annotations: "id, versionId, pageNumber, type, createdAt, updatedAt, [versionId+pageNumber], [versionId+type]",
      editorStates: "id, documentId, currentVersionId, createdAt, updatedAt, [documentId+updatedAt]",
      versionEditorStates: "id, versionId, createdAt, updatedAt, [versionId+updatedAt]",
    })
  }
}

export const db = new Database()
