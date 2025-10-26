import type {Annotation} from "../types"
import {db} from "./database"
import {DatabaseError, type Result} from "./documents"

export class AnnotationNotFoundError extends DatabaseError {
  constructor(id: string) {
    super(`Annotation with id ${id} not found`)
  }
}

export const annotationService = {
  /**
   * Add a new annotation to the database
   */
  async addAnnotation(annotation: Annotation): Promise<Result<string, DatabaseError>> {
    try {
      const id = await db.annotations.add(annotation)
      return {success: true, data: id}
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(
          `Failed to add annotation: ${error instanceof Error ? error.message : "Unknown error"}`,
        ),
      }
    }
  },

  /**
   * Get all annotations for a specific version
   */
  async getAnnotationsByVersion(versionId: string): Promise<Result<Annotation[], DatabaseError>> {
    try {
      const annotations = await db.annotations.where("versionId").equals(versionId).toArray()
      return {success: true, data: annotations}
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(
          `Failed to get annotations: ${error instanceof Error ? error.message : "Unknown error"}`,
        ),
      }
    }
  },

  /**
   * Get annotations by version and page number
   */
  async getAnnotationsByVersionAndPage(
    versionId: string,
    pageNumber: number,
  ): Promise<Result<Annotation[], DatabaseError>> {
    try {
      const annotations = await db.annotations.where("[versionId+pageNumber]").equals([versionId, pageNumber]).toArray()
      return {success: true, data: annotations}
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(
          `Failed to get annotations by page: ${error instanceof Error ? error.message : "Unknown error"}`,
        ),
      }
    }
  },

  /**
   * Update an existing annotation
   */
  async updateAnnotation(id: string, updates: Partial<Annotation>): Promise<Result<void, DatabaseError>> {
    try {
      const annotation = await db.annotations.get(id)
      if (!annotation) {
        return {success: false, error: new AnnotationNotFoundError(id)}
      }

      const updateResult = await db.annotations.update(id, updates)

      if (updateResult === 0) {
        return {success: false, error: new AnnotationNotFoundError(id)}
      }

      return {success: true, data: undefined}
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(
          `Failed to update annotation: ${error instanceof Error ? error.message : "Unknown error"}`,
        ),
      }
    }
  },

  /**
   * Delete an annotation
   */
  async deleteAnnotation(id: string): Promise<Result<void, DatabaseError>> {
    try {
      const annotation = await db.annotations.get(id)
      if (!annotation) {
        return {success: false, error: new AnnotationNotFoundError(id)}
      }

      await db.annotations.delete(id)
      return {success: true, data: undefined}
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(
          `Failed to delete annotation: ${error instanceof Error ? error.message : "Unknown error"}`,
        ),
      }
    }
  },

  /**
   * Delete all annotations for a version
   */
  async deleteAnnotationsByVersion(versionId: string): Promise<Result<void, DatabaseError>> {
    try {
      await db.annotations.where("versionId").equals(versionId).delete()
      return {success: true, data: undefined}
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(
          `Failed to delete annotations by version: ${error instanceof Error ? error.message : "Unknown error"}`,
        ),
      }
    }
  },

  /**
   * Get annotation by ID
   */
  async getAnnotation(id: string): Promise<Result<Annotation | undefined, DatabaseError>> {
    try {
      const annotation = await db.annotations.get(id)
      return {success: true, data: annotation}
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(
          `Failed to get annotation: ${error instanceof Error ? error.message : "Unknown error"}`,
        ),
      }
    }
  },
}
