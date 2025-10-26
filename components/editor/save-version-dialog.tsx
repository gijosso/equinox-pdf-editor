"use client"

import {Save} from "lucide-react"
import React from "react"

import {Button} from "@/components/ui/button"
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/components/ui/dialog"
import {Label} from "@/components/ui/label"
import {Textarea} from "@/components/ui/textarea"
import {useToast} from "@/hooks/use-toast"
import {
  useGetAnnotationsByVersionQuery,
  useGetDocumentEditorQuery,
  useUpdateDocumentWithVersionMutation,
} from "@/lib/store/api"
import {saveVersion} from "@/lib/utils/version"

interface SaveVersionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onVersionSaved?: () => void
  documentId: string
}

export function SaveVersionDialog({open, onOpenChange, onVersionSaved, documentId}: SaveVersionDialogProps) {
  const {data: editor} = useGetDocumentEditorQuery(documentId, {skip: !documentId})
  const currentVersionId = editor?.currentVersionId || null

  const {data: annotations = []} = useGetAnnotationsByVersionQuery(currentVersionId || "", {
    skip: !currentVersionId,
  })

  const [updateDocumentWithVersion, {isLoading: saving}] = useUpdateDocumentWithVersionMutation()
  const [message, setMessage] = React.useState("")
  const {toast} = useToast()

  const handleSave = async () => {
    if (!documentId || !message.trim()) return

    const result = await saveVersion({
      documentId,
      message: message.trim(),
      annotations: annotations || [],
      updateDocumentWithVersion,
    })

    if (result.success) {
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
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Save Version</DialogTitle>
          <DialogDescription>
            Create a new version with your current annotations. This will commit your changes to a new version.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
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
                <li>{annotations.length} annotations</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!message.trim() || saving} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Version"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
