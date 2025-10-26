"use client"

import {FileText, Loader2} from "lucide-react"

import {ErrorBoundaryWithSuspense} from "@/components/error-boundary"
import {HomePageLoading} from "@/components/loading"
import {useGetAllDocumentsQuery} from "@/lib/store/api"

import {DocumentList} from "./document-list"
import {FileUpload} from "./file-upload"

export function HomePage() {
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
        <ErrorBoundaryWithSuspense suspenseFallback={<HomePageLoading />}>
          <Home />
        </ErrorBoundaryWithSuspense>
      </main>
    </div>
  )
}

function Home() {
  const {data: documents = [], error, isLoading} = useGetAllDocumentsQuery()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-red-600 mb-2">
            Error: {error ? (error as any)?.message || "Failed to load documents" : null}
          </p>
          <p className="text-sm text-muted-foreground">Failed to load document</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Your Documents</h2>
          <p className="mt-1 text-sm text-muted-foreground">Manage and edit your PDF documents</p>
        </div>
        <div className="h-10 w-24">
          <FileUpload variant={documents.length === 0 ? "dropzone" : "button"} />
        </div>
      </div>

      <div className="min-h-[400px]">
        <DocumentList />
      </div>
    </div>
  )
}
