"use client"

import {ChevronLeft, ChevronRight} from "lucide-react"
import React from "react"

import {Button} from "@/components/ui/button"
import {useEditorActions} from "@/lib/store/api"

interface ToolbarPageProps {
  documentId: string
}

export function ToolbarPage({documentId}: ToolbarPageProps) {
  const {editor, setCurrentPage} = useEditorActions(documentId)

  const currentPage = editor?.currentPage || 1
  const totalPages = editor?.totalPages || 1

  const isFirstPage = React.useMemo(() => currentPage <= 1, [currentPage])
  const isLastPage = React.useMemo(() => currentPage >= totalPages, [currentPage, totalPages])

  const handlePageChange = React.useCallback(
    async (newPage: number) => {
      await setCurrentPage(newPage)
    },
    [setCurrentPage],
  )

  const handlePreviousPage = React.useCallback(() => {
    handlePageChange(Math.max(1, currentPage - 1))
  }, [handlePageChange, currentPage])

  const handleNextPage = React.useCallback(() => {
    handlePageChange(Math.min(totalPages, currentPage + 1))
  }, [handlePageChange, currentPage, totalPages])

  return (
    <div className="">
      <div className="flex items-center justify-center gap-4">
        <Button variant="ghost" size="sm" onClick={handlePreviousPage} disabled={isFirstPage}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="hidden lg:block text-sm w-12 text-center">
          {currentPage} of {totalPages}
        </span>
        <Button variant="ghost" size="sm" onClick={handleNextPage} disabled={isLastPage}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
