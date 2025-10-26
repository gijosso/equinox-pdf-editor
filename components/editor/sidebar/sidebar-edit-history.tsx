"use client"

import {formatDistanceToNow} from "date-fns"
import {Edit, History, Plus, RotateCcw, Trash2} from "lucide-react"

import {Button} from "@/components/ui/button"
import {ScrollArea} from "@/components/ui/scroll-area"
import {useGetDocumentEditorQuery, useSaveDocumentEditorMutation} from "@/lib/store/api"

interface SidebarEditHistoryProps {
  documentId: string
}

export function SidebarEditHistory({documentId}: SidebarEditHistoryProps) {
  const [saveDocumentEditor] = useSaveDocumentEditorMutation()
  const {data: editor} = useGetDocumentEditorQuery(documentId, {
    skip: !documentId,
  })

  const history = editor?.history || []
  const historyIndex = editor?.historyIndex || 0

  const getActionIcon = (action: string) => {
    switch (action) {
      case "add-annotation":
        return <Plus className="h-4 w-4" />
      case "update-annotation":
        return <Edit className="h-4 w-4" />
      case "delete-annotation":
        return <Trash2 className="h-4 w-4" />
      default:
        return <History className="h-4 w-4" />
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case "add-annotation":
        return "text-green-500"
      case "update-annotation":
        return "text-blue-500"
      case "delete-annotation":
        return "text-red-500"
      default:
        return "text-muted-foreground"
    }
  }

  const handleJumpToHistory = async (index: number) => {
    if (!editor || !documentId) return

    const updatedEditor = {
      ...editor,
      historyIndex: index,
    }

    try {
      await saveDocumentEditor({documentId, editor: updatedEditor}).unwrap()
    } catch (error) {
      console.error("Failed to jump to history:", error)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center border-b border-border h-18 p-4">
        <p className="text-sm text-muted-foreground">{history.length} total</p>
      </div>
      <ScrollArea className="flex-1 overflow-auto bg-muted">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <History className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">No edit history yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Your actions will be tracked here</p>
          </div>
        ) : (
          <div className="space-y-1 p-4">
            {history.map((entry: any, index: number) => {
              const annotation = entry.state.annotations[entry.state.annotations.length - 1]
              const highlightedText = annotation?.type === "highlight" && annotation.text ? annotation.text : null

              return (
                <div
                  key={entry.id}
                  className={`rounded-lg border p-3 ${
                    index === historyIndex
                      ? "border-primary bg-primary/10"
                      : index > historyIndex
                        ? "border-border bg-muted/50 opacity-50"
                        : "border-border bg-background"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 ${getActionColor(entry.action)}`}>{getActionIcon(entry.action)}</div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{entry.description}</p>
                      {highlightedText && (
                        <p className="mt-1 rounded bg-yellow-100 px-2 py-1 text-xs text-foreground dark:bg-yellow-900/30">
                          "{highlightedText}"
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(entry.timestamp, {addSuffix: true})}
                      </p>
                    </div>
                    {index === historyIndex ? (
                      <span className="rounded bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                        Current
                      </span>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleJumpToHistory(index)}
                        className="h-7 gap-1 px-2"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span className="text-xs">Restore</span>
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
