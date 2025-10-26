import {annotationsApi} from "./annotations"
import {documentsApi} from "./documents"
import {editorApi} from "./editor"
import {versionsApi} from "./versions"

// Export all APIs
export {documentsApi, versionsApi, annotationsApi, editorApi}

// Export all hooks from all APIs
export {
  // Documents
  useGetAllDocumentsQuery,
  useGetDocumentQuery,
  useAddDocumentMutation,
  useUpdateDocumentMutation,
  useUpdateDocumentWithVersionMutation,
  useDeleteDocumentMutation,
} from "./documents"

export {
  // Versions
  useGetVersionsByDocumentQuery,
} from "./versions"

export {
  // Annotations
  useGetAnnotationsByVersionQuery,
  useUpdateVersionAnnotationsMutation,
  useAddAnnotationMutation,
  useUpdateAnnotationMutation,
  useDeleteAnnotationMutation,
} from "./annotations"

export {
  // Editor
  useGetDocumentEditorQuery,
  useSaveDocumentEditorMutation,
  useGetVersionEditorQuery,
  useSaveVersionEditorMutation,
} from "./editor"

// Export combined API for store configuration
export const api = {
  documentsApi,
  versionsApi,
  annotationsApi,
  editorApi,
}
