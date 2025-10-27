"use client"

import React from "react"

import {useGetDocumentBlobQuery} from "@/lib/store/api"

interface UsePDFBlobResult {
  blob: Blob | null
  blobUrl: string | null
  loading: boolean
  error: string | null
}

export function usePDFBlob(documentId: string): UsePDFBlobResult {
  const {data, isLoading: loading, error: queryError} = useGetDocumentBlobQuery(documentId, {skip: !documentId})

  // Convert RTK Query error to string
  const error = queryError ? (queryError as any)?.error || "Failed to load PDF" : null

  // Create blob URL from blob data
  const blobUrl = React.useMemo(() => {
    if (data?.blob) {
      return URL.createObjectURL(data.blob)
    }
    return null
  }, [data?.blob])

  // Cleanup blob URL when component unmounts or blob changes
  React.useEffect(() => {
    if (blobUrl) {
      return () => URL.revokeObjectURL(blobUrl)
    }
  }, [blobUrl])

  return {blob: data?.blob || null, blobUrl, loading, error}
}
