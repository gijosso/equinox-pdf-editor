import type {TextEdit} from "@/lib/types"
import {DatabaseError, type Result, TextEditNotFoundError, withDatabaseErrorHandling} from "@/lib/utils/error-handling"
import {generateTextEditId} from "@/lib/utils/id"

import {db} from "./database"

export interface AddTextEditOptions {
  versionId: string
  pageNumber: number
  originalText: string
  newText: string
  x: number
  y: number
  width: number
  height: number
  fontFamily?: string
  fontSize?: number
  fontWeight?: string | number
  color?: string
  operation?: "insert" | "delete" | "replace"
}

export const textEditService = {
  async addTextEdit(options: AddTextEditOptions): Promise<Result<string, DatabaseError>> {
    return withDatabaseErrorHandling(
      async () => {
        const now = new Date().toISOString()
        const textEdit: TextEdit = {
          id: generateTextEditId(),
          versionId: options.versionId,
          pageNumber: options.pageNumber,
          originalText: options.originalText,
          newText: options.newText,
          x: options.x,
          y: options.y,
          width: options.width,
          height: options.height,
          fontFamily: options.fontFamily,
          fontSize: options.fontSize,
          fontWeight: options.fontWeight,
          color: options.color,
          operation: options.operation,
          createdAt: now,
          updatedAt: now,
        }

        const id = await db.textEdits.add(textEdit)
        return id
      },
      {operation: "addTextEdit", versionId: options.versionId},
    )
  },

  async getTextEditsByVersion(versionId: string): Promise<Result<TextEdit[], DatabaseError>> {
    return withDatabaseErrorHandling(
      async () => {
        const textEdits = await db.textEdits.where("versionId").equals(versionId).toArray()
        return textEdits
      },
      {operation: "getTextEditsByVersion", versionId},
    )
  },

  async getTextEditsByPage(versionId: string, pageNumber: number): Promise<Result<TextEdit[], DatabaseError>> {
    return withDatabaseErrorHandling(
      async () => {
        const textEdits = await db.textEdits
          .where(["versionId", "pageNumber"])
          .equals([versionId, pageNumber])
          .toArray()
        return textEdits
      },
      {operation: "getTextEditsByPage", versionId, pageNumber},
    )
  },

  async updateTextEdit(id: string, updates: Partial<TextEdit>): Promise<Result<void, DatabaseError>> {
    return withDatabaseErrorHandling(
      async () => {
        const updateData = {
          ...updates,
          updatedAt: new Date().toISOString(),
        }
        await db.textEdits.update(id, updateData)
      },
      {operation: "updateTextEdit", textEditId: id},
    )
  },

  async deleteTextEdit(id: string): Promise<Result<void, DatabaseError>> {
    return withDatabaseErrorHandling(
      async () => {
        const textEdit = await db.textEdits.get(id)
        if (!textEdit) {
          throw new TextEditNotFoundError(id)
        }
        await db.textEdits.delete(id)
      },
      {operation: "deleteTextEdit", textEditId: id},
    )
  },

  async deleteTextEditsByVersion(versionId: string): Promise<Result<void, DatabaseError>> {
    return withDatabaseErrorHandling(
      async () => {
        await db.textEdits.where("versionId").equals(versionId).delete()
      },
      {operation: "deleteTextEditsByVersion", versionId},
    )
  },

  async hasTextEdits(versionId: string): Promise<Result<boolean, DatabaseError>> {
    return withDatabaseErrorHandling(
      async () => {
        const count = await db.textEdits.where("versionId").equals(versionId).count()
        return count > 0
      },
      {operation: "hasTextEdits", versionId},
    )
  },
}
