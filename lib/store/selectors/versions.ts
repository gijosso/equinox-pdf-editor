import {createSelector} from "@reduxjs/toolkit"

import type {NormalizedDocumentsState} from "@/lib/types"

const selectDocumentsState = (state: {documents: NormalizedDocumentsState}) => state.documents

export const versionSelectors = {
  versionsByDocumentId: (documentId: string) =>
    createSelector([selectDocumentsState], state => {
      const versionIds = state.versions.byDocument[documentId] || []
      return versionIds.map(id => state.versions.entities[id]).filter(Boolean)
    }),

  versionById: (id: string) => createSelector([selectDocumentsState], state => state.versions.entities[id]),

  versionsCount: createSelector([selectDocumentsState], state => state.versions.ids.length),

  // Combined document with versions
  documentWithVersions: (documentId: string) =>
    createSelector([selectDocumentsState], state => {
      const document = state.documents.entities[documentId]
      if (!document) return null

      const versionIds = state.versions.byDocument[documentId] || []
      const versions = versionIds.map(id => state.versions.entities[id]).filter(Boolean)

      return {...document, versions}
    }),
}

export const {
  versionsByDocumentId: selectVersionsByDocumentId,
  versionById: selectVersionById,
  versionsCount: selectVersionsCount,
  documentWithVersions: selectDocumentWithVersions,
} = versionSelectors
