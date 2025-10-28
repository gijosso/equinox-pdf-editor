"use client"

import React from "react"

import {getTextEditClasses} from "@/lib/utils/text-edit-styling"

interface TextEditLegendProps {
  className?: string
}

export function TextEditLegend({className = ""}: TextEditLegendProps) {
  const operations: Array<"insert" | "delete" | "replace"> = ["insert", "delete", "replace"]

  return (
    <div className={`flex items-center gap-4 text-xs ${className}`}>
      <span className="text-muted-foreground font-medium">Text Edits:</span>
      {operations.map(operation => {
        const classes = getTextEditClasses(operation)

        return (
          <div key={operation} className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded border ${classes.container}`}></div>
            <span className="text-muted-foreground capitalize">{operation}</span>
          </div>
        )
      })}
    </div>
  )
}
