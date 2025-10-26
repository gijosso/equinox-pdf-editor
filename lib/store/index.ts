import {configureStore} from "@reduxjs/toolkit"

import {documentsApi} from "./api"
import editorReducer from "./slices/editor"

export const makeStore = () => {
  return configureStore({
    reducer: {
      editor: editorReducer,
      [documentsApi.reducerPath]: documentsApi.reducer,
    },
    middleware: getDefaultMiddleware => getDefaultMiddleware().concat(documentsApi.middleware),
    devTools: process.env.NODE_ENV !== "production",
  })
}

export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore["getState"]>
export type AppDispatch = AppStore["dispatch"]
