export interface PDFDocument {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  currentVersionId: string
  latestVersionId: string
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

export interface Edit {
  id: string
  versionId: string
  type:
    | "annotation_added"
    | "annotation_updated"
    | "annotation_deleted"
    | "annotation_moved"
    | "annotation_resized"
    | "annotation_text_changed"
    | "text_inserted"
    | "text_deleted"
    | "text_replaced"
    | "text_edit_deleted"
  annotationId?: string
  textEditId?: string // For text edits that aren't annotations
  timestamp: string
  data?: any // Additional data for the edit
}

export type Rect = {x: number; y: number; width: number; height: number}
export type CreatedUpdated = {createdAt: string; updatedAt: string}
export type DiffType = "added" | "removed" | "modified" | "untouched"
export type ViewMode = "all" | "grouped"

export type PositionedContent = Rect & {pageNumber: number} & CreatedUpdated

export type DiffItem = Rect & {
  id: string
  pageNumber: number
  annotationType: DiffType
}

export interface Annotation extends PositionedContent {
  id: string
  versionId: string // Reference to the version this annotation belongs to
  type: "highlight" | "note" | "redaction"
  content: string
  text?: string
  color?: string
  fontSize?: number
  originalId?: string // ID of the original annotation for diff comparison across versions
  committedVersionId?: string // Version number this annotation was committed from (for display)
}

export interface AnnotationDiff {
  id: string
  type: DiffType
  annotation: Annotation
  oldAnnotation?: Annotation
}

export interface EditorViewport {
  x: number
  y: number
  zoom: number
}

export interface EditorTool {
  type: "select" | "highlight" | "note" | "redaction" | "text_edit"
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
  annotationsViewMode: ViewMode
  textEditsViewMode: ViewMode
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
  currentPage: number
  totalPages: number
  searchQuery: string
  searchResults: SearchResult[]
  currentSearchIndex: number
  history: any[]
  historyIndex: number
  isDiffMode: boolean
  compareVersionIds: string[]
  annotationsViewMode: ViewMode
  textEditsViewMode: ViewMode
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
  fontFamily?: string
  fontSize?: number
  fontWeight?: string | number
  color?: string
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

// Text editing specific types
export interface TextEdit extends PositionedContent {
  id: string
  versionId: string
  originalText: string
  newText: string
  fontFamily?: string
  fontSize?: number
  fontWeight?: string | number
  color?: string
  operation?: TextEditOperation["type"]
  originalId?: string // ID of the original text edit for diff comparison across versions
  committedVersionId?: string // Version this text edit was committed from
}

export interface FontInfo {
  fontFamily: string
  fontSize: number
  fontWeight: string | number
  fontStyle?: string
  color?: string
  kerning?: number
  letterSpacing?: number
  lineHeight?: number
}

export interface TextSelection {
  pageNumber: number
  startX: number
  startY: number
  endX: number
  endY: number
  text: string
  fontInfo: FontInfo
  textSpans: TextSpan[]
}

export interface TextEditOperation {
  type: "insert" | "delete" | "replace"
  selection: TextSelection
  newText?: string
  fontInfo?: FontInfo
}
