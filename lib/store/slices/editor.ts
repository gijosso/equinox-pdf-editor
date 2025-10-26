import {type PayloadAction, createSlice} from "@reduxjs/toolkit"

import type {Annotation, DocumentEditorState, EditorState, EditorTool, SearchResult} from "@/lib/types"

const initialState: EditorState = {
  byDocument: {},
  documentId: null,
  loading: false,
  error: null,
}

export const defaultDocumentEditorState = (documentId: string): DocumentEditorState => ({
  documentId,
  isEditing: false,
  selectedAnnotations: [],
  viewport: {x: 0, y: 0, zoom: 1},
  activeTool: {type: "select"},
  sidebarOpen: true,
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
    openDocument: (state, action: PayloadAction<string>) => {
      const documentId = action.payload
      state.documentId = documentId

      // Initialize editor state for document if it doesn't exist
      if (!state.byDocument[documentId]) {
        state.byDocument[documentId] = defaultDocumentEditorState(documentId)
      }

      // Set as editing
      state.byDocument[documentId].isEditing = true
    },

    closeDocument: (state, action: PayloadAction<{documentId: string}>) => {
      const {documentId} = action.payload
      if (state.byDocument[documentId]) {
        state.byDocument[documentId].isEditing = false
      }

      if (state.documentId === documentId) {
        state.documentId = null
      }
    },

    updateZoom: (state, action: PayloadAction<{documentId: string; zoom: number}>) => {
      const {documentId, zoom} = action.payload
      if (state.byDocument[documentId]) {
        state.byDocument[documentId].viewport.zoom = zoom
      }
    },

    setActiveTool: (state, action: PayloadAction<{documentId: string; tool: EditorTool}>) => {
      const {documentId, tool} = action.payload
      if (state.byDocument[documentId]) {
        state.byDocument[documentId].activeTool = tool
      }
    },

    toggleSidebar: (state, action: PayloadAction<string>) => {
      const documentId = action.payload
      if (state.byDocument[documentId]) {
        state.byDocument[documentId].sidebarOpen = !state.byDocument[documentId].sidebarOpen
      }
    },

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

    addAnnotation: (state, action: PayloadAction<{documentId: string; annotation: Annotation}>) => {
      const {documentId, annotation} = action.payload
      if (state.byDocument[documentId]) {
        state.byDocument[documentId].annotations.push(annotation)
        state.byDocument[documentId].hasUnsavedChanges = true
      }
    },

    updateAnnotation: (
      state,
      action: PayloadAction<{documentId: string; id: string; updates: Partial<Annotation>}>,
    ) => {
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

    setAnnotations: (state, action: PayloadAction<{documentId: string; annotations: Annotation[]}>) => {
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

    setSearchResults: (state, action: PayloadAction<{documentId: string; results: SearchResult[]}>) => {
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
  updateZoom,
  setActiveTool,
  toggleSidebar,
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
