import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react"

import {annotationService} from "@/lib/db/annotations"
import {atomicService} from "@/lib/db/atomic"
import type {Annotation} from "@/lib/types"

export const annotationsApi = createApi({
  reducerPath: "annotationsApi",
  baseQuery: fetchBaseQuery({baseUrl: "/api/"}), // Not used since we're using local DB
  tagTypes: ["Annotation"],
  keepUnusedDataFor: 60, // Keep unused data for 60 seconds
  endpoints: builder => ({
    getAnnotationsByVersion: builder.query<Annotation[], string>({
      queryFn: async versionId => {
        const result = await annotationService.getAnnotationsByVersion(versionId)
        if (!result.success) {
          return {error: {status: "CUSTOM_ERROR", error: result.error.message}}
        }
        return {data: result.data}
      },
      providesTags: (result, error, versionId) => [
        {type: "Annotation", id: `version-${versionId}`},
        ...(result || []).map(({id}) => ({type: "Annotation" as const, id})),
      ],
    }),

    updateVersionAnnotations: builder.mutation<null, {versionId: string; annotations: Annotation[]}>({
      queryFn: async args => {
        const {versionId, annotations} = args
        const result = await atomicService.updateVersionAnnotations(versionId, annotations)
        if (!result.success) {
          return {error: {status: "CUSTOM_ERROR", error: result.error.message}}
        }
        return {data: null}
      },
      invalidatesTags: (result, error, {versionId}) => [{type: "Annotation", id: `version-${versionId}`}],
    }),

    addAnnotation: builder.mutation<string, Annotation>({
      queryFn: async annotation => {
        const result = await annotationService.addAnnotation(annotation)
        if (!result.success) {
          return {error: {status: "CUSTOM_ERROR", error: result.error.message}}
        }
        return {data: result.data}
      },
      invalidatesTags: (result, error, annotation) => [{type: "Annotation", id: `version-${annotation.versionId}`}],
      // Optimistic update - add annotation immediately to UI
      async onQueryStarted(annotation, {dispatch, queryFulfilled}) {
        // Optimistically add the annotation to the cache
        const patchResult = dispatch(
          annotationsApi.util.updateQueryData("getAnnotationsByVersion", annotation.versionId, draft => {
            draft.push(annotation)
          }),
        )

        try {
          await queryFulfilled
        } catch {
          // If the mutation fails, revert the optimistic update
          patchResult.undo()
        }
      },
    }),

    updateAnnotation: builder.mutation<null, {id: string; versionId: string; updates: Partial<Annotation>}>({
      queryFn: async args => {
        const {id, updates} = args
        const result = await annotationService.updateAnnotation(id, updates)

        if (!result.success) {
          return {error: {status: "CUSTOM_ERROR", error: result.error.message}}
        }

        return {data: null}
      },
      invalidatesTags: (result, error, {id}) => [{type: "Annotation", id}],
      // Optimistic update - update UI immediately
      async onQueryStarted({id, versionId, updates}, {dispatch, queryFulfilled}) {
        // Optimistically update the cache
        const patchResult = dispatch(
          annotationsApi.util.updateQueryData("getAnnotationsByVersion", versionId, draft => {
            const annotation = draft.find(ann => ann.id === id)
            if (annotation) {
              Object.assign(annotation, updates)
            }
          }),
        )

        try {
          await queryFulfilled
        } catch {
          // If the mutation fails, revert the optimistic update
          patchResult.undo()
        }
      },
    }),

    deleteAnnotation: builder.mutation<null, string>({
      queryFn: async id => {
        const result = await annotationService.deleteAnnotation(id)
        if (!result.success) {
          return {error: {status: "CUSTOM_ERROR", error: result.error.message}}
        }
        return {data: null}
      },
      invalidatesTags: (result, error, id) => [{type: "Annotation", id}],
    }),
  }),
})

export const {
  useGetAnnotationsByVersionQuery,
  useUpdateVersionAnnotationsMutation,
  useAddAnnotationMutation,
  useUpdateAnnotationMutation,
  useDeleteAnnotationMutation,
} = annotationsApi
