import {annotationsApi} from "./annotations"
import {documentsApi} from "./documents"
import {editorApi} from "./editor"
import {editsApi} from "./edits"
import {exportApi} from "./export"
import {textEditsApi} from "./text-edits"
import {versionsApi} from "./versions"

export {documentsApi, versionsApi, annotationsApi, editsApi, editorApi, exportApi, textEditsApi}

export {
  useGetAllDocumentsQuery,
  useGetDocumentQuery,
  useGetDocumentBlobQuery,
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

export {
  useGetTextEditsByVersionQuery,
  useGetTextEditsByPageQuery,
  useAddTextEditMutation,
  useUpdateTextEditMutation,
  useDeleteTextEditMutation,
  useDeleteTextEditsByVersionMutation,
  useHasTextEditsQuery,
} from "./text-edits"

export const api = {
  documentsApi,
  versionsApi,
  annotationsApi,
  editsApi,
  editorApi,
  exportApi,
  textEditsApi,
}
