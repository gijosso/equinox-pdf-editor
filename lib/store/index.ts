import {type Store, configureStore} from "@reduxjs/toolkit"

import {documentsApi} from "./api"
import {documentNamesCacheMiddleware} from "./middleware/document-names-cache"
import editorReducer from "./slices/editor"

export const store: Store = configureStore({
  reducer: {
    editor: editorReducer,
    [documentsApi.reducerPath]: documentsApi.reducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware().concat(documentsApi.middleware, documentNamesCacheMiddleware),
  devTools: process.env.NODE_ENV !== "production",
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
