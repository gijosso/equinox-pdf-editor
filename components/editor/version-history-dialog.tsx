"use client"

import {formatDistanceToNow} from "date-fns"
import {Calendar, Clock, FileText} from "lucide-react"
import React from "react"

import {Button} from "@/components/ui/button"
import {Dialog, DialogContent, DialogHeader, DialogTitle} from "@/components/ui/dialog"
import {ScrollArea} from "@/components/ui/scroll-area"
import {useAppDispatch, useAppSelector} from "@/lib/store/hooks"
import {selectVersionsByDocumentId} from "@/lib/store/selectors"
import {loadVersions, setCompareVersions, toggleDiffMode} from "@/lib/store/slices"

interface VersionHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function VersionHistoryDialog({open, onOpenChange}: VersionHistoryDialogProps) {
  const dispatch = useAppDispatch()
  const activeDocumentId = useAppSelector(state => state.editor.activeDocumentId)
  const versions = useAppSelector(selectVersionsByDocumentId(activeDocumentId || ""))

  // Load versions when dialog opens
  React.useEffect(() => {
    if (open && activeDocumentId) {
      dispatch(loadVersions(activeDocumentId))
    }
  }, [open, activeDocumentId, dispatch])

  const handleLoadVersion = (versionId: string) => {
    if (!activeDocumentId) return
    const version = versions.find(v => v.id === versionId)
    if (version) {
      // Load annotations from XFDF string
      // const annotations = loadAnnotationsFromVersion(version.xfdf)
      // dispatch(setAnnotations({documentId: activeDocumentId, annotations}))
      onOpenChange(false)
    }
  }

  const handleCompareVersions = (versionId: string) => {
    if (!activeDocumentId) return
    const currentVersionId = versions[versions.length - 1]?.id
    if (currentVersionId) {
      dispatch(setCompareVersions({documentId: activeDocumentId, versionIds: [currentVersionId, versionId]}))
      dispatch(toggleDiffMode(activeDocumentId))
      onOpenChange(false)
    }
  }

  if (!activeDocumentId) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Version History</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-96">
          <div className="space-y-4">
            {versions.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-muted-foreground">No versions found</p>
              </div>
            ) : (
              versions
                .slice()
                .reverse()
                .map(version => (
                  <div key={version.id} className="rounded-lg border border-border bg-card p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Version {version.versionNumber}</span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{version.message}</p>
                        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(version.createdAt).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(version.createdAt), {addSuffix: true})}
                          </div>
                          {/* <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {xfdfToAnnotations(version.xfdf).annotations.length} annotations
                          </div> */}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleLoadVersion(version.id)}>
                          Load
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleCompareVersions(version.id)}>
                          Compare
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
