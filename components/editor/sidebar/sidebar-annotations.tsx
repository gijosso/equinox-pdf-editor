"use client"

import {ChevronDown, ChevronRight, Highlighter, Layers, List, Square, StickyNote, Trash2} from "lucide-react"
import React from "react"

import {Button} from "@/components/ui/button"
import {ScrollArea} from "@/components/ui/scroll-area"
import {
  useDeleteAnnotationMutation,
  useGetAnnotationsByVersionQuery,
  useGetDocumentEditorQuery,
  useSaveDocumentEditorMutation,
} from "@/lib/store/api"
import type {Annotation, AnnotationType} from "@/lib/types"
import {formatDate} from "@/lib/utils"

type AnnotationToolConfig = {type: AnnotationType; icon: React.ReactNode; label: string}

const ANNOTATIONS_CONFIGS = {
  highlight: {type: "highlight" as const, icon: <Highlighter className="h-4 w-4" />, label: "Highlight"},
  note: {type: "note" as const, icon: <StickyNote className="h-4 w-4" />, label: "Sticky Note"},
  redaction: {type: "redaction" as const, icon: <Square className="h-4 w-4" />, label: "Redaction"},
} as const satisfies {[K in AnnotationType]: AnnotationToolConfig}

const ANNOTATION_CONFIGS_ARRAY = Object.values(ANNOTATIONS_CONFIGS)

interface SidebarAnnotationsProps {
  documentId: string
}

const AnnotationItem = React.memo(
  ({documentId, versionId, annotation}: {documentId: string; versionId: string; annotation: Annotation}) => {
    const [deleteAnnotation] = useDeleteAnnotationMutation()
    const [saveDocumentEditor] = useSaveDocumentEditorMutation()
    const {data: editor} = useGetDocumentEditorQuery(documentId, {
      skip: !documentId,
    })

    const handleSetCurrentPage = async (pageNumber: number) => {
      if (!editor || !documentId) {
        return
      }

      const updatedEditor = {
        ...editor,
        currentPage: pageNumber,
      }

      try {
        await saveDocumentEditor({documentId, editor: updatedEditor}).unwrap()
      } catch (error) {
        console.error("Failed to set current page:", error)
      }
    }

    // Safety check for annotation type
    const annotationConfig = ANNOTATIONS_CONFIGS[annotation.type as AnnotationType]
    if (!annotationConfig) {
      console.warn(`Unknown annotation type: ${annotation.type}`, annotation)
      return null
    }

    const handleDelete = async () => {
      try {
        await deleteAnnotation(annotation.id).unwrap()
      } catch (error) {
        console.error("Failed to delete annotation:", error)
      }
    }

    return (
      <div className="rounded-lg border border-border bg-background p-3 h-24">
        <div className="flex items-center justify-between gap-2 h-full">
          <div className="flex items-center gap-2 flex-1 min-w-0 max-w-full h-full">
            {annotationConfig.icon}
            <div className="flex-1 min-w-0 max-w-full h-full flex flex-col justify-between">
              <div>
                <button
                  onClick={() => handleSetCurrentPage(annotation.pageNumber || 1)}
                  className="text-sm font-medium capitalize text-foreground"
                >
                  {annotationConfig.label}
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
                  <div>
                    Updated:{" "}
                    {formatDate(
                      annotation.updatedAt,
                      new Date(annotation.updatedAt).toDateString() === new Date().toDateString()
                        ? {hour: "2-digit", minute: "2-digit"}
                        : {weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"},
                    )}
                  </div>
                ) : (
                  <div>
                    Created:{" "}
                    {formatDate(
                      annotation.createdAt,
                      new Date(annotation.createdAt).toDateString() === new Date().toDateString()
                        ? {hour: "2-digit", minute: "2-digit"}
                        : {weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"},
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={handleDelete}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    )
  },
)

AnnotationItem.displayName = "AnnotationItem"

export function SidebarAnnotations({documentId}: SidebarAnnotationsProps) {
  const {data: editor} = useGetDocumentEditorQuery(documentId, {
    skip: !documentId,
  })
  const currentVersionId = editor?.currentVersionId || null

  const {
    data: annotations = [],
    isLoading,
    error,
  } = useGetAnnotationsByVersionQuery(currentVersionId || "", {
    skip: !currentVersionId,
  })

  const [viewMode, setViewMode] = React.useState<"all" | "grouped">("all")
  const [collapsedGroups, setCollapsedGroups] = React.useState<Set<string>>(new Set())

  const groupedAnnotations = React.useMemo(() => {
    const groups: Record<AnnotationType, Annotation[]> = {
      highlight: [],
      note: [],
      redaction: [],
    } satisfies {[K in AnnotationType]: Annotation[]}

    for (const annotation of annotations) {
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

  if (isLoading) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-border h-18 p-4">
          <p className="text-sm text-muted-foreground">Loading annotations...</p>
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
          <p className="text-sm text-muted-foreground">Error loading annotations</p>
        </div>
        <ScrollArea className="flex-1 overflow-auto bg-muted">
          <div className="p-4 text-center text-destructive">Failed to load annotations</div>
        </ScrollArea>
      </div>
    )
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
              <AnnotationItem
                key={annotation.id}
                documentId={documentId}
                versionId={currentVersionId || ""}
                annotation={annotation}
              />
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
                          documentId={documentId || ""}
                          versionId={currentVersionId || ""}
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
    </div>
  )
}
