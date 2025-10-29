"use client"

import {ScrollArea} from "@/components/ui/scroll-area"
import type {PDFVersion} from "@/lib/types"

import {VersionItem} from "./version-item"

interface VersionListProps {
  versions: PDFVersion[]
  currentVersionId: string | null
  selectedVersions: Pick<PDFVersion, "id" | "versionNumber">[]
  onSelectVersion: (version: PDFVersion) => void
  onLoadVersion: (version: PDFVersion) => void
  onCompareVersion: (version: PDFVersion) => void
  isLoading: boolean
}

export function VersionList({
  versions,
  currentVersionId,
  selectedVersions,
  onSelectVersion,
  onLoadVersion,
  onCompareVersion,
  isLoading,
}: VersionListProps) {
  if (versions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="text-muted-foreground mb-4">
          <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <p className="text-sm text-muted-foreground">No versions available</p>
        <p className="text-xs text-muted-foreground mt-1">Versions will appear here as you make changes</p>
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1 overflow-auto">
      <div className="space-y-3 p-4">
        {versions.map(version => (
          <VersionItem
            key={version.id}
            version={version}
            isCurrent={version.id === currentVersionId}
            isSelected={selectedVersions.some(v => v.id === version.id)}
            onSelect={onSelectVersion}
            onLoad={onLoadVersion}
            onCompare={onCompareVersion}
            isLoading={isLoading}
          />
        ))}
      </div>
    </ScrollArea>
  )
}
