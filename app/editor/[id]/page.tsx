import {EditorClient} from "@/components/editor/editor-client"
import {ErrorBoundaryWithSuspense} from "@/components/error-boundary"
import {EditorLoading} from "@/components/loading-fallback"

interface EditorPageProps {
  params: Promise<{id: string}>
}

export default async function EditorPage({params}: EditorPageProps) {
  const {id} = await params

  return (
    <ErrorBoundaryWithSuspense suspenseFallback={<EditorLoading />}>
      <EditorClient documentId={id} />
    </ErrorBoundaryWithSuspense>
  )
}
