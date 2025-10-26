"use client"

import React from "react"

import {pdfSearchService} from "@/lib/services/pdf-search"
import {useGetDocumentEditorQuery, useSaveDocumentEditorMutation} from "@/lib/store/api"

import {usePDFBlob} from "./use-pdf-blob"

interface UsePDFSearchResult {
  isSearching: boolean
  searchInDocument: (query: string) => Promise<void>
  clearSearch: () => void
  goToNextResult: () => void
  goToPreviousResult: () => void
}

export function usePDFSearch(documentId: string, debounceTime: number = 300): UsePDFSearchResult {
  const [saveDocumentEditor] = useSaveDocumentEditorMutation()
  const {data: editor} = useGetDocumentEditorQuery(documentId, {
    skip: !documentId,
  })

  const searchQuery = editor?.searchQuery || ""
  const searchResults = editor?.searchResults || []
  const currentSearchIndex = editor?.currentSearchIndex || 0
  const hasHadSearchQuery = React.useRef(false)

  const {blob, loading: pdfLoading} = usePDFBlob(documentId)

  const searchInDocument = React.useCallback(
    async (query: string) => {
      if (!documentId || !blob || pdfLoading || !editor) {
        return
      }

      try {
        const results = await pdfSearchService.searchInPDF(blob, query, {
          caseSensitive: false,
          wholeWord: false,
          highlightAll: true,
        })

        const updatedEditor = {
          ...editor,
          searchResults: results,
          currentSearchIndex: 0,
        }

        await saveDocumentEditor({documentId, editor: updatedEditor}).unwrap()
      } catch (error) {
        console.error("Error searching PDF:", error)
      }
    },
    [documentId, blob, pdfLoading, editor, saveDocumentEditor],
  )

  const clearSearch = React.useCallback(async () => {
    if (!documentId || !editor) {
      return
    }

    const updatedEditor = {
      ...editor,
      searchResults: [],
      currentSearchIndex: 0,
    }

    try {
      await saveDocumentEditor({documentId, editor: updatedEditor}).unwrap()
    } catch (error) {
      console.error("Failed to clear search:", error)
    }
  }, [documentId, editor, saveDocumentEditor])

  const goToNextResult = React.useCallback(async () => {
    if (!documentId || !editor || searchResults.length === 0) {
      return
    }

    const nextIndex = (currentSearchIndex + 1) % searchResults.length
    const nextResult = searchResults[nextIndex]

    const updatedEditor = {
      ...editor,
      currentSearchIndex: nextIndex,
      currentPage: nextResult.pageNumber,
    }

    try {
      await saveDocumentEditor({documentId, editor: updatedEditor}).unwrap()
    } catch (error) {
      console.error("Failed to go to next result:", error)
    }
  }, [documentId, editor, searchResults, currentSearchIndex, saveDocumentEditor])

  const goToPreviousResult = React.useCallback(async () => {
    if (!documentId || !editor || searchResults.length === 0) {
      return
    }

    const prevIndex = (currentSearchIndex - 1 + searchResults.length) % searchResults.length
    const prevResult = searchResults[prevIndex]

    const updatedEditor = {
      ...editor,
      currentSearchIndex: prevIndex,
      currentPage: prevResult.pageNumber,
    }

    try {
      await saveDocumentEditor({documentId, editor: updatedEditor}).unwrap()
    } catch (error) {
      console.error("Failed to go to previous result:", error)
    }
  }, [documentId, editor, searchResults, currentSearchIndex, saveDocumentEditor])

  // Debounce search
  React.useEffect(() => {
    if (searchQuery && blob && !pdfLoading && editor) {
      hasHadSearchQuery.current = true
      const timeoutId = setTimeout(() => {
        searchInDocument(searchQuery.trim())
      }, debounceTime)

      return () => clearTimeout(timeoutId)
    } else if (!searchQuery && documentId && hasHadSearchQuery.current && editor) {
      // Only clear search results if we've had a search query before (not on mount)
      clearSearch()
      hasHadSearchQuery.current = false
    }
  }, [searchQuery, documentId, debounceTime, blob, pdfLoading, searchInDocument, clearSearch, editor])

  return {isSearching: pdfLoading, searchInDocument, clearSearch, goToNextResult, goToPreviousResult}
}
