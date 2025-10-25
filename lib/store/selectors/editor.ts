import {createSelector} from "@reduxjs/toolkit"

import type {RootState} from "../index"
import type {DocumentEditorState, EditorState} from "../slices/editor"

export const selectEditorState = (state: RootState): EditorState => state.editor

export const selectDocumentEditorState =
  (documentId: string) =>
  (state: RootState): DocumentEditorState | null =>
    state.editor.byDocument[documentId] || null

export const selectActiveDocumentEditorState = (state: RootState): DocumentEditorState | null => {
  const activeDocumentId = state.editor.activeDocumentId
  return activeDocumentId ? state.editor.byDocument[activeDocumentId] || null : null
}

export const selectActiveDocumentViewport = createSelector(
  [selectActiveDocumentEditorState],
  editorState => editorState?.viewport || {x: 0, y: 0, zoom: 1},
)

export const selectActiveDocumentActiveTool = createSelector(
  [selectActiveDocumentEditorState],
  editorState => editorState?.activeTool || {type: "select"},
)

export const selectActiveDocumentSelectedAnnotations = createSelector(
  [selectActiveDocumentEditorState],
  editorState => editorState?.selectedAnnotations || [],
)

export const selectActiveDocumentIsEditing = createSelector(
  [selectActiveDocumentEditorState],
  editorState => editorState?.isEditing || false,
)

export const selectActiveDocumentSidebarOpen = createSelector(
  [selectActiveDocumentEditorState],
  editorState => editorState?.sidebarOpen ?? true,
)

export const selectActiveDocumentAnnotationsVisible = createSelector(
  [selectActiveDocumentEditorState],
  editorState => editorState?.annotationsVisible ?? true,
)

export const selectActiveDocumentGridVisible = createSelector(
  [selectActiveDocumentEditorState],
  editorState => editorState?.gridVisible ?? false,
)

export const selectActiveDocumentSnapToGrid = createSelector(
  [selectActiveDocumentEditorState],
  editorState => editorState?.snapToGrid ?? false,
)

export const selectActiveDocumentCurrentPage = createSelector(
  [selectActiveDocumentEditorState],
  editorState => editorState?.currentPage || 1,
)

export const selectActiveDocumentTotalPages = createSelector(
  [selectActiveDocumentEditorState],
  editorState => editorState?.totalPages || 0,
)

export const selectActiveDocumentAnnotations = createSelector(
  [selectActiveDocumentEditorState],
  editorState => editorState?.annotations || [],
)

// Search selectors
export const selectActiveDocumentSearchQuery = createSelector(
  [selectActiveDocumentEditorState],
  editorState => editorState?.searchQuery || "",
)

export const selectActiveDocumentSearchResults = createSelector(
  [selectActiveDocumentEditorState],
  editorState => editorState?.searchResults || [],
)

export const selectActiveDocumentCurrentSearchIndex = createSelector(
  [selectActiveDocumentEditorState],
  editorState => editorState?.currentSearchIndex || 0,
)

export const selectActiveDocumentHistory = createSelector(
  [selectActiveDocumentEditorState],
  editorState => editorState?.history || [],
)

export const selectActiveDocumentHistoryIndex = createSelector(
  [selectActiveDocumentEditorState],
  editorState => editorState?.historyIndex || 0,
)

export const selectActiveDocumentIsDiffMode = createSelector(
  [selectActiveDocumentEditorState],
  editorState => editorState?.isDiffMode || false,
)

export const selectActiveDocumentCompareVersionIds = createSelector(
  [selectActiveDocumentEditorState],
  editorState => editorState?.compareVersionIds || [],
)
