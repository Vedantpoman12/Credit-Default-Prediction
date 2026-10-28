"use client"

import { useCallback, useSyncExternalStore } from "react"

const listeners = new Set<() => void>()

function read(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === "1"
  } catch {
    return false
  }
}

/** A boolean preference persisted in localStorage; falls back to `false` when storage is unavailable. */
export function useLocalStorageFlag(key: string): [boolean, (value: boolean) => void] {
  const value = useSyncExternalStore(
    (notify) => {
      listeners.add(notify)
      return () => listeners.delete(notify)
    },
    () => read(key),
    () => false,
  )
  const set = useCallback(
    (next: boolean) => {
      try {
        window.localStorage.setItem(key, next ? "1" : "0")
      } catch {
        // storage unavailable (private mode); preference is not persisted
      }
      listeners.forEach((notify) => notify())
    },
    [key],
  )
  return [value, set]
}
