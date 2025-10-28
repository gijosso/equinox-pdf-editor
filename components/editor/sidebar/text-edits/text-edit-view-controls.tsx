"use client"

import {Layers, List} from "lucide-react"

import {Button} from "@/components/ui/button"

interface TextEditViewControlsProps {
  viewMode: "all" | "grouped"
  onViewModeChange: (mode: "all" | "grouped") => void
}

export function TextEditViewControls({viewMode, onViewModeChange}: TextEditViewControlsProps) {
  return (
    <div className="flex gap-1 rounded-md border border-border p-1">
      <Button
        variant={viewMode === "all" ? "secondary" : "ghost"}
        size="sm"
        className="h-7 px-2"
        onClick={() => onViewModeChange("all")}
      >
        <List className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant={viewMode === "grouped" ? "secondary" : "ghost"}
        size="sm"
        className="h-7 px-2"
        onClick={() => onViewModeChange("grouped")}
      >
        <Layers className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}
