"use client"

import React from "react"

import {Button} from "@/components/ui/button"
import {useEditorActions} from "@/lib/store/api"
import {PDFVersion} from "@/lib/types"

interface VersionActionsProps {
  selectedVersions: PDFVersion[]
  onClose: () => void
  documentId: string
}

export function VersionActions({selectedVersions, onClose, documentId}: VersionActionsProps) {
  const {setDiffMode} = useEditorActions(documentId)

  const handleCompareSelected = React.useCallback(async () => {
    if (selectedVersions.length === 2) {
      await setDiffMode(
        true,
        selectedVersions.sort((a, b) => a.versionNumber - b.versionNumber).map(v => v.id),
      )
      onClose()
    }
  }, [selectedVersions, setDiffMode, onClose])

  const canCompare = selectedVersions.length === 2

  const sortedVersions = React.useMemo(() => {
    return selectedVersions.sort((a, b) => a.versionNumber - b.versionNumber)
  }, [selectedVersions])

  return (
    <div className="flex justify-between items-center border-t border-border p-4">
      <div className="text-sm text-muted-foreground">
        {sortedVersions.length === 0
          ? "Select versions to compare"
          : `Compare v${sortedVersions[0].versionNumber} -> v${sortedVersions[1]?.versionNumber ?? "?"}`}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button onClick={handleCompareSelected} disabled={!canCompare}>
          Compare Selected
        </Button>
      </div>
    </div>
  )
}
