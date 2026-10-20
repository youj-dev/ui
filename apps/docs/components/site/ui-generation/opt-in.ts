'use client'

import { useEffect, useSyncExternalStore } from 'react'

/* Which demos generate in, and the `?generate=1` switch: kept apart from the wrapper (./generated.tsx) so every page
 * that only asks pays a few bytes, and the wrapper loads only where something builds. */

/** The examples that arrive with an entrance whatever the reader picked, by the name <ComponentPreview> uses: the entrance's id (./entrances.ts). Any other plays the reader's pick. */
export const GENERATED = new Map<string, string>([
  ['tool-approval/demo', 'blueprint'],
  ['prompt-input/session', 'generate'],
])

/* The entrance effect the reader chose (the island's Entrance menu, ./entrances.ts), remembered across visits.
 * `?generate=1` on a page picks Generate (`?generate=blueprint`, Blueprint) until the reader picks again. Storage can be blocked: the pick then lasts the page's life. */

const KEY = 'youj-entrance'
const listeners = new Set<() => void>()
let held: string | null = null

function stored() {
  try {
    return localStorage.getItem(KEY) ?? held
  } catch {
    return held
  }
}
const subscribe = (notify: () => void) => {
  listeners.add(notify)
  addEventListener('storage', notify)
  return () => {
    listeners.delete(notify)
    removeEventListener('storage', notify)
  }
}

/** The effect a page's `?generate=` asks for (`1`, or none given, is Generate), else null. */
export function entranceFromQuery(params: URLSearchParams) {
  const asked = params.get('generate')
  return asked === null ? null : asked && asked !== '1' ? asked : 'generate'
}

/** The effect on show: `?generate=` on the page (a docs page, or a frame's /view page), else the reader's pick, else 'none'. */
export function useEntranceId() {
  return useSyncExternalStore(
    subscribe,
    () => entranceFromQuery(new URLSearchParams(location.search)) ?? stored() ?? 'none',
    () => 'none',
  )
}

/** The reader's pick: remembered, and it replaces a `?generate=1` the page was opened with. */
export function setEntrance(id: string) {
  held = id
  try {
    localStorage.setItem(KEY, id)
  } catch {}
  const url = new URL(location.href)
  if (url.searchParams.has('generate')) {
    url.searchParams.delete('generate')
    history.replaceState(history.state, '', url)
  }
  for (const notify of listeners) notify()
}

/** Whether every demo on the page builds in (the Generate entrance). */
export const useGenerating = () => useEntranceId() === 'generate'

/** The `generate=` query a frame's URL carries to wear the reader's pick, or '' on None. */
export function useEntranceQuery() {
  const id = useEntranceId()
  return id === 'none' ? '' : `generate=${id}`
}

/** With the Generate entrance, dialogs and other overlays that open while the demo arrives build in too (one watcher a page, however many demos). */
export function useGenerateOverlays(on: boolean) {
  useEffect(() => {
    if (!on) return
    let stop: (() => void) | undefined
    let gone = false
    void import('./overlays').then((m) => {
      if (!gone) stop = m.watchOverlays()
    })
    return () => {
      gone = true
      stop?.()
    }
  }, [on])
}

