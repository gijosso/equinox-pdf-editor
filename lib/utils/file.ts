import {generatePDFThumbnail} from "./pdf"

export async function computeFileHash(file: File | Blob): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("")
  return hashHex
}

export function generateUniqueName(baseName: string, existingNames: string[]): string {
  if (!existingNames.includes(baseName)) {
    return baseName
  }

  const nameWithoutExt = baseName.replace(/\.pdf$/i, "")
  let counter = 1
  let newName = `${nameWithoutExt} (${counter}).pdf`

  while (existingNames.includes(newName)) {
    counter++
    newName = `${nameWithoutExt} (${counter}).pdf`
  }

  return newName
}

export const generateDocumentId = () => {
  return `doc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

export const generateVersionId = () => {
  return `ver-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

export const maxFileSize = 50 * 1024 * 1024 // 50MB
export const isValidFileSize = (file: File | Blob) => {
  return file.size < maxFileSize
}

export const isValidPdfFile = async (file: File | Blob): Promise<boolean> => {
  if (typeof window === "undefined") {
    return false
  }

  // First check MIME type as a quick filter
  if (file.type !== "application/pdf") {
    return false
  }

  try {
    // Read the first 4 bytes to check PDF magic signature
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    // PDF files start with %PDF (0x25, 0x50, 0x44, 0x46)
    const pdfSignature = [0x25, 0x50, 0x44, 0x46] // %PDF

    if (uint8Array.length < 4) {
      return false
    }

    // Check if the first 4 bytes match PDF signature
    for (let i = 0; i < 4; i++) {
      if (uint8Array[i] !== pdfSignature[i]) {
        return false
      }
    }

    return true
  } catch (error) {
    console.error("Error validating PDF file signature:", error)
    return false
  }
}

const documentNamesCache = new Set<string>()
let cacheInitialized = false

export async function processFile(
  file: File,
  existingDocuments: Array<{name: string}>,
): Promise<{
  fileHash: string
  thumbnail: string
  documentName: string
  blob: Blob
}> {
  if (!cacheInitialized) {
    existingDocuments.forEach(doc => documentNamesCache.add(doc.name))
    cacheInitialized = true
  }

  const fileHash = await computeFileHash(file)
  const blob = new Blob([await file.arrayBuffer()], {type: "application/pdf"})
  const thumbnail = await generatePDFThumbnail(blob)
  const documentName = generateUniqueNameOptimized(file.name, documentNamesCache)
  documentNamesCache.add(documentName)

  return {
    fileHash,
    thumbnail,
    documentName,
    blob,
  }
}

// Optimized unique name generation using Set for O(1) lookups
function generateUniqueNameOptimized(baseName: string, existingNames: Set<string>): string {
  if (!existingNames.has(baseName)) {
    return baseName
  }

  const nameWithoutExt = baseName.replace(/\.pdf$/i, "")
  let counter = 1
  let newName = `${nameWithoutExt} (${counter}).pdf`

  while (existingNames.has(newName)) {
    counter++
    newName = `${nameWithoutExt} (${counter}).pdf`
  }

  return newName
}

// Clear cache when documents change
export function clearDocumentNamesCache() {
  documentNamesCache.clear()
  cacheInitialized = false
}

// Update cache when documents are added/removed
export function updateDocumentNamesCache(documentNames: string[]) {
  documentNamesCache.clear()
  documentNames.forEach(name => documentNamesCache.add(name))
  cacheInitialized = true
}
