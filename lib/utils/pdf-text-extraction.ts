import {diff_match_patch} from "diff-match-patch"

export interface TextSpan {
  text: string
  pageNumber: number
  x: number
  y: number
  width: number
  height: number
  index: number
}

export interface TextDiff {
  type: "equal" | "delete" | "insert"
  text: string
  spans?: TextSpan[]
}

export interface TextDiffResult {
  diffs: TextDiff[]
  totalChanges: number
  addedText: string
  removedText: string
}

export class PDFTextExtractor {
  private static instance: PDFTextExtractor

  static getInstance(): PDFTextExtractor {
    if (!PDFTextExtractor.instance) {
      PDFTextExtractor.instance = new PDFTextExtractor()
    }
    return PDFTextExtractor.instance
  }

  async extractTextFromPDF(pdfBlob: Blob): Promise<TextSpan[]> {
    try {
      const pdfjsLib = await import("pdfjs-dist")
      pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"

      const arrayBuffer = await pdfBlob.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({data: arrayBuffer}).promise
      const textSpans: TextSpan[] = []

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum)
        const textContent = await page.getTextContent()
        const viewport = page.getViewport({scale: 1})

        for (const item of textContent.items) {
          // Type guard to ensure we have a TextItem (not TextMarkedContent)
          if ("str" in item && item.str && item.str.trim()) {
            textSpans.push({
              text: item.str,
              pageNumber: pageNum,
              x: item.transform[4],
              y: viewport.height - item.transform[5] - item.height,
              width: item.width,
              height: item.height,
              index: textSpans.length,
            })
          }
        }
      }

      return textSpans
    } catch (error) {
      console.error("Error extracting text from PDF:", error)
      return []
    }
  }

  async extractFullTextFromPDF(pdfBlob: Blob): Promise<string> {
    const textSpans = await this.extractTextFromPDF(pdfBlob)
    return textSpans.map(span => span.text).join("")
  }

  compareTextVersions(text1: string, text2: string): TextDiffResult {
    const dmp = new diff_match_patch()
    const diffs = dmp.diff_main(text1, text2)
    dmp.diff_cleanupSemantic(diffs)

    let addedText = ""
    let removedText = ""
    let totalChanges = 0

    const processedDiffs: TextDiff[] = diffs.map(diff => {
      const [type, text] = diff
      let diffType: "equal" | "delete" | "insert"

      switch (type) {
        case -1:
          diffType = "delete"
          removedText += text
          totalChanges++
          break
        case 1:
          diffType = "insert"
          addedText += text
          totalChanges++
          break
        default:
          diffType = "equal"
      }

      return {
        type: diffType,
        text,
      }
    })

    return {
      diffs: processedDiffs,
      totalChanges,
      addedText,
      removedText,
    }
  }

  async comparePDFVersions(
    pdfBlob1: Blob,
    pdfBlob2: Blob,
  ): Promise<{
    textDiff: TextDiffResult
    textSpans1: TextSpan[]
    textSpans2: TextSpan[]
  }> {
    const [text1, text2, textSpans1, textSpans2] = await Promise.all([
      this.extractFullTextFromPDF(pdfBlob1),
      this.extractFullTextFromPDF(pdfBlob2),
      this.extractTextFromPDF(pdfBlob1),
      this.extractTextFromPDF(pdfBlob2),
    ])

    const textDiff = this.compareTextVersions(text1, text2)

    return {
      textDiff,
      textSpans1,
      textSpans2,
    }
  }

  mapTextDiffToSpans(textDiff: TextDiffResult, textSpans1: TextSpan[], textSpans2: TextSpan[]): TextDiff[] {
    const result: TextDiff[] = []
    let spanIndex1 = 0
    let spanIndex2 = 0
    let charIndex1 = 0
    let charIndex2 = 0

    for (const diff of textDiff.diffs) {
      if (diff.type === "equal") {
        // Map equal text to spans
        const spans: TextSpan[] = []
        let remainingText = diff.text

        while (remainingText.length > 0 && spanIndex1 < textSpans1.length) {
          const currentSpan = textSpans1[spanIndex1]
          const spanText = currentSpan.text
          const spanStart = charIndex1
          const spanEnd = charIndex1 + spanText.length

          if (spanStart < diff.text.length) {
            const overlapStart = Math.max(0, spanStart - charIndex1)
            const overlapEnd = Math.min(diff.text.length, spanEnd - charIndex1)
            const overlapText = diff.text.substring(overlapStart, overlapEnd)

            if (overlapText.length > 0) {
              spans.push({
                ...currentSpan,
                text: overlapText,
              })
              remainingText = remainingText.substring(overlapText.length)
            }
          }

          charIndex1 += spanText.length
          spanIndex1++
        }

        result.push({
          ...diff,
          spans,
        })
      } else if (diff.type === "delete") {
        // Map deleted text to spans from version 1
        const spans: TextSpan[] = []
        let remainingText = diff.text

        while (remainingText.length > 0 && spanIndex1 < textSpans1.length) {
          const currentSpan = textSpans1[spanIndex1]
          const spanText = currentSpan.text
          const spanStart = charIndex1
          const spanEnd = charIndex1 + spanText.length

          if (spanStart < diff.text.length) {
            const overlapStart = Math.max(0, spanStart - charIndex1)
            const overlapEnd = Math.min(diff.text.length, spanEnd - charIndex1)
            const overlapText = diff.text.substring(overlapStart, overlapEnd)

            if (overlapText.length > 0) {
              spans.push({
                ...currentSpan,
                text: overlapText,
              })
              remainingText = remainingText.substring(overlapText.length)
            }
          }

          charIndex1 += spanText.length
          spanIndex1++
        }

        result.push({
          ...diff,
          spans,
        })
      } else if (diff.type === "insert") {
        // Map inserted text to spans from version 2
        const spans: TextSpan[] = []
        let remainingText = diff.text

        while (remainingText.length > 0 && spanIndex2 < textSpans2.length) {
          const currentSpan = textSpans2[spanIndex2]
          const spanText = currentSpan.text
          const spanStart = charIndex2
          const spanEnd = charIndex2 + spanText.length

          if (spanStart < diff.text.length) {
            const overlapStart = Math.max(0, spanStart - charIndex2)
            const overlapEnd = Math.min(diff.text.length, spanEnd - charIndex2)
            const overlapText = diff.text.substring(overlapStart, overlapEnd)

            if (overlapText.length > 0) {
              spans.push({
                ...currentSpan,
                text: overlapText,
              })
              remainingText = remainingText.substring(overlapText.length)
            }
          }

          charIndex2 += spanText.length
          spanIndex2++
        }

        result.push({
          ...diff,
          spans,
        })
      }
    }

    return result
  }
}

export const pdfTextExtractor = PDFTextExtractor.getInstance()
