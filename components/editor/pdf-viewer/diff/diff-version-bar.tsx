"use client"

import {ArrowRight} from "lucide-react"
import React from "react"

import {useEditorActions} from "@/lib/store/api"
import {useGetVersionsByDocumentQuery} from "@/lib/store/api"

interface VersionComparisonBarProps {
  documentId: string
  className?: string
}

export function DiffVersionBar({documentId, className = ""}: VersionComparisonBarProps) {
  const {editor} = useEditorActions(documentId)
  const isDiffMode = editor?.isDiffMode || false
  const {data: versions = []} = useGetVersionsByDocumentQuery(documentId, {skip: !documentId || !isDiffMode})
  const compareVersionIds = React.useMemo(() => editor?.compareVersionIds || [], [editor?.compareVersionIds])

  const [oldestVersion, latestVersion] = React.useMemo(() => {
    const v1 = versions.find(v => v.id === compareVersionIds[0])
    const v2 = versions.find(v => v.id === compareVersionIds[1])
    if (!v1 || !v2) {
      return [undefined, undefined]
    }
    return v1.versionNumber < v2.versionNumber ? [v1, v2] : [v2, v1]
  }, [versions, compareVersionIds])

  return (
    <div className={`flex items-center justify-between px-3 py-2 ${className}`}>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">v{oldestVersion?.versionNumber}</span>
        </div>
        <div className="text-muted-foreground">
          <ArrowRight className="h-4 w-4" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">v{latestVersion?.versionNumber}</span>
        </div>
      </div>
    </div>
  )
}
