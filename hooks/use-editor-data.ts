import React from "react"

import {useAppDispatch, useAppSelector} from "@/lib/store/hooks"
import {selectEditorError, selectEditorLoading} from "@/lib/store/selectors"
import {loadDocumentWithVersions} from "@/lib/store/slices/documents"
import {openDocument} from "@/lib/store/slices/editor"

interface UserEditorDataProps {
  documentId: string
}

interface UseEditorDataReturn {
  loading: boolean
  error: string | null
}

export function useEditorData({documentId}: UserEditorDataProps): UseEditorDataReturn {
  const dispatch = useAppDispatch()
  const loading = useAppSelector(selectEditorLoading)
  const error = useAppSelector(selectEditorError)

  React.useEffect(() => {
    dispatch(loadDocumentWithVersions(documentId))
    dispatch(openDocument(documentId))
  }, [dispatch, documentId])

  return {loading, error}
}
