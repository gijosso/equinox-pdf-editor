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

export type AnnotationType = "highlight" | "note" | "redaction"
export interface Annotation {
  id: string
  type: AnnotationType
  pageNumber: number
  createdAt: string
  updatedAt: string
  content: string
  // Position and dimensions (in PDF coordinates)
  x: number
  y: number
  width: number
  height: number
  // Annotation-specific properties
  text?: string // For text annotations
  color?: string // For highlight/redaction color
  fontSize?: number // For text annotations
  // XFDF-specific properties
  xfdfType: "highlight" | "text" | "redaction" // Standard XFDF annotation types
  quadPoints?: number[] // For highlight annotations (4 points defining the highlighted area)
}

export type AnnotationDiffType = "added" | "removed" | "modified"
export interface AnnotationDiff {
  id: string
  type: AnnotationDiffType
  annotation: Annotation
  oldAnnotation?: Annotation
}

export interface EditorViewport {
  x: number
  y: number
  zoom: number
}

export type EditorToolType = "select" | "highlight" | "note" | "redaction"
export interface EditorTool {
  type: EditorToolType
  color?: string
  size?: number
}

export interface DocumentEditorState {
  documentId: string
  isEditing: boolean
  selectedAnnotations: string[]
  viewport: EditorViewport
  activeTool: EditorTool
  sidebarOpen: boolean
  lastSaved?: string
  hasUnsavedChanges: boolean

  // PDF-specific state
  currentPage: number
  totalPages: number
  annotations: Annotation[]

  // Search state
  searchQuery: string
  searchResults: SearchResult[]
  currentSearchIndex: number

  // History state
  history: any[]
  historyIndex: number

  // Diff mode state
  isDiffMode: boolean
  compareVersionIds: string[]
}

export interface EditorState {
  documentId: string | null
  byDocument: Record<string, DocumentEditorState>
  loading: boolean
  error: string | null
}

export interface SearchResult {
  pageNumber: number
  x: number
  y: number
  width: number
  height: number
  text: string
  index: number
}
