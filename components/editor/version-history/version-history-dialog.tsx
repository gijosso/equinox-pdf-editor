"use client"

import React from "react"

import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/components/ui/dialog"
import {useToast} from "@/hooks/use-toast"
import {
  useEditorActions,
  useGetDocumentQuery,
  useGetVersionsByDocumentQuery,
  useUpdateDocumentMutation,
} from "@/lib/store/api"
import {PDFVersion} from "@/lib/types"

import {VersionActions, VersionList} from "."

interface VersionHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentId: string
}

export function VersionHistoryDialog({open, onOpenChange, documentId}: VersionHistoryDialogProps) {
  const [updateDocument, {isLoading: updating}] = useUpdateDocumentMutation()
  const {editor, setCurrentVersionId, setDiffMode} = useEditorActions(documentId)
  const {data: document} = useGetDocumentQuery(documentId, {skip: !documentId})
  const {toast} = useToast()
  const [selectedVersions, setSelectedVersions] = React.useState<PDFVersion[]>([])
  const currentVersionId = editor?.currentVersionId || null

  const {
    data: versions = [],
    isLoading,
    error,
  } = useGetVersionsByDocumentQuery(documentId, {skip: !documentId || !open})

  React.useEffect(() => {
    if (!open) {
      setSelectedVersions([])
    }
  }, [open])

  const handleLoadVersion = React.useCallback(
    async (version: PDFVersion) => {
      if (!documentId || !editor) {
        return
      }

      try {
        await updateDocument({
          documentId,
          updates: {currentVersionId: version.id},
        }).unwrap()

        await setCurrentVersionId(version.id)
        toast({
          title: "Version Loaded",
          description: `Switched to version ${version.versionNumber}`,
          duration: 2000,
        })
        onOpenChange(false)
      } catch (error) {
        console.error("Failed to load version:", error)
        toast({
          title: "Error",
          description: "Failed to load version. Please try again.",
          variant: "destructive",
          duration: 3000,
        })
      }
    },
    [documentId, editor, updateDocument, setCurrentVersionId, toast, onOpenChange],
  )

  const handleSelectVersion = React.useCallback(
    (version: PDFVersion) => {
      setSelectedVersions(prev => {
        if (prev.some(v => v.id === version.id)) {
          return prev.filter(v => v.id !== version.id)
        } else if (prev.length < 2) {
          return [...prev, version]
        } else {
          return [prev[1], version]
        }
      })
    },
    [setSelectedVersions],
  )

  const handleCompareVersion = React.useCallback(
    async (version: PDFVersion) => {
      if (!currentVersionId) {
        return
      }

      await setDiffMode(true, [version.id, currentVersionId])
      onOpenChange(false)
    },
    [currentVersionId, setDiffMode, onOpenChange],
  )

  const sortedVersions = React.useMemo(() => {
    return [...versions].sort((a, b) => b.versionNumber - a.versionNumber)
  }, [versions])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Version History</DialogTitle>
          <DialogDescription>
            {document?.name ? `Version history for "${document.name}"` : "Manage document versions"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-sm text-muted-foreground">Loading versions...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-sm text-destructive">Failed to load versions</p>
                <p className="text-xs text-muted-foreground mt-1">Please try again later</p>
              </div>
            </div>
          ) : (
            <VersionList
              versions={sortedVersions}
              currentVersionId={currentVersionId}
              selectedVersions={selectedVersions}
              onSelectVersion={handleSelectVersion}
              onLoadVersion={handleLoadVersion}
              onCompareVersion={handleCompareVersion}
              isLoading={updating}
            />
          )}
        </div>

        <VersionActions
          selectedVersions={selectedVersions}
          onClose={() => onOpenChange(false)}
          documentId={documentId}
        />
      </DialogContent>
    </Dialog>
  )
}
