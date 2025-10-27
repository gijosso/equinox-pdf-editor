import {configureStore} from "@reduxjs/toolkit"

import {annotationsApi, documentsApi, editorApi, exportApi, versionsApi} from "./api"
import {documentNamesCacheMiddleware} from "./middleware/document-names-cache"

export const store = configureStore({
  reducer: {
    [documentsApi.reducerPath]: documentsApi.reducer,
    [versionsApi.reducerPath]: versionsApi.reducer,
    [annotationsApi.reducerPath]: annotationsApi.reducer,
    [editorApi.reducerPath]: editorApi.reducer,
    [exportApi.reducerPath]: exportApi.reducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          // Ignore these action types
          "persist/PERSIST",
          "persist/REHYDRATE",
          "persist/REGISTER",
        ],
        ignoredActionsPaths: ["meta.arg", "payload.timestamp"],
        ignoredPaths: ["items.dates"],
      },
    }).concat(
      documentsApi.middleware,
      versionsApi.middleware,
      annotationsApi.middleware,
      editorApi.middleware,
      exportApi.middleware,
      documentNamesCacheMiddleware,
    ),
  devTools: process.env.NODE_ENV !== "production",
}) as any

export type RootState = ReturnType<typeof store.getState>
