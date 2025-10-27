"use client"

import {formatDistanceToNow} from "date-fns"
import {Calendar, Clock, FileText} from "lucide-react"
import React from "react"

import {Button} from "@/components/ui/button"
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/components/ui/dialog"
import {ScrollArea} from "@/components/ui/scroll-area"
import {useToast} from "@/hooks/use-toast"
import {annotationService} from "@/lib/db/annotations"
import {useEditorActions, useGetVersionsByDocumentQuery, useUpdateDocumentMutation} from "@/lib/store/api"

interface VersionHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentId: string
}

export function VersionHistoryDialog({open, onOpenChange, documentId}: VersionHistoryDialogProps) {
  const [updateDocument, {isLoading: updating}] = useUpdateDocumentMutation()
  const {editor, setCurrentVersionId, setDiffMode} = useEditorActions(documentId)
  const {toast} = useToast()
  const [selectedVersions, setSelectedVersions] = React.useState<string[]>([])

  // Use RTK Query to fetch versions
  const {
    data: versions = [],
    isLoading,
    error,
  } = useGetVersionsByDocumentQuery(documentId, {
    skip: !documentId || !open, // Only fetch when dialog is open and documentId exists
  })

  // Reset selected versions when dialog closes
  React.useEffect(() => {
    if (!open) {
      setSelectedVersions([])
    }
  }, [open])

  const handleLoadVersion = async (versionId: string) => {
    if (!documentId || !editor) {
      return
    }

    const version = versions.find(v => v.id === versionId)
    if (!version) {
      return
    }

    try {
      // Update document to point to the selected version
      await updateDocument({
        documentId,
        updates: {currentVersionId: versionId},
      }).unwrap()

      const annotationsResult = await annotationService.getAnnotationsByVersion(versionId)
      const annotations = annotationsResult.success ? annotationsResult.data : []

      // Create a new version ID for the working changes
      const nextVersionId = `working-${Date.now()}`

      // Update editor state with the new version
      await setCurrentVersionId(nextVersionId)

      // Show success toast
      toast({
        title: "Version loaded",
        description: `Version ${version.versionNumber} has been loaded successfully.`,
      })

      onOpenChange(false)
    } catch (error) {
      console.error("Failed to load version:", error)
      toast({
        title: "Failed to load version",
        description: "There was an error loading the selected version.",
        variant: "destructive",
      })
    }
  }

  const handleVersionSelect = (versionId: string) => {
    if (selectedVersions.includes(versionId)) {
      setSelectedVersions(selectedVersions.filter(id => id !== versionId))
    } else if (selectedVersions.length < 2) {
      setSelectedVersions([...selectedVersions, versionId])
    } else {
      // Replace the first selected version
      setSelectedVersions([selectedVersions[1], versionId])
    }
  }

  const handleCompareSelectedVersions = async () => {
    if (!documentId || !editor || selectedVersions.length !== 2) {
      return
    }

    try {
      await setDiffMode(true, selectedVersions)
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to enable diff mode:", error)
      toast({
        title: "Failed to compare versions",
        description: "There was an error enabling diff mode.",
        variant: "destructive",
      })
    }
  }

  const handleCompareVersions = async (versionId: string) => {
    if (!documentId || !editor) {
      return
    }
    const currentVersionId = versions[versions.length - 1]?.id
    if (currentVersionId) {
      try {
        await setDiffMode(true, [currentVersionId, versionId])
        onOpenChange(false)
      } catch (error) {
        console.error("Failed to enable diff mode:", error)
        toast({
          title: "Failed to compare versions",
          description: "There was an error enabling diff mode.",
          variant: "destructive",
        })
      }
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
          <DialogDescription>
            View and manage document versions. Load a previous version or compare versions to see changes.
          </DialogDescription>
        </DialogHeader>

        {/* Selection summary and compare button */}
        {selectedVersions.length > 0 && (
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="text-sm text-muted-foreground">
              {selectedVersions.length === 1
                ? "Select one more version to compare"
                : `Selected ${selectedVersions.length} versions for comparison`}
            </div>
            {selectedVersions.length === 2 && (
              <Button onClick={handleCompareSelectedVersions} size="sm">
                Compare Selected Versions
              </Button>
            )}
          </div>
        )}

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
                  <div
                    key={version.id}
                    className={`rounded-lg border border-border bg-card p-4 ${
                      selectedVersions.includes(version.id) ? "ring-2 ring-primary" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <input
                          type="checkbox"
                          checked={selectedVersions.includes(version.id)}
                          onChange={() => handleVersionSelect(version.id)}
                          className="mt-1"
                        />
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
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleLoadVersion(version.id)}
                          disabled={updating}
                        >
                          {updating ? "Loading..." : "Load"}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleCompareVersions(version.id)}>
                          Compare with Latest
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
