"use client"

import {ChevronDown, ChevronUp, Search, X} from "lucide-react"
import React from "react"

import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {useAppDispatch, useAppSelector} from "@/lib/store/hooks"
import {
  selectActiveDocumentCurrentSearchIndex,
  selectActiveDocumentSearchQuery,
  selectActiveDocumentSearchResults,
} from "@/lib/store/selectors"
import {
  clearSearch,
  nextSearchResult,
  prevSearchResult,
  setCurrentPage,
  setSearchQuery,
  setSearchResults,
} from "@/lib/store/slices"

export function SearchBar() {
  const dispatch = useAppDispatch()
  const activeDocumentId = useAppSelector(state => state.editor.activeDocumentId)
  const searchQuery = useAppSelector(selectActiveDocumentSearchQuery)
  const searchResults = useAppSelector(selectActiveDocumentSearchResults)
  const currentSearchIndex = useAppSelector(selectActiveDocumentCurrentSearchIndex)
  const [isSearching, setIsSearching] = React.useState(false)
  const [isPdfLoading, setIsPdfLoading] = React.useState(false)

  const handleNext = () => {
    if (!activeDocumentId) return
    dispatch(nextSearchResult(activeDocumentId))
    if (searchResults.length > 0) {
      const nextIndex = (currentSearchIndex + 1) % searchResults.length
      const nextResult = searchResults[nextIndex]
      dispatch(setCurrentPage({documentId: activeDocumentId, page: nextResult.pageNumber}))
    }
  }

  const handlePrev = () => {
    if (!activeDocumentId) return
    dispatch(prevSearchResult(activeDocumentId))
    if (searchResults.length > 0) {
      const prevIndex = (currentSearchIndex - 1 + searchResults.length) % searchResults.length
      const prevResult = searchResults[prevIndex]
      dispatch(setCurrentPage({documentId: activeDocumentId, page: prevResult.pageNumber}))
    }
  }

  const handleClear = () => {
    if (!activeDocumentId) {
      return
    }

    dispatch(clearSearch(activeDocumentId))
  }

  if (!activeDocumentId) {
    return null
  }

  // If PDF blob is not loaded (still null), show loading indicator and disable input
  if (isPdfLoading) {
    return (
      <div className="flex items-center gap-2 border-border pr-4">
        <span className="text-sm text-muted-foreground">Loading PDF...</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 border-border pr-4">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search in document..."
          value={searchQuery}
          onChange={e => dispatch(setSearchQuery({documentId: activeDocumentId, query: e.target.value}))}
          className="h-8 w-64 pl-8 pr-8 bg-muted"
          disabled={isPdfLoading || isSearching}
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-0 top-1/2 h-8 w-8 -translate-y-1/2 p-0"
            disabled={isSearching}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {searchResults.length > 0 && (
        <>
          <span className="text-sm text-muted-foreground">
            {currentSearchIndex + 1} of {searchResults.length}
          </span>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={handlePrev} className="h-8 w-8 p-0" disabled={isSearching}>
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleNext} className="h-8 w-8 p-0" disabled={isSearching}>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}

      {isSearching && <span className="text-sm text-muted-foreground">Searching...</span>}
    </div>
  )
}
