import type {FontInfo, TextSpan} from "@/lib/types"

/**
 * Extracts font information from a DOM element containing PDF text
 */
export function extractFontInfoFromElement(element: HTMLElement): FontInfo {
  const computedStyle = window.getComputedStyle(element)

  return {
    fontFamily: computedStyle.fontFamily,
    fontSize: parseFloat(computedStyle.fontSize),
    fontWeight: computedStyle.fontWeight,
    color: computedStyle.color,
    letterSpacing: parseFloat(computedStyle.letterSpacing) || 0,
    lineHeight: parseFloat(computedStyle.lineHeight) || 1,
  }
}

/**
 * Extracts font information from PDF.js text content items
 */
export function extractFontInfoFromTextItem(textItem: any): FontInfo {
  // PDF.js text items have font information in the fontName property
  const fontName = textItem.fontName || "Helvetica"

  // Parse font size from transform matrix
  const fontSize = textItem.height || 12

  // Extract font weight from font name
  let fontWeight = "normal"
  if (fontName.toLowerCase().includes("bold")) {
    fontWeight = "bold"
  } else if (fontName.toLowerCase().includes("italic")) {
    fontWeight = "italic"
  }

  return {
    fontFamily: fontName,
    fontSize,
    fontWeight,
    color: "#000000", // Default black, could be extracted from fillColor if available
    letterSpacing: 0,
    lineHeight: 1,
  }
}

/**
 * Creates a font info object that preserves the most important font characteristics
 */
export function createPreservedFontInfo(originalFontInfo: FontInfo, overrides: Partial<FontInfo> = {}): FontInfo {
  return {
    fontFamily: overrides.fontFamily || originalFontInfo.fontFamily,
    fontSize: overrides.fontSize || originalFontInfo.fontSize,
    fontWeight: overrides.fontWeight || originalFontInfo.fontWeight,
    color: overrides.color || originalFontInfo.color,
    letterSpacing: overrides.letterSpacing !== undefined ? overrides.letterSpacing : originalFontInfo.letterSpacing,
    lineHeight: overrides.lineHeight !== undefined ? overrides.lineHeight : originalFontInfo.lineHeight,
  }
}

/**
 * Calculates the width of text with specific font information
 */
export function calculateTextWidth(text: string, fontInfo: FontInfo): number {
  // Create a temporary canvas to measure text width
  const canvas = document.createElement("canvas")
  const context = canvas.getContext("2d")

  if (!context) {
    return text.length * fontInfo.fontSize * 0.6 // Rough estimate
  }

  context.font = `${fontInfo.fontWeight} ${fontInfo.fontSize}px ${fontInfo.fontFamily}`
  return context.measureText(text).width
}

/**
 * Calculates the height of text with specific font information
 */
export function calculateTextHeight(fontInfo: FontInfo): number {
  return fontInfo.fontSize * (fontInfo.lineHeight || 1)
}

/**
 * Determines if two font info objects are compatible for text editing
 */
export function areFontsCompatible(font1: FontInfo, font2: FontInfo): boolean {
  return (
    font1.fontFamily === font2.fontFamily && font1.fontSize === font2.fontSize && font1.fontWeight === font2.fontWeight
  )
}

/**
 * Merges font information from multiple text spans, prioritizing the most common characteristics
 */
export function mergeFontInfoFromSpans(textSpans: TextSpan[]): FontInfo {
  if (textSpans.length === 0) {
    return {
      fontFamily: "Helvetica",
      fontSize: 12,
      fontWeight: "normal",
      color: "#000000",
      letterSpacing: 0,
      lineHeight: 1,
    }
  }

  // Use the first span as base and check for consistency
  const baseSpan = textSpans[0]
  const fontFamily = baseSpan.fontFamily || "Helvetica"
  const fontSize = baseSpan.fontSize || 12
  const fontWeight = baseSpan.fontWeight || "normal"
  const color = baseSpan.color || "#000000"

  // Check if all spans have consistent font properties
  // const isConsistent = textSpans.every(
  //   span =>
  //     (span.fontFamily || "Helvetica") === fontFamily &&
  //     (span.fontSize || 12) === fontSize &&
  //     (span.fontWeight || "normal") === fontWeight,
  // )

  return {
    fontFamily,
    fontSize,
    fontWeight,
    color,
    letterSpacing: 0,
    lineHeight: 1,
  }
}

/**
 * Applies font information to a DOM element
 */
export function applyFontInfoToElement(element: HTMLElement, fontInfo: FontInfo): void {
  element.style.fontFamily = fontInfo.fontFamily
  element.style.fontSize = `${fontInfo.fontSize}px`
  element.style.fontWeight = fontInfo.fontWeight.toString()
  element.style.color = fontInfo.color || "#000000"
  element.style.letterSpacing = `${fontInfo.letterSpacing}px`
  element.style.lineHeight = fontInfo.lineHeight?.toString() || "1"
}

/**
 * Creates CSS font string from font info
 */
export function createFontString(fontInfo: FontInfo): string {
  return `${fontInfo.fontWeight} ${fontInfo.fontSize}px ${fontInfo.fontFamily}`
}
