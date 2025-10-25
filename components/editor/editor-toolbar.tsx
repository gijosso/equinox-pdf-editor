"use client"

import {Highlighter, MousePointer, Square, StickyNote, Type, ZoomIn, ZoomOut} from "lucide-react"

import {Button} from "@/components/ui/button"
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip"
import {useAppDispatch, useAppSelector} from "@/lib/store/hooks"
import {selectActiveDocumentActiveTool, selectActiveDocumentViewport} from "@/lib/store/selectors"
import {setActiveTool, updateZoom} from "@/lib/store/slices"

import {PageBar} from "./page-bar"
import {SearchBar} from "./search-bar"

export function EditorToolbar() {
  const dispatch = useAppDispatch()
  const viewport = useAppSelector(selectActiveDocumentViewport)
  const activeTool = useAppSelector(selectActiveDocumentActiveTool)
  const activeDocumentId = useAppSelector(state => state.editor.activeDocumentId)

  const handleZoomIn = () => {
    if (activeDocumentId) {
      dispatch(updateZoom({documentId: activeDocumentId, zoom: viewport.zoom + 0.1}))
    }
  }
  const handleZoomOut = () => {
    if (activeDocumentId) {
      dispatch(updateZoom({documentId: activeDocumentId, zoom: viewport.zoom - 0.1}))
    }
  }
  const handleToolSelect = (toolType: string) => {
    if (activeDocumentId) {
      dispatch(setActiveTool({documentId: activeDocumentId, tool: {type: toolType as any}}))
    }
  }

  const tools = [
    {id: "select", icon: MousePointer, label: "Select Text"},
    {id: "highlight", icon: Highlighter, label: "Highlight"},
    {id: "note", icon: StickyNote, label: "Sticky Note"},
    {id: "draw", icon: Square, label: "Draw"},
    {id: "erase", icon: Type, label: "Erase"},
  ]

  return (
    <TooltipProvider>
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2">
        <PageBar />

        <div className="flex items-center gap-1">
          {tools.map(tool => (
            <Tooltip key={tool.id}>
              <TooltipTrigger asChild>
                <Button
                  variant={activeTool.type === tool.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleToolSelect(tool.id)}
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

        <SearchBar />

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleZoomOut} disabled={viewport.zoom <= 0.5}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="min-w-16 text-center text-sm text-foreground">{Math.round(viewport.zoom * 100)}%</span>
          <Button variant="ghost" size="sm" onClick={handleZoomIn} disabled={viewport.zoom >= 3}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </TooltipProvider>
  )
}
