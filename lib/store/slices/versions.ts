import {createAsyncThunk} from "@reduxjs/toolkit"

import {versionService} from "@/lib/db/versions"
import type {PDFVersion} from "@/lib/types"

export const loadVersions = createAsyncThunk("versions/loadVersions", async (documentId: string, {rejectWithValue}) => {
  const result = await versionService.getVersionsByDocument(documentId)

  if (!result.success) {
    return rejectWithValue(result.error.message)
  }

  return {documentId, versions: result.data}
})

export const addVersion = createAsyncThunk("versions/addVersion", async (version: PDFVersion, {rejectWithValue}) => {
  const result = await versionService.addVersion(version)

  if (!result.success) {
    return rejectWithValue(result.error.message)
  }

  return version
})

export const deleteVersion = createAsyncThunk("versions/deleteVersion", async (id: string, {rejectWithValue}) => {
  const result = await versionService.deleteVersion(id)

  if (!result.success) {
    return rejectWithValue(result.error.message)
  }

  return id
})
