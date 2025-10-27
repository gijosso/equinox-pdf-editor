import type {Annotation} from "../types"
import {AnnotationNotFoundError, DatabaseError, type Result, withDatabaseErrorHandling} from "../utils/error-handling"
import {db} from "./database"

export const annotationService = {
  async addAnnotation(annotation: Annotation): Promise<Result<string, DatabaseError>> {
    return withDatabaseErrorHandling(
      async () => {
        const id = await db.annotations.add(annotation)
        return id
      },
      {operation: "addAnnotation", annotationId: annotation.id},
    )
  },

  async getAnnotationsByVersion(versionId: string): Promise<Result<Annotation[], DatabaseError>> {
    return withDatabaseErrorHandling(
      async () => {
        const annotations = await db.annotations.where("versionId").equals(versionId).toArray()
        return annotations
      },
      {operation: "getAnnotationsByVersion", versionId},
    )
  },

  async getAnnotationsByVersionAndPage(
    versionId: string,
    pageNumber: number,
  ): Promise<Result<Annotation[], DatabaseError>> {
    return withDatabaseErrorHandling(
      async () => {
        const annotations = await db.annotations
          .where("[versionId+pageNumber]")
          .equals([versionId, pageNumber])
          .toArray()
        return annotations
      },
      {operation: "getAnnotationsByVersionAndPage", versionId, pageNumber},
    )
  },

  async updateAnnotation(id: string, updates: Partial<Annotation>): Promise<Result<void, DatabaseError>> {
    return withDatabaseErrorHandling(
      async () => {
        const annotation = await db.annotations.get(id)
        if (!annotation) {
          throw new AnnotationNotFoundError(id)
        }

        const updateResult = await db.annotations.update(id, updates)
        if (updateResult === 0) {
          throw new AnnotationNotFoundError(id)
        }
      },
      {operation: "updateAnnotation", annotationId: id},
    )
  },

  async deleteAnnotation(id: string): Promise<Result<void, DatabaseError>> {
    return withDatabaseErrorHandling(
      async () => {
        const annotation = await db.annotations.get(id)
        if (!annotation) {
          throw new AnnotationNotFoundError(id)
        }
        await db.annotations.delete(id)
      },
      {operation: "deleteAnnotation", annotationId: id},
    )
  },

  async deleteAnnotationsByVersion(versionId: string): Promise<Result<void, DatabaseError>> {
    return withDatabaseErrorHandling(
      async () => {
        await db.annotations.where("versionId").equals(versionId).delete()
      },
      {operation: "deleteAnnotationsByVersion", versionId},
    )
  },

  async getAnnotation(id: string): Promise<Result<Annotation | undefined, DatabaseError>> {
    return withDatabaseErrorHandling(
      async () => {
        const annotation = await db.annotations.get(id)
        return annotation
      },
      {operation: "getAnnotation", annotationId: id},
    )
  },
}
