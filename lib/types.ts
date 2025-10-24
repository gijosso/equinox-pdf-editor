// Normalized document metadata (without blob)
export interface PDFDocumentMeta {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  currentVersionId: string
  fileHash: string // SHA-256 hash of the file content
  thumbnail?: string // Added thumbnail data URL for preview
}

// Full document with blob (for database operations)
export interface PDFDocument extends PDFDocumentMeta {
  blob: Blob
}

// Normalized state structure
export interface NormalizedDocumentsState {
  documents: {
    entities: Record<string, PDFDocumentMeta>
    ids: string[]
  }
  versions: {
    entities: Record<string, PDFVersion>
    ids: string[]
    byDocument: Record<string, string[]> // documentId -> versionIds[]
  }
  loading: boolean
  error: string | null
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
