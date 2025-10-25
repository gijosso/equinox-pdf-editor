// Normalized document metadata (without blob)
export interface PDFDocument {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  currentVersionId: string
  fileHash: string // SHA-256 hash of the file content
  thumbnail: string // Base64 encoded thumbnail
}

export interface PDFDocumentWithBlob extends PDFDocument {
  blob: Blob
}

// Normalized state structure
export interface NormalizedDocumentsState {
  documents: {
    entities: Record<string, PDFDocument>
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
  xfdf: string // XFDF string instead of JS objects
  textContent?: string
}

export interface Annotation {
  id: string
  type: string
  pageNumber: number
  createdAt: string
  content: string
  x?: number
  y?: number
  width?: number
  height?: number
  text?: string
  color?: string
  fontSize?: number
}

export interface AnnotationDiff {
  id: string
  type: "added" | "removed" | "modified"
  annotation: Annotation
  oldAnnotation?: Annotation
}
