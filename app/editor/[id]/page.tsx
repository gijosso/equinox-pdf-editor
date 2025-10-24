import {EditorClient} from "@/components/editor/editor-client"

interface EditorPageProps {
  params: Promise<{id: string}>
}

export default async function EditorPage({params}: EditorPageProps) {
  const {id} = await params

  return <EditorClient documentId={id} />
}
