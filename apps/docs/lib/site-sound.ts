'use client'

import { useSyncExternalStore } from 'react'
import { createStoreSignal, onStorageKey } from '@/lib/store-signal'

/* The site's interface sound: off until the visitor turns it on with the
 * header's toggle, then remembered across visits and kept in step across
 * tabs. Only this flag is in the first load; the provider and the pack are
 * fetched once it's on (components/site/site-sound). */

export const SITE_SOUND_KEY = 'youj-sound'

// The choice storage refused (blocked, or full): it holds for this page's lifetime only.
let unsaved: boolean | null = null
// When a press last turned sound on, so that press, and nothing else (a reload, another tab), may be answered with a sound.
let turnedOnAt = Number.NEGATIVE_INFINITY

function stored(): boolean {
  if (unsaved !== null) return unsaved
  try {
    return localStorage.getItem(SITE_SOUND_KEY) === 'on'
  } catch {
    return false
  }
}

const { subscribe, notify } = createStoreSignal(onStorageKey(SITE_SOUND_KEY, true))

/** Turns the site's sound on or off, here and in every other tab, now and on later visits. */
export function setSiteSound(on: boolean) {
  if (on) turnedOnAt = performance.now()
  try {
    if (on) localStorage.setItem(SITE_SOUND_KEY, 'on')
    else localStorage.removeItem(SITE_SOUND_KEY)
    unsaved = null
  } catch {
    unsaved = on
  }
  notify()
}

/** Whether the visitor has sound on: false on the server and while hydrating. */
export function useSiteSound(): boolean {
  return useSyncExternalStore(subscribe, stored, () => false)
}

/** True within a moment of the press that turned sound on: long enough for the pack to arrive, short enough that the answer still belongs to the press. */
export function justTurnedOn(within = 1000): boolean {
  return performance.now() - turnedOnAt < within
}
