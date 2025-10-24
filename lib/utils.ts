import {type ClassValue, clsx} from "clsx"
import {twMerge} from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

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

export async function generatePDFThumbnail(blob: Blob): Promise<string> {
  // Ensure this function only runs on the client side
  if (typeof window === "undefined") {
    throw new Error("generatePDFThumbnail can only be called on the client side")
  }

  // Dynamically import pdfjs-dist to avoid bundling it with the server code
  const pdfjsLib = await import("pdfjs-dist")
  // Worker script in public folder
  pdfjsLib.GlobalWorkerOptions.workerSrc = window.location.origin + "/pdf.worker.min.mjs"

  const arrayBuffer = await blob.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({data: arrayBuffer}).promise
  const page = await pdf.getPage(1)

  const viewport = page.getViewport({scale: 0.1})
  const canvas = document.createElement("canvas")
  const context = canvas.getContext("2d")

  if (!context) {
    throw new Error("Could not get canvas context")
  }

  canvas.width = viewport.width
  canvas.height = viewport.height

  await page.render({
    viewport: viewport,
    canvas: canvas,
    canvasContext: context,
  }).promise

  return canvas.toDataURL("image/jpeg", 0.8)
}

const defaultFormatDatOptions: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC", // Force UTC to ensure consistency
}

export const formatDate = (dateString: string, options = defaultFormatDatOptions) => {
  return new Intl.DateTimeFormat("en-US", options).format(new Date(dateString))
}

export const isValidFileType = async (file: File | Blob): Promise<boolean> => {
  // First check MIME type as a quick filter
  if (file.type !== "application/pdf") {
    return false
  }

  try {
    // Read the first 4 bytes to check PDF magic signature
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

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

export const maxFileSize = 50 * 1024 * 1024 // 50MB
export const isValidFileSize = (file: File | Blob) => {
  return file.size < maxFileSize
}

export const generateDocumentId = () => {
  return `doc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

export const generateVersionId = () => {
  return `ver-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}
