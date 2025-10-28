"use client"

import React from "react"

import {Button} from "@/components/ui/button"
import {useEditorActions} from "@/lib/store/api"

interface VersionActionsProps {
  selectedVersions: string[]
  onClose: () => void
  documentId: string
}

export function VersionActions({selectedVersions, onClose, documentId}: VersionActionsProps) {
  const {setDiffMode} = useEditorActions(documentId)

  const handleCompareSelected = React.useCallback(async () => {
    if (selectedVersions.length === 2) {
      await setDiffMode(true, selectedVersions)
      onClose()
    }
  }, [selectedVersions, setDiffMode, onClose])

  const canCompare = selectedVersions.length === 2

  return (
    <div className="flex justify-between items-center border-t border-border p-4">
      <div className="text-sm text-muted-foreground">
        {selectedVersions.length === 0 && "Select versions to compare"}
        {selectedVersions.length === 1 && "Select one more version to compare"}
        {selectedVersions.length === 2 && "Ready to compare selected versions"}
        {selectedVersions.length > 2 && "Select only 2 versions to compare"}
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
