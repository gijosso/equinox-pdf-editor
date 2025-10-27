import Dexie from "dexie"

import type {PDFVersion} from "../types"
import {DatabaseError, type Result, VersionNotFoundError, withDatabaseErrorHandling} from "../utils/error-handling"
import {db} from "./database"

export const versionService = {
  async addVersion(version: PDFVersion): Promise<Result<string, DatabaseError>> {
    return withDatabaseErrorHandling(
      async () => {
        const id = await db.versions.add(version)
        return id
      },
      {operation: "addVersion", versionId: version.id},
    )
  },

  async getVersion(id: string): Promise<Result<PDFVersion | undefined, DatabaseError>> {
    return withDatabaseErrorHandling(
      async () => {
        const version = await db.versions.get(id)
        return version
      },
      {operation: "getVersion", versionId: id},
    )
  },

  async getVersionsByDocument(documentId: string): Promise<Result<PDFVersion[], DatabaseError>> {
    return withDatabaseErrorHandling(
      async () => {
        const versions = await db.versions.where("documentId").equals(documentId).sortBy("createdAt")
        return versions
      },
      {operation: "getVersionsByDocument", documentId},
    )
  },

  async getNextVersionNumber(documentId: string): Promise<Result<number, DatabaseError>> {
    return withDatabaseErrorHandling(
      async () => {
        const maxVersion = await db.versions
          .where("[documentId+versionNumber]")
          .between([documentId, Dexie.minKey], [documentId, Dexie.maxKey])
          .reverse()
          .first()

        return maxVersion ? maxVersion.versionNumber + 1 : 1
      },
      {operation: "getNextVersionNumber", documentId},
    )
  },

  async updateVersion(id: string, updates: Partial<PDFVersion>): Promise<Result<void, DatabaseError>> {
    return withDatabaseErrorHandling(
      async () => {
        const version = await db.versions.get(id)
        if (!version) {
          throw new VersionNotFoundError(id)
        }
        await db.versions.update(id, updates)
      },
      {operation: "updateVersion", versionId: id},
    )
  },

  async deleteVersion(id: string): Promise<Result<void, DatabaseError>> {
    return withDatabaseErrorHandling(
      async () => {
        const version = await db.versions.get(id)
        if (!version) {
          throw new VersionNotFoundError(id)
        }
        await db.versions.delete(id)
      },
      {operation: "deleteVersion", versionId: id},
    )
  },

  async deleteVersionsByDocument(documentId: string): Promise<Result<void, DatabaseError>> {
    return withDatabaseErrorHandling(
      async () => {
        const versions = await db.versions.where("documentId").equals(documentId).toArray()
        if (versions.length > 0) {
          await db.versions.bulkDelete(versions.map(v => v.id))
        }
      },
      {operation: "deleteVersionsByDocument", documentId},
    )
  },
}
