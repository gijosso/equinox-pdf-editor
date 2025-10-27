"use client"

import React from "react"

import {documentService} from "@/lib/db/documents"

interface UsePDFBlobResult {
  blob: Blob | null
  blobUrl: string | null
  loading: boolean
  error: string | null
  refreshBlob: () => void
}

export function usePDFBlob(documentId: string): UsePDFBlobResult {
  const [blob, setBlob] = React.useState<Blob | null>(null)
  const [blobUrl, setBlobUrl] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [versionKey, setVersionKey] = React.useState(0)

  const loadBlob = React.useCallback(async () => {
    if (!documentId) {
      setBlob(null)
      setBlobUrl(null)
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await documentService.getDocumentBlob(documentId)
      if (!result.success) {
        setError(result.error.message)
        setBlob(null)
        setBlobUrl(null)
        return
      }

      if (!result.data) {
        setError("Document blob not found")
        setBlob(null)
        setBlobUrl(null)
        return
      }

      setBlob(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load PDF")
      setBlob(null)
      setBlobUrl(null)
    } finally {
      setLoading(false)
    }
  }, [documentId, versionKey])

  React.useEffect(() => {
    loadBlob()
  }, [loadBlob])

  React.useEffect(() => {
    if (blob) {
      const url = URL.createObjectURL(blob)
      setBlobUrl(url)
      return () => URL.revokeObjectURL(url)
    } else {
      setBlobUrl(null)
    }
  }, [blob])

  const refreshBlob = React.useCallback(() => {
    setVersionKey(prev => prev + 1)
  }, [])

  return {blob, blobUrl, loading, error, refreshBlob}
}
