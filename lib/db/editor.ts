import type {DocumentEditor, EditorRecord, VersionEditor, VersionEditorRecord} from "../types"
import {db} from "./database"
import {DatabaseError, type Result} from "./documents"

export class EditorNotFoundError extends DatabaseError {
  constructor(id: string) {
    super(`Editor with id ${id} not found`)
  }
}

export const editorService = {
  /**
   * Save document editor to database
   */
  async saveDocumentEditor(documentId: string, editor: DocumentEditor): Promise<Result<string, DatabaseError>> {
    try {
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
        hasUnsavedChanges: editor.hasUnsavedChanges,
        currentPage: editor.currentPage,
        totalPages: editor.totalPages,
        searchQuery: editor.searchQuery,
        searchResults: editor.searchResults,
        currentSearchIndex: editor.currentSearchIndex,
        history: editor.history,
        historyIndex: editor.historyIndex,
        isDiffMode: editor.isDiffMode,
        compareVersionIds: editor.compareVersionIds,
        createdAt: now,
        updatedAt: now,
      }

      await db.editorStates.put(editorRecord)
      return {success: true, data: documentId}
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(`Failed to save editor: ${error instanceof Error ? error.message : "Unknown error"}`),
      }
    }
  },

  /**
   * Load document editor from database
   */
  async loadDocumentEditor(documentId: string): Promise<Result<DocumentEditor | undefined, DatabaseError>> {
    try {
      const record = await db.editorStates.get(documentId)
      if (!record) {
        return {success: true, data: undefined}
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
        hasUnsavedChanges: record.hasUnsavedChanges,
        currentPage: record.currentPage,
        totalPages: record.totalPages,
        searchQuery: record.searchQuery,
        searchResults: record.searchResults,
        currentSearchIndex: record.currentSearchIndex,
        history: record.history,
        historyIndex: record.historyIndex,
        isDiffMode: record.isDiffMode,
        compareVersionIds: record.compareVersionIds,
      }

      return {success: true, data: editor}
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(`Failed to load editor: ${error instanceof Error ? error.message : "Unknown error"}`),
      }
    }
  },

  /**
   * Save version editor to database
   */
  async saveVersionEditor(versionId: string, editor: VersionEditor): Promise<Result<string, DatabaseError>> {
    try {
      const now = new Date().toISOString()
      const versionEditorRecord: VersionEditorRecord = {
        id: versionId,
        versionId,
        annotations: editor.annotations,
        createdAt: now,
        updatedAt: now,
      }

      await db.versionEditorStates.put(versionEditorRecord)
      return {success: true, data: versionId}
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(
          `Failed to save version editor: ${error instanceof Error ? error.message : "Unknown error"}`,
        ),
      }
    }
  },

  /**
   * Load version editor from database
   */
  async loadVersionEditor(versionId: string): Promise<Result<VersionEditor | undefined, DatabaseError>> {
    try {
      const record = await db.versionEditorStates.get(versionId)
      if (!record) {
        return {success: true, data: undefined}
      }

      const editor: VersionEditor = {
        versionId: record.versionId,
        annotations: record.annotations,
      }

      return {success: true, data: editor}
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(
          `Failed to load version editor: ${error instanceof Error ? error.message : "Unknown error"}`,
        ),
      }
    }
  },

  /**
   * Delete document editor
   */
  async deleteDocumentEditor(documentId: string): Promise<Result<void, DatabaseError>> {
    try {
      await db.editorStates.delete(documentId)
      return {success: true, data: undefined}
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(
          `Failed to delete editor: ${error instanceof Error ? error.message : "Unknown error"}`,
        ),
      }
    }
  },

  /**
   * Delete version editor
   */
  async deleteVersionEditor(versionId: string): Promise<Result<void, DatabaseError>> {
    try {
      await db.versionEditorStates.delete(versionId)
      return {success: true, data: undefined}
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(
          `Failed to delete version editor: ${error instanceof Error ? error.message : "Unknown error"}`,
        ),
      }
    }
  },

  /**
   * Get all editors
   */
  async getAllEditors(): Promise<Result<EditorRecord[], DatabaseError>> {
    try {
      const editors = await db.editorStates.toArray()
      return {success: true, data: editors}
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(
          `Failed to get all editors: ${error instanceof Error ? error.message : "Unknown error"}`,
        ),
      }
    }
  },

  /**
   * Get all version editors
   */
  async getAllVersionEditors(): Promise<Result<VersionEditorRecord[], DatabaseError>> {
    try {
      const editors = await db.versionEditorStates.toArray()
      return {success: true, data: editors}
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(
          `Failed to get all version editors: ${error instanceof Error ? error.message : "Unknown error"}`,
        ),
      }
    }
  },
}
