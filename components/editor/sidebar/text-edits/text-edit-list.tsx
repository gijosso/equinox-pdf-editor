"use client"

import {ChevronDown, ChevronRight, Edit3} from "lucide-react"
import React from "react"

import {ScrollArea} from "@/components/ui/scroll-area"
import type {TextEdit} from "@/lib/types"

import {TEXT_EDIT_CONFIGS_ARRAY} from "./text-edit-configs"
import {TextEditItem} from "./text-edit-item"

interface TextEditListProps {
  documentId: string
  versionId: string
  textEdits: TextEdit[]
  viewMode: "all" | "grouped"
}

export function TextEditList({documentId, versionId, textEdits, viewMode}: TextEditListProps) {
  const [collapsedGroups, setCollapsedGroups] = React.useState<Set<string>>(new Set())

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

  if (textEdits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Edit3 className="h-12 w-12 text-muted-foreground" />
        <p className="mt-4 text-sm text-muted-foreground">No text edits yet</p>
        <p className="mt-1 text-xs text-muted-foreground">Use the text editor to make changes</p>
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1 overflow-auto bg-muted">
      {viewMode === "all" ? (
        <div className="space-y-2 p-4">
          {sortedTextEdits.map(textEdit => (
            <TextEditItem key={textEdit.id} documentId={documentId} versionId={versionId} textEdit={textEdit} />
          ))}
        </div>
      ) : (
        <div>
          {TEXT_EDIT_CONFIGS_ARRAY.map(config => {
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
                        versionId={versionId}
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
  )
}
