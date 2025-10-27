"use client"

import {Save} from "lucide-react"
import React from "react"

import {Button} from "@/components/ui/button"
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/components/ui/dialog"
import {Label} from "@/components/ui/label"
import {Textarea} from "@/components/ui/textarea"
import {useToast} from "@/hooks/use-toast"
import {versionManager} from "@/lib/services/version-manager"
import {store} from "@/lib/store"
import {
  useGetAnnotationsByVersionQuery,
  useGetDocumentEditorQuery,
  useHasEditsQuery,
  useSaveDocumentEditorMutation,
} from "@/lib/store/api"

interface SaveVersionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onVersionSaved?: () => void
  documentId: string
}

export function SaveVersionDialog({open, onOpenChange, onVersionSaved, documentId}: SaveVersionDialogProps) {
  const [saveDocumentEditor] = useSaveDocumentEditorMutation()
  const {data: editor} = useGetDocumentEditorQuery(documentId, {skip: !documentId})
  const currentVersionId = editor?.currentVersionId || null

  const {data: annotations = []} = useGetAnnotationsByVersionQuery(currentVersionId || "", {
    skip: !currentVersionId,
  })

  const {data: hasEdits = false} = useHasEditsQuery(currentVersionId || "", {
    skip: !currentVersionId,
  })

  const [message, setMessage] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const {toast} = useToast()

  const handleSave = React.useCallback(async () => {
    if (!documentId || !message.trim()) {
      return
    }

    // Prevent saving if there are no edits
    if (!hasEdits) {
      toast({
        title: "No changes to save",
        description: "There are no edits to save. Make some changes before creating a new version.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const result = await versionManager.commitVersion({
        documentId,
        message: message.trim(),
        annotations: annotations || [],
      })

      if (result.success) {
        // Update editor state to use the new version as current
        if (editor && result.versionId) {
          const updatedEditor = {
            ...editor,
            currentVersionId: result.versionId,
          }
          await saveDocumentEditor({documentId, editor: updatedEditor}).unwrap()
        }

        // Invalidate cache to refresh version history and document data
        store.dispatch({
          type: "versionsApi/invalidateTags",
          payload: [
            {type: "Version", id: `document-${documentId}`},
            {type: "Document", id: documentId},
          ],
        })

        // Invalidate annotations cache to refresh annotation data
        store.dispatch({
          type: "annotationsApi/invalidateTags",
          payload: [
            {type: "Annotation", id: `version-${currentVersionId}`}, // Previous version annotations
            {type: "Annotation", id: `version-${result.versionId}`}, // New version annotations
          ],
        })

        // Invalidate edits cache to refresh edit data
        store.dispatch({
          type: "editsApi/invalidateTags",
          payload: [
            {type: "Edit", id: `version-${currentVersionId}`}, // Previous version edits
            {type: "Edit", id: `version-${result.versionId}`}, // New version edits
          ],
        })

        // Also invalidate documentsApi cache to refresh document metadata
        store.dispatch({
          type: "documentsApi/invalidateTags",
          payload: [{type: "Document", id: documentId}],
        })

        // Show success toast
        toast({
          title: "Version saved",
          description: `Version ${result.versionNumber} has been saved successfully.`,
        })

        setMessage("")
        onOpenChange(false)
        onVersionSaved?.() // Refresh PDF blob after saving
      } else {
        toast({
          title: "Failed to save version",
          description: result.error || "There was an error saving the version. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Failed to save version",
        description: "There was an error saving the version. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [documentId, message, hasEdits, annotations, editor, saveDocumentEditor, toast, onOpenChange, onVersionSaved])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Save Version</DialogTitle>
          <DialogDescription>
            Create a new version with your current annotations. Committed annotations will be locked and cannot be
            modified.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="message">Version Message</Label>
            <Textarea
              id="message"
              placeholder="Describe the changes in this version..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="min-h-20"
            />
          </div>

          <div className="rounded-lg border border-border bg-muted/50 p-3">
            <div className="text-sm text-muted-foreground">
              {hasEdits ? (
                <>
                  <p>This version will include:</p>
                  <ul className="mt-1 list-disc list-inside">
                    <li>{annotations.length} annotations (will be locked)</li>
                    <li>Original PDF content (preserved)</li>
                  </ul>
                </>
              ) : (
                <p className="text-amber-600 dark:text-amber-400">
                  ⚠️ No edits detected. Make some changes before saving a new version.
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!message.trim() || isLoading || !hasEdits} className="gap-2">
              <Save className="h-4 w-4" />
              {isLoading ? "Saving..." : "Save Version"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
