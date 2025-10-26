"use client"

import {Save} from "lucide-react"
import React from "react"

import {Button} from "@/components/ui/button"
import {Dialog, DialogContent, DialogHeader, DialogTitle} from "@/components/ui/dialog"
import {Label} from "@/components/ui/label"
import {Textarea} from "@/components/ui/textarea"
import {useAddVersionMutation} from "@/lib/store/api"
import {useAppSelector} from "@/lib/store/hooks"
import {selectEditorState} from "@/lib/store/selectors"

// import {createVersionWithXFDF} from "@/lib/utils/xfdf"

interface SaveVersionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SaveVersionDialog({open, onOpenChange}: SaveVersionDialogProps) {
  const {documentId, annotations, currentPage} = useAppSelector(selectEditorState)
  const [addVersion, {isLoading: saving}] = useAddVersionMutation()
  const [message, setMessage] = React.useState("")

  const handleSave = async () => {
    if (!documentId || !message.trim()) return

    try {
      // Create version object (you'll need to implement the version creation logic)
      const version = {
        id: crypto.randomUUID(),
        documentId,
        versionNumber: 1, // You might want to calculate this based on existing versions
        message: message.trim(),
        createdAt: new Date().toISOString(),
        xfdf: "", // You'll need to generate this from annotations
      }

      await addVersion(version).unwrap()
      setMessage("")
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to save version:", error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Save Version</DialogTitle>
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
                <li>Current page: {currentPage}</li>
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
