import {EditorPage as EditorPageComponent} from "@/components/editor/editor-page"
import {ErrorBoundaryWithSuspense} from "@/components/error-boundary"
import {EditorLoading} from "@/components/loading"

interface EditorPageProps {
  params: Promise<{id: string}>
}

export default async function EditorPage({params}: EditorPageProps) {
  const {id} = await params

  return (
    <ErrorBoundaryWithSuspense suspenseFallback={<EditorLoading />}>
      <EditorPageComponent documentId={id} />
    </ErrorBoundaryWithSuspense>
  )
}
