import {createSelector} from "@reduxjs/toolkit"

import type {EditorState} from "@/lib/types"

import type {RootState} from "../index"
import {defaultDocumentEditorState} from "../slices/editor"

export const selectBasicEditorState = (state: RootState): EditorState => state.editor

const editorSelectors = {
  loading: createSelector([selectBasicEditorState], editorState => editorState.loading),
  error: createSelector([selectBasicEditorState], editorState => editorState.error),
  editorState: createSelector([selectBasicEditorState], editorState =>
    editorState.documentId ? editorState.byDocument[editorState.documentId] : defaultDocumentEditorState(""),
  ),
  searchResults: createSelector([selectBasicEditorState], editorState =>
    editorState.documentId ? editorState.byDocument[editorState.documentId]?.searchResults || [] : [],
  ),
  currentSearchIndex: createSelector([selectBasicEditorState], editorState =>
    editorState.documentId ? editorState.byDocument[editorState.documentId]?.currentSearchIndex || 0 : 0,
  ),
  currentPage: createSelector([selectBasicEditorState], editorState =>
    editorState.documentId ? editorState.byDocument[editorState.documentId]?.currentPage || 1 : 1,
  ),
}

export const {
  loading: selectEditorLoading,
  error: selectEditorError,
  editorState: selectEditorState,
  searchResults: selectSearchResults,
  currentSearchIndex: selectCurrentSearchIndex,
  currentPage: selectCurrentPage,
} = editorSelectors
