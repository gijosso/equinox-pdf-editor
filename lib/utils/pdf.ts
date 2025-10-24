// PDF utilities with dynamic imports to reduce bundle size
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
