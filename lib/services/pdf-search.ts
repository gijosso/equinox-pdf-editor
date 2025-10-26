import type {SearchResult} from "@/lib/types"

export class PDFSearchService {
  private static instance: PDFSearchService

  static getInstance(): PDFSearchService {
    if (!PDFSearchService.instance) {
      PDFSearchService.instance = new PDFSearchService()
    }
    return PDFSearchService.instance
  }

  async searchInPDF(
    pdfBlob: Blob,
    query: string,
    options: {
      caseSensitive?: boolean
      wholeWord?: boolean
      highlightAll?: boolean
    } = {},
  ): Promise<SearchResult[]> {
    if (!query.trim()) {
      return []
    }

    try {
      const pdfjsLib = await import("pdfjs-dist")
      pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"

      const arrayBuffer = await pdfBlob.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({data: arrayBuffer}).promise
      const searchResults: SearchResult[] = []
      const searchOptions = {
        caseSensitive: options.caseSensitive || false,
        wholeWord: options.wholeWord || false,
        highlightAll: options.highlightAll || true,
      }

      let resultIndex = 0
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum)
        const textContent = await page.getTextContent()

        // Get page viewport for coordinate calculations
        const viewport = page.getViewport({scale: 1})

        const pageResults = await this.searchInPageText(
          textContent,
          query,
          pageNum,
          viewport,
          searchOptions,
          resultIndex,
        )

        searchResults.push(...pageResults)
      }

      // Assign index based on sorted order
      searchResults.forEach((r, i) => {
        r.index = i
      })

      return searchResults
    } catch (error) {
      console.error("Error searching PDF:", error)
      return []
    }
  }

  private async searchInPageText(
    textContent: any,
    query: string,
    pageNumber: number,
    viewport: any,
    options: any,
    resultIndex: number,
  ): Promise<SearchResult[]> {
    const results: SearchResult[] = []
    const searchText = options.caseSensitive ? query : query.toLowerCase()

    for (const item of textContent.items) {
      const itemText = options.caseSensitive ? item.str : item.str.toLowerCase()

      if (itemText.includes(searchText)) {
        let startIndex = 0
        let foundIndex = itemText.indexOf(searchText, startIndex)

        while (foundIndex !== -1) {
          // Calculate the actual position of the search term within the text item
          const matchWidth = item.width * (query.length / item.str.length)
          const textBeforeWidth = item.width * (foundIndex / item.str.length)

          // Calculate position relative to the text item
          const x = item.transform[4] + textBeforeWidth
          const y = viewport.height - item.transform[5] - item.height

          results.push({
            pageNumber,
            text: item.str.substring(foundIndex, foundIndex + query.length),
            x,
            y,
            width: matchWidth,
            height: item.height,
            index: 0,
          })

          startIndex = foundIndex + 1
          foundIndex = itemText.indexOf(searchText, startIndex)
        }
      }
    }

    // Sort results by y coordinate (ascending), then x coordinate (ascending)
    results.sort((a, b) => {
      if (a.y === b.y) {
        return a.x - b.x
      }
      return a.y - b.y
    })

    return results
  }
}

export const pdfSearchService = PDFSearchService.getInstance()
