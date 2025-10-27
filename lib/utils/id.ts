/**
 * Utility functions for generating unique IDs
 */

export function generateDocumentId(): string {
  return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function generateVersionId(): string {
  return `ver_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function generateAnnotationId(): string {
  return `ann_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function generateEditorStateId(): string {
  return `editor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
