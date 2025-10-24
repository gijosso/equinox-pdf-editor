import {createAsyncThunk, createSlice} from "@reduxjs/toolkit"

import {documentService} from "@/lib/db/documents"
import type {NormalizedDocumentsState, PDFDocument, PDFDocumentMeta, PDFVersion} from "@/lib/types"

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
const addDocumentToState = (state: NormalizedDocumentsState, document: PDFDocumentMeta) => {
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

const updateDocumentInState = (
  state: NormalizedDocumentsState,
  documentId: string,
  updates: Partial<PDFDocumentMeta>,
) => {
  const document = state.documents.entities[documentId]
  if (document) {
    Object.assign(document, updates)
  }
}

export const loadDocuments = createAsyncThunk("documents/loadDocuments", async (_, {rejectWithValue}) => {
  const result = await documentService.getAllDocuments()

  if (!result.success) {
    return rejectWithValue(result.error.message)
  }

  return result.data
})

export const addDocument = createAsyncThunk("documents/addDocument", async (doc: PDFDocument, {rejectWithValue}) => {
  const result = await documentService.addDocument(doc)

  if (!result.success) {
    return rejectWithValue(result.error.message)
  }

  return doc
})

export const deleteDocument = createAsyncThunk("documents/deleteDocument", async (id: string, {rejectWithValue}) => {
  const result = await documentService.deleteDocument(id)

  if (!result.success) {
    return rejectWithValue(result.error.message)
  }

  return id
})

export const updateDocument = createAsyncThunk(
  "documents/updateDocument",
  async ({id, updates}: {id: string; updates: Partial<PDFDocumentMeta>}, {rejectWithValue}) => {
    const result = await documentService.updateDocument(id, updates)

    if (!result.success) {
      return rejectWithValue(result.error.message)
    }

    return {id, updates}
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
  },
})

export const {clearError} = documentsSlice.actions
export default documentsSlice.reducer
