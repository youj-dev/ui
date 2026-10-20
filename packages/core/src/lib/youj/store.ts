/* External stores over the document and the OS, for useSyncExternalStore.
 * Each one shares a single observer or MediaQueryList between every
 * subscriber: it connects with the first and disconnects with the last. */

type Disconnect = () => void

function sharedSubscription(connect: (notify: () => void) => Disconnect | undefined) {
  const listeners = new Set<() => void>()
  let disconnect: Disconnect | undefined
  const notify = () => listeners.forEach((listener) => listener())
  return (listener: () => void) => {
    listeners.add(listener)
    if (listeners.size === 1) disconnect = connect(notify)
    return () => {
      listeners.delete(listener)
      if (listeners.size > 0) return
      disconnect?.()
      disconnect = undefined
    }
  }
}

/** The `subscribe` for an attribute of `<html>`: one MutationObserver serves every subscriber. */
export function createAttributeStore(attribute: string) {
  return sharedSubscription((notify) => {
    if (typeof MutationObserver === 'undefined') return undefined
    const observer = new MutationObserver(notify)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: [attribute] })
    return () => observer.disconnect()
  })
}

/** A media query as a store: its `subscribe` shares one MediaQueryList, and `matches` reads it (`fallback` where the browser has none). */
export function createMediaStore(query: string, fallback: boolean) {
  let list: MediaQueryList | undefined
  const subscribe = sharedSubscription((notify) => {
    list = window.matchMedia?.(query)
    list?.addEventListener?.('change', notify)
    return () => {
      list?.removeEventListener?.('change', notify)
      list = undefined
    }
  })
  const matches = () => (list ?? window.matchMedia?.(query))?.matches ?? fallback
  return { subscribe, matches }
}

/** A localStorage entry as a store, `null` where storage is blocked: `subscribe` hears this page's `write`s and other tabs' changes. */
export function createStorageStore(key: string) {
  const writes = new Set<() => void>()
  const subscribe = sharedSubscription((notify) => {
    const onStorage = (event: StorageEvent) => (event.key === key || event.key === null) && notify()
    writes.add(notify)
    window.addEventListener('storage', onStorage)
    return () => {
      writes.delete(notify)
      window.removeEventListener('storage', onStorage)
    }
  })
  const read = (): string | null => {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  }
  const write = (value: string) => {
    try {
      localStorage.setItem(key, value)
    } catch {
      // Private mode or blocked storage: the value holds for this page.
    }
    writes.forEach((notify) => notify())
  }
  return { subscribe, read, write }
}
