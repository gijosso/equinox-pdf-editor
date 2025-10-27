"use client"

import {Edit3, Highlighter, MousePointer, Square, StickyNote, ZoomIn, ZoomOut} from "lucide-react"
import React from "react"

import {Button} from "@/components/ui/button"
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip"
import {useEditorActions, useGetDocumentQuery} from "@/lib/store/api"
import type {EditorToolType} from "@/lib/types"

import {ToolbarPage} from "./toolbar-page"
import {ToolbarSearch} from "./toolbar-search"

type EditorToolConfig = {type: EditorToolType; icon: React.ElementType; label: string}

const EDITOR_TOOL_CONFIGS = {
  select: {type: "select", icon: MousePointer, label: "Select Text"},
  highlight: {type: "highlight", icon: Highlighter, label: "Highlight"},
  note: {type: "note", icon: StickyNote, label: "Sticky Note"},
  redaction: {type: "redaction", icon: Square, label: "Redaction"},
  text_edit: {type: "text_edit", icon: Edit3, label: "Edit Text"},
} as const satisfies {[K in EditorToolType]: EditorToolConfig}

interface ToolbarProps {
  documentId: string
}

export function Toolbar({documentId}: ToolbarProps) {
  const {editor, setActiveTool, setViewport} = useEditorActions(documentId)
  const {data: document} = useGetDocumentQuery(documentId, {skip: !documentId})
  const toolConfigs = React.useMemo(() => Object.values(EDITOR_TOOL_CONFIGS), [])
  const isViewingHistoricalVersion = React.useMemo(
    () => Boolean(editor && document && editor.currentVersionId !== document.latestVersionId),
    [editor, document],
  )
  const isDiffMode = React.useMemo(() => editor?.isDiffMode || false, [editor?.isDiffMode])
  const isReadOnly = React.useMemo(
    () => isViewingHistoricalVersion || isDiffMode,
    [isViewingHistoricalVersion, isDiffMode],
  )

  // Memoize handlers to prevent unnecessary re-renders
  const handleToolChange = React.useCallback(
    async (toolType: EditorToolType) => {
      await setActiveTool({type: toolType})
    },
    [setActiveTool],
  )

  const activeTool = editor?.activeTool || {type: "select"}
  const viewport = editor?.viewport || {x: 0, y: 0, zoom: 1}
  const zoomPercentage = React.useMemo(() => Math.round(viewport.zoom * 100), [viewport.zoom])

  const handleZoomIn = React.useCallback(async () => {
    await setViewport({
      ...viewport,
      zoom: viewport.zoom + 0.1,
    })
  }, [setViewport, viewport])

  const handleZoomOut = React.useCallback(async () => {
    await setViewport({
      ...viewport,
      zoom: Math.max(0.1, viewport.zoom - 0.1),
    })
  }, [setViewport, viewport])

  return (
    <TooltipProvider>
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2" data-toolbar>
        <ToolbarPage documentId={documentId} />

        <div className="flex items-center gap-1">
          {toolConfigs.map(tool => (
            <Tooltip key={tool.type}>
              <TooltipTrigger asChild>
                <Button
                  variant={activeTool.type === tool.type ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleToolChange(tool.type)}
                  disabled={isReadOnly && tool.type !== "select"}
                >
                  <tool.icon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isReadOnly && tool.type !== "select" ? `${tool.label} (Read-only mode)` : tool.label}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        <div className="w-64">
          <ToolbarSearch documentId={documentId} />
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleZoomOut} disabled={viewport.zoom <= 0.1}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="min-w-16 text-center text-sm text-foreground">{zoomPercentage}%</span>
          <Button variant="ghost" size="sm" onClick={handleZoomIn} disabled={viewport.zoom >= 3}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </TooltipProvider>
  )
}
