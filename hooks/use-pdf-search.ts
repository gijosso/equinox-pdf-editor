"use client"

import React from "react"

import {type SearchResult, pdfSearchService} from "@/lib/services/pdf-search"
import {useAppDispatch, useAppSelector} from "@/lib/store/hooks"
import {
  selectActiveDocumentCurrentSearchIndex,
  selectActiveDocumentSearchQuery,
  selectActiveDocumentSearchResults,
} from "@/lib/store/selectors/editor"
import {nextSearchResult, prevSearchResult, setCurrentPage, setSearchResults} from "@/lib/store/slices/editor"

import {usePDFBlob} from "./use-pdf-blob"

interface UsePDFSearchResult {
  searchQuery: string
  searchResults: SearchResult[]
  currentSearchIndex: number
  isSearching: boolean
  searchInDocument: (query: string) => Promise<void>
  clearSearch: () => void
  goToNextResult: () => void
  goToPreviousResult: () => void
}

export function usePDFSearch(documentId: string | null, debounceTime: number = 300): UsePDFSearchResult {
  const dispatch = useAppDispatch()
  const {blob, loading: pdfLoading} = usePDFBlob(documentId)
  const searchQuery = useAppSelector(selectActiveDocumentSearchQuery)
  const searchResults = useAppSelector(selectActiveDocumentSearchResults)
  const currentSearchIndex = useAppSelector(selectActiveDocumentCurrentSearchIndex)

  const searchInDocument = React.useCallback(
    async (query: string) => {
      if (!documentId || !blob || pdfLoading) {
        return
      }

      try {
        const results = await pdfSearchService.searchInPDF(blob, query, {
          caseSensitive: false,
          wholeWord: false,
          highlightAll: true,
        })

        dispatch(setSearchResults({documentId, results}))
      } catch (error) {
        console.error("Error searching PDF:", error)
      }
    },
    [documentId, blob, pdfLoading, dispatch],
  )

  const clearSearch = React.useCallback(() => {
    if (!documentId) return
    dispatch(setSearchResults({documentId, results: []}))
  }, [documentId, dispatch])

  const goToNextResult = React.useCallback(() => {
    if (!documentId || searchResults.length === 0) {
      return
    }

    dispatch(nextSearchResult(documentId))

    const nextIndex = (currentSearchIndex + 1) % searchResults.length
    const nextResult = searchResults[nextIndex]
    dispatch(setCurrentPage({documentId, page: nextResult.pageNumber}))
  }, [documentId, searchResults, currentSearchIndex, dispatch])

  const goToPreviousResult = React.useCallback(() => {
    if (!documentId || searchResults.length === 0) {
      return
    }

    dispatch(prevSearchResult(documentId))
    const prevIndex = (currentSearchIndex - 1 + searchResults.length) % searchResults.length
    const prevResult = searchResults[prevIndex]
    dispatch(setCurrentPage({documentId, page: prevResult.pageNumber}))
  }, [documentId, searchResults, currentSearchIndex, dispatch])

  // Debounce search
  React.useEffect(() => {
    if (searchQuery.trim() && blob && !pdfLoading) {
      const timeoutId = setTimeout(() => {
        searchInDocument(searchQuery)
      }, debounceTime)

      return () => clearTimeout(timeoutId)
    } else if (!searchQuery.trim()) {
      clearSearch()
    }
  }, [searchQuery, debounceTime, blob, pdfLoading, searchInDocument, clearSearch])

  return {
    searchQuery,
    searchResults,
    currentSearchIndex,
    isSearching: pdfLoading,
    searchInDocument,
    clearSearch,
    goToNextResult,
    goToPreviousResult,
  }
}
