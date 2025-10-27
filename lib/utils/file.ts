import {documentNamesCache} from "../services/document-names-cache"
import {PDFDocumentWithBlob, PDFVersion} from "../types"
import {generatePDFThumbnail} from "./pdf"

export async function computeFileHash(file: File | Blob): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("")
  return hashHex
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

// Optimized unique name generation using Set for O(1) lookups
export function generateUniqueName(baseName: string): string {
  const existingNames = documentNamesCache.getCache()

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

export const uploadNewFile = async (file: File): Promise<{document: PDFDocumentWithBlob; version: PDFVersion}> => {
  const documentName = generateUniqueName(file.name)

  const fileHash = await computeFileHash(file)
  const blob = new Blob([await file.arrayBuffer()], {type: "application/pdf"})
  const thumbnail = await generatePDFThumbnail(file)

  const now = new Date()
  const documentId = generateDocumentId()
  const versionId = generateVersionId()

  const document: PDFDocumentWithBlob = {
    id: documentId,
    name: documentName,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    currentVersionId: versionId,
    latestVersionId: versionId, // Initial version is also the latest
    fileHash,
    thumbnail,
    blob, // Add the PDF blob to the document
  }

  const version: PDFVersion = {
    id: versionId,
    documentId,
    versionNumber: 1,
    message: "Initial upload",
    createdAt: now.toISOString(),
  }

  return {document, version}
}
