import {annotationService} from "@/lib/db/annotations"
import type {Annotation} from "@/lib/types"

import {saveVersion} from "./version"

export interface VersionCommitOptions {
  documentId: string
  message: string
  annotations: Annotation[]
}

export interface VersionCommitResult {
  success: boolean
  versionId?: string
  versionNumber?: number
  error?: string
}

/**
 * Enhanced version management that preserves annotation history
 * and enables meaningful diff comparisons
 */
export class VersionManager {
  private static instance: VersionManager

  static getInstance(): VersionManager {
    if (!VersionManager.instance) {
      VersionManager.instance = new VersionManager()
    }
    return VersionManager.instance
  }

  /**
   * Commit a new version with annotation changes only (non-destructive)
   * Committed annotations become locked and cannot be modified
   */
  async commitVersion(options: VersionCommitOptions): Promise<VersionCommitResult> {
    const {documentId, message, annotations} = options

    try {
      const result = await saveVersion({
        documentId,
        message,
        annotations,
      })

      return {
        success: result.success,
        versionId: result.versionId,
        versionNumber: result.versionNumber,
        error: result.error,
      }
    } catch (error) {
      console.error("Failed to commit version:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }
    }
  }

  /**
   * Get annotation history for a version
   */
  async getVersionAnnotationHistory(versionId: string): Promise<Annotation[]> {
    const result = await annotationService.getAnnotationsByVersion(versionId)
    return result.success ? result.data : []
  }

  /**
   * Compare annotation changes between two versions using originalId for consistent comparison
   */
  async compareAnnotationChanges(
    versionId1: string,
    versionId2: string,
  ): Promise<{
    added: Annotation[]
    removed: Annotation[]
    modified: Array<{old: Annotation; new: Annotation}>
  }> {
    const [annotations1, annotations2] = await Promise.all([
      this.getVersionAnnotationHistory(versionId1),
      this.getVersionAnnotationHistory(versionId2),
    ])

    const added: Annotation[] = []
    const removed: Annotation[] = []
    const modified: Array<{old: Annotation; new: Annotation}> = []

    // Helper function to check if annotations are functionally different
    const areAnnotationsDifferent = (ann1: Annotation, ann2: Annotation) => {
      // Compare only the relevant properties that matter for display
      return (
        ann1.x !== ann2.x ||
        ann1.y !== ann2.y ||
        ann1.width !== ann2.width ||
        ann1.height !== ann2.height ||
        ann1.content !== ann2.content ||
        ann1.text !== ann2.text ||
        ann1.color !== ann2.color ||
        ann1.fontSize !== ann2.fontSize ||
        ann1.type !== ann2.type ||
        ann1.pageNumber !== ann2.pageNumber
      )
    }

    // Find added annotations (new originalIds in version2)
    annotations2.forEach(ann2 => {
      const found = annotations1.find(ann1 => ann1.originalId === ann2.originalId)
      if (!found) {
        added.push(ann2)
      } else if (areAnnotationsDifferent(found, ann2)) {
        modified.push({old: found, new: ann2})
      }
    })

    // Find removed annotations (originalIds that exist in version1 but not in version2)
    annotations1.forEach(ann1 => {
      const found = annotations2.find(ann2 => ann2.originalId === ann1.originalId)
      if (!found) {
        removed.push(ann1)
      }
    })

    return {added, removed, modified}
  }
}

export const versionManager = VersionManager.getInstance()
