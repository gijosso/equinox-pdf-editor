"use client"

import {ChevronDown, ChevronUp, Search, X} from "lucide-react"
import {useState} from "react"

import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {usePDFSearch} from "@/hooks/use-pdf-search"
import {useAppDispatch, useAppSelector} from "@/lib/store/hooks"
import {setSearchQuery} from "@/lib/store/slices/editor"

export function SearchBar() {
  const dispatch = useAppDispatch()
  const activeDocumentId = useAppSelector(state => state.editor.activeDocumentId)
  const [localSearchQuery, setLocalSearchQuery] = useState("")

  const {searchResults, currentSearchIndex, isSearching, clearSearch, goToNextResult, goToPreviousResult} =
    usePDFSearch(activeDocumentId)

  const handleNext = () => {
    goToNextResult()
  }

  const handlePrev = () => {
    goToPreviousResult()
  }

  const handleClear = () => {
    setLocalSearchQuery("")
    clearSearch()
    dispatch(setSearchQuery({documentId: activeDocumentId!, query: ""}))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocalSearchQuery(value)
    dispatch(setSearchQuery({documentId: activeDocumentId!, query: value}))
  }

  if (!activeDocumentId) {
    return null
  }

  if (isSearching) {
    return (
      <div className="flex items-center gap-2 border-border pr-4">
        <span className="text-sm text-muted-foreground">Loading PDF...</span>
      </div>
    )
  }

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

      {searchResults.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground w-12 text-center">
            {currentSearchIndex + 1} of {searchResults.length}
          </span>
          <div>
            <Button variant="ghost" size="sm" onClick={handlePrev} className="h-8 w-8 p-0" disabled={isSearching}>
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleNext} className="h-8 w-8 p-0" disabled={isSearching}>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {isSearching && <span className="text-sm text-muted-foreground">Searching...</span>}
    </div>
  )
}
