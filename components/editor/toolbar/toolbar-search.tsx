"use client"

import {ChevronDown, ChevronUp, Search, X} from "lucide-react"
import React, {useState} from "react"

import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {usePDFSearch} from "@/hooks/use-pdf-search"
import {useEditorActions} from "@/lib/store/api"

interface ToolbarSearchProps {
  documentId: string
}

export function ToolbarSearch({documentId}: ToolbarSearchProps) {
  const {editor, setSearchQuery, clearSearch: clearSearchState} = useEditorActions(documentId)
  const searchResults = editor?.searchResults || []
  const currentSearchIndex = editor?.currentSearchIndex || 0
  const [localSearchQuery, setLocalSearchQuery] = useState("")
  const {isSearching, clearSearch, goToNextResult, goToPreviousResult} = usePDFSearch(documentId)

  const handleClear = React.useCallback(async () => {
    setLocalSearchQuery("")
    clearSearch()
    await clearSearchState()
  }, [clearSearch, clearSearchState])

  const handleInputChange = React.useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setLocalSearchQuery(value)
      await setSearchQuery(value)
    },
    [setSearchQuery],
  )

  const hasSearchResults = React.useMemo(() => searchResults.length > 0, [searchResults.length])
  const canGoPrevious = React.useMemo(
    () => !isSearching && hasSearchResults && currentSearchIndex > 0,
    [isSearching, hasSearchResults, currentSearchIndex],
  )
  const canGoNext = React.useMemo(() => !isSearching && hasSearchResults, [isSearching, hasSearchResults])
  const searchResultText = React.useMemo(
    () => `${hasSearchResults ? currentSearchIndex + 1 : 0} of ${searchResults.length}`,
    [hasSearchResults, currentSearchIndex, searchResults.length],
  )

  return (
    <div className="flex items-center border-border gap-4">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search in document..."
          value={localSearchQuery}
          onChange={handleInputChange}
          className="h-8 w-64 pl-8 pr-8 bg-muted"
          disabled={isSearching}
        />
        {localSearchQuery && (
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

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground w-12 text-center">{searchResultText}</span>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPreviousResult}
            className="h-8 w-8 p-0"
            disabled={!canGoPrevious}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={goToNextResult} className="h-8 w-8 p-0" disabled={!canGoNext}>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
