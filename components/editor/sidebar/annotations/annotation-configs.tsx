"use client"

import {Highlighter, Square, StickyNote} from "lucide-react"
import React from "react"

import type {Annotation} from "@/lib/types"

export type AnnotationToolConfig = {type: Annotation["type"]; icon: React.ReactNode; label: string}

export const ANNOTATIONS_CONFIGS = {
  highlight: {type: "highlight" as const, icon: <Highlighter className="h-4 w-4" />, label: "Highlight"},
  note: {type: "note" as const, icon: <StickyNote className="h-4 w-4" />, label: "Sticky Note"},
  redaction: {type: "redaction" as const, icon: <Square className="h-4 w-4" />, label: "Redaction"},
} as const satisfies {[K in Annotation["type"]]: AnnotationToolConfig}

export const ANNOTATION_CONFIGS_ARRAY = Object.values(ANNOTATIONS_CONFIGS)
