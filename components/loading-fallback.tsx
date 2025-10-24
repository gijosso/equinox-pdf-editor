import {Loader2} from "lucide-react"

import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"

interface LoadingFallbackProps {
  message?: string
  description?: string
}

export function LoadingFallback({
  message = "Loading...",
  description = "Please wait while we load your content",
}: LoadingFallbackProps) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
          <CardTitle className="text-xl">{message}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center">
            <div className="h-2 w-full rounded-full bg-muted">
              <div className="h-2 w-3/4 animate-pulse rounded-full bg-primary"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Specific loading components for different parts of the app
export function DocumentListLoading() {
  return <LoadingFallback message="Loading documents..." description="Fetching your PDF documents" />
}

export function EditorLoading() {
  return <LoadingFallback message="Loading editor..." description="Preparing the PDF editor" />
}

export function FileUploadLoading() {
  return <LoadingFallback message="Preparing upload..." description="Setting up file upload functionality" />
}

export default LoadingFallback
