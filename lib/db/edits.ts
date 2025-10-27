import {Dexie, Table} from "dexie"

import type {Edit} from "@/lib/types"
import {DatabaseError, type Result, withDatabaseErrorHandling} from "@/lib/utils/error-handling"
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

export const editService = {
  async addEdit(options: AddEditOptions): Promise<Result<string, DatabaseError>> {
    return withDatabaseErrorHandling(
      async () => {
        const edit: Edit = {
          id: generateEditId(),
          versionId: options.versionId,
          type: options.type,
          annotationId: options.annotationId,
          timestamp: new Date().toISOString(),
          data: options.data,
        }

        const id = await editsDb.edits.add(edit)
        return id
      },
      {operation: "addEdit", versionId: options.versionId},
    )
  },

  async getEditsByVersion(versionId: string): Promise<Result<Edit[], DatabaseError>> {
    return withDatabaseErrorHandling(
      async () => {
        const edits = await editsDb.edits.where("versionId").equals(versionId).toArray()
        return edits
      },
      {operation: "getEditsByVersion", versionId},
    )
  },

  async deleteEditsByVersion(versionId: string): Promise<Result<void, DatabaseError>> {
    return withDatabaseErrorHandling(
      async () => {
        await editsDb.edits.where("versionId").equals(versionId).delete()
      },
      {operation: "deleteEditsByVersion", versionId},
    )
  },

  async hasEdits(versionId: string): Promise<Result<boolean, DatabaseError>> {
    return withDatabaseErrorHandling(
      async () => {
        const count = await editsDb.edits.where("versionId").equals(versionId).count()
        return count > 0
      },
      {operation: "hasEdits", versionId},
    )
  },
}
