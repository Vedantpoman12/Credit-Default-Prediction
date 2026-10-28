"use client"

import { useSyncExternalStore } from "react"

/** Subscribes to a CSS media query. `serverValue` is used during prerendering and hydration. */
export function useMediaQuery(query: string, serverValue: boolean): boolean {
  return useSyncExternalStore(
    (notify) => {
      const list = window.matchMedia(query)
      list.addEventListener("change", notify)
      return () => list.removeEventListener("change", notify)
    },
    () => window.matchMedia(query).matches,
    () => serverValue,
  )
}
