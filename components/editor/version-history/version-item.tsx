"use client"

import {formatDistanceToNow} from "date-fns"
import {Calendar, Clock, FileText} from "lucide-react"
import React from "react"

import {Button} from "@/components/ui/button"
import type {PDFVersion} from "@/lib/types"

interface VersionItemProps {
  version: PDFVersion
  isCurrent: boolean
  isSelected: boolean
  onSelect: (version: PDFVersion) => void
  onLoad: (version: PDFVersion) => void
  onCompare: (version: PDFVersion) => void
  isLoading: boolean
}

export function VersionItem({
  version,
  isCurrent,
  isSelected,
  onSelect,
  onLoad,
  onCompare,
  isLoading,
}: VersionItemProps) {
  const handleSelect = React.useCallback(() => {
    onSelect(version)
  }, [onSelect, version])

  const handleLoad = React.useCallback(() => {
    onLoad(version)
  }, [onLoad, version])

  const handleCompare = React.useCallback(() => {
    onCompare(version)
  }, [onCompare, version])

  return (
    <div
      className={`rounded-lg border p-4 cursor-pointer transition-colors ${
        isCurrent
          ? "border-primary bg-primary/5"
          : isSelected
            ? "border-primary/50 bg-primary/5"
            : "border-border hover:border-primary/50"
      }`}
      onClick={handleSelect}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium text-sm">Version {version.versionNumber}</h3>
            {isCurrent && <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">Current</span>}
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDistanceToNow(new Date(version.createdAt), {addSuffix: true})}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{new Date(version.createdAt).toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 ml-4">
          <Button
            size="sm"
            variant="outline"
            onClick={e => {
              e.stopPropagation()
              handleLoad()
            }}
            disabled={isCurrent || isLoading}
          >
            Load
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={e => {
              e.stopPropagation()
              handleCompare()
            }}
            disabled={isCurrent || isLoading}
          >
            Compare with Latest
          </Button>
        </div>
      </div>
    </div>
  )
}
