import dynamic from "next/dynamic"

export const LazyAnnotations = dynamic(() => import("./editor/annotations").then(mod => ({default: mod.Annotations})), {
  loading: () => (
    <div className="flex h-full items-center justify-center p-4">
      <div className="text-center">
        <div className="mb-2 h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto"></div>
        <p className="text-sm text-muted-foreground">Loading annotations...</p>
      </div>
    </div>
  ),
  ssr: false,
})

export const LazyEditHistory = dynamic(
  () => import("./editor/edit-history").then(mod => ({default: mod.EditHistory})),
  {
    loading: () => (
      <div className="flex h-full items-center justify-center p-4">
        <div className="text-center">
          <div className="mb-2 h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading history...</p>
        </div>
      </div>
    ),
    ssr: false,
  },
)

export const LazySearchHighlights = dynamic(
  () => import("./editor/search-highlights").then(mod => ({default: mod.SearchHighlightOverlay})),
  {
    loading: () => null, // Invisible when loading
    ssr: false,
  },
)
