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

    updateVersionAnnotations: builder.mutation<void, {versionId: string; annotations: Annotation[]}>({
      queryFn: async args => {
        const {versionId, annotations} = args
        const result = await atomicService.updateVersionAnnotations(versionId, annotations)
        if (!result.success) {
          return {error: {status: "CUSTOM_ERROR", error: result.error.message}}
        }
        return {data: undefined}
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
    }),

    updateAnnotation: builder.mutation<void, {id: string; updates: Partial<Annotation>}>({
      queryFn: async args => {
        const {id, updates} = args
        const result = await annotationService.updateAnnotation(id, updates)
        if (!result.success) {
          return {error: {status: "CUSTOM_ERROR", error: result.error.message}}
        }
        return {data: undefined}
      },
      invalidatesTags: (result, error, {id}) => [{type: "Annotation", id}],
    }),

    deleteAnnotation: builder.mutation<void, string>({
      queryFn: async id => {
        const result = await annotationService.deleteAnnotation(id)
        if (!result.success) {
          return {error: {status: "CUSTOM_ERROR", error: result.error.message}}
        }
        return {data: undefined}
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
