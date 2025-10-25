"use client"

import React from "react"

import {documentService} from "@/lib/db/documents"

interface UsePDFBlobResult {
  blob: Blob | null
  blobUrl: string | null
  loading: boolean
  error: string | null
}

export function usePDFBlob(documentId: string | null): UsePDFBlobResult {
  const [blob, setBlob] = React.useState<Blob | null>(null)
  const [blobUrl, setBlobUrl] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!documentId) {
      setBlob(null)
      setBlobUrl(null)
      setLoading(false)
      setError(null)
      return
    }

    const loadPDFBlob = async () => {
      setLoading(true)
      setError(null)

      try {
        const result = await documentService.getDocumentWithBlob(documentId)

        if (!result.success) {
          setError(result.error.message)
          setBlob(null)
          setBlobUrl(null)
          return
        }

        if (result.data?.blob) {
          setBlob(result.data.blob)
          // Create object URL for the blob
          const url = URL.createObjectURL(result.data.blob)
          setBlobUrl(url)
        } else {
          setError("PDF blob not found")
          setBlob(null)
          setBlobUrl(null)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load PDF")
        setBlob(null)
        setBlobUrl(null)
      } finally {
        setLoading(false)
      }
    }

    loadPDFBlob()

    // Cleanup function to revoke object URL
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl)
      }
    }
  }, [documentId])

  // Cleanup blob URL when component unmounts
  React.useEffect(() => {
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl)
      }
    }
  }, [blobUrl])

  return {blob, blobUrl, loading, error}
}
