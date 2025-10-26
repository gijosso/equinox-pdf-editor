"use client"

import React from "react"

import {pdfSearchService} from "@/lib/services/pdf-search"
import {useAppDispatch, useAppSelector} from "@/lib/store/hooks"
import {selectEditorState} from "@/lib/store/selectors/editor"
import {nextSearchResult, prevSearchResult, setCurrentPage, setSearchResults} from "@/lib/store/slices/editor"

import {usePDFBlob} from "./use-pdf-blob"

interface UsePDFSearchResult {
  isSearching: boolean
  searchInDocument: (query: string) => Promise<void>
  clearSearch: () => void
  goToNextResult: () => void
  goToPreviousResult: () => void
}

export function usePDFSearch(debounceTime: number = 300): UsePDFSearchResult {
  const dispatch = useAppDispatch()
  const {documentId, searchQuery, searchResults, currentSearchIndex} = useAppSelector(selectEditorState)
  const hasHadSearchQuery = React.useRef(false)

  const {blob, loading: pdfLoading} = usePDFBlob()

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
    if (!documentId) {
      return
    }

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
    if (searchQuery && blob && !pdfLoading) {
      hasHadSearchQuery.current = true
      const timeoutId = setTimeout(() => {
        searchInDocument(searchQuery.trim())
      }, debounceTime)

      return () => clearTimeout(timeoutId)
    } else if (!searchQuery && documentId && hasHadSearchQuery.current) {
      // Only clear search results if we've had a search query before (not on mount)
      dispatch(setSearchResults({documentId, results: []}))
      hasHadSearchQuery.current = false
    }
  }, [searchQuery, documentId, debounceTime, blob, pdfLoading, searchInDocument, dispatch])

  return {isSearching: pdfLoading, searchInDocument, clearSearch, goToNextResult, goToPreviousResult}
}
