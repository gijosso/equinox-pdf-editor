"use client"

import {ArrowLeft, GitCompare} from "lucide-react"
import React from "react"

import {Button} from "@/components/ui/button"
import {useGetDocumentEditorQuery, useGetVersionsByDocumentQuery, useSaveDocumentEditorMutation} from "@/lib/store/api"
import type {AnnotationDiff} from "@/lib/types"
import {loadAnnotationsFromVersion} from "@/lib/utils/xfdf"

interface DiffViewProps {
  documentId: string
}

export function DiffView({documentId}: DiffViewProps) {
  const [saveDocumentEditor] = useSaveDocumentEditorMutation()

  // Get editor state from API
  const {data: editor} = useGetDocumentEditorQuery(documentId, {
    skip: !documentId,
  })
  const compareVersionIds = editor?.compareVersionIds || []

  const {data: versions = []} = useGetVersionsByDocumentQuery(documentId, {
    skip: !documentId,
  })
  const [diffs, setDiffs] = React.useState<AnnotationDiff[]>([])

  React.useEffect(() => {
    if (!documentId || !compareVersionIds[0] || !compareVersionIds[1]) {
      return
    }

    const version1 = versions.find(v => v.id === compareVersionIds[0])
    const version2 = versions.find(v => v.id === compareVersionIds[1])

    if (!version1 || !version2) {
      return
    }

    // Load annotations from XFDF strings
    const annotations1 = loadAnnotationsFromVersion(version1.xfdf)
    const annotations2 = loadAnnotationsFromVersion(version2.xfdf)

    const calculatedDiffs: AnnotationDiff[] = []

    // Find annotations in version1 that are not in version2 (removed)
    annotations1.forEach(ann1 => {
      const found = annotations2.find(ann2 => ann2.id === ann1.id)
      if (!found) {
        calculatedDiffs.push({
          id: ann1.id,
          type: "removed",
          annotation: ann1,
        })
      }
    })

    // Find annotations in version2 that are not in version1 (added)
    annotations2.forEach(ann2 => {
      const found = annotations1.find(ann1 => ann1.id === ann2.id)
      if (!found) {
        calculatedDiffs.push({
          id: ann2.id,
          type: "added",
          annotation: ann2,
        })
      } else if (JSON.stringify(found) !== JSON.stringify(ann2)) {
        calculatedDiffs.push({
          id: ann2.id,
          type: "modified",
          annotation: ann2,
          oldAnnotation: found,
        })
      }
    })

    setDiffs(calculatedDiffs)
  }, [compareVersionIds, documentId, versions])

  const getVersionNumber = (versionId: string) => {
    const version = versions.find(v => v.id === versionId)
    return version?.versionNumber.toString()
  }

  const handleExitDiff = async () => {
    if (!editor || !documentId) {
      return
    }

    // Update editor state to exit diff mode
    const updatedEditor = {
      ...editor,
      isDiffMode: false,
      compareVersionIds: [],
    }

    try {
      await saveDocumentEditor({documentId, editor: updatedEditor}).unwrap()
    } catch (error) {
      console.error("Failed to exit diff mode:", error)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleExitDiff}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <GitCompare className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold text-foreground">Compare Versions</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Version {getVersionNumber(compareVersionIds[0])} vs Version {getVersionNumber(compareVersionIds[1])}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {diffs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <GitCompare className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">No differences found</p>
            <p className="mt-1 text-xs text-muted-foreground">The selected versions are identical</p>
          </div>
        ) : (
          <div className="space-y-4">
            {diffs.map(diff => (
              <div
                key={diff.id}
                className={`rounded-lg border p-4 ${
                  diff.type === "added"
                    ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                    : diff.type === "removed"
                      ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
                      : "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 ${
                      diff.type === "added"
                        ? "text-green-500"
                        : diff.type === "removed"
                          ? "text-red-500"
                          : "text-yellow-500"
                    }`}
                  >
                    {diff.type === "added" ? "+" : diff.type === "removed" ? "-" : "~"}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground capitalize">
                      {diff.type} {diff.annotation.type.replace("-", " ")}
                    </p>
                    <p className="text-xs text-muted-foreground">Page {diff.annotation.pageNumber}</p>
                    {diff.annotation.content && (
                      <p className="mt-1 text-sm text-foreground">{diff.annotation.content}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
