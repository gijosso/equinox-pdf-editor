import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react"
import {PDFDocument} from "pdf-lib"

import {db} from "@/lib/db/database"
import {documentService} from "@/lib/db/documents"
import {addOriginalPages, createChangeLogPage, createPlaceholderPage, generateExportFilename} from "@/lib/utils/export"
import {drawPDFAnnotations} from "@/lib/utils/pdf-annotations"

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

          // Get all versions for this document up to and including the current version
          const allVersions = await db.versions.where("documentId").equals(documentId).sortBy("createdAt")

          // Find the current version index to limit the history
          const currentVersionIndex = allVersions.findIndex(v => v.id === versionId)
          const versionsUpToCurrent =
            currentVersionIndex >= 0 ? allVersions.slice(0, currentVersionIndex + 1) : allVersions

          // Get annotations and text edits for each version
          const versionAnnotations = await Promise.all(
            versionsUpToCurrent.map(async version => ({
              version,
              annotations: await db.annotations.where("versionId").equals(version.id).toArray(),
              textEdits: await db.textEdits.where("versionId").equals(version.id).toArray(),
            })),
          )

          // Create new PDF document
          const pdfDoc = await PDFDocument.create()

          // Create change log page
          await createChangeLogPage(pdfDoc, {
            documentName: document.name,
            versions: versionAnnotations,
          })

          // Add original pages from document blob
          const blobResult = await documentService.getDocumentBlob(documentId)
          if (blobResult.success && blobResult.data) {
            try {
              const originalPdfBytes = await blobResult.data.arrayBuffer()
              await addOriginalPages(pdfDoc, originalPdfBytes)

              // Get all text edits from all versions up to current
              // const allTextEdits = versionAnnotations.flatMap(version => version.textEdits)

              // Adjust text edit page numbers to account for the change log page (add 1 to each page number)
              // const adjustedTextEdits = allTextEdits.map(textEdit => ({
              //   ...textEdit,
              //   pageNumber: textEdit.pageNumber + 1,
              // }))

              // TODO: Instead of applying text edits here, we should apply them in the client-side using the reconstructive approach
              // await applyTextEditsToPDF(pdfDoc, adjustedTextEdits)

              // Draw annotations from the last version onto the PDF pages
              const lastVersionAnnotations = versionAnnotations[versionAnnotations.length - 1]?.annotations || []
              // Adjust page numbers to account for the change log page (add 1 to each page number)
              const adjustedAnnotations = lastVersionAnnotations.map(annotation => ({
                ...annotation,
                pageNumber: annotation.pageNumber + 1,
              }))
              drawPDFAnnotations(pdfDoc, adjustedAnnotations)
            } catch (error) {
              console.error("Error loading original PDF:", error)
              await createPlaceholderPage(pdfDoc)
            }
          } else {
            await createPlaceholderPage(pdfDoc)
          }

          // Generate PDF bytes
          const pdfBytes = await pdfDoc.save()
          const blob = new Blob([pdfBytes.buffer as ArrayBuffer], {type: "application/pdf"})

          // Generate filename
          const filename = generateExportFilename(document.name, currentVersion.versionNumber)

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
