"use client"

import React from "react"

import {versionService} from "@/lib/db/versions"
import {useGetDocumentQuery} from "@/lib/store/api"
import {useAppSelector} from "@/lib/store/hooks"
import {selectEditorState} from "@/lib/store/selectors"

interface UsePDFBlobResult {
  blob: Blob | null
  blobUrl: string | null
  loading: boolean
  error: string | null
  refreshBlob: () => void
}

export function usePDFBlob(): UsePDFBlobResult {
  const {documentId} = useAppSelector(selectEditorState)
  const [blob, setBlob] = React.useState<Blob | null>(null)
  const [blobUrl, setBlobUrl] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [versionKey, setVersionKey] = React.useState(0)

  const {data: document} = useGetDocumentQuery(documentId || "", {skip: !documentId})

  const loadPDFBlob = React.useCallback(async () => {
    if (!documentId || !document) return

    setLoading(true)
    setError(null)

    try {
      // Get the current version with blob
      const versionResult = await versionService.getVersion(document.currentVersionId)
      if (!versionResult.success) {
        setError(versionResult.error.message)
        setBlob(null)
        setBlobUrl(null)
        return
      }

      const version = versionResult.data
      if (!version?.blob) {
        setError("PDF blob not found in current version")
        setBlob(null)
        setBlobUrl(null)
        return
      }

      setBlob(version.blob)
      // Create object URL for the blob
      const url = URL.createObjectURL(version.blob)
      setBlobUrl(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load PDF")
      setBlob(null)
      setBlobUrl(null)
    } finally {
      setLoading(false)
    }
  }, [documentId, document?.currentVersionId])

  React.useEffect(() => {
    if (!documentId || !document) {
      setBlob(null)
      setBlobUrl(null)
      setLoading(false)
      setError(null)
      return
    }

    loadPDFBlob()

    // Cleanup function to revoke object URL
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl)
      }
    }
  }, [documentId, document?.currentVersionId, versionKey, loadPDFBlob]) // Add loadPDFBlob to dependencies

  // Cleanup blob URL when component unmounts
  React.useEffect(() => {
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl)
      }
    }
  }, [blobUrl])

  const refreshBlob = React.useCallback(() => {
    setVersionKey(prev => prev + 1)
  }, [])

  return {blob, blobUrl, loading, error, refreshBlob}
}
