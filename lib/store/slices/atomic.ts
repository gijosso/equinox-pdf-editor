import {createAsyncThunk} from "@reduxjs/toolkit"

import {atomicService} from "@/lib/db/atomic"
import type {PDFDocument, PDFDocumentWithBlob, PDFVersion} from "@/lib/types"

export const addDocumentWithVersion = createAsyncThunk(
  "atomic/addDocumentWithVersion",
  async ({document, version}: {document: PDFDocumentWithBlob; version: PDFVersion}, {rejectWithValue}) => {
    const result = await atomicService.addDocumentWithVersion(document, version)

    if (!result.success) {
      return rejectWithValue(result.error.message)
    }

    return {document, version}
  },
)

export const updateDocumentWithVersion = createAsyncThunk(
  "atomic/updateDocumentWithVersion",
  async (
    {
      documentId,
      documentUpdates,
      version,
    }: {
      documentId: string
      documentUpdates: Partial<PDFDocument>
      version: PDFVersion
    },
    {rejectWithValue},
  ) => {
    const result = await atomicService.updateDocumentWithVersion(documentId, documentUpdates, version)

    if (!result.success) {
      return rejectWithValue(result.error.message)
    }

    return {documentId, documentUpdates, version}
  },
)

export const deleteDocumentWithVersions = createAsyncThunk(
  "atomic/deleteDocumentWithVersions",
  async (documentId: string, {rejectWithValue}) => {
    const result = await atomicService.deleteDocumentWithVersions(documentId)

    if (!result.success) {
      return rejectWithValue(result.error.message)
    }

    return documentId
  },
)
