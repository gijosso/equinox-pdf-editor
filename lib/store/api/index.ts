import {annotationsApi} from "./annotations"
import {documentsApi} from "./documents"
import {editorApi} from "./editor"
import {exportApi} from "./export"
import {versionsApi} from "./versions"

export {documentsApi, versionsApi, annotationsApi, editorApi, exportApi}

export {
  useGetAllDocumentsQuery,
  useGetDocumentQuery,
  useAddDocumentMutation,
  useUpdateDocumentMutation,
  useUpdateDocumentWithVersionMutation,
  useDeleteDocumentMutation,
} from "./documents"

export {useGetVersionsByDocumentQuery} from "./versions"

export {
  useGetAnnotationsByVersionQuery,
  useUpdateVersionAnnotationsMutation,
  useAddAnnotationMutation,
  useUpdateAnnotationMutation,
  useDeleteAnnotationMutation,
} from "./annotations"

export {
  useGetDocumentEditorQuery,
  useSaveDocumentEditorMutation,
  useGetVersionEditorQuery,
  useSaveVersionEditorMutation,
} from "./editor"

export {useExportPDFMutation} from "./export"

export const api = {
  documentsApi,
  versionsApi,
  annotationsApi,
  editorApi,
  exportApi,
}
