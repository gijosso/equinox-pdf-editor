import {configureStore} from "@reduxjs/toolkit"

import documentsReducer from "./slices/documents"

export const makeStore = () => {
  return configureStore({
    reducer: {
      documents: documentsReducer,
    },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        // Suppress serialized checks (persisted through IndexedDB)
        serializableCheck: {
          ignoredActions: [
            "documents/loadDocuments/fulfilled",
            "documents/addDocument",
            "documents/updateDocument",
            "documents/loadDocuments",
            "documents/addVersion",
          ],
          ignoredActionPaths: ["payload.blob", "meta.arg.blob"],
          ignoredPaths: ["documents.items"],
        },
      }),
    devTools: process.env.NODE_ENV !== "production",
  })
}

export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore["getState"]>
export type AppDispatch = AppStore["dispatch"]
