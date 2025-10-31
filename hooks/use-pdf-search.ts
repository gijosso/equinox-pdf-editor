"use client"

import React from "react"

import {pdfSearchService} from "@/lib/services/pdf-search"
import {useEditorActions} from "@/lib/store/api"

import {usePDFBlob} from "./use-pdf-blob"

interface UsePDFSearchResult {
  isSearching: boolean
  searchInDocument: (query: string) => Promise<void>
  clearSearch: () => void
  goToNextResult: () => void
  goToPreviousResult: () => void
}

export function usePDFSearch(documentId: string, debounceTime: number = 300): UsePDFSearchResult {
  const {editor, updateEditor} = useEditorActions(documentId)
  const searchResults = React.useMemo(() => editor?.searchResults || [], [editor?.searchResults])

  const searchQuery = editor?.searchQuery || ""
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

        const newIndex = currentSearchIndex < results.length ? currentSearchIndex : 0

        await updateEditor(
          {
            searchResults: results,
            currentSearchIndex: newIndex,
          },
          "Error searching PDF",
        )
      } catch (error) {
        console.error("Error searching PDF:", error)
      }
    },
    [documentId, blob, pdfLoading, editor, updateEditor, currentSearchIndex],
  )

  const clearSearch = React.useCallback(async () => {
    if (!documentId || !editor) {
      return
    }

    await updateEditor(
      {
        searchResults: [],
        currentSearchIndex: 0,
      },
      "Failed to clear search",
    )
  }, [documentId, editor, updateEditor])

  const goToNextResult = React.useCallback(async () => {
    if (!documentId || !editor || searchResults.length === 0) {
      return
    }

    const nextIndex = (currentSearchIndex + 1) % searchResults.length
    const nextResult = searchResults[nextIndex]

    await updateEditor(
      {
        currentSearchIndex: nextIndex,
        currentPage: nextResult.pageNumber,
      },
      "Failed to go to next result",
    )
  }, [documentId, editor, searchResults, currentSearchIndex, updateEditor])

  const goToPreviousResult = React.useCallback(async () => {
    if (!documentId || !editor || searchResults.length === 0) {
      return
    }

    const prevIndex = (currentSearchIndex - 1 + searchResults.length) % searchResults.length
    const prevResult = searchResults[prevIndex]

    await updateEditor(
      {
        currentSearchIndex: prevIndex,
        currentPage: prevResult.pageNumber,
      },
      "Failed to go to previous result",
    )
  }, [documentId, editor, searchResults, currentSearchIndex, updateEditor])

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
