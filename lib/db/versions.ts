import Dexie from "dexie"

import type {PDFVersion} from "../types"
import {db} from "./database"
import {DatabaseError, type Result} from "./documents"

export class VersionNotFoundError extends DatabaseError {
  constructor(id: string) {
    super(`Version with id "${id}" not found`, "VERSION_NOT_FOUND")
  }
}

export const versionService = {
  async addVersion(version: PDFVersion): Promise<Result<string, DatabaseError>> {
    try {
      const id = await db.versions.add(version)
      return {success: true, data: id}
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(`Failed to add version: ${error instanceof Error ? error.message : "Unknown error"}`),
      }
    }
  },

  async getVersion(id: string): Promise<Result<PDFVersion | undefined, DatabaseError>> {
    try {
      const version = await db.versions.get(id)
      return {success: true, data: version}
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(`Failed to get version: ${error instanceof Error ? error.message : "Unknown error"}`),
      }
    }
  },

  async getVersionsByDocument(documentId: string): Promise<Result<PDFVersion[], DatabaseError>> {
    try {
      const versions = await db.versions.where("documentId").equals(documentId).sortBy("createdAt")
      return {success: true, data: versions}
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(
          `Failed to get versions by document: ${error instanceof Error ? error.message : "Unknown error"}`,
        ),
      }
    }
  },

  async getNextVersionNumber(documentId: string): Promise<Result<number, DatabaseError>> {
    try {
      const maxVersion = await db.versions
        .where("[documentId+versionNumber]")
        .between([documentId, Dexie.minKey], [documentId, Dexie.maxKey])
        .reverse()
        .first()

      return {success: true, data: maxVersion ? maxVersion.versionNumber + 1 : 1}
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(
          `Failed to get next version number: ${error instanceof Error ? error.message : "Unknown error"}`,
        ),
      }
    }
  },

  async updateVersion(id: string, updates: Partial<PDFVersion>): Promise<Result<void, DatabaseError>> {
    try {
      const version = await db.versions.get(id)
      if (!version) {
        return {success: false, error: new VersionNotFoundError(id)}
      }

      await db.versions.update(id, updates)
      return {success: true, data: undefined}
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(
          `Failed to update version: ${error instanceof Error ? error.message : "Unknown error"}`,
        ),
      }
    }
  },

  async deleteVersion(id: string): Promise<Result<void, DatabaseError>> {
    try {
      const version = await db.versions.get(id)
      if (!version) {
        return {success: false, error: new VersionNotFoundError(id)}
      }

      await db.versions.delete(id)
      return {success: true, data: undefined}
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(
          `Failed to delete version: ${error instanceof Error ? error.message : "Unknown error"}`,
        ),
      }
    }
  },

  async deleteVersionsByDocument(documentId: string): Promise<Result<void, DatabaseError>> {
    try {
      const versions = await db.versions.where("documentId").equals(documentId).toArray()
      if (versions.length > 0) {
        await db.versions.bulkDelete(versions.map(v => v.id))
      }
      return {success: true, data: undefined}
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(
          `Failed to delete versions by document: ${error instanceof Error ? error.message : "Unknown error"}`,
        ),
      }
    }
  },
}
