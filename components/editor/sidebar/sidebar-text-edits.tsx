"use client"

import {ChevronDown, ChevronRight, Edit3, FileText, Layers, List, Trash2} from "lucide-react"
import React from "react"

import {Button} from "@/components/ui/button"
import {ScrollArea} from "@/components/ui/scroll-area"
import {useDeleteTextEditMutation, useEditorActions, useGetTextEditsByVersionQuery} from "@/lib/store/api"
import type {TextEdit} from "@/lib/types"
import {formatDate} from "@/lib/utils"

interface SidebarTextEditsProps {
  documentId: string
}

const TextEditItem = React.memo(
  ({documentId, versionId, textEdit}: {documentId: string; versionId: string; textEdit: TextEdit}) => {
    const [deleteTextEdit] = useDeleteTextEditMutation()
    const {setCurrentPage, editor} = useEditorActions(documentId)
    const isDiffMode = editor?.isDiffMode || false

    // Memoize handlers to prevent unnecessary re-renders
    const handleSetCurrentPage = React.useCallback(
      async (pageNumber: number) => {
        await setCurrentPage(pageNumber)
      },
      [setCurrentPage],
    )

    const handleDelete = React.useCallback(async () => {
      try {
        await deleteTextEdit({id: textEdit.id, versionId}).unwrap()
      } catch (error) {
        console.error("Failed to delete text edit:", error)
      }
    }, [deleteTextEdit, textEdit.id, versionId])

    const isLocked = isDiffMode

    const formattedDate = React.useMemo(() => {
      const isUpdated = textEdit.updatedAt !== textEdit.createdAt
      const dateToFormat = isUpdated ? textEdit.updatedAt : textEdit.createdAt
      const isToday = new Date(dateToFormat).toDateString() === new Date().toDateString()

      return {
        isUpdated,
        formatted: formatDate(
          dateToFormat,
          isToday
            ? {hour: "2-digit", minute: "2-digit"}
            : {weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"},
        ),
      }
    }, [textEdit.updatedAt, textEdit.createdAt])

    const getOperationIcon = () => {
      switch (textEdit.operation) {
        case "insert":
          return <Edit3 className="h-4 w-4 text-green-600" />
        case "delete":
          return <Trash2 className="h-4 w-4 text-red-600" />
        case "replace":
          return <FileText className="h-4 w-4 text-blue-600" />
        default:
          return <Edit3 className="h-4 w-4" />
      }
    }

    const getOperationLabel = () => {
      switch (textEdit.operation) {
        case "insert":
          return "Insert"
        case "delete":
          return "Delete"
        case "replace":
          return "Replace"
        default:
          return "Edit"
      }
    }

    return (
      <div className={`rounded-lg border border-border p-3 h-24 ${isLocked ? "bg-muted opacity-75" : "bg-background"}`}>
        <div className="flex items-center justify-between gap-2 h-full">
          <div className="flex items-center gap-2 flex-1 min-w-0 max-w-full h-full">
            {getOperationIcon()}
            <div className="flex-1 min-w-0 max-w-full h-full flex flex-col justify-between">
              <div>
                <button
                  onClick={() => handleSetCurrentPage(textEdit.pageNumber)}
                  className="text-sm font-medium capitalize text-foreground"
                >
                  {getOperationLabel()}
                </button>
                <p className="text-xs text-muted-foreground">Page {textEdit.pageNumber}</p>
              </div>
              <div className="text-sm text-muted-foreground">
                <div className="block overflow-hidden text-ellipsis whitespace-nowrap italic max-w-48">
                  {textEdit.operation === "delete" ? (
                    <span className="line-through text-red-600">{textEdit.originalText}</span>
                  ) : textEdit.operation === "insert" ? (
                    <span className="text-green-600">{textEdit.newText}</span>
                  ) : (
                    <>
                      <span className="line-through text-red-600">{textEdit.originalText}</span>
                      <span className="mx-1">→</span>
                      <span className="text-green-600">{textEdit.newText}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                {formattedDate.isUpdated ? (
                  <div>Updated: {formattedDate.formatted}</div>
                ) : (
                  <div>Created: {formattedDate.formatted}</div>
                )}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className={`h-6 w-6 shrink-0 ${isLocked ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={handleDelete}
            disabled={isLocked}
            title={isLocked ? "Cannot delete during diff mode" : "Delete text edit"}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    )
  },
)

TextEditItem.displayName = "TextEditItem"

export function SidebarTextEdits({documentId}: SidebarTextEditsProps) {
  const {editor, setTextEditsViewMode} = useEditorActions(documentId)
  const currentVersionId = editor?.currentVersionId || null

  const {
    data: textEdits = [],
    isLoading,
    error,
  } = useGetTextEditsByVersionQuery(currentVersionId || "", {
    skip: !currentVersionId,
  })

  const viewMode = editor?.textEditsViewMode || "all"
  const [collapsedGroups, setCollapsedGroups] = React.useState<Set<string>>(new Set())

  const handleViewModeChange = React.useCallback(
    async (newViewMode: "all" | "grouped") => {
      await setTextEditsViewMode(newViewMode)
    },
    [setTextEditsViewMode],
  )

  const toggleGroup = React.useCallback((operation: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      if (next.has(operation)) {
        next.delete(operation)
      } else {
        next.add(operation)
      }
      return next
    })
  }, [])

  // Sort text edits by createdAt
  const sortedTextEdits = React.useMemo(() => {
    return [...textEdits].sort((a, b) => {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })
  }, [textEdits])

  const groupedTextEdits = React.useMemo(() => {
    const groups: Record<string, TextEdit[]> = {
      insert: [],
      delete: [],
      replace: [],
    }

    for (const textEdit of sortedTextEdits) {
      const operation = textEdit.operation || "replace"
      if (operation in groups) {
        groups[operation].push(textEdit)
      }
    }

    return groups
  }, [sortedTextEdits])

  const operationConfigs = [
    {operation: "insert", icon: <Edit3 className="h-4 w-4 text-green-600" />, label: "Insert"},
    {operation: "delete", icon: <Trash2 className="h-4 w-4 text-red-600" />, label: "Delete"},
    {operation: "replace", icon: <FileText className="h-4 w-4 text-blue-600" />, label: "Replace"},
  ]

  if (isLoading) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-border h-18 p-4">
          <p className="text-sm text-muted-foreground">Loading text edits...</p>
        </div>
        <ScrollArea className="flex-1 overflow-auto bg-muted">
          <div className="p-4 text-center text-muted-foreground">Loading...</div>
        </ScrollArea>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-border h-18 p-4">
          <p className="text-sm text-muted-foreground">Error loading text edits</p>
        </div>
        <ScrollArea className="flex-1 overflow-auto bg-muted">
          <div className="p-4 text-center text-destructive">Failed to load text edits</div>
        </ScrollArea>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border h-18 p-4">
        <p className="text-sm text-muted-foreground">{textEdits.length} total</p>
      </div>
      <ScrollArea className="flex-1 overflow-auto bg-muted">
        {textEdits.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Edit3 className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">No text edits yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Use the text editor to make changes</p>
          </div>
        ) : viewMode === "all" ? (
          <div className="space-y-2 p-4">
            {sortedTextEdits.map(textEdit => (
              <TextEditItem
                key={textEdit.id}
                documentId={documentId}
                versionId={currentVersionId || ""}
                textEdit={textEdit}
              />
            ))}
          </div>
        ) : (
          <div>
            {operationConfigs.map(config => {
              const operationTextEdits = groupedTextEdits[config.operation]

              if (operationTextEdits.length === 0) {
                return null
              }

              const isCollapsed = collapsedGroups.has(config.operation)

              return (
                <div key={config.operation}>
                  <button
                    onClick={() => toggleGroup(config.operation)}
                    className="flex w-full items-center gap-2 border-b border-border py-2 px-4 hover:opacity-70 transition-opacity bg-background"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                    {config.icon}
                    <h3 className="text-sm font-semibold text-foreground">
                      {config.label} ({operationTextEdits.length})
                    </h3>
                  </button>
                  {!isCollapsed && (
                    <div className="space-y-2 p-4">
                      {operationTextEdits.map(textEdit => (
                        <TextEditItem
                          key={textEdit.id}
                          documentId={documentId}
                          versionId={currentVersionId || ""}
                          textEdit={textEdit}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
