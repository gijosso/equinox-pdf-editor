"use client"

import {FileText} from "lucide-react"
import {useEffect} from "react"

import {DocumentList} from "@/components/document-list"
import {FileUpload} from "@/components/file-upload"
import {useAppDispatch, useAppSelector} from "@/lib/store/hooks"
import {loadDocuments} from "@/lib/store/slices/documents-slice"

export default function HomePage() {
  const dispatch = useAppDispatch()
  const {items: documents, loading} = useAppSelector(state => state.documents)

  useEffect(() => {
    dispatch(loadDocuments())
  }, [dispatch])

  return (
    <div className="min-h-screen bg-background" suppressHydrationWarning>
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <FileText className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Equinox PDF Editor</h1>
              <p className="text-sm text-muted-foreground">Edit PDFs with ease</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {documents.length === 0 && !loading ? (
          <FileUpload variant="dropzone" />
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">Your Documents</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {`You have ${documents.length} document${documents.length === 1 ? "" : "s"}`}
                </p>
              </div>
              <FileUpload />
            </div>
            <DocumentList documents={documents} loading={loading} />
          </div>
        )}
      </main>
    </div>
  )
}
