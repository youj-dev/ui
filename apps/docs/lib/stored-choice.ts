'use client'

import { useSyncExternalStore } from 'react'

/* A reader's pick from a short list, chosen once for the whole site:
 * remembered in this browser, and shared by every field on the page (an event
 * tells the others). The first value until they choose, on the server too. */
export function storedChoice<T extends string>(key: string, values: readonly T[]): () => [T, (next: T) => void] {
  const read = (): T => {
    try {
      const stored = localStorage.getItem(key) as T | null
      return stored && values.includes(stored) ? stored : values[0]!
    } catch {
      return values[0]!
    }
  }
  const subscribe = (onChange: () => void) => {
    window.addEventListener(key, onChange)
    window.addEventListener('storage', onChange)
    return () => {
      window.removeEventListener(key, onChange)
      window.removeEventListener('storage', onChange)
    }
  }
  return function useStoredChoice() {
    const value = useSyncExternalStore(subscribe, read, () => values[0]!)
    const set = (next: T) => {
      try {
        localStorage.setItem(key, next)
      } catch {
        // No storage (a private window): the choice holds until the page changes.
      }
      window.dispatchEvent(new Event(key))
    }
    return [value, set]
  }
}
