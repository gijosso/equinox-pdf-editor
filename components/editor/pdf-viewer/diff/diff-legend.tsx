"use client"

const classes = {
  added: "bg-green-500",
  removed: "bg-red-500",
  modified: "bg-yellow-500",
  untouched: "bg-gray-500",
}

interface DiffLegendProps {
  className?: string
}

export function DiffLegend({className = ""}: DiffLegendProps) {
  return (
    <div className={`flex items-center gap-4 text-xs ${className}`}>
      <div className="flex items-center gap-1">
        <div className={`w-3 h-3 rounded ${classes.added}`}></div>
        <span className="text-muted-foreground">Added</span>
      </div>
      <div className="flex items-center gap-1">
        <div className={`w-3 h-3 rounded ${classes.removed}`}></div>
        <span className="text-muted-foreground">Removed</span>
      </div>
      <div className="flex items-center gap-1">
        <div className={`w-3 h-3 rounded ${classes.modified}`}></div>
        <span className="text-muted-foreground">Modified</span>
      </div>
      <div className="flex items-center gap-1">
        <div className={`w-3 h-3 rounded ${classes.untouched}`}></div>
        <span className="text-muted-foreground">Untouched</span>
      </div>
    </div>
  )
}
