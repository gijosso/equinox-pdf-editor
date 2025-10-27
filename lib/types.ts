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

export interface PDFVersion {
  id: string
  documentId: string
  versionNumber: number
  message: string
  createdAt: string
  textContent?: string
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
  x: number
  y: number
  width: number
  height: number
  text?: string
  color?: string
  fontSize?: number
  originalId?: string // ID of the original annotation for diff comparison across versions
  committedVersionId?: string // Version number this annotation was committed from (for display)
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

  // Sidebar state
  annotationsViewMode: "all" | "grouped"
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
  annotationsViewMode: "all" | "grouped"
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

export interface TextSpan {
  text: string
  pageNumber: number
  x: number
  y: number
  width: number
  height: number
  index: number
}

export interface TextDiff {
  type: "equal" | "delete" | "insert"
  text: string
  spans?: TextSpan[]
}

export interface TextDiffResult {
  diffs: TextDiff[]
  totalChanges: number
  addedText: string
  removedText: string
}

export interface VersionDiffResult {
  textDiff: TextDiffResult
  annotationDiff: AnnotationDiff[]
  hasChanges: boolean
}
