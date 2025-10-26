"use client"

import {ChevronLeft, ChevronRight} from "lucide-react"

import {Button} from "@/components/ui/button"
import {useAppDispatch, useAppSelector} from "@/lib/store/hooks"
import {selectEditorState} from "@/lib/store/selectors"
import {setCurrentPage} from "@/lib/store/slices/editor"

export function PageBar() {
  const dispatch = useAppDispatch()
  const {documentId, currentPage, totalPages} = useAppSelector(selectEditorState)

  return (
    <div className="">
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            dispatch(
              setCurrentPage({
                documentId,
                page: Math.max(1, (currentPage || 1) - 1),
              }),
            )
          }
          disabled={(currentPage && currentPage <= 1) || false}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm w-12 text-center">
          {currentPage} of {totalPages}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            dispatch(
              setCurrentPage({
                documentId,
                page: Math.min(totalPages || 0, (currentPage || 0) + 1),
              }),
            )
          }
          disabled={(currentPage && currentPage >= (totalPages || 0)) || false}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
