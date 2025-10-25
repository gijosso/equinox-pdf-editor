"use client"

import {Loader2} from "lucide-react"
import {useRouter} from "next/navigation"
import React from "react"

import {EditorLayout} from "@/components/editor/editor-layout"
import {documentService} from "@/lib/db/documents"
import {useAppDispatch, useAppSelector} from "@/lib/store/hooks"
import {selectAllDocuments, selectDocumentById} from "@/lib/store/selectors"
import {loadDocuments} from "@/lib/store/slices"
import {closeDocument, openDocument} from "@/lib/store/slices"

interface EditorClientProps {
  documentId: string
}

export function EditorClient({documentId}: EditorClientProps) {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const documents = useAppSelector(selectAllDocuments)
  const documentMeta = useAppSelector(selectDocumentById(documentId))
  const isLoading = useAppSelector(state => state.documents.loading)
  const [fullDocument, setFullDocument] = React.useState<any>(null)
  const [loadingFullDocument, setLoadingFullDocument] = React.useState(false)

  React.useEffect(() => {
    if (documents.length === 0) {
      dispatch(loadDocuments())
    }
  }, [dispatch, documents.length])

  React.useEffect(() => {
    if (documentMeta && !fullDocument) {
      // Load the full document with blob
      const loadFullDocument = async () => {
        setLoadingFullDocument(true)
        try {
          const result = await documentService.getDocument(documentId)
          if (result.success && result.data) {
            setFullDocument(result.data)
            dispatch(openDocument(documentId))
          } else {
            router.push("/")
          }
        } catch (error) {
          console.error("Failed to load full document:", error)
          router.push("/")
        } finally {
          setLoadingFullDocument(false)
        }
      }
      loadFullDocument()
    } else if (documents.length > 0 && !documentMeta) {
      // Document not found, redirect to home
      router.push("/")
    }
  }, [documentId, documentMeta, documents.length, dispatch, router, fullDocument])

  React.useEffect(() => {
    return () => {
      dispatch(closeDocument(documentId))
    }
  }, [dispatch, documentId])

  if (isLoading || !documentMeta || loadingFullDocument || !fullDocument) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return <EditorLayout />
}
