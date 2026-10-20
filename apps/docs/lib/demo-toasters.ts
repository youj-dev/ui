import { useEffect, useSyncExternalStore } from 'react'

/* The examples that render their own <Toaster>, as the docs teach. Youj shows
 * one Toaster at a time (the first mounted), so while one of these is on the
 * page the site's own Toaster steps aside and the demo's (its position, its
 * limit) shows the toasts. A test keeps this list in step with the examples. */
export const DEMO_TOASTERS = new Set(['notification-center/demo', 'presets/demo', 'toast/demo'])

let mounted = 0
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((listener) => listener())
const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Marks a live example on the page; one in DEMO_TOASTERS sends the site's Toaster away while it's mounted. */
export function useDemoToaster(name: string) {
  const owns = DEMO_TOASTERS.has(name)
  useEffect(() => {
    if (!owns) return
    mounted++
    emit()
    return () => {
      mounted--
      emit()
    }
  }, [owns])
}

/** Whether an example with its own Toaster is on the page. */
export function useDemoToasterShown() {
  return useSyncExternalStore(subscribe, () => mounted > 0, () => false)
}
