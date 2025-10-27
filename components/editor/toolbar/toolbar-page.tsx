"use client"

import {ChevronLeft, ChevronRight} from "lucide-react"

import {Button} from "@/components/ui/button"
import {useGetDocumentEditorQuery, useSaveDocumentEditorMutation} from "@/lib/store/api"

interface ToolbarPageProps {
  documentId: string
}

export function ToolbarPage({documentId}: ToolbarPageProps) {
  const [saveDocumentEditor] = useSaveDocumentEditorMutation()
  const {data: editor} = useGetDocumentEditorQuery(documentId, {
    skip: !documentId,
  })

  const currentPage = editor?.currentPage || 1
  const totalPages = editor?.totalPages || 1

  const handlePageChange = async (newPage: number) => {
    if (!editor || !documentId) {
      return
    }

    const updatedEditor = {
      ...editor,
      currentPage: newPage,
    }

    try {
      await saveDocumentEditor({documentId, editor: updatedEditor}).unwrap()
    } catch (error) {
      console.error("Failed to change page:", error)
    }
  }

  return (
    <div className="">
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm w-12 text-center">
          {currentPage} of {totalPages}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
