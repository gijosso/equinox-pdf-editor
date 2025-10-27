"use client"

import React from "react"

import {useGetDocumentBlobQuery} from "@/lib/store/api"

interface UsePDFBlobResult {
  blob: Blob | null
  blobUrl: string | null
  loading: boolean
  error: string | null
  refreshBlob: () => void
}

export function usePDFBlob(documentId: string): UsePDFBlobResult {
  const [blobUrl, setBlobUrl] = React.useState<string | null>(null)
  const [versionKey, setVersionKey] = React.useState(0)

  const {
    data: blob,
    isLoading: loading,
    error: queryError,
  } = useGetDocumentBlobQuery(documentId, {
    skip: !documentId,
    // Use versionKey to force refetch when needed
    refetchOnMountOrArgChange: versionKey,
  })

  // Convert RTK Query error to string
  const error = queryError ? (queryError as any)?.error || "Failed to load PDF" : null

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

  return {blob: blob || null, blobUrl, loading, error, refreshBlob}
}
