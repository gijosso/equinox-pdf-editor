import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react"

import {atomicService} from "@/lib/db/atomic"
import {editorService} from "@/lib/db/editor"
import type {DocumentEditor, VersionEditor} from "@/lib/types"

export const editorApi = createApi({
  reducerPath: "editorApi",
  baseQuery: fetchBaseQuery({baseUrl: "/api/"}), // Not used since we're using local DB
  tagTypes: ["Editor"],
  keepUnusedDataFor: 60, // Keep unused data for 60 seconds
  endpoints: builder => ({
    getDocumentEditor: builder.query<DocumentEditor | undefined, string>({
      queryFn: async documentId => {
        const result = await atomicService.loadDocumentEditor(documentId)
        if (!result.success) {
          return {error: {status: "CUSTOM_ERROR", error: result.error.message}}
        }
        return {data: result.data}
      },
      providesTags: (result, error, documentId) => [{type: "Editor", id: `document-${documentId}`}],
    }),

    saveDocumentEditor: builder.mutation<null, {documentId: string; editor: DocumentEditor}>({
      queryFn: async args => {
        const {documentId, editor} = args
        const result = await editorService.saveDocumentEditor(documentId, editor)
        if (!result.success) {
          return {error: {status: "CUSTOM_ERROR", error: result.error.message}}
        }
        return {data: null}
      },
      invalidatesTags: (result, error, {documentId}) => [{type: "Editor", id: `document-${documentId}`}],
    }),

    getVersionEditor: builder.query<VersionEditor | undefined, string>({
      queryFn: async versionId => {
        const result = await atomicService.loadVersionEditor(versionId)
        if (!result.success) {
          return {error: {status: "CUSTOM_ERROR", error: result.error.message}}
        }
        return {data: result.data}
      },
      providesTags: (result, error, versionId) => [{type: "Editor", id: `version-${versionId}`}],
    }),

    saveVersionEditor: builder.mutation<null, {versionId: string; editor: VersionEditor}>({
      queryFn: async args => {
        const {versionId, editor} = args
        const result = await atomicService.saveVersionEditor(versionId, editor)
        if (!result.success) {
          return {error: {status: "CUSTOM_ERROR", error: result.error.message}}
        }
        return {data: null}
      },
      invalidatesTags: (result, error, {versionId}) => [{type: "Editor", id: `version-${versionId}`}],
    }),
  }),
})

export const {
  useGetDocumentEditorQuery,
  useSaveDocumentEditorMutation,
  useGetVersionEditorQuery,
  useSaveVersionEditorMutation,
} = editorApi
