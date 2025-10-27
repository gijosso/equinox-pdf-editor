// Global PDF.js worker setup
// This should be imported before any PDF components are rendered

let workerSetup = false

export async function setupPDFWorker() {
  if (workerSetup) return

  try {
    const {pdfjs} = await import("react-pdf")
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"
    workerSetup = true
    console.log("PDF.js worker setup complete")
  } catch (error) {
    console.error("Failed to setup PDF worker:", error)
  }
}

// Auto-setup when module loads (client-side only)
if (typeof window !== "undefined") {
  setupPDFWorker()
}
