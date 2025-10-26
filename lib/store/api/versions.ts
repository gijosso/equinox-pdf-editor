import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react"

import {versionService} from "@/lib/db/versions"
import type {PDFVersion} from "@/lib/types"

export const versionsApi = createApi({
  reducerPath: "versionsApi",
  baseQuery: fetchBaseQuery({baseUrl: "/api/"}), // Not used since we're using local DB
  tagTypes: ["Version", "Document"],
  keepUnusedDataFor: 60, // Keep unused data for 60 seconds
  endpoints: builder => ({
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

export const {useGetVersionsByDocumentQuery} = versionsApi
