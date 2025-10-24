import {Analytics} from "@vercel/analytics/next"
import type {Metadata} from "next"
import {Geist, Geist_Mono} from "next/font/google"
import type React from "react"

import {ErrorBoundaryWithSuspense} from "@/components/error-boundary"
import LoadingFallback from "@/components/loading-fallback"
import {ThemeProvider} from "@/components/theme-provider"
import {Toaster} from "@/components/ui/toaster"
import StoreProvider from "@/lib/providers/store-provider"

import "./globals.css"

const _geist = Geist({subsets: ["latin"]})
const _geistMono = Geist_Mono({subsets: ["latin"]})

export const metadata: Metadata = {
  title: "Equinox PDF Editor",
  description: "Edit PDFs with ease",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased`} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          <ErrorBoundaryWithSuspense suspenseFallback={<LoadingFallback />}>
            <StoreProvider>{children}</StoreProvider>
          </ErrorBoundaryWithSuspense>
          <Toaster />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
