export interface NormalizedState {
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

export interface PDFVersion {
  id: string
  documentId: string
  versionNumber: number
  message: string
  createdAt: string
  xfdf: string // XFDF string instead of JS objects
  textContent?: string
  blob: Blob // PDF blob with annotations applied
}

export type AnnotationType = "highlight" | "note" | "redaction"
export interface Annotation {
  id: string
  versionId: string // Reference to the version this annotation belongs to
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

export interface DocumentEditor {
  documentId: string
  currentVersionId: string | null // Track current version
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

export interface VersionEditor {
  versionId: string
  annotations: Annotation[]
}

export interface Editor {
  documentId: string | null
  byDocument: Record<string, DocumentEditor>
  byVersion: Record<string, VersionEditor> // Store annotations by version
  loading: boolean
  error: string | null
}

export interface EditorRecord {
  id: string // documentId
  documentId: string
  currentVersionId: string | null
  isEditing: boolean
  selectedAnnotations: string[]
  viewport: EditorViewport
  activeTool: EditorTool
  sidebarOpen: boolean
  lastSaved?: string
  hasUnsavedChanges: boolean
  currentPage: number
  totalPages: number
  searchQuery: string
  searchResults: SearchResult[]
  currentSearchIndex: number
  history: any[]
  historyIndex: number
  isDiffMode: boolean
  compareVersionIds: string[]
  createdAt: string
  updatedAt: string
}

export interface VersionEditorRecord {
  id: string // versionId
  versionId: string
  annotations: Annotation[]
  createdAt: string
  updatedAt: string
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
