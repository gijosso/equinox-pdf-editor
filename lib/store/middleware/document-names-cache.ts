import type {Middleware} from "@reduxjs/toolkit"

import {documentNamesCache} from "@/lib/services/document-names-cache"

// Middleware to automatically manage document names cache
// This middleware listens to document-related actions and updates the cache accordingly
export const documentNamesCacheMiddleware: Middleware = store => next => action => {
  const result = next(action)

  // Handle document mutations that affect the document list
  if ((action as any).type?.startsWith("documentsApi/executeMutation")) {
    const {endpointName} = (action as any).meta?.arg || {}

    // Check if this is a document-affecting mutation
    if (endpointName === "addDocument" || endpointName === "deleteDocument") {
      // Get current documents from the store
      const state = store.getState()
      const documents = state.documentsApi.queries["getAllDocuments(undefined)"]?.data || []

      if (documents.length > 0) {
        // Update cache with current document names
        documentNamesCache.initialize(documents.map((doc: any) => doc.name))
      } else {
        // Clear cache if no documents
        documentNamesCache.clear()
      }
    }
  }

  // Handle query cache updates that might affect document names
  if ((action as any).type?.startsWith("documentsApi/executeQuery/fulfilled")) {
    const {endpointName} = (action as any).meta?.arg || {}

    if (endpointName === "getAllDocuments") {
      const documents = (action as any).payload || []

      if (documents.length > 0) {
        // Update cache with current document names
        documentNamesCache.initialize(documents.map((doc: any) => doc.name))
      } else {
        // Clear cache if no documents
        documentNamesCache.clear()
      }
    }
  }

  return result
}
