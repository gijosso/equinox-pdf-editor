import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react"

import {db} from "@/lib/db/database"
import {textEditService} from "@/lib/db/text-edits"
import {store} from "@/lib/store"
import type {TextEdit} from "@/lib/types"

import {editsApi} from "./edits"

export const textEditsApi = createApi({
  reducerPath: "textEditsApi",
  baseQuery: fetchBaseQuery({baseUrl: "/api/"}), // Not used since we're using local DB
  tagTypes: ["TextEdit"],
  keepUnusedDataFor: 60, // Keep unused data for 60 seconds
  endpoints: builder => ({
    getTextEditsByVersion: builder.query<TextEdit[], string>({
      queryFn: async versionId => {
        const result = await textEditService.getTextEditsByVersion(versionId)
        if (!result.success) {
          return {error: {status: "CUSTOM_ERROR", error: result.error?.message || "Unknown error"}}
        }
        return {data: result.data || []}
      },
      providesTags: (result, error, versionId) => [
        {type: "TextEdit", id: `version-${versionId}`},
        ...(result || []).map(({id}) => ({type: "TextEdit" as const, id})),
      ],
    }),

    getTextEditsByPage: builder.query<TextEdit[], {versionId: string; pageNumber: number}>({
      queryFn: async ({versionId, pageNumber}) => {
        const result = await textEditService.getTextEditsByPage(versionId, pageNumber)
        if (!result.success) {
          return {error: {status: "CUSTOM_ERROR", error: result.error?.message || "Unknown error"}}
        }
        return {data: result.data || []}
      },
      providesTags: (result, error, {versionId, pageNumber}) => [
        {type: "TextEdit", id: `version-${versionId}-page-${pageNumber}`},
        ...(result || []).map(({id}) => ({type: "TextEdit" as const, id})),
      ],
    }),

    addTextEdit: builder.mutation<
      string,
      {
        versionId: string
        pageNumber: number
        originalText: string
        newText: string
        x: number
        y: number
        width: number
        height: number
        fontFamily?: string
        fontSize?: number
        fontWeight?: string | number
        color?: string
        operation?: "insert" | "delete" | "replace"
      }
    >({
      queryFn: async args => {
        const result = await textEditService.addTextEdit(args)
        if (!result.success) {
          return {error: {status: "CUSTOM_ERROR", error: result.error?.message || "Unknown error"}}
        }
        return {data: result.data || ""}
      },
      invalidatesTags: (result, error, {versionId, pageNumber}) => [
        {type: "TextEdit", id: `version-${versionId}`},
        {type: "TextEdit", id: `version-${versionId}-page-${pageNumber}`},
      ],
      async onQueryStarted(args, {dispatch, queryFulfilled}) {
        try {
          const result = await queryFulfilled
          const textEditId = result.data

          // Determine the edit type based on operation
          let editType: "text_inserted" | "text_deleted" | "text_replaced"
          switch (args.operation) {
            case "insert":
              editType = "text_inserted"
              break
            case "delete":
              editType = "text_deleted"
              break
            case "replace":
            default:
              editType = "text_replaced"
              break
          }

          // Track edit for text edit addition
          await store
            .dispatch(
              editsApi.endpoints.addEdit.initiate({
                versionId: args.versionId,
                type: editType,
                textEditId: textEditId,
                data: {
                  pageNumber: args.pageNumber,
                  originalText: args.originalText,
                  newText: args.newText,
                  operation: args.operation,
                },
              }),
            )
            .unwrap()
        } catch (error) {
          console.error("Failed to track text edit addition:", error)
        }
      },
    }),

    updateTextEdit: builder.mutation<null, {id: string; updates: Partial<TextEdit>}>({
      queryFn: async ({id, updates}) => {
        const result = await textEditService.updateTextEdit(id, updates)
        if (!result.success) {
          return {error: {status: "CUSTOM_ERROR", error: result.error?.message || "Unknown error"}}
        }
        return {data: null}
      },
      invalidatesTags: (result, error, {id}) => [{type: "TextEdit", id}],
    }),

    deleteTextEdit: builder.mutation<null, {id: string; versionId: string}>({
      queryFn: async ({id, versionId}) => {
        const result = await textEditService.deleteTextEdit(id)
        if (!result.success) {
          return {error: {status: "CUSTOM_ERROR", error: result.error?.message || "Unknown error"}}
        }
        return {data: null}
      },
      invalidatesTags: (result, error, {id, versionId}) => [
        {type: "TextEdit", id},
        {type: "TextEdit", id: `version-${versionId}`},
      ],
      async onQueryStarted({id, versionId}, {dispatch, queryFulfilled}) {
        try {
          await queryFulfilled

          // Track edit for text edit deletion
          await store
            .dispatch(
              editsApi.endpoints.addEdit.initiate({
                versionId,
                type: "text_edit_deleted",
                textEditId: id,
                data: {deletedAt: new Date().toISOString()},
              }),
            )
            .unwrap()
        } catch (error) {
          console.error("Failed to track text edit deletion:", error)
        }
      },
    }),

    deleteTextEditsByVersion: builder.mutation<null, string>({
      queryFn: async versionId => {
        try {
          await textEditService.deleteTextEditsByVersion(versionId)
          return {data: null}
        } catch (error) {
          console.error("Delete error:", error)
          return {error: {status: "CUSTOM_ERROR", error: "Failed to delete text edits"}}
        }
      },
      invalidatesTags: (result, error, versionId) => [{type: "TextEdit", id: `version-${versionId}`}],
    }),

    hasTextEdits: builder.query<boolean, string>({
      queryFn: async versionId => {
        const result = await textEditService.hasTextEdits(versionId)
        if (!result.success) {
          return {error: {status: "CUSTOM_ERROR", error: result.error?.message || "Unknown error"}}
        }
        return {data: result.data || false}
      },
      providesTags: (result, error, versionId) => [{type: "TextEdit", id: `version-${versionId}`}],
    }),
  }),
})

export const {
  useGetTextEditsByVersionQuery,
  useGetTextEditsByPageQuery,
  useAddTextEditMutation,
  useUpdateTextEditMutation,
  useDeleteTextEditMutation,
  useDeleteTextEditsByVersionMutation,
  useHasTextEditsQuery,
} = textEditsApi
