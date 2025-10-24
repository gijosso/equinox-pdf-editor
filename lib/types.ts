export interface PDFDocument {
  id: string
  name: string
  blob: Blob
  createdAt: string
  updatedAt: string
  currentVersionId: string
  fileHash: string // SHA-256 hash of the file content
  thumbnail?: string // Added thumbnail data URL for preview
}

export interface PDFVersion {
  id: string
  documentId: string
  versionNumber: number
  message: string
  createdAt: string
  annotations: Annotation[]
  textContent?: string
}

export interface Annotation {
  id: string
  type: string
  pageNumber: number
  createdAt: string
  content: string
}
