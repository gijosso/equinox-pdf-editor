import {type PayloadAction, createSlice} from "@reduxjs/toolkit"

export interface EditorViewport {
  x: number
  y: number
  zoom: number
}

export interface EditorTool {
  type: "select" | "highlight" | "note" | "draw" | "erase"
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
  annotationsVisible: boolean
  gridVisible: boolean
  snapToGrid: boolean
  lastSaved?: string
  hasUnsavedChanges: boolean

  // PDF-specific state
  currentPage: number
  totalPages: number
  annotations: any[]

  // Search state
  searchQuery: string
  searchResults: any[]
  currentSearchIndex: number

  // History state
  history: any[]
  historyIndex: number

  // Diff mode state
  isDiffMode: boolean
  compareVersionIds: string[]
}

export interface EditorState {
  // Per-document editor state
  byDocument: Record<string, DocumentEditorState>

  // Global editor state
  activeDocumentId: string | null
  isLoading: boolean
  error: string | null
}

const initialState: EditorState = {
  byDocument: {},
  activeDocumentId: null,
  isLoading: false,
  error: null,
}

const defaultDocumentEditorState = (documentId: string): DocumentEditorState => ({
  documentId,
  isEditing: false,
  selectedAnnotations: [],
  viewport: {x: 0, y: 0, zoom: 1},
  activeTool: {type: "select"},
  sidebarOpen: true,
  annotationsVisible: true,
  gridVisible: false,
  snapToGrid: false,
  hasUnsavedChanges: false,

  // PDF-specific state
  currentPage: 1,
  totalPages: 0,
  annotations: [],

  // Search state
  searchQuery: "",
  searchResults: [],
  currentSearchIndex: 0,

  // History state
  history: [],
  historyIndex: 0,

  // Diff mode state
  isDiffMode: false,
  compareVersionIds: [],
})

export const editorSlice = createSlice({
  name: "editor",
  initialState,
  reducers: {
    // Document management
    openDocument: (state, action: PayloadAction<string>) => {
      const documentId = action.payload
      state.activeDocumentId = documentId

      // Initialize editor state for document if it doesn't exist
      if (!state.byDocument[documentId]) {
        state.byDocument[documentId] = defaultDocumentEditorState(documentId)
      }

      // Set as editing
      state.byDocument[documentId].isEditing = true
    },

    closeDocument: (state, action: PayloadAction<string>) => {
      const documentId = action.payload
      if (state.byDocument[documentId]) {
        state.byDocument[documentId].isEditing = false
      }

      if (state.activeDocumentId === documentId) {
        state.activeDocumentId = null
      }
    },

    clearDocumentState: (state, action: PayloadAction<string>) => {
      const documentId = action.payload
      delete state.byDocument[documentId]

      if (state.activeDocumentId === documentId) {
        state.activeDocumentId = null
      }
    },

    // Viewport management
    setViewport: (state, action: PayloadAction<{documentId: string; viewport: EditorViewport}>) => {
      const {documentId, viewport} = action.payload
      if (state.byDocument[documentId]) {
        state.byDocument[documentId].viewport = viewport
      }
    },

    updateZoom: (state, action: PayloadAction<{documentId: string; zoom: number}>) => {
      const {documentId, zoom} = action.payload
      if (state.byDocument[documentId]) {
        state.byDocument[documentId].viewport.zoom = zoom
      }
    },

    // Tool management
    setActiveTool: (state, action: PayloadAction<{documentId: string; tool: EditorTool}>) => {
      const {documentId, tool} = action.payload
      if (state.byDocument[documentId]) {
        state.byDocument[documentId].activeTool = tool
      }
    },

    // UI state management
    toggleSidebar: (state, action: PayloadAction<string>) => {
      const documentId = action.payload
      if (state.byDocument[documentId]) {
        state.byDocument[documentId].sidebarOpen = !state.byDocument[documentId].sidebarOpen
      }
    },

    setSidebarOpen: (state, action: PayloadAction<{documentId: string; open: boolean}>) => {
      const {documentId, open} = action.payload
      if (state.byDocument[documentId]) {
        state.byDocument[documentId].sidebarOpen = open
      }
    },

    toggleAnnotations: (state, action: PayloadAction<string>) => {
      const documentId = action.payload
      if (state.byDocument[documentId]) {
        state.byDocument[documentId].annotationsVisible = !state.byDocument[documentId].annotationsVisible
      }
    },

    toggleGrid: (state, action: PayloadAction<string>) => {
      const documentId = action.payload
      if (state.byDocument[documentId]) {
        state.byDocument[documentId].gridVisible = !state.byDocument[documentId].gridVisible
      }
    },

    toggleSnapToGrid: (state, action: PayloadAction<string>) => {
      const documentId = action.payload
      if (state.byDocument[documentId]) {
        state.byDocument[documentId].snapToGrid = !state.byDocument[documentId].snapToGrid
      }
    },

    // PDF-specific actions
    setCurrentPage: (state, action: PayloadAction<{documentId: string; page: number}>) => {
      const {documentId, page} = action.payload
      if (state.byDocument[documentId]) {
        state.byDocument[documentId].currentPage = page
      }
    },

    setTotalPages: (state, action: PayloadAction<{documentId: string; totalPages: number}>) => {
      const {documentId, totalPages} = action.payload
      if (state.byDocument[documentId]) {
        state.byDocument[documentId].totalPages = totalPages
      }
    },

    addAnnotation: (state, action: PayloadAction<{documentId: string; annotation: any}>) => {
      const {documentId, annotation} = action.payload
      if (state.byDocument[documentId]) {
        state.byDocument[documentId].annotations.push(annotation)
        state.byDocument[documentId].hasUnsavedChanges = true
      }
    },

    updateAnnotation: (state, action: PayloadAction<{documentId: string; id: string; updates: any}>) => {
      const {documentId, id, updates} = action.payload
      if (state.byDocument[documentId]) {
        const annotationIndex = state.byDocument[documentId].annotations.findIndex(a => a.id === id)
        if (annotationIndex !== -1) {
          state.byDocument[documentId].annotations[annotationIndex] = {
            ...state.byDocument[documentId].annotations[annotationIndex],
            ...updates,
          }
          state.byDocument[documentId].hasUnsavedChanges = true
        }
      }
    },

    deleteAnnotation: (state, action: PayloadAction<{documentId: string; id: string}>) => {
      const {documentId, id} = action.payload
      if (state.byDocument[documentId]) {
        state.byDocument[documentId].annotations = state.byDocument[documentId].annotations.filter(a => a.id !== id)
        state.byDocument[documentId].hasUnsavedChanges = true
      }
    },

    setAnnotations: (state, action: PayloadAction<{documentId: string; annotations: any[]}>) => {
      const {documentId, annotations} = action.payload
      if (state.byDocument[documentId]) {
        state.byDocument[documentId].annotations = annotations
      }
    },

    // Search actions
    setSearchQuery: (state, action: PayloadAction<{documentId: string; query: string}>) => {
      const {documentId, query} = action.payload
      if (state.byDocument[documentId]) {
        state.byDocument[documentId].searchQuery = query
      }
    },

    setSearchResults: (state, action: PayloadAction<{documentId: string; results: any[]}>) => {
      const {documentId, results} = action.payload
      if (state.byDocument[documentId]) {
        state.byDocument[documentId].searchResults = results
        state.byDocument[documentId].currentSearchIndex = 0
      }
    },

    nextSearchResult: (state, action: PayloadAction<string>) => {
      const documentId = action.payload
      if (state.byDocument[documentId] && state.byDocument[documentId].searchResults.length > 0) {
        state.byDocument[documentId].currentSearchIndex =
          (state.byDocument[documentId].currentSearchIndex + 1) % state.byDocument[documentId].searchResults.length
      }
    },

    prevSearchResult: (state, action: PayloadAction<string>) => {
      const documentId = action.payload
      if (state.byDocument[documentId] && state.byDocument[documentId].searchResults.length > 0) {
        state.byDocument[documentId].currentSearchIndex =
          (state.byDocument[documentId].currentSearchIndex - 1 + state.byDocument[documentId].searchResults.length) %
          state.byDocument[documentId].searchResults.length
      }
    },

    clearSearch: (state, action: PayloadAction<string>) => {
      const documentId = action.payload
      if (state.byDocument[documentId]) {
        state.byDocument[documentId].searchQuery = ""
        state.byDocument[documentId].searchResults = []
        state.byDocument[documentId].currentSearchIndex = 0
      }
    },

    // History actions
    jumpToHistory: (state, action: PayloadAction<{documentId: string; index: number}>) => {
      const {documentId, index} = action.payload
      if (state.byDocument[documentId]) {
        state.byDocument[documentId].historyIndex = index
      }
    },

    // Diff mode actions
    toggleDiffMode: (state, action: PayloadAction<string>) => {
      const documentId = action.payload
      if (state.byDocument[documentId]) {
        state.byDocument[documentId].isDiffMode = !state.byDocument[documentId].isDiffMode
      }
    },

    setCompareVersions: (state, action: PayloadAction<{documentId: string; versionIds: string[]}>) => {
      const {documentId, versionIds} = action.payload
      if (state.byDocument[documentId]) {
        state.byDocument[documentId].compareVersionIds = versionIds
      }
    },
  },
})

export const {
  openDocument,
  closeDocument,
  clearDocumentState,
  setViewport,
  updateZoom,
  setActiveTool,
  toggleSidebar,
  setSidebarOpen,
  toggleAnnotations,
  toggleGrid,
  toggleSnapToGrid,
  // PDF-specific actions
  setCurrentPage,
  setTotalPages,
  addAnnotation,
  updateAnnotation,
  deleteAnnotation,
  setAnnotations,
  // Search actions
  setSearchQuery,
  setSearchResults,
  nextSearchResult,
  prevSearchResult,
  clearSearch,
  // History actions
  jumpToHistory,
  // Diff mode actions
  toggleDiffMode,
  setCompareVersions,
} = editorSlice.actions

export default editorSlice.reducer
