"use client"

import {ArrowRight} from "lucide-react"

interface VersionComparisonBarProps {
  version1Number: number
  version2Number: number
  className?: string
}

export function DiffVersionBar({version1Number, version2Number, className = ""}: VersionComparisonBarProps) {
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
