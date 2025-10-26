import {createAsyncThunk, createSlice} from "@reduxjs/toolkit"

import {atomicService} from "@/lib/db/atomic"
import {documentService} from "@/lib/db/documents"
import type {NormalizedDocumentsState, PDFDocument, PDFDocumentWithBlob, PDFVersion} from "@/lib/types"

import {addDocumentWithVersion, deleteDocumentWithVersions, updateDocumentWithVersion} from "./atomic"
import {loadVersions} from "./versions"

const initialState: NormalizedDocumentsState = {
  documents: {
    entities: {},
    ids: [],
  },
  versions: {
    entities: {},
    ids: [],
    byDocument: {},
  },
  loading: true,
  error: null,
}

// Helper functions for normalized state updates
const addDocumentToState = (state: NormalizedDocumentsState, document: PDFDocument) => {
  state.documents.entities[document.id] = document
  if (!state.documents.ids.includes(document.id)) {
    state.documents.ids.unshift(document.id)
  }
}

const removeDocumentFromState = (state: NormalizedDocumentsState, documentId: string) => {
  delete state.documents.entities[documentId]
  state.documents.ids = state.documents.ids.filter(id => id !== documentId)
  delete state.versions.byDocument[documentId]
}

const updateDocumentInState = (state: NormalizedDocumentsState, documentId: string, updates: Partial<PDFDocument>) => {
  const document = state.documents.entities[documentId]
  if (document) {
    Object.assign(document, updates)
  }
}

const addVersionToState = (state: NormalizedDocumentsState, version: PDFVersion) => {
  state.versions.entities[version.id] = version
  if (!state.versions.ids.includes(version.id)) {
    state.versions.ids.push(version.id)
  }

  // Add to document's version list
  if (!state.versions.byDocument[version.documentId]) {
    state.versions.byDocument[version.documentId] = []
  }
  if (!state.versions.byDocument[version.documentId].includes(version.id)) {
    state.versions.byDocument[version.documentId].push(version.id)
  }
}

const removeVersionFromState = (state: NormalizedDocumentsState, versionId: string) => {
  const version = state.versions.entities[versionId]
  if (version) {
    delete state.versions.entities[versionId]
    state.versions.ids = state.versions.ids.filter(id => id !== versionId)

    // Remove from document's version list
    if (state.versions.byDocument[version.documentId]) {
      state.versions.byDocument[version.documentId] = state.versions.byDocument[version.documentId].filter(
        id => id !== versionId,
      )
    }
  }
}

export const loadDocuments = createAsyncThunk("documents/loadDocuments", async (_, {rejectWithValue}) => {
  const result = await documentService.getAllDocuments()

  if (!result.success) {
    return rejectWithValue(result.error.message)
  }

  return result.data
})

export const addDocument = createAsyncThunk(
  "documents/addDocument",
  async (doc: PDFDocumentWithBlob, {rejectWithValue}) => {
    const result = await documentService.addDocument(doc)

    if (!result.success) {
      return rejectWithValue(result.error.message)
    }

    // Return metadata only (without blob) for Redux state
    const {blob, ...metadata} = doc
    return metadata
  },
)

export const deleteDocument = createAsyncThunk("documents/deleteDocument", async (id: string, {rejectWithValue}) => {
  const result = await documentService.deleteDocument(id)

  if (!result.success) {
    return rejectWithValue(result.error.message)
  }

  return id
})

export const updateDocument = createAsyncThunk(
  "documents/updateDocument",
  async ({id, updates}: {id: string; updates: Partial<PDFDocument>}, {rejectWithValue}) => {
    const result = await documentService.updateDocument(id, updates)

    if (!result.success) {
      return rejectWithValue(result.error.message)
    }

    return {id, updates}
  },
)

export const loadDocumentWithVersions = createAsyncThunk(
  "documents/loadDocumentWithVersions",
  async (documentId: string, {rejectWithValue}) => {
    const result = await atomicService.loadDocumentWithVersions(documentId)
    if (!result.success) {
      return rejectWithValue(result.error.message)
    }

    return {documentId, document: result.data.document, versions: result.data.versions}
  },
)

export const documentsSlice = createSlice({
  name: "documents",
  initialState,
  reducers: {
    clearError: state => {
      state.error = null
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loadDocuments.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(loadDocuments.fulfilled, (state, action) => {
        state.loading = false
        // Reset and populate documents
        state.documents.entities = {}
        state.documents.ids = []
        action.payload.forEach(doc => addDocumentToState(state, doc))
      })
      .addCase(loadDocuments.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Failed to load documents"
      })
      .addCase(addDocument.fulfilled, (state, action) => {
        addDocumentToState(state, action.payload)
      })
      .addCase(deleteDocument.fulfilled, (state, action) => {
        removeDocumentFromState(state, action.payload)
      })
      .addCase(updateDocument.fulfilled, (state, action) => {
        const {id, updates} = action.payload
        updateDocumentInState(state, id, updates)
      })
      // Handle atomic actions
      .addCase(addDocumentWithVersion.fulfilled, (state, action) => {
        const {document, version} = action.payload
        // Remove blob from document before storing in Redux
        const {blob, ...documentWithoutBlob} = document
        addDocumentToState(state, documentWithoutBlob)
        addVersionToState(state, version)
      })
      .addCase(updateDocumentWithVersion.fulfilled, (state, action) => {
        const {documentId, documentUpdates, version} = action.payload
        updateDocumentInState(state, documentId, documentUpdates)
        addVersionToState(state, version)
      })
      .addCase(deleteDocumentWithVersions.fulfilled, (state, action) => {
        const documentId = action.payload
        removeDocumentFromState(state, documentId)
        removeVersionFromState(state, documentId)
      })
      // Handle version loading
      .addCase(loadVersions.fulfilled, (state, action) => {
        const {documentId, versions} = action.payload
        // Clear existing versions for this document
        const existingVersionIds = state.versions.byDocument[documentId] || []
        existingVersionIds.forEach(versionId => {
          delete state.versions.entities[versionId]
          const index = state.versions.ids.indexOf(versionId)
          if (index > -1) {
            state.versions.ids.splice(index, 1)
          }
        })
        // Add new versions
        versions.forEach(version => addVersionToState(state, version))
      })
      // Handle atomic document with versions loading
      .addCase(loadDocumentWithVersions.fulfilled, (state, action) => {
        const {documentId, document, versions} = action.payload
        // Remove blob from document before storing in Redux
        const {blob, ...documentWithoutBlob} = document
        addDocumentToState(state, documentWithoutBlob)

        // Clear existing versions for this document
        const existingVersionIds = state.versions.byDocument[documentId] || []
        existingVersionIds.forEach(versionId => {
          delete state.versions.entities[versionId]
          const index = state.versions.ids.indexOf(versionId)
          if (index > -1) {
            state.versions.ids.splice(index, 1)
          }
        })
        // Add new versions
        versions.forEach(version => addVersionToState(state, version))
      })
  },
})

export const {clearError} = documentsSlice.actions
export default documentsSlice.reducer
