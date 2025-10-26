import {type Api, createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react"

import {atomicService} from "@/lib/db/atomic"
import {documentService} from "@/lib/db/documents"
import {versionService} from "@/lib/db/versions"
import type {PDFDocument, PDFDocumentWithBlob, PDFVersion} from "@/lib/types"

export const documentsApi = createApi({
  reducerPath: "documentsApi",
  baseQuery: fetchBaseQuery({baseUrl: "/api/"}), // Not used since we're using local DB
  tagTypes: ["Document", "Version"],
  endpoints: builder => ({
    getAllDocuments: builder.query<PDFDocument[], void>({
      queryFn: async () => {
        const result = await documentService.getAllDocuments()
        if (!result.success) {
          return {error: {status: "CUSTOM_ERROR", error: result.error.message}}
        }
        return {data: result.data}
      },
      providesTags: ["Document"],
    }),

    getDocumentWithVersions: builder.query<{document: PDFDocument; versions: PDFVersion[]}, string>({
      queryFn: async documentId => {
        const result = await atomicService.loadDocumentWithVersions(documentId)
        if (!result.success) {
          return {error: {status: "CUSTOM_ERROR", error: result.error.message}}
        }
        // Remove blob from document before caching
        const {blob, ...documentWithoutBlob} = result.data.document
        return {data: {document: documentWithoutBlob, versions: result.data.versions}}
      },
      providesTags: (result, error, documentId) => [{type: "Document", id: documentId}, "Version"],
    }),

    getDocumentMetadata: builder.query<PDFDocument, string>({
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
      {document: PDFDocumentWithBlob; version: PDFVersion}
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

    updateDocument: builder.mutation<
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

    getVersionsByDocument: builder.query<PDFVersion[], string>({
      queryFn: async documentId => {
        const result = await versionService.getVersionsByDocument(documentId)
        if (!result.success) {
          return {error: {status: "CUSTOM_ERROR", error: result.error.message}}
        }
        return {data: result.data}
      },
      providesTags: (result, error, documentId) => [
        {type: "Version", id: `document-${documentId}`},
        {type: "Document", id: documentId},
      ],
    }),

    addVersion: builder.mutation<PDFVersion, PDFVersion>({
      queryFn: async version => {
        const result = await versionService.addVersion(version)
        if (!result.success) {
          return {error: {status: "CUSTOM_ERROR", error: result.error.message}}
        }
        return {data: version}
      },
      invalidatesTags: (result, error, version) => [
        {type: "Version", id: `document-${version.documentId}`},
        {type: "Document", id: version.documentId},
      ],
    }),

    deleteVersion: builder.mutation<string, string>({
      queryFn: async versionId => {
        const result = await versionService.deleteVersion(versionId)
        if (!result.success) {
          return {error: {status: "CUSTOM_ERROR", error: result.error.message}}
        }
        return {data: versionId}
      },
      invalidatesTags: (result, error, versionId) => ["Version"], // Will invalidate all version queries
    }),
  }),
})

export const {
  useGetAllDocumentsQuery,
  useGetDocumentWithVersionsQuery,
  useGetDocumentMetadataQuery,
  useAddDocumentMutation,
  useUpdateDocumentMutation,
  useDeleteDocumentMutation,
  useGetVersionsByDocumentQuery,
  useAddVersionMutation,
  useDeleteVersionMutation,
} = documentsApi
