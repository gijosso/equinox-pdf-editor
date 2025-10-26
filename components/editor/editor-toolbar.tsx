"use client"

import {Highlighter, MousePointer, Square, StickyNote, Type, ZoomIn, ZoomOut} from "lucide-react"

import {Button} from "@/components/ui/button"
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip"
import {useAppDispatch, useAppSelector} from "@/lib/store/hooks"
import {selectEditorState} from "@/lib/store/selectors"
import {setActiveTool, updateZoom} from "@/lib/store/slices"
import type {EditorToolType} from "@/lib/types"

import {PageBar} from "./page-bar"
import {SearchBar} from "./search-bar"

type EditorToolConfig = {type: EditorToolType; icon: React.ElementType; label: string}

const EDITOR_TOOL_CONFIGS = {
  select: {type: "select", icon: MousePointer, label: "Select Text"},
  highlight: {type: "highlight", icon: Highlighter, label: "Highlight"},
  note: {type: "note", icon: StickyNote, label: "Sticky Note"},
  draw: {type: "draw", icon: Square, label: "Draw"},
  erase: {type: "erase", icon: Type, label: "Erase"},
} as const satisfies {[K in EditorToolType]: EditorToolConfig}

export function EditorToolbar() {
  const dispatch = useAppDispatch()
  const {documentId, activeTool, viewport} = useAppSelector(selectEditorState)

  return (
    <TooltipProvider>
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2">
        <PageBar />

        <div className="flex items-center gap-1">
          {Object.values(EDITOR_TOOL_CONFIGS).map(tool => (
            <Tooltip key={tool.type}>
              <TooltipTrigger asChild>
                <Button
                  variant={activeTool.type === tool.type ? "default" : "ghost"}
                  size="sm"
                  onClick={() => dispatch(setActiveTool({documentId, tool: {type: tool.type}}))}
                >
                  <tool.icon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{tool.label}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        <div className="w-64">
          <SearchBar />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => dispatch(updateZoom({documentId, zoom: viewport.zoom + 0.1}))}
            disabled={viewport.zoom <= 0.5}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="min-w-16 text-center text-sm text-foreground">{Math.round(viewport.zoom * 100)}%</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => dispatch(updateZoom({documentId, zoom: viewport.zoom - 0.1}))}
            disabled={viewport.zoom >= 3}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </TooltipProvider>
  )
}
