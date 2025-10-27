import {annotationsApi} from "./annotations"
import {documentsApi} from "./documents"
import {editorApi} from "./editor"
import {editsApi} from "./edits"
import {exportApi} from "./export"
import {versionsApi} from "./versions"

export {documentsApi, versionsApi, annotationsApi, editsApi, editorApi, exportApi}

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
  useEditorActions,
} from "./editor"

export {useExportPDFMutation} from "./export"

export {useGetEditsByVersionQuery, useAddEditMutation, useDeleteEditsByVersionMutation, useHasEditsQuery} from "./edits"

export const api = {
  documentsApi,
  versionsApi,
  annotationsApi,
  editsApi,
  editorApi,
  exportApi,
}
