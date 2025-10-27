import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react"

import {db} from "@/lib/db/database"
import {addOriginalPages, createChangeLogPage, createPlaceholderPage, generateExportFilename} from "@/lib/utils/export"

export interface ExportPDFRequest {
  documentId: string
  versionId: string
}

export interface ExportPDFResponse {
  filename: string
  downloadUrl: string
}

export const exportApi = createApi({
  reducerPath: "exportApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api/",
  }),
  tagTypes: ["Export"],
  endpoints: builder => ({
    exportPDF: builder.mutation<ExportPDFResponse, ExportPDFRequest>({
      queryFn: async ({documentId, versionId}) => {
        try {
          // Import PDF-lib dynamically to avoid SSR issues
          const {PDFDocument} = await import("pdf-lib")

          // Get document data from IndexedDB
          const document = await db.documents.get(documentId)
          if (!document) {
            return {error: {status: "CUSTOM_ERROR", error: "Document not found"}}
          }

          // Get current version
          const currentVersion = await db.versions.get(versionId)
          if (!currentVersion) {
            return {error: {status: "CUSTOM_ERROR", error: "Version not found"}}
          }

          // Get all versions for this document
          const allVersions = await db.versions.where("documentId").equals(documentId).sortBy("createdAt")

          // Get annotations for all versions
          const versionAnnotations = await Promise.all(
            allVersions.map(async version => ({
              version,
              annotations: await db.annotations.where("versionId").equals(version.id).toArray(),
            })),
          )

          // Create new PDF document
          const pdfDoc = await PDFDocument.create()

          // Create change log page
          await createChangeLogPage(pdfDoc, {
            documentName: document.name,
            versions: versionAnnotations,
          })

          // Add original pages
          if (currentVersion.blob) {
            try {
              const originalPdfBytes = await currentVersion.blob.arrayBuffer()
              await addOriginalPages(pdfDoc, originalPdfBytes)
            } catch (error) {
              console.error("Error loading original PDF:", error)
              await createPlaceholderPage(pdfDoc)
            }
          }

          // Generate PDF bytes
          const pdfBytes = await pdfDoc.save()
          const blob = new Blob([pdfBytes], {type: "application/pdf"})

          // Generate filename
          const filename = generateExportFilename(document.name)

          // Create object URL for download
          const downloadUrl = URL.createObjectURL(blob)

          return {
            data: {
              filename,
              downloadUrl,
            },
          }
        } catch (error) {
          console.error("Export error:", error)
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error instanceof Error ? error.message : "Failed to export annotated PDF",
            },
          }
        }
      },
      invalidatesTags: ["Export"],
    }),
  }),
})

export const {useExportPDFMutation} = exportApi
