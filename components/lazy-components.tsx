import dynamic from "next/dynamic"

import {EditorLoading, FileUploadLoading} from "./loading-fallback"

// Lazy load heavy components with loading states
export const LazyFileUpload = dynamic(() => import("./file-upload").then(mod => ({default: mod.FileUpload})), {
  loading: () => <FileUploadLoading />,
  ssr: false, // File upload is client-side only
})

export const LazyEditorClient = dynamic(
  () => import("./editor/editor-client").then(mod => ({default: mod.EditorClient})),
  {
    loading: () => <EditorLoading />,
    ssr: false, // PDF editor is client-side only
  },
)
