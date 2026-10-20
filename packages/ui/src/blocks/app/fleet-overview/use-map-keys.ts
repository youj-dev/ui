import { useEffect, useLayoutEffect, useRef } from 'react'
import type { Harbor } from './use-harbor'

/* The map's keys: / searches, J and K step through the list, + and − zoom,
 * 0 frames, Esc closes the voyage. */

const isTyping = (target: EventTarget | null) => {
  const el = target as HTMLElement | null
  return !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))
}

/** `enabled` false leaves the keys alone (the map isn't on screen). */
export function useMapKeys({ visible, selectedId, select, floating, search, map }: Harbor, enabled = true) {
  // Keys, off while typing, with a modifier, or inside a dialog or menu.
  const keys = useRef({ visible, selectedId, select, floating, enabled })
  useLayoutEffect(() => {
    keys.current = { visible, selectedId, select, floating, enabled }
  })
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!keys.current.enabled || event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return
      if ((event.target as HTMLElement | null)?.closest?.('[role=dialog],[role=menu],[role=listbox],[role=grid]')) return
      const { visible, selectedId, select, floating } = keys.current
      const step = (by: 1 | -1) => {
        if (!visible.length) return
        const index = visible.findIndex((s) => s.id === selectedId)
        const next = visible[index === -1 ? 0 : Math.min(visible.length - 1, Math.max(0, index + by))]
        if (next) select(next.id)
      }
      const actions: Record<string, (() => void) | undefined> = {
        '/': () => search.current?.focus(),
        j: () => step(1),
        k: () => step(-1),
        '+': () => map.current?.zoomBy(1.4),
        '=': () => map.current?.zoomBy(1.4),
        '-': () => map.current?.zoomBy(1 / 1.4),
        '0': () => map.current?.fit(),
        Escape: selectedId && floating ? () => select(null) : undefined,
      }
      const action = actions[event.key]
      if (!action) return
      event.preventDefault()
      action()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one listener for the map’s life; map and search are refs and the rest is read from keys
  }, [])
}
