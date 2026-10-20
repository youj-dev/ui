'use client'

/* The subscription half of a small client-side store for useSyncExternalStore:
 * a set of listeners the store's own setters notify, plus whatever outside
 * event (a storage event, popstate) should wake them too. */

/** A listener set; `attach` wires the outside events that also wake it, and returns how to unwire them. */
export function createStoreSignal(attach?: (wake: () => void) => () => void) {
  const listeners = new Set<() => void>()
  return {
    subscribe(listener: () => void) {
      listeners.add(listener)
      const detach = attach?.(listener)
      return () => {
        listeners.delete(listener)
        detach?.()
      }
    },
    notify: () => listeners.forEach((listener) => listener()),
  }
}

/** Wakes on another tab's change to `key`; `orCleared` also wakes on a clear (a storage event with no key). */
export const onStorageKey =
  (key: string, orCleared = false) =>
  (wake: () => void) => {
    const onStorage = (event: StorageEvent) => (event.key === key || (orCleared && event.key === null)) && wake()
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }
