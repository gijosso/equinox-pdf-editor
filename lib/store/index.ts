import {configureStore} from "@reduxjs/toolkit"

import {annotationsApi, documentsApi, editorApi, versionsApi} from "./api"
import {documentNamesCacheMiddleware} from "./middleware/document-names-cache"

export const store = configureStore({
  reducer: {
    [documentsApi.reducerPath]: documentsApi.reducer,
    [versionsApi.reducerPath]: versionsApi.reducer,
    [annotationsApi.reducerPath]: annotationsApi.reducer,
    [editorApi.reducerPath]: editorApi.reducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware().concat(
      documentsApi.middleware,
      versionsApi.middleware,
      annotationsApi.middleware,
      editorApi.middleware,
      documentNamesCacheMiddleware,
    ),
  devTools: process.env.NODE_ENV !== "production",
}) as any

export type RootState = ReturnType<typeof store.getState>
