"use client"

import {ArrowLeft, FileText, GitCompare, MessageSquare} from "lucide-react"
import React from "react"

import {Button} from "@/components/ui/button"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"
import {annotationService} from "@/lib/db/annotations"
import {useGetDocumentEditorQuery, useGetVersionsByDocumentQuery, useSaveDocumentEditorMutation} from "@/lib/store/api"
import type {AnnotationDiff, TextDiffResult} from "@/lib/types"

interface DiffViewProps {
  documentId: string
}

export function DiffView({documentId}: DiffViewProps) {
  const [saveDocumentEditor] = useSaveDocumentEditorMutation()
  const {data: editor} = useGetDocumentEditorQuery(documentId, {skip: !documentId})
  const {data: versions = []} = useGetVersionsByDocumentQuery(documentId, {skip: !documentId})
  const [annotationDiffs, setAnnotationDiffs] = React.useState<AnnotationDiff[]>([])
  const [textDiff, setTextDiff] = React.useState<TextDiffResult | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const compareVersionIds = editor?.compareVersionIds || []

  React.useEffect(() => {
    if (!documentId || !compareVersionIds[0] || !compareVersionIds[1]) {
      return
    }

    const version1 = versions.find(v => v.id === compareVersionIds[0])
    const version2 = versions.find(v => v.id === compareVersionIds[1])

    if (!version1 || !version2) {
      return
    }

    const calculateDiffs = async () => {
      setIsLoading(true)
      try {
        const [annotations1Result, annotations2Result] = await Promise.all([
          annotationService.getAnnotationsByVersion(version1.id),
          annotationService.getAnnotationsByVersion(version2.id),
        ])

        const annotations1 = annotations1Result.success ? annotations1Result.data : []
        const annotations2 = annotations2Result.success ? annotations2Result.data : []

        const calculatedAnnotationDiffs: AnnotationDiff[] = []

        // Find annotations in version1 that are not in version2 (removed)
        annotations1.forEach(ann1 => {
          const found = annotations2.find(ann2 => ann2.id === ann1.id)
          if (!found) {
            calculatedAnnotationDiffs.push({
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
            calculatedAnnotationDiffs.push({
              id: ann2.id,
              type: "added",
              annotation: ann2,
            })
          } else if (JSON.stringify(found) !== JSON.stringify(ann2)) {
            calculatedAnnotationDiffs.push({
              id: ann2.id,
              type: "modified",
              annotation: ann2,
              oldAnnotation: found,
            })
          }
        })

        setAnnotationDiffs(calculatedAnnotationDiffs)

        // With annotation-only commits, PDF content is preserved
        // Only compare annotations, not PDF content
        setTextDiff({
          diffs: [],
          totalChanges: 0,
          addedText: "",
          removedText: "",
        })
      } catch (error) {
        console.error("Error calculating diffs:", error)
      } finally {
        setIsLoading(false)
      }
    }

    calculateDiffs()
  }, [compareVersionIds[0], compareVersionIds[1], documentId])

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

  const renderTextDiff = () => {
    if (!textDiff) return null

    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-4 w-4 text-primary" />
            <h3 className="font-medium">Text Changes Summary</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-muted-foreground">Removed:</span>
              <span className="font-medium">{textDiff.removedText.length} characters</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-muted-foreground">Added:</span>
              <span className="font-medium">{textDiff.addedText.length} characters</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="font-medium mb-3">Text Differences</h3>
          <div className="space-y-2">
            {textDiff.diffs.map((diff, index) => (
              <div
                key={index}
                className={`p-2 rounded text-sm ${
                  diff.type === "equal"
                    ? "bg-muted/50"
                    : diff.type === "delete"
                      ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                      : "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                }`}
              >
                <div className="flex items-start gap-2">
                  <div
                    className={`mt-0.5 text-xs font-mono ${
                      diff.type === "equal"
                        ? "text-muted-foreground"
                        : diff.type === "delete"
                          ? "text-red-500"
                          : "text-green-500"
                    }`}
                  >
                    {diff.type === "equal" ? "=" : diff.type === "delete" ? "-" : "+"}
                  </div>
                  <div className="flex-1">
                    <pre className="whitespace-pre-wrap font-mono text-xs">{diff.text || "(empty)"}</pre>
                    {diff.spans && diff.spans.length > 0 && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        Page {diff.spans[0].pageNumber} • {diff.spans.length} text span(s)
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderAnnotationDiff = () => {
    return (
      <div className="space-y-4">
        {annotationDiffs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">No annotation differences found</p>
            <p className="mt-1 text-xs text-muted-foreground">Annotations are identical between versions</p>
          </div>
        ) : (
          annotationDiffs.map(diff => (
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
                  {diff.annotation.content && <p className="mt-1 text-sm text-foreground">{diff.annotation.content}</p>}
                  {diff.type === "modified" && diff.oldAnnotation && (
                    <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                      <p className="text-muted-foreground">Previous content:</p>
                      <p className="mt-1">{diff.oldAnnotation.content}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    )
  }

  const hasAnyChanges = (textDiff?.totalChanges || 0) > 0 || annotationDiffs.length > 0

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
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-sm text-muted-foreground">Calculating differences...</p>
          </div>
        ) : !hasAnyChanges ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <GitCompare className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">No differences found</p>
            <p className="mt-1 text-xs text-muted-foreground">The selected versions are identical</p>
          </div>
        ) : (
          <Tabs defaultValue="text" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="text" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Text Changes ({textDiff?.totalChanges || 0})
              </TabsTrigger>
              <TabsTrigger value="annotations" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Annotations ({annotationDiffs.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="text" className="mt-4">
              {renderTextDiff()}
            </TabsContent>
            <TabsContent value="annotations" className="mt-4">
              {renderAnnotationDiff()}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
