import {Edit3, Highlighter, MousePointer, Square, StickyNote} from "lucide-react"

import type {EditorToolType} from "@/lib/types"

type EditorToolConfig = {type: EditorToolType; icon: React.ElementType; label: string}

export const EDITOR_TOOL_CONFIGS = {
  select: {type: "select", icon: MousePointer, label: "Select Text"},
  highlight: {type: "highlight", icon: Highlighter, label: "Highlight"},
  note: {type: "note", icon: StickyNote, label: "Sticky Note"},
  redaction: {type: "redaction", icon: Square, label: "Redaction"},
  text_edit: {type: "text_edit", icon: Edit3, label: "Edit Text"},
} as const satisfies {[K in EditorToolType]: EditorToolConfig}
