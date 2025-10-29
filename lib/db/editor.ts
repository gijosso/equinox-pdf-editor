import type {DocumentEditor, EditorRecord, VersionEditor, VersionEditorRecord} from "../types"
import {DatabaseError, type Result, withDatabaseErrorHandling} from "../utils/error-handling"
import {db} from "./database"

export const editorService = {
  async saveDocumentEditor(documentId: string, editor: DocumentEditor): Promise<Result<string, DatabaseError>> {
    return withDatabaseErrorHandling(
      async () => {
        const now = new Date().toISOString()
        const editorRecord: EditorRecord = {
          id: documentId,
          documentId,
          currentVersionId: editor.currentVersionId,
          isEditing: editor.isEditing,
          selectedAnnotations: editor.selectedAnnotations,
          viewport: editor.viewport,
          activeTool: editor.activeTool,
          sidebarOpen: editor.sidebarOpen,
          lastSaved: editor.lastSaved,
          currentPage: editor.currentPage,
          totalPages: editor.totalPages,
          searchQuery: editor.searchQuery,
          searchResults: editor.searchResults,
          currentSearchIndex: editor.currentSearchIndex,
          history: editor.history,
          historyIndex: editor.historyIndex,
          isDiffMode: editor.isDiffMode,
          compareVersionIds: editor.compareVersionIds,
          annotationsViewMode: editor.annotationsViewMode,
          textEditsViewMode: editor.textEditsViewMode,
          createdAt: now,
          updatedAt: now,
        }

        const id = await db.editorStates.put(editorRecord)
        return id
      },
      {operation: "saveDocumentEditor", documentId},
    )
  },

  async loadDocumentEditor(documentId: string): Promise<Result<DocumentEditor | undefined, DatabaseError>> {
    return withDatabaseErrorHandling(
      async () => {
        const record = await db.editorStates.get(documentId)
        if (!record) {
          return undefined
        }

        const editor: DocumentEditor = {
          documentId: record.documentId,
          currentVersionId: record.currentVersionId,
          isEditing: record.isEditing,
          selectedAnnotations: record.selectedAnnotations,
          viewport: record.viewport,
          activeTool: record.activeTool,
          sidebarOpen: record.sidebarOpen,
          lastSaved: record.lastSaved,
          currentPage: record.currentPage,
          totalPages: record.totalPages,
          searchQuery: record.searchQuery,
          searchResults: record.searchResults,
          currentSearchIndex: record.currentSearchIndex,
          history: record.history,
          historyIndex: record.historyIndex,
          isDiffMode: record.isDiffMode,
          compareVersionIds: record.compareVersionIds,
          annotationsViewMode: record.annotationsViewMode,
          textEditsViewMode: record.textEditsViewMode,
        }

        return editor
      },
      {operation: "loadDocumentEditor", documentId},
    )
  },

  async saveVersionEditor(versionId: string, editor: VersionEditor): Promise<Result<string, DatabaseError>> {
    return withDatabaseErrorHandling(
      async () => {
        const now = new Date().toISOString()
        const versionEditorRecord: VersionEditorRecord = {
          id: versionId,
          versionId,
          annotations: editor.annotations,
          createdAt: now,
          updatedAt: now,
        }

        const id = await db.versionEditorStates.put(versionEditorRecord)
        return id
      },
      {operation: "saveVersionEditor", versionId},
    )
  },

  async loadVersionEditor(versionId: string): Promise<Result<VersionEditor | undefined, DatabaseError>> {
    return withDatabaseErrorHandling(
      async () => {
        const record = await db.versionEditorStates.get(versionId)
        if (!record) {
          return undefined
        }

        const editor: VersionEditor = {
          versionId: record.versionId,
          annotations: record.annotations,
        }

        return editor
      },
      {operation: "loadVersionEditor", versionId},
    )
  },

  async deleteDocumentEditor(documentId: string): Promise<Result<void, DatabaseError>> {
    return withDatabaseErrorHandling(
      async () => {
        await db.editorStates.delete(documentId)
      },
      {operation: "deleteDocumentEditor", documentId},
    )
  },

  async deleteVersionEditor(versionId: string): Promise<Result<void, DatabaseError>> {
    return withDatabaseErrorHandling(
      async () => {
        await db.versionEditorStates.delete(versionId)
      },
      {operation: "deleteVersionEditor", versionId},
    )
  },

  async getAllEditors(): Promise<Result<EditorRecord[], DatabaseError>> {
    return withDatabaseErrorHandling(
      async () => {
        const editors = await db.editorStates.toArray()
        return editors
      },
      {operation: "getAllEditors"},
    )
  },

  async getAllVersionEditors(): Promise<Result<VersionEditorRecord[], DatabaseError>> {
    return withDatabaseErrorHandling(
      async () => {
        const editors = await db.versionEditorStates.toArray()
        return editors
      },
      {operation: "getAllVersionEditors"},
    )
  },
}
