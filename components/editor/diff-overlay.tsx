"use client"

import {ArrowRight} from "lucide-react"
import React from "react"

import type {AnnotationDiff, TextDiff, TextSpan} from "@/lib/types"

type DiffType = "added" | "removed" | "modified"

interface DiffOverlayConfig {
  highlightClasses: string
  outlineClasses: string
  iconClasses: string
  icon: string
}

const DIFF_OVERLAY_CONFIG: Record<DiffType, DiffOverlayConfig> = {
  added: {
    highlightClasses: "bg-green-500/50 border-green-500",
    outlineClasses: "border-green-500",
    iconClasses: "bg-green-500",
    icon: "+",
  },
  removed: {
    highlightClasses: "bg-red-500/50 border-red-500",
    outlineClasses: "border-red-500",
    iconClasses: "bg-red-500",
    icon: "-",
  },
  modified: {
    highlightClasses: "bg-yellow-500/50 border-yellow-500",
    outlineClasses: "border-yellow-500",
    iconClasses: "bg-yellow-500",
    icon: "~",
  },
} as const

interface DiffOverlayProps {
  textDiffs: TextDiff[]
  annotationDiffs: AnnotationDiff[]
  pageNumber: number
  scale: number
  viewportWidth: number
  viewportHeight: number
}

interface DiffHighlightProps {
  span: TextSpan
  type: DiffType
  scale: number
}

function DiffHighlight({span, type, scale}: DiffHighlightProps) {
  const config = DIFF_OVERLAY_CONFIG[type]

  return (
    <div
      className={`absolute pointer-events-none border rounded-sm ${config.highlightClasses}`}
      style={{
        left: span.x * scale,
        top: span.y * scale,
        width: span.width * scale,
        height: span.height * scale,
      }}
    >
      <div
        className={`absolute -top-2 -left-2 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold text-white ${config.iconClasses}`}
      >
        {config.icon}
      </div>
    </div>
  )
}

interface AnnotationDiffHighlightProps {
  annotation: AnnotationDiff["annotation"]
  type: DiffType
  scale: number
}

function AnnotationDiffHighlight({annotation, type, scale}: AnnotationDiffHighlightProps) {
  const config = DIFF_OVERLAY_CONFIG[type]

  return (
    <div
      className={`absolute pointer-events-none border-2 rounded bg-transparent ${config.outlineClasses}`}
      style={{
        left: annotation.x * scale,
        top: annotation.y * scale,
        width: annotation.width * scale,
        height: annotation.height * scale,
      }}
    >
      <div
        className={`absolute -top-3 -left-3 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm ${config.iconClasses}`}
      >
        {config.icon}
      </div>
    </div>
  )
}

export function DiffOverlay({
  textDiffs,
  annotationDiffs,
  pageNumber,
  scale,
  viewportWidth,
  viewportHeight,
}: DiffOverlayProps) {
  const pageAnnotationDiffs = React.useMemo(
    () => annotationDiffs.filter(diff => diff.annotation.pageNumber === pageNumber),
    [annotationDiffs, pageNumber],
  )

  // Filter text diffs for the current page and only show non-equal diffs
  const pageTextDiffs = textDiffs.filter(diff => {
    if (diff.type === "equal") return false
    return diff.spans?.some(span => span.pageNumber === pageNumber)
  })

  if (pageTextDiffs.length === 0 && pageAnnotationDiffs.length === 0) {
    return null
  }

  return (
    <div
      className="absolute inset-0 pointer-events-none z-10"
      style={{
        width: viewportWidth,
        height: viewportHeight,
      }}
    >
      {pageTextDiffs.map((diff, diffIndex) => {
        if (!diff.spans) return null

        return diff.spans
          .filter(span => span.pageNumber === pageNumber)
          .map((span, spanIndex) => (
            <DiffHighlight
              key={`text-${diffIndex}-${spanIndex}`}
              span={span}
              type={diff.type === "insert" ? "added" : diff.type === "delete" ? "removed" : "modified"}
              scale={scale}
            />
          ))
      })}

      {pageAnnotationDiffs.map((diff, diffIndex) => (
        <AnnotationDiffHighlight
          key={`annotation-${diffIndex}`}
          annotation={diff.annotation}
          type={diff.type}
          scale={scale}
        />
      ))}
    </div>
  )
}

interface DiffLegendProps {
  className?: string
}

export function DiffLegend({className = ""}: DiffLegendProps) {
  return (
    <div className={`flex items-center gap-4 text-xs ${className}`}>
      <div className="flex items-center gap-1">
        <div className={`w-3 h-3 rounded ${DIFF_OVERLAY_CONFIG.added.iconClasses}`}></div>
        <span className="text-muted-foreground">Added</span>
      </div>
      <div className="flex items-center gap-1">
        <div className={`w-3 h-3 rounded ${DIFF_OVERLAY_CONFIG.removed.iconClasses}`}></div>
        <span className="text-muted-foreground">Removed</span>
      </div>
      <div className="flex items-center gap-1">
        <div className={`w-3 h-3 rounded ${DIFF_OVERLAY_CONFIG.modified.iconClasses}`}></div>
        <span className="text-muted-foreground">Modified</span>
      </div>
    </div>
  )
}

interface VersionComparisonBarProps {
  version1Number: number
  version2Number: number
  className?: string
}

export function VersionComparisonBar({version1Number, version2Number, className = ""}: VersionComparisonBarProps) {
  return (
    <div className={`flex items-center justify-between px-3 py-2 ${className}`}>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">v{version1Number}</span>
        </div>
        <div className="text-muted-foreground">
          <ArrowRight className="h-4 w-4" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">v{version2Number}</span>
        </div>
      </div>
    </div>
  )
}
