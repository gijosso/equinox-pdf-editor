import {Dexie, Table} from "dexie"

import type {Edit} from "@/lib/types"
import {generateEditId} from "@/lib/utils/id"

export class EditsTable extends Dexie {
  edits!: Table<Edit>

  constructor() {
    super("EditsDatabase")
    this.version(1).stores({
      edits: "id, versionId, type, annotationId, timestamp",
    })
  }
}

export const editsDb = new EditsTable()

export interface AddEditOptions {
  versionId: string
  type: Edit["type"]
  annotationId: string
  data?: any
}

export interface AddEditResult {
  success: boolean
  data?: string
  error?: {message: string}
}

export interface GetEditsByVersionResult {
  success: boolean
  data?: Edit[]
  error?: {message: string}
}

export interface DeleteEditsByVersionResult {
  success: boolean
  error?: {message: string}
}

export const editService = {
  async addEdit(options: AddEditOptions): Promise<AddEditResult> {
    try {
      const edit: Edit = {
        id: generateEditId(),
        versionId: options.versionId,
        type: options.type,
        annotationId: options.annotationId,
        timestamp: new Date().toISOString(),
        data: options.data,
      }

      await editsDb.edits.add(edit)
      return {success: true, data: edit.id}
    } catch (error) {
      console.error("Failed to add edit:", error)
      return {
        success: false,
        error: {message: error instanceof Error ? error.message : "Unknown error occurred"},
      }
    }
  },

  async getEditsByVersion(versionId: string): Promise<GetEditsByVersionResult> {
    try {
      const edits = await editsDb.edits.where("versionId").equals(versionId).toArray()
      return {success: true, data: edits}
    } catch (error) {
      console.error("Failed to get edits by version:", error)
      return {
        success: false,
        error: {message: error instanceof Error ? error.message : "Unknown error occurred"},
      }
    }
  },

  async deleteEditsByVersion(versionId: string): Promise<DeleteEditsByVersionResult> {
    try {
      await editsDb.edits.where("versionId").equals(versionId).delete()
      return {success: true}
    } catch (error) {
      console.error("Failed to delete edits by version:", error)
      return {
        success: false,
        error: {message: error instanceof Error ? error.message : "Unknown error occurred"},
      }
    }
  },

  async hasEdits(versionId: string): Promise<boolean> {
    try {
      const count = await editsDb.edits.where("versionId").equals(versionId).count()
      return count > 0
    } catch (error) {
      console.error("Failed to check if version has edits:", error)
      return false
    }
  },
}
