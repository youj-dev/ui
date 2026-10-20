/* The dev colour panel's current look, for the parts of the site that keep a theme scope of their own (a docs
 * example's preview): they follow it while the panel is open and nothing was picked on them. Tiny on purpose, so
 * every page can read it while the panel itself stays a lazy chunk. */

import { useSyncExternalStore } from 'react'
import type { ThemeInput } from '@youj/core/lib/youj/theme/contract'

let current: ThemeInput | null = null
const listeners = new Set<() => void>()

/** The panel's look, or null to hand the previews back to their own. */
export function setDevTheme(theme: ThemeInput | null): void {
  current = theme
  for (const listener of listeners) listener()
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** The panel's look while it's open, else null. */
export function useDevTheme(): ThemeInput | null {
  return useSyncExternalStore(subscribe, () => current, () => null)
}
