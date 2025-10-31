import Dexie, {Table} from "dexie"

import {Annotation, Edit, EditorRecord, PDFDocument, PDFVersion, TextEdit, VersionEditorRecord} from "../types"

export class Database extends Dexie {
  documents!: Table<PDFDocument, string>
  versions!: Table<PDFVersion, string>
  annotations!: Table<Annotation, string>
  editorStates!: Table<EditorRecord, string>
  versionEditorStates!: Table<VersionEditorRecord, string>
  edits!: Table<Edit, string>
  textEdits!: Table<TextEdit, string>

  constructor() {
    super("PDFEditorDB")
    this.version(1).stores({
      documents: "id, name, createdAt, updatedAt, currentVersionId, latestVersionId, fileHash, blob, [name+updatedAt]",
      versions: "id, documentId, versionNumber, createdAt, [documentId+createdAt], [documentId+versionNumber]",
      annotations:
        "id, versionId, pageNumber, type, createdAt, updatedAt, originalId, committedVersionId, [versionId+pageNumber], [versionId+type]",
      editorStates: "id, documentId, currentVersionId, createdAt, updatedAt, [documentId+updatedAt]",
      versionEditorStates: "id, versionId, createdAt, updatedAt, [versionId+updatedAt]",
      edits: "id, versionId, type, annotationId, timestamp, [versionId+type], [versionId+annotationId]",
      textEdits:
        "id, versionId, pageNumber, originalText, newText, x, y, width, height, fontFamily, fontSize, fontWeight, color, operation, originalId, committedVersionId, createdAt, updatedAt, [versionId+pageNumber]",
    })
  }
}

export const db = new Database()
