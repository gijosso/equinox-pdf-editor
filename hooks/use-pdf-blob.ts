"use client"

import React from "react"

import {documentService} from "@/lib/db/documents"

interface UsePDFBlobResult {
  blob: Blob | null
  blobUrl: string | null
  loading: boolean
  error: string | null
}

// Simple in-memory cache to avoid refetch and keep URLs stable between page transitions
const blobCache = new Map<string, Blob>()
const urlCache = new Map<string, string>()

export function usePDFBlob(documentId: string): UsePDFBlobResult {
  const [blob, setBlob] = React.useState<Blob | null>(() => (documentId && blobCache.get(documentId)) || null)
  const [blobUrl, setBlobUrl] = React.useState<string | null>(() => (documentId && urlCache.get(documentId)) || null)
  const [loading, setLoading] = React.useState<boolean>(!blob)
  const [error, setError] = React.useState<string | null>(null)

  // Fetch blob from IndexedDB directly, keep previous URL until new is ready
  React.useEffect(() => {
    let cancelled = false
    if (!documentId) {
      setError("Missing documentId")
      setLoading(false)
      return
    }

    const cachedBlob = blobCache.get(documentId)
    if (cachedBlob) {
      // Ensure we have a cached URL
      const cachedUrl = urlCache.get(documentId) || URL.createObjectURL(cachedBlob)
      urlCache.set(documentId, cachedUrl)
      if (!cancelled) {
        setBlob(cachedBlob)
        setBlobUrl(cachedUrl)
        setLoading(false)
      }
      return
    }

    setLoading(true)
    ;(async () => {
      const result = await documentService.getDocumentBlob(documentId)
      if (cancelled) return
      if (!result.success) {
        setError(result.error.message || "Failed to load PDF")
        setLoading(false)
        return
      }
      const newBlob = result.data || null
      if (newBlob) {
        blobCache.set(documentId, newBlob)
        const existingUrl = urlCache.get(documentId)
        const newUrl = existingUrl || URL.createObjectURL(newBlob)
        urlCache.set(documentId, newUrl)
        setBlob(newBlob)
        setBlobUrl(newUrl)
      } else {
        setBlob(null)
        setBlobUrl(null)
      }
      setLoading(false)
    })()

    return () => {
      cancelled = true
    }
  }, [documentId])

  // Revoke URL on unmount if this component created it (we keep cache-wide URL stable otherwise)
  React.useEffect(() => {
    return () => {
      // Do not revoke cached URL; keep it for fast re-mounts
      // URLs will be cleared on full page reload
    }
  }, [])

  return {blob, blobUrl, loading, error}
}
