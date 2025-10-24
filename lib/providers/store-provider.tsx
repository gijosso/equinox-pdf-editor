"use client"

import React from "react"
import {Provider} from "react-redux"

import {type AppStore, makeStore} from "@/lib/store/store"

export default function StoreProvider({children}: {children: React.ReactNode}) {
  const storeRef = React.useRef<AppStore | undefined>(undefined)

  if (!storeRef.current) {
    storeRef.current = makeStore()
  }

  return <Provider store={storeRef.current}>{children}</Provider>
}
