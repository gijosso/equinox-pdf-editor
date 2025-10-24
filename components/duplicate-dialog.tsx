"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface DuplicateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingDocumentName: string
  newDocumentName: string
  onConfirm: () => void
  onCancel: () => void
}

export function DuplicateDialog({
  open,
  onOpenChange,
  existingDocumentName,
  newDocumentName,
  onConfirm,
  onCancel,
}: DuplicateDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Duplicate PDF Detected</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <span>This PDF already exists in your documents as:</span>
            <br />
            <span className="font-medium text-foreground">{existingDocumentName}</span>
            <br />
            <br />
            <span className="mt-4">Do you want to create a new document with the name:</span>
            <br />
            <span className="font-medium text-foreground">{newDocumentName}</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Create New Document</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
