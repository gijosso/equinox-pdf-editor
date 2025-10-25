"use client"

import {ChevronLeft, ChevronRight} from "lucide-react"

import {Button} from "@/components/ui/button"
import {useAppDispatch, useAppSelector} from "@/lib/store/hooks"
import {selectActiveDocumentCurrentPage, selectActiveDocumentTotalPages} from "@/lib/store/selectors/editor"
import {setCurrentPage} from "@/lib/store/slices/editor"

export function PageBar() {
  const dispatch = useAppDispatch()
  const documentId = useAppSelector(state => state.editor.activeDocumentId)
  const currentPage = useAppSelector(selectActiveDocumentCurrentPage)
  const totalPages = useAppSelector(selectActiveDocumentTotalPages)

  const handlePageChange = (newPage: number) => {
    dispatch(setCurrentPage({documentId: documentId!, page: newPage}))
  }

  return (
    <div className="">
      {totalPages > 1 && (
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
      )}
    </div>
  )
}
