import {ErrorBoundaryWithSuspense} from "@/components/error-boundary"
import {HomePage as HomePageComponent} from "@/components/home/home-page"
import {HomePageLoading} from "@/components/loading"

export default function HomePage() {
  return (
    <ErrorBoundaryWithSuspense suspenseFallback={<HomePageLoading />}>
      <HomePageComponent />
    </ErrorBoundaryWithSuspense>
  )
}
