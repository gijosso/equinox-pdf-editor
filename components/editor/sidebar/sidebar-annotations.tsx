"use client"

import {ChevronDown, ChevronRight, Highlighter, Layers, List, Square, StickyNote, Trash2} from "lucide-react"
import React from "react"

import {Button} from "@/components/ui/button"
import {ScrollArea} from "@/components/ui/scroll-area"
import {useAppDispatch, useAppSelector} from "@/lib/store/hooks"
import {selectEditorState} from "@/lib/store/selectors"
import {deleteAnnotation, setCurrentPage} from "@/lib/store/slices"
import type {Annotation, AnnotationType} from "@/lib/types"

type AnnotationToolConfig = {type: AnnotationType; icon: React.ReactNode; label: string}

const ANNOTATIONS_CONFIGS = {
  highlight: {type: "highlight", icon: <Highlighter className="h-4 w-4" />, label: "Highlight"},
  note: {type: "note", icon: <StickyNote className="h-4 w-4" />, label: "Sticky Note"},
  redaction: {type: "redaction", icon: <Square className="h-4 w-4" />, label: "Redaction"},
} as const satisfies {[K in AnnotationType]: AnnotationToolConfig}

export function SidebarAnnotations() {
  const {documentId, annotations} = useAppSelector(selectEditorState)
  const [viewMode, setViewMode] = React.useState<"all" | "grouped">("all")
  const [collapsedGroups, setCollapsedGroups] = React.useState<Set<string>>(new Set())

  const groupedAnnotations = React.useMemo(() => {
    const groups: Record<AnnotationType, Annotation[]> = {
      highlight: [],
      note: [],
      redaction: [],
    } satisfies {[K in AnnotationType]: Annotation[]}

    for (const annotation of annotations || []) {
      if (annotation.type in groups) {
        groups[annotation.type as keyof typeof groups].push(annotation)
      }
    }

    return groups
  }, [annotations])

  const toggleGroup = (type: AnnotationType) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      if (next.has(type)) {
        next.delete(type)
      } else {
        next.add(type)
      }
      return next
    })
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border h-18 p-4">
        <p className="text-sm text-muted-foreground">{annotations.length} total</p>
        <div className="flex gap-1 rounded-md border border-border p-1">
          <Button
            variant={viewMode === "all" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-2"
            onClick={() => setViewMode("all")}
          >
            <List className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={viewMode === "grouped" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-2"
            onClick={() => setViewMode("grouped")}
          >
            <Layers className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1 overflow-auto bg-muted">
        {annotations.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <StickyNote className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">No annotations yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Use the tools above to add annotations</p>
          </div>
        ) : viewMode === "all" ? (
          <div className="space-y-2 p-4">
            {annotations.map(annotation => (
              <AnnotationItem key={annotation.id} documentId={documentId} annotation={annotation} />
            ))}
          </div>
        ) : (
          <div>
            {Object.values(ANNOTATIONS_CONFIGS).map(annotation => {
              const typeAnnotations = groupedAnnotations[annotation.type]

              if (typeAnnotations.length === 0) {
                return null
              }

              const isCollapsed = collapsedGroups.has(annotation.type)

              return (
                <div key={annotation.type}>
                  <button
                    onClick={() => toggleGroup(annotation.type)}
                    className="flex w-full items-center gap-2 border-b border-border py-2 px-4 hover:opacity-70 transition-opacity bg-background"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                    {annotation.icon}
                    <h3 className="text-sm font-semibold text-foreground">
                      {annotation.label} ({typeAnnotations.length})
                    </h3>
                  </button>
                  {!isCollapsed && (
                    <div className="space-y-2 p-4">
                      {typeAnnotations.map(annotation => (
                        <AnnotationItem key={annotation.id} documentId={documentId || ""} annotation={annotation} />
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

const AnnotationItem = ({documentId, annotation}: {documentId: string; annotation: Annotation}) => {
  const dispatch = useAppDispatch()

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})
  }

  return (
    <div className="rounded-lg border border-border bg-background p-3 h-24">
      <div className="flex items-center justify-between gap-2 h-full">
        <div className="flex items-center gap-2 flex-1 min-w-0 max-w-full h-full">
          {ANNOTATIONS_CONFIGS[annotation.type].icon}
          <div className="flex-1 min-w-0 max-w-full h-full flex flex-col justify-between">
            <div>
              <button
                onClick={() => dispatch(setCurrentPage({documentId, page: annotation.pageNumber || 1}))}
                className="text-sm font-medium capitalize text-foreground"
              >
                {ANNOTATIONS_CONFIGS[annotation.type].label}
              </button>
              <p className="text-xs text-muted-foreground">Page {annotation.pageNumber || 1}</p>
            </div>
            <div className="text-sm text-muted-foreground">
              <div className="block overflow-hidden text-ellipsis whitespace-nowrap italic max-w-48">
                {annotation.content}
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              {annotation.updatedAt !== annotation.createdAt ? (
                <div>Updated: {formatDate(annotation.updatedAt)}</div>
              ) : (
                <div>Created: {formatDate(annotation.createdAt)}</div>
              )}
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={() => dispatch(deleteAnnotation({documentId, id: annotation.id}))}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}
