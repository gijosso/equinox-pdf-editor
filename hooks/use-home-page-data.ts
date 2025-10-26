import React from "react"

import {useAppDispatch, useAppSelector} from "@/lib/store/hooks"
import {selectAllDocuments, selectDocumentError, selectDocumentLoading} from "@/lib/store/selectors"
import {loadDocuments} from "@/lib/store/slices"

interface UseHomepageDataReturn {
  documents: any[]
  loading: boolean
  error: string | null
}

export function useHomePageData(): UseHomepageDataReturn {
  const dispatch = useAppDispatch()
  const documents = useAppSelector(selectAllDocuments)
  const loading = useAppSelector(selectDocumentLoading)
  const error = useAppSelector(selectDocumentError)

  // Load documents list on mount
  React.useEffect(() => {
    dispatch(loadDocuments())
  }, [dispatch])

  return {
    documents,
    loading,
    error,
  }
}
