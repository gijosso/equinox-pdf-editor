import {createSelector} from "@reduxjs/toolkit"

import type {NormalizedDocumentsState} from "@/lib/types"

const selectDocumentsState = (state: {documents: NormalizedDocumentsState}) => state.documents

export const documentSelectors = {
  loading: createSelector([selectDocumentsState], state => state.loading),
  error: createSelector([selectDocumentsState], state => state.error),

  allDocuments: createSelector([selectDocumentsState], state =>
    state.documents.ids.map(id => state.documents.entities[id]).filter(Boolean),
  ),

  documentById: (id: string) => createSelector([selectDocumentsState], state => state.documents.entities[id]),

  documentCount: createSelector([selectDocumentsState], state => state.documents.ids.length),
}

// Export individual selectors for convenience
export const {
  loading: selectLoading,
  error: selectError,
  allDocuments: selectAllDocuments,
  documentById: selectDocumentById,
  documentCount: selectDocumentCount,
} = documentSelectors
