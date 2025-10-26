"use client"

import {formatDistanceToNow} from "date-fns"
import {Calendar, Clock, FileText} from "lucide-react"

import {Button} from "@/components/ui/button"
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/components/ui/dialog"
import {ScrollArea} from "@/components/ui/scroll-area"
import {useToast} from "@/hooks/use-toast"
import {useGetVersionsByDocumentQuery, useUpdateDocumentMutation} from "@/lib/store/api"
import {useAppDispatch, useAppSelector} from "@/lib/store/hooks"
import {setAnnotations, setCompareVersions, setCurrentVersion, toggleDiffMode} from "@/lib/store/slices"
import {convertXFDFAnnotationsToAnnotations} from "@/lib/utils/annotations"
import {xfdfToAnnotations} from "@/lib/utils/xfdf"

interface VersionHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function VersionHistoryDialog({open, onOpenChange}: VersionHistoryDialogProps) {
  const dispatch = useAppDispatch()
  const documentId = useAppSelector(state => state.editor.documentId)
  const [updateDocument, {isLoading: updating}] = useUpdateDocumentMutation()
  const {toast} = useToast()

  // Use RTK Query to fetch versions
  const {
    data: versions = [],
    isLoading,
    error,
  } = useGetVersionsByDocumentQuery(documentId || "", {
    skip: !documentId || !open, // Only fetch when dialog is open and documentId exists
  })

  const handleLoadVersion = async (versionId: string) => {
    if (!documentId) return

    const version = versions.find(v => v.id === versionId)
    if (!version) return

    try {
      // Update document to point to the selected version
      await updateDocument({
        documentId,
        updates: {currentVersionId: versionId},
      }).unwrap()

      // Load annotations from the selected version's XFDF
      const {annotations: xfdfAnnotations} = xfdfToAnnotations(version.xfdf)
      const annotations = convertXFDFAnnotationsToAnnotations(xfdfAnnotations)

      // Set annotations for the next version (working changes)
      // The selected version becomes the current committed state
      // We need to create a new version ID for the working changes
      const nextVersionId = `working-${Date.now()}`
      dispatch(setAnnotations({documentId, versionId: nextVersionId, annotations}))

      // Update the current version in Redux to point to the working version
      dispatch(setCurrentVersion({documentId, versionId: nextVersionId}))

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
          <DialogDescription>
            View and manage document versions. Load a previous version or compare versions to see changes.
          </DialogDescription>
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleLoadVersion(version.id)}
                          disabled={updating}
                        >
                          {updating ? "Loading..." : "Load"}
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
