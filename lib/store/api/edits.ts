import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react"

import {editService} from "@/lib/db/edits"
import type {Edit} from "@/lib/types"

export const editsApi = createApi({
  reducerPath: "editsApi",
  baseQuery: fetchBaseQuery({baseUrl: "/api/"}), // Not used since we're using local DB
  tagTypes: ["Edit"],
  keepUnusedDataFor: 60, // Keep unused data for 60 seconds
  endpoints: builder => ({
    getEditsByVersion: builder.query<Edit[], string>({
      queryFn: async versionId => {
        const result = await editService.getEditsByVersion(versionId)
        if (!result.success) {
          return {error: {status: "CUSTOM_ERROR", error: result.error.message}}
        }
        return {data: result.data || []}
      },
      providesTags: (result, error, versionId) => [
        {type: "Edit", id: `version-${versionId}`},
        ...(result || []).map(({id}) => ({type: "Edit" as const, id})),
      ],
    }),

    addEdit: builder.mutation<string, {versionId: string; type: Edit["type"]; annotationId: string; data?: any}>({
      queryFn: async args => {
        const result = await editService.addEdit(args)
        if (!result.success) {
          return {error: {status: "CUSTOM_ERROR", error: result.error.message}}
        }
        return {data: result.data || ""}
      },
      invalidatesTags: (result, error, {versionId}) => [{type: "Edit", id: `version-${versionId}`}],
    }),

    deleteEditsByVersion: builder.mutation<null, string>({
      queryFn: async versionId => {
        const result = await editService.deleteEditsByVersion(versionId)
        if (!result.success) {
          return {error: {status: "CUSTOM_ERROR", error: result.error.message}}
        }
        return {data: null}
      },
      invalidatesTags: (result, error, versionId) => [{type: "Edit", id: `version-${versionId}`}],
    }),

    hasEdits: builder.query<boolean, string>({
      queryFn: async versionId => {
        const hasEdits = await editService.hasEdits(versionId)
        return {data: hasEdits}
      },
      providesTags: (result, error, versionId) => [{type: "Edit", id: `version-${versionId}`}],
    }),
  }),
})

export const {useGetEditsByVersionQuery, useAddEditMutation, useDeleteEditsByVersionMutation, useHasEditsQuery} =
  editsApi
