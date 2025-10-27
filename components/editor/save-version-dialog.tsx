"use client"

import {Save} from "lucide-react"
import React from "react"

import {Button} from "@/components/ui/button"
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/components/ui/dialog"
import {Label} from "@/components/ui/label"
import {Textarea} from "@/components/ui/textarea"
import {useToast} from "@/hooks/use-toast"
import {store} from "@/lib/store"
import {
  useGetAnnotationsByVersionQuery,
  useGetDocumentEditorQuery,
  useSaveDocumentEditorMutation,
} from "@/lib/store/api"
import {versionManager} from "@/lib/utils/version-manager"

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

  const [message, setMessage] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const {toast} = useToast()

  const handleSave = async () => {
    if (!documentId || !message.trim()) {
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
  }

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
              <p>This version will include:</p>
              <ul className="mt-1 list-disc list-inside">
                <li>{annotations.length} annotations (will be locked)</li>
                <li>Original PDF content (preserved)</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!message.trim() || isLoading} className="gap-2">
              <Save className="h-4 w-4" />
              {isLoading ? "Saving..." : "Save Version"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
