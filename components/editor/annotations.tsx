"use client"

import {ChevronDown, ChevronRight, Highlighter, Layers, List, Square, StickyNote, Trash2, Type} from "lucide-react"
import React from "react"

import {Button} from "@/components/ui/button"
import {ScrollArea} from "@/components/ui/scroll-area"
import {useAppDispatch, useAppSelector} from "@/lib/store/hooks"
import {selectActiveDocumentAnnotations, selectActiveDocumentCurrentPage} from "@/lib/store/selectors"
import {deleteAnnotation, setCurrentPage} from "@/lib/store/slices"
import type {Annotation} from "@/lib/types"

export function Annotations() {
  const dispatch = useAppDispatch()
  const activeDocumentId = useAppSelector(state => state.editor.activeDocumentId)
  const annotations = useAppSelector(selectActiveDocumentAnnotations)
  const currentPage = useAppSelector(selectActiveDocumentCurrentPage)
  const [viewMode, setViewMode] = React.useState<"all" | "grouped">("all")
  const [collapsedGroups, setCollapsedGroups] = React.useState<Set<string>>(new Set())

  const toggleGroup = (type: string) => {
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

  const getAnnotationIcon = (type: string) => {
    switch (type) {
      case "highlight":
        return <Highlighter className="h-4 w-4" />
      case "note":
        return <StickyNote className="h-4 w-4" />
      case "draw":
        return <Square className="h-4 w-4" />
      case "erase":
        return <Square className="h-4 w-4" />
      default:
        return null
    }
  }

  const handleGoToAnnotation = (pageNumber: number) => {
    if (!activeDocumentId) return
    dispatch(setCurrentPage({documentId: activeDocumentId, page: pageNumber}))
  }

  const handleDelete = (id: string) => {
    if (!activeDocumentId) return
    dispatch(deleteAnnotation({documentId: activeDocumentId, id}))
  }

  const groupedAnnotations = {
    highlight: annotations.filter(a => a.type === "highlight"),
    note: annotations.filter(a => a.type === "note"),
    draw: annotations.filter(a => a.type === "draw"),
    erase: annotations.filter(a => a.type === "erase"),
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "highlight":
        return "Highlights"
      case "note":
        return "Notes"
      case "draw":
        return "Drawings"
      case "erase":
        return "Erased Areas"
      default:
        return type
    }
  }

  const AnnotationItem = ({annotation}: {annotation: Annotation}) => (
    <div key={annotation.id} className="rounded-lg border border-border bg-background p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {getAnnotationIcon(annotation.type)}
          <div className="flex-1">
            <button
              onClick={() => handleGoToAnnotation(annotation.pageNumber || 1)}
              className="text-sm font-medium capitalize text-foreground hover:text-primary"
            >
              {annotation.type.replace("-", " ")}
            </button>
            <p className="text-xs text-muted-foreground">Page {annotation.pageNumber || 1}</p>
            {annotation.type === "highlight" && "text" in annotation && annotation.text ? (
              <p className="mt-1 text-xs italic text-muted-foreground line-clamp-2">"{String(annotation.text)}"</p>
            ) : null}
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDelete(annotation.id)}>
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
      {"content" in annotation && annotation.content && (
        <p className="mt-2 text-sm text-muted-foreground">{annotation.content}</p>
      )}
    </div>
  )

  if (!activeDocumentId) return null

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
              <AnnotationItem key={annotation.id} annotation={annotation} />
            ))}
          </div>
        ) : (
          <div>
            {(Object.keys(groupedAnnotations) as Array<keyof typeof groupedAnnotations>).map(type => {
              const typeAnnotations = groupedAnnotations[type]
              if (typeAnnotations.length === 0) return null

              const isCollapsed = collapsedGroups.has(type)

              return (
                <div key={type}>
                  <button
                    onClick={() => toggleGroup(type)}
                    className="flex w-full items-center gap-2 border-b border-border py-2 px-4 hover:opacity-70 transition-opacity bg-background"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                    {getAnnotationIcon(type)}
                    <h3 className="text-sm font-semibold text-foreground">
                      {getTypeLabel(type)} ({typeAnnotations.length})
                    </h3>
                  </button>
                  {!isCollapsed && (
                    <div className="space-y-2 p-4">
                      {typeAnnotations.map(annotation => (
                        <AnnotationItem key={annotation.id} annotation={annotation} />
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
