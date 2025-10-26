import {type Api, createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react"

import {atomicService} from "@/lib/db/atomic"
import {documentService} from "@/lib/db/documents"
import {versionService} from "@/lib/db/versions"
import type {PDFDocument, PDFVersion} from "@/lib/types"

export const documentsApi = createApi({
  reducerPath: "documentsApi",
  baseQuery: fetchBaseQuery({baseUrl: "/api/"}), // Not used since we're using local DB
  tagTypes: ["Document", "Version"],
  keepUnusedDataFor: 60, // Keep unused data for 60 seconds
  endpoints: builder => ({
    getAllDocuments: builder.query<PDFDocument[], void>({
      queryFn: async () => {
        const result = await documentService.getAllDocuments()
        if (!result.success) {
          return {error: {status: "CUSTOM_ERROR", error: result.error.message}}
        }
        return {data: result.data}
      },
      providesTags: result =>
        result ? ["Document", ...result.map(({id}) => ({type: "Document" as const, id}))] : ["Document"],
    }),

    getDocument: builder.query<PDFDocument, string>({
      queryFn: async documentId => {
        const result = await documentService.getDocument(documentId)
        if (!result.success) {
          return {error: {status: "CUSTOM_ERROR", error: result.error.message}}
        }
        return {data: result.data!}
      },
      providesTags: (result, error, documentId) => [{type: "Document", id: documentId}],
    }),

    addDocument: builder.mutation<
      {documentId: string; versionId: string},
      {document: PDFDocument; version: PDFVersion}
    >({
      queryFn: async args => {
        const {document, version} = args
        const result = await atomicService.addDocumentWithVersion(document, version)
        if (!result.success) {
          return {error: {status: "CUSTOM_ERROR", error: result.error.message}}
        }
        return {data: result.data}
      },
      invalidatesTags: ["Document"],
    }),

    updateDocumentWithVersion: builder.mutation<
      {documentId: string; versionId: string},
      {documentId: string; documentUpdates: Partial<PDFDocument>; version: PDFVersion}
    >({
      queryFn: async ({documentId, documentUpdates, version}) => {
        const result = await atomicService.updateDocumentWithVersion(documentId, documentUpdates, version)
        if (!result.success) {
          return {error: {status: "CUSTOM_ERROR", error: result.error.message}}
        }
        return {data: result.data}
      },
      invalidatesTags: (result, error, {documentId}) => [{type: "Document", id: documentId}, "Version"],
    }),

    updateDocument: builder.mutation<string, {documentId: string; updates: Partial<PDFDocument>}>({
      queryFn: async ({documentId, updates}) => {
        const result = await documentService.updateDocument(documentId, updates)
        if (!result.success) {
          return {error: {status: "CUSTOM_ERROR", error: result.error.message}}
        }
        return {data: documentId}
      },
      invalidatesTags: (result, error, {documentId}) => [{type: "Document", id: documentId}],
    }),

    deleteDocument: builder.mutation<string, string>({
      queryFn: async documentId => {
        const result = await atomicService.deleteDocumentWithVersions(documentId)
        if (!result.success) {
          return {error: {status: "CUSTOM_ERROR", error: result.error.message}}
        }
        return {data: documentId}
      },
      invalidatesTags: (result, error, documentId) => [{type: "Document", id: documentId}, "Version"],
    }),

    getVersionsByDocument: builder.query<Omit<PDFVersion, "blob">[], string>({
      queryFn: async documentId => {
        const result = await versionService.getVersionsByDocument(documentId)
        if (!result.success) {
          return {error: {status: "CUSTOM_ERROR", error: result.error.message}}
        }
        // Strip blob from versions before caching
        const versionsWithoutBlob = result.data.map(({blob, ...version}) => version)
        return {data: versionsWithoutBlob}
      },
      providesTags: (result, error, documentId) => [
        {type: "Version", id: `document-${documentId}`},
        {type: "Document", id: documentId},
      ],
    }),
  }),
})

export const {
  useGetAllDocumentsQuery,
  useGetDocumentQuery,
  useAddDocumentMutation,
  useUpdateDocumentMutation,
  useUpdateDocumentWithVersionMutation,
  useDeleteDocumentMutation,
  useGetVersionsByDocumentQuery,
} = documentsApi
