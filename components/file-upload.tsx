"use client"

import {Loader2, Upload} from "lucide-react"
import {useRouter} from "next/navigation"
import React from "react"

import {DuplicateDialog} from "@/components/duplicate-dialog"
import {Button} from "@/components/ui/button"
import {Draggable} from "@/components/ui/draggable"
import {useToast} from "@/hooks/use-toast"
import {documentService} from "@/lib/db/documents"
import {useAppDispatch, useAppSelector} from "@/lib/store/hooks"
import {selectAllDocuments} from "@/lib/store/selectors"
import {addDocumentWithVersion} from "@/lib/store/slices"
import type {PDFDocument} from "@/lib/types"
import {cn, computeFileHash, generateUniqueName, isValidFileSize, isValidPdfFile, uploadNewFile} from "@/lib/utils"

interface FileUploadProps {
  variant?: "button" | "dropzone"
}

type DuplicateDialogState = {
  open: boolean
  existingDoc: PDFDocument | null
  name: string
  file: File | null
  fileHash: string
}

const initialDuplicateDialogState: DuplicateDialogState = {
  open: false,
  existingDoc: null,
  name: "",
  file: null,
  fileHash: "",
}

export function FileUpload({variant = "button"}: FileUploadProps) {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const {toast} = useToast()
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = React.useState(false)
  const [isDragging, setIsDragging] = React.useState(false)
  const [duplicateDialog, setDuplicateDialog] = React.useState<DuplicateDialogState>(initialDuplicateDialogState)

  const documents = useAppSelector(selectAllDocuments)

  const handleFile = async (file: File, forceName?: string) => {
    const isValidPDF = await isValidPdfFile(file)
    if (!isValidPDF) {
      toast({
        title: "Invalid PDF file",
        description: "Error while uploading the PDF file",
        variant: "destructive",
      })
      return
    }

    if (!isValidFileSize(file)) {
      toast({
        title: "File too large",
        description: "Please upload a PDF smaller than 50MB",
        variant: "destructive",
      })
      return
    }

    setUploading(true)

    try {
      const fileHash = await computeFileHash(file)
      const existingDocResult = await documentService.getDocumentByHash(fileHash)

      if (!existingDocResult.success) {
        toast({
          title: "Document error",
          description: "An error occurred while checking for existing documents",
          variant: "destructive",
        })
        return
      }

      const existingDoc = existingDocResult.data
      if (existingDoc && !forceName) {
        const existingNames = documents.map(d => d.name)
        const name = generateUniqueName(file.name, existingNames)

        setDuplicateDialog({open: true, existingDoc, name, file, fileHash})
        setUploading(false)
        return
      }

      const {document, version} = await uploadNewFile(file, documents)
      await dispatch(addDocumentWithVersion({document, version})).unwrap()

      toast({
        title: "Upload successful",
        description: `${document.name} has been uploaded`,
      })

      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      router.push(`/editor/${document.id}`)
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Upload failed",
        description: "There was an error uploading your file",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    await handleFile(file)
  }

  const handleDrop = async (e: React.DragEvent) => {
    const file = e.dataTransfer.files?.[0]

    if (!file) {
      return
    }

    await handleFile(file)
  }

  const handleDuplicateConfirm = async () => {
    if (duplicateDialog.file) {
      await handleFile(duplicateDialog.file, duplicateDialog.name)
    }

    setDuplicateDialog(initialDuplicateDialogState)
  }

  const handleDuplicateCancel = () => {
    setDuplicateDialog(initialDuplicateDialogState)

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  if (variant === "dropzone") {
    return (
      <>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
        <Draggable
          setIsDragging={setIsDragging}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={cn(
            "flex min-h-[70vh] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all",
            isDragging
              ? "border-primary bg-primary/5 scale-[1.02]"
              : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50",
            uploading && "cursor-not-allowed opacity-50",
          )}
        >
          <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
            {uploading ? (
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
            ) : (
              <Upload
                className={cn("h-16 w-16 transition-colors", isDragging ? "text-primary" : "text-muted-foreground")}
              />
            )}
            <div className="space-y-2">
              <h3 className="text-2xl font-semibold text-foreground">
                {uploading ? "Uploading..." : isDragging ? "Drop your PDF here" : "Drop PDF here or click to upload"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {uploading ? "Please wait while we process your file" : "Supports PDF files up to 50MB"}
              </p>
            </div>
          </div>
        </Draggable>
        <DuplicateDialog
          open={duplicateDialog.open}
          onOpenChange={open => !open && handleDuplicateCancel()}
          existingDocumentName={duplicateDialog.existingDoc?.name || ""}
          newDocumentName={duplicateDialog.name}
          onConfirm={handleDuplicateConfirm}
          onCancel={handleDuplicateCancel}
        />
      </>
    )
  }

  return (
    <Draggable setIsDragging={setIsDragging} onDrop={handleDrop} className="inline-block">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />
      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        size="lg"
        className={cn(isDragging && "ring-2 ring-primary ring-offset-2")}
      >
        {uploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : isDragging ? (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Drop to Upload
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Upload PDF
          </>
        )}
      </Button>
      <DuplicateDialog
        open={duplicateDialog.open}
        onOpenChange={open => !open && handleDuplicateCancel()}
        existingDocumentName={duplicateDialog.existingDoc?.name || ""}
        newDocumentName={duplicateDialog.name}
        onConfirm={handleDuplicateConfirm}
        onCancel={handleDuplicateCancel}
      />
    </Draggable>
  )
}
