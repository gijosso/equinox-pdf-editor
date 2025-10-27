"use client"

import {Loader2, Upload} from "lucide-react"
import {useRouter} from "next/navigation"
import React from "react"

import {DuplicateDialog} from "@/components/home/duplicate-dialog"
import {Button} from "@/components/ui/button"
import {Draggable} from "@/components/ui/draggable"
import {useToast} from "@/hooks/use-toast"
import {documentService} from "@/lib/db/documents"
import {useAddDocumentMutation} from "@/lib/store/api"
import type {PDFDocument} from "@/lib/types"
import {cn, computeFileHash, isValidFileSize, isValidPdfFile, uploadNewFile} from "@/lib/utils"
import {ErrorHandler, FileSizeError, FileTypeError} from "@/lib/utils/error-handling"

interface FileUploadProps {
  variant?: "button" | "dropzone"
}

type DuplicateDialogState = {
  open: boolean
  existingDoc: PDFDocument | null
  file: File | null
  fileHash: string
}

const initialDuplicateDialogState: DuplicateDialogState = {
  open: false,
  existingDoc: null,
  file: null,
  fileHash: "",
}

export function FileUpload({variant = "button"}: FileUploadProps) {
  const router = useRouter()
  const {toast} = useToast()
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const [duplicateDialog, setDuplicateDialog] = React.useState<DuplicateDialogState>(initialDuplicateDialogState)
  const [addDocument, {isLoading: uploading}] = useAddDocumentMutation()

  // Memoize handlers to prevent unnecessary re-renders
  const validateAndCheckDuplicate = React.useCallback(
    async (file: File) => {
      try {
        const isValidPDF = await isValidPdfFile(file)
        if (!isValidPDF) {
          throw new FileTypeError("application/pdf", file.type)
        }

        if (!isValidFileSize(file)) {
          const maxSize = 50 * 1024 * 1024 // 50MB
          throw new FileSizeError(maxSize, file.size)
        }

        const fileHash = await computeFileHash(file)
        const existingDocResult = await documentService.getDocumentByHash(fileHash)

        if (!existingDocResult.success) {
          throw ErrorHandler.handle(existingDocResult.error, {operation: "getDocumentByHash"})
        }

        const existingDoc = existingDocResult.data
        if (existingDoc) {
          return {valid: true, isDuplicate: true, existingDoc, fileHash}
        }

        return {valid: true, isDuplicate: false}
      } catch (error) {
        const appError = ErrorHandler.handle(error, {operation: "validateAndCheckDuplicate", filename: file.name})
        ErrorHandler.log(appError)

        toast({
          title: "Validation Error",
          description: ErrorHandler.getUserMessage(appError),
          variant: "destructive",
        })

        return {valid: false, error: appError}
      }
    },
    [toast],
  )

  const uploadFile = React.useCallback(
    async (file: File) => {
      try {
        const {document, version} = await uploadNewFile(file)
        await addDocument({document, version}).unwrap()

        toast({
          title: "Upload successful",
          description: `${document.name} has been uploaded successfully.`,
        })

        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }

        router.push(`/editor/${document.id}`)
      } catch (error) {
        const appError = ErrorHandler.handle(error, {operation: "uploadFile", filename: file.name})
        ErrorHandler.log(appError)

        toast({
          title: "Upload failed",
          description: ErrorHandler.getUserMessage(appError),
          variant: "destructive",
        })
      }
    },
    [addDocument, toast, router],
  )

  const handleFile = React.useCallback(
    async (file: File) => {
      const validation = await validateAndCheckDuplicate(file)

      if (!validation.valid) {
        return
      }

      if (validation.isDuplicate) {
        setDuplicateDialog({
          open: true,
          existingDoc: validation.existingDoc!,
          file,
          fileHash: validation.fileHash!,
        })
        return
      }

      await uploadFile(file)
    },
    [validateAndCheckDuplicate, uploadFile],
  )

  const handleFileSelect = React.useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) {
        return
      }
      await handleFile(file)
    },
    [handleFile],
  )

  const handleDrop = React.useCallback(
    async (e: React.DragEvent) => {
      const file = e.dataTransfer.files?.[0]

      if (!file) {
        return
      }

      await handleFile(file)
    },
    [handleFile],
  )

  const handleDuplicateConfirm = React.useCallback(async () => {
    if (duplicateDialog.file) {
      await uploadFile(duplicateDialog.file)
    }

    setDuplicateDialog(initialDuplicateDialogState)
  }, [duplicateDialog.file, uploadFile])

  const handleDuplicateCancel = React.useCallback(() => {
    setDuplicateDialog(initialDuplicateDialogState)

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [])

  const handleFileInputClick = React.useCallback(() => {
    if (!uploading && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }, [uploading])

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
          onClick={handleFileInputClick}
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
        onClick={handleFileInputClick}
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
        onConfirm={handleDuplicateConfirm}
        onCancel={handleDuplicateCancel}
      />
    </Draggable>
  )
}
