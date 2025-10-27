import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react"

import {atomicService} from "@/lib/db/atomic"
import {editorService} from "@/lib/db/editor"
import type {DocumentEditor, VersionEditor} from "@/lib/types"

export const editorApi = createApi({
  reducerPath: "editorApi",
  baseQuery: fetchBaseQuery({baseUrl: "/api/"}), // Not used since we're using local DB
  tagTypes: ["Editor"],
  keepUnusedDataFor: 60, // Keep unused data for 60 seconds
  endpoints: builder => ({
    getDocumentEditor: builder.query<DocumentEditor | undefined, string>({
      queryFn: async documentId => {
        const result = await atomicService.loadDocumentEditor(documentId)
        if (!result.success) {
          return {error: {status: "CUSTOM_ERROR", error: result.error.message}}
        }
        return {data: result.data}
      },
      providesTags: (result, error, documentId) => [{type: "Editor", id: `document-${documentId}`}],
    }),

    saveDocumentEditor: builder.mutation<null, {documentId: string; editor: DocumentEditor}>({
      queryFn: async args => {
        const {documentId, editor} = args
        const result = await editorService.saveDocumentEditor(documentId, editor)
        if (!result.success) {
          return {error: {status: "CUSTOM_ERROR", error: result.error.message}}
        }
        return {data: null}
      },
      invalidatesTags: (result, error, {documentId}) => [{type: "Editor", id: `document-${documentId}`}],
    }),

    getVersionEditor: builder.query<VersionEditor | undefined, string>({
      queryFn: async versionId => {
        const result = await atomicService.loadVersionEditor(versionId)
        if (!result.success) {
          return {error: {status: "CUSTOM_ERROR", error: result.error.message}}
        }
        return {data: result.data}
      },
      providesTags: (result, error, versionId) => [{type: "Editor", id: `version-${versionId}`}],
    }),

    saveVersionEditor: builder.mutation<null, {versionId: string; editor: VersionEditor}>({
      queryFn: async args => {
        const {versionId, editor} = args
        const result = await atomicService.saveVersionEditor(versionId, editor)
        if (!result.success) {
          return {error: {status: "CUSTOM_ERROR", error: result.error.message}}
        }
        return {data: null}
      },
      invalidatesTags: (result, error, {versionId}) => [{type: "Editor", id: `version-${versionId}`}],
    }),
  }),
})

export const {
  useGetDocumentEditorQuery,
  useSaveDocumentEditorMutation,
  useGetVersionEditorQuery,
  useSaveVersionEditorMutation,
} = editorApi

// Helper hooks for common editor updates
export const useEditorActions = (documentId: string) => {
  const [saveDocumentEditor] = useSaveDocumentEditorMutation()
  const {data: editor} = useGetDocumentEditorQuery(documentId, {skip: !documentId})

  const updateEditor = async (updates: Partial<DocumentEditor>, errorMessage?: string) => {
    if (!editor || !documentId) {
      console.warn("Cannot update editor: missing editor state or documentId")
      return false
    }

    try {
      const updatedEditor = {...editor, ...updates}
      await saveDocumentEditor({documentId, editor: updatedEditor}).unwrap()
      return true
    } catch (error) {
      console.error(errorMessage || "Failed to update editor:", error)
      return false
    }
  }

  return {
    editor,
    updateEditor,
    // Specific helper functions for common operations
    setCurrentPage: (page: number) => updateEditor({currentPage: page}, "Failed to change page"),

    setActiveTool: (tool: DocumentEditor["activeTool"]) => updateEditor({activeTool: tool}, "Failed to change tool"),

    setSidebarOpen: (open: boolean) => updateEditor({sidebarOpen: open}, "Failed to toggle sidebar"),

    setAnnotationsViewMode: (mode: DocumentEditor["annotationsViewMode"]) =>
      updateEditor({annotationsViewMode: mode}, "Failed to update view mode"),

    setSearchQuery: (query: string) => updateEditor({searchQuery: query}, "Failed to update search query"),

    setSearchResults: (results: DocumentEditor["searchResults"], index: number = 0) =>
      updateEditor({searchResults: results, currentSearchIndex: index}, "Failed to update search results"),

    setCurrentSearchIndex: (index: number) =>
      updateEditor({currentSearchIndex: index}, "Failed to update search index"),

    setViewport: (viewport: DocumentEditor["viewport"]) => updateEditor({viewport}, "Failed to update viewport"),

    setDiffMode: (isDiffMode: boolean, compareVersionIds: string[] = []) =>
      updateEditor({isDiffMode, compareVersionIds}, "Failed to update diff mode"),

    setCurrentVersionId: (versionId: string | null) =>
      updateEditor({currentVersionId: versionId}, "Failed to update current version"),

    setHistoryIndex: (index: number) => updateEditor({historyIndex: index}, "Failed to jump to history"),

    clearSearch: () =>
      updateEditor(
        {
          searchQuery: "",
          searchResults: [],
          currentSearchIndex: 0,
        },
        "Failed to clear search",
      ),
  }
}
