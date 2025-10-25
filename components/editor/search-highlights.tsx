"use client"

import React from "react"
import "react-pdf/dist/Page/AnnotationLayer.css"
import "react-pdf/dist/Page/TextLayer.css"

import {useAppSelector} from "@/lib/store/hooks"
import {
  selectActiveDocumentCurrentPage,
  selectActiveDocumentCurrentSearchIndex,
  selectActiveDocumentSearchResults,
} from "@/lib/store/selectors/editor"

export function SearchHighlightOverlay({scale}: {scale: number}) {
  const searchResults = useAppSelector(selectActiveDocumentSearchResults)
  const currentSearchIndex = useAppSelector(selectActiveDocumentCurrentSearchIndex)
  const currentPage = useAppSelector(selectActiveDocumentCurrentPage)

  // TODO: properly wait for text layer rendering
  React.useEffect(() => {
    const waitForTextLayer = (): Promise<HTMLElement> => {
      return new Promise((resolve, reject) => {
        const checkTextLayer = () => {
          const textLayer = document.querySelector(".react-pdf__Page__textContent") as HTMLElement
          if (textLayer && textLayer.querySelectorAll("span").length > 0) {
            resolve(textLayer)
            return
          }
          setTimeout(checkTextLayer, 50)
        }
        checkTextLayer()
        setTimeout(() => reject(new Error("TextLayer not found after 3 seconds")), 3000)
      })
    }

    const updateHighlights = async () => {
      try {
        const textLayer = await waitForTextLayer()
        textLayer.querySelectorAll(".search-highlight").forEach(el => el.remove())

        const currentPageResults = searchResults.filter(result => result.pageNumber === currentPage)

        currentPageResults.forEach(result => {
          const highlight = document.createElement("div")

          highlight.id = `search-highlight-${result.index}`
          highlight.className = `search-highlight absolute pointer-events-none ${
            result.index === currentSearchIndex ? "search-highlight-active" : ""
          }`
          highlight.style.cssText = `
            left: ${result.x * scale}px;
            top: ${result.y * scale}px;
            width: ${result.width * scale}px;
            height: ${result.height * scale}px;
            z-index: 10;
          `

          textLayer.appendChild(highlight)
        })
      } catch (error) {
        console.warn("Failed to update search highlights:", error)
      }
    }

    updateHighlights()

    return () => {
      const textLayer = document.querySelector(".react-pdf__Page__textContent")
      if (textLayer) {
        textLayer.querySelectorAll(".search-highlight").forEach(el => el.remove())
      }
    }
  }, [searchResults, currentPage, currentSearchIndex, scale])

  return null
}
