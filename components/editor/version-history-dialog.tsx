"use client"

import {formatDistanceToNow} from "date-fns"
import {Calendar, Clock, FileText} from "lucide-react"
import React from "react"

import {Button} from "@/components/ui/button"
import {Dialog, DialogContent, DialogHeader, DialogTitle} from "@/components/ui/dialog"
import {ScrollArea} from "@/components/ui/scroll-area"
import {useGetVersionsByDocumentQuery} from "@/lib/store/api"
import {useAppDispatch, useAppSelector} from "@/lib/store/hooks"
import {setCompareVersions, toggleDiffMode} from "@/lib/store/slices"

interface VersionHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function VersionHistoryDialog({open, onOpenChange}: VersionHistoryDialogProps) {
  const dispatch = useAppDispatch()
  const documentId = useAppSelector(state => state.editor.documentId)

  // Use RTK Query to fetch versions
  const {
    data: versions = [],
    isLoading,
    error,
  } = useGetVersionsByDocumentQuery(documentId || "", {
    skip: !documentId || !open, // Only fetch when dialog is open and documentId exists
  })

  const handleLoadVersion = (versionId: string) => {
    if (!documentId) return
    const version = versions.find(v => v.id === versionId)
    if (version) {
      // Load annotations from XFDF string
      // const annotations = loadAnnotationsFromVersion(version.xfdf)
      // dispatch(setAnnotations({documentId: documentId, annotations}))
      onOpenChange(false)
    }
  }

  const handleCompareVersions = (versionId: string) => {
    if (!documentId) return
    const currentVersionId = versions[versions.length - 1]?.id
    if (currentVersionId) {
      dispatch(setCompareVersions({documentId: documentId, versionIds: [currentVersionId, versionId]}))
      dispatch(toggleDiffMode(documentId))
      onOpenChange(false)
    }
  }

  if (!documentId) {
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
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-muted-foreground">Loading versions...</p>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-red-600">Failed to load versions</p>
              </div>
            ) : versions.length === 0 ? (
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
