"use client"

import {Highlighter, MousePointer, Square, StickyNote, ZoomIn, ZoomOut} from "lucide-react"

import {Button} from "@/components/ui/button"
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip"
import {useAppDispatch, useAppSelector} from "@/lib/store/hooks"
import {selectEditorState} from "@/lib/store/selectors"
import {setActiveTool, updateZoom} from "@/lib/store/slices"
import type {EditorToolType} from "@/lib/types"

import {ToolbarPage} from "./toolbar/toolbar-page"
import {ToolbarSearch} from "./toolbar/toolbar-search"

type EditorToolConfig = {type: EditorToolType; icon: React.ElementType; label: string}

const EDITOR_TOOL_CONFIGS = {
  select: {type: "select", icon: MousePointer, label: "Select Text"},
  highlight: {type: "highlight", icon: Highlighter, label: "Highlight"},
  note: {type: "note", icon: StickyNote, label: "Sticky Note"},
  redaction: {type: "redaction", icon: Square, label: "Redaction"},
} as const satisfies {[K in EditorToolType]: EditorToolConfig}

const EDITOR_TOOL_CONFIGS_ARRAY = Object.values(EDITOR_TOOL_CONFIGS)

export function EditorToolbar() {
  const dispatch = useAppDispatch()
  const {documentId, activeTool, viewport} = useAppSelector(selectEditorState)

  return (
    <TooltipProvider>
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2">
        <ToolbarPage />

        <div className="flex items-center gap-1">
          {EDITOR_TOOL_CONFIGS_ARRAY.map(tool => (
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
          <ToolbarSearch />
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
