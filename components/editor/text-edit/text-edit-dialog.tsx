"use client"

import {Edit3, Minus, Plus} from "lucide-react"
import React from "react"

import type {TextEditOperation, TextSelection} from "@/lib/types"

import {Button} from "../../ui/button"
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from "../../ui/dialog"
import {Input} from "../../ui/input"

interface TextEditDialogProps {
  isOpen: boolean
  selection: TextSelection | null
  onDelete: () => void
  onSave: (operation: TextEditOperation) => void
  onCancel: () => void
}

const TEXT_EDIT_DIALOG_CONFIGS = {
  insert: {
    title: "Insert Text",
    icon: <Plus className="h-3 w-3" />,
    label: "Insert",
    description: "Insert text at the selection",
    variant: "default",
  },
  replace: {
    title: "Replace Text",
    icon: <Edit3 className="h-3 w-3" />,
    label: "Replace",
    description: "Replace text at the selection",
    variant: "default",
  },
  delete: {
    title: "Delete Text",
    icon: <Minus className="h-3 w-3" />,
    label: "Delete",
    description: "Delete text at the selection",
    variant: "destructive",
  },
} as const satisfies {
  [K in TextEditOperation["type"]]: {
    title: string
    icon: React.ReactNode
    label: string
    description: string
    variant: "default" | "destructive"
  }
}

export function TextEditDialog({isOpen, selection, onDelete, onSave, onCancel}: TextEditDialogProps) {
  const [editText, setEditText] = React.useState("")
  const [currentOperation, setCurrentOperation] = React.useState<TextEditOperation["type"] | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    setEditText(selection?.text || "")
  }, [selection])

  React.useEffect(() => {
    if (!isOpen) {
      setCurrentOperation(null)
    }
  }, [isOpen])

  const handleOperationClick = React.useCallback(
    (operation: TextEditOperation["type"]) => {
      if (operation === "delete") {
        onDelete()
        return
      }

      setCurrentOperation(operation)

      if (inputRef.current) {
        inputRef.current.focus()
        inputRef.current.select()
      }
    },
    [onDelete],
  )

  const handleSave = React.useCallback(async () => {
    if (!selection || !currentOperation) {
      return
    }

    const textEditOperation: TextEditOperation = {
      type: currentOperation,
      selection,
      newText: editText,
      fontInfo: selection.fontInfo,
    }
    onSave(textEditOperation)
    setCurrentOperation(null)
  }, [selection, currentOperation, editText, onSave])

  const onOpenChange = React.useCallback(
    (open: boolean) => {
      if (!open) {
        onCancel()
      }
    },
    [onCancel],
  )

  if (!selection) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" aria-describedby="text-edit-dialog-description">
        <DialogHeader>
          <DialogTitle>Create Text Edit</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {Object.entries(TEXT_EDIT_DIALOG_CONFIGS).map(([key, value]) => (
                <Button
                  key={key}
                  size="sm"
                  variant={value.variant}
                  onClick={() => handleOperationClick(key as TextEditOperation["type"])}
                >
                  {value.icon}
                  {value.label}
                </Button>
              ))}
            </div>
          </div>

          <Input
            ref={inputRef}
            type="text"
            value={editText}
            onChange={e => setEditText(e.target.value)}
            placeholder={selection.text}
            className="w-full"
            disabled={!currentOperation}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!currentOperation}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
