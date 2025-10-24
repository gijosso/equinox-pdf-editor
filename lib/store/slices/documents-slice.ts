import {createAsyncThunk, createSlice} from "@reduxjs/toolkit"

import {dbHelpers} from "@/lib/db"
import type {PDFDocument, PDFVersion} from "@/lib/types"

interface DocumentsState {
  items: PDFDocument[]
  versions: Record<string, PDFVersion[]>
  loading: boolean
  error: string | null
}

const initialState: DocumentsState = {
  items: [],
  versions: {},
  loading: true,
  error: null,
}

export const loadDocuments = createAsyncThunk("documents/loadDocuments", async (_, {rejectWithValue}) => {
  const result = await dbHelpers.getAllDocuments()

  if (!result.success) {
    return rejectWithValue(result.error.message)
  }

  return result.data
})

export const addDocument = createAsyncThunk("documents/addDocument", async (doc: PDFDocument, {rejectWithValue}) => {
  const result = await dbHelpers.addDocument(doc)

  if (!result.success) {
    return rejectWithValue(result.error.message)
  }

  return doc
})

export const deleteDocument = createAsyncThunk("documents/deleteDocument", async (id: string, {rejectWithValue}) => {
  const result = await dbHelpers.deleteDocument(id)

  if (!result.success) {
    return rejectWithValue(result.error.message)
  }

  return id
})

export const loadVersions = createAsyncThunk(
  "documents/loadVersions",
  async (documentId: string, {rejectWithValue}) => {
    const result = await dbHelpers.getVersionsByDocument(documentId)

    if (!result.success) {
      return rejectWithValue(result.error.message)
    }

    return {documentId, versions: result.data}
  },
)

export const addVersion = createAsyncThunk("documents/addVersion", async (version: PDFVersion, {rejectWithValue}) => {
  const result = await dbHelpers.addVersion(version)

  if (!result.success) {
    return rejectWithValue(result.error.message)
  }

  return version
})

const documentsSlice = createSlice({
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
        state.items = action.payload
      })
      .addCase(loadDocuments.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Failed to load documents"
      })
      .addCase(addDocument.fulfilled, (state, action) => {
        state.items.unshift(action.payload)
      })
      .addCase(deleteDocument.fulfilled, (state, action) => {
        state.items = state.items.filter(doc => doc.id !== action.payload)
        delete state.versions[action.payload]
      })
      .addCase(loadVersions.fulfilled, (state, action) => {
        state.versions[action.payload.documentId] = action.payload.versions
      })
      .addCase(addVersion.fulfilled, (state, action) => {
        const {documentId} = action.payload

        if (!state.versions[documentId]) {
          state.versions[documentId] = []
        }

        state.versions[documentId].push(action.payload)

        const doc = state.items.find(d => d.id === documentId)

        if (doc) {
          doc.currentVersionId = action.payload.id
          doc.updatedAt = action.payload.createdAt
        }
      })
  },
})

export const {clearError} = documentsSlice.actions
export default documentsSlice.reducer
