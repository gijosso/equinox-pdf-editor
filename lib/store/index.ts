import {configureStore} from "@reduxjs/toolkit"

import {annotationsApi, documentsApi, editorApi, editsApi, exportApi, textEditsApi, versionsApi} from "./api"
import {documentNamesCacheMiddleware} from "./middleware/document-names-cache"

const store = configureStore({
  reducer: {
    [documentsApi.reducerPath]: documentsApi.reducer,
    [versionsApi.reducerPath]: versionsApi.reducer,
    [annotationsApi.reducerPath]: annotationsApi.reducer,
    [editsApi.reducerPath]: editsApi.reducer,
    [editorApi.reducerPath]: editorApi.reducer,
    [exportApi.reducerPath]: exportApi.reducer,
    [textEditsApi.reducerPath]: textEditsApi.reducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(
      documentsApi.middleware,
      versionsApi.middleware,
      annotationsApi.middleware,
      editsApi.middleware,
      editorApi.middleware,
      exportApi.middleware,
      textEditsApi.middleware,
      documentNamesCacheMiddleware,
    ),
  devTools: process.env.NODE_ENV !== "production",
})

export {store}

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
