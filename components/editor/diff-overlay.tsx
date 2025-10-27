"use client"

import type {TextDiff, TextSpan} from "@/lib/types"

interface DiffOverlayProps {
  textDiffs: TextDiff[]
  pageNumber: number
  scale: number
  viewportWidth: number
  viewportHeight: number
}

interface DiffHighlightProps {
  span: TextSpan
  type: "added" | "removed" | "modified"
  scale: number
}

function DiffHighlight({span, type, scale}: DiffHighlightProps) {
  const getHighlightColor = () => {
    switch (type) {
      case "added":
        return "rgba(34, 197, 94, 0.3)" // green-500 with opacity
      case "removed":
        return "rgba(239, 68, 68, 0.3)" // red-500 with opacity
      case "modified":
        return "rgba(245, 158, 11, 0.3)" // yellow-500 with opacity
      default:
        return "rgba(156, 163, 175, 0.3)" // gray-400 with opacity
    }
  }

  const getBorderColor = () => {
    switch (type) {
      case "added":
        return "rgba(34, 197, 94, 0.8)" // green-500
      case "removed":
        return "rgba(239, 68, 68, 0.8)" // red-500
      case "modified":
        return "rgba(245, 158, 11, 0.8)" // yellow-500
      default:
        return "rgba(156, 163, 175, 0.8)" // gray-400
    }
  }

  const getIcon = () => {
    switch (type) {
      case "added":
        return "+"
      case "removed":
        return "-"
      case "modified":
        return "~"
      default:
        return "="
    }
  }

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: span.x * scale,
        top: span.y * scale,
        width: span.width * scale,
        height: span.height * scale,
        backgroundColor: getHighlightColor(),
        border: `1px solid ${getBorderColor()}`,
        borderRadius: "2px",
      }}
    >
      {/* Icon indicator */}
      <div
        className="absolute -top-2 -left-2 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold text-white"
        style={{
          backgroundColor: getBorderColor(),
        }}
      >
        {getIcon()}
      </div>
    </div>
  )
}

export function DiffOverlay({textDiffs, pageNumber, scale, viewportWidth, viewportHeight}: DiffOverlayProps) {
  // Filter diffs for the current page and only show non-equal diffs
  const pageDiffs = textDiffs.filter(diff => {
    if (diff.type === "equal") return false
    return diff.spans?.some(span => span.pageNumber === pageNumber)
  })

  if (pageDiffs.length === 0) {
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
      {pageDiffs.map((diff, diffIndex) => {
        if (!diff.spans) return null

        return diff.spans
          .filter(span => span.pageNumber === pageNumber)
          .map((span, spanIndex) => (
            <DiffHighlight
              key={`${diffIndex}-${spanIndex}`}
              span={span}
              type={diff.type === "insert" ? "added" : diff.type === "delete" ? "removed" : "modified"}
              scale={scale}
            />
          ))
      })}
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
        <div className="w-3 h-3 bg-green-500 rounded"></div>
        <span className="text-muted-foreground">Added</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-3 h-3 bg-red-500 rounded"></div>
        <span className="text-muted-foreground">Removed</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-3 h-3 bg-yellow-500 rounded"></div>
        <span className="text-muted-foreground">Modified</span>
      </div>
    </div>
  )
}
