import {configureStore} from "@reduxjs/toolkit"

import documentsReducer from "./slices/documents"

export const makeStore = () => {
  return configureStore({
    reducer: {
      documents: documentsReducer,
    },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        // Suppress blob checks (persisted through IndexedDB)
        serializableCheck: {
          ignoredActionPaths: ["payload.document.blob", "meta.arg.document.blob"],
        },
      }),
    devTools: process.env.NODE_ENV !== "production",
  })
}

export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore["getState"]>
export type AppDispatch = AppStore["dispatch"]
