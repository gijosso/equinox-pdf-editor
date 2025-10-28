"use client"

import {ChevronDown, ChevronRight} from "lucide-react"
import React from "react"

import {ScrollArea} from "@/components/ui/scroll-area"
import type {Annotation, AnnotationType} from "@/lib/types"
import {isAnnotationLocked} from "@/lib/utils/annotations"

import {ANNOTATION_CONFIGS_ARRAY} from "./annotation-configs"
import {AnnotationItem} from "./annotation-item"

interface AnnotationListProps {
  documentId: string
  versionId: string
  annotations: Annotation[]
  viewMode: "all" | "grouped"
}

export function AnnotationList({documentId, versionId, annotations, viewMode}: AnnotationListProps) {
  const [collapsedGroups, setCollapsedGroups] = React.useState<Set<string>>(new Set())

  const toggleGroup = React.useCallback((type: AnnotationType) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      if (next.has(type)) {
        next.delete(type)
      } else {
        next.add(type)
      }
      return next
    })
  }, [])

  // Sort annotations: unlocked first (by createdAt), then locked (by createdAt)
  const sortedAnnotations = React.useMemo(() => {
    return [...annotations].sort((a, b) => {
      const aLocked = isAnnotationLocked(a)
      const bLocked = isAnnotationLocked(b)

      // If both have same lock status, sort by createdAt
      if (aLocked === bLocked) {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      }

      // Unlocked annotations come first
      return aLocked ? 1 : -1
    })
  }, [annotations])

  const groupedAnnotations = React.useMemo(() => {
    const groups: Record<AnnotationType, Annotation[]> = {
      highlight: [],
      note: [],
      redaction: [],
    } satisfies {[K in AnnotationType]: Annotation[]}

    for (const annotation of sortedAnnotations) {
      if (annotation.type in groups) {
        groups[annotation.type as keyof typeof groups].push(annotation)
      }
    }

    return groups
  }, [sortedAnnotations])

  if (annotations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="h-12 w-12 text-muted-foreground" />
        <p className="mt-4 text-sm text-muted-foreground">No annotations yet</p>
        <p className="mt-1 text-xs text-muted-foreground">Use the tools above to add annotations</p>
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1 overflow-auto bg-muted">
      {viewMode === "all" ? (
        <div className="space-y-2 p-4">
          {sortedAnnotations.map(annotation => (
            <AnnotationItem key={annotation.id} documentId={documentId} versionId={versionId} annotation={annotation} />
          ))}
        </div>
      ) : (
        <div>
          {ANNOTATION_CONFIGS_ARRAY.map(config => {
            const typeAnnotations = groupedAnnotations[config.type]

            if (typeAnnotations.length === 0) {
              return null
            }

            const isCollapsed = collapsedGroups.has(config.type)

            return (
              <div key={config.type}>
                <button
                  onClick={() => toggleGroup(config.type)}
                  className="flex w-full items-center gap-2 border-b border-border py-2 px-4 hover:opacity-70 transition-opacity bg-background"
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                  {config.icon}
                  <h3 className="text-sm font-semibold text-foreground">
                    {config.label} ({typeAnnotations.length})
                  </h3>
                </button>
                {!isCollapsed && (
                  <div className="space-y-2 p-4">
                    {typeAnnotations.map(annotation => (
                      <AnnotationItem
                        key={annotation.id}
                        documentId={documentId}
                        versionId={versionId}
                        annotation={annotation}
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
