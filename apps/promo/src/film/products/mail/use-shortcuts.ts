import { useEffect, useRef } from 'react'
import type { Folio } from './use-folio'

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null
  return !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))
}

/**
 * Folio's keys: J / K move, E is done, H sets aside, R replies, # deletes,
 * S stars, Z undoes, C writes, / searches, and on a phone Escape goes back
 * to the index. Each presses its cap in on the legend. They're off while
 * typing, while a dialog or menu is open, and with a modifier held (⌘K is the
 * palette's).
 */
export function useShortcuts(folio: Folio, phone: boolean) {
  const latest = useRef({ folio, phone })
  latest.current = { folio, phone }
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const { folio: f, phone: small } = latest.current
      if (f.composing || event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return
      if ((event.target as HTMLElement | null)?.closest?.('[role=dialog],[role=menu]')) return
      const m = f.current
      const live = m && m.stack !== 'sent' && m.stack !== 'drafts'
      const actions: Record<string, [string, () => void] | undefined> = {
        j: ['move', () => f.step(1)],
        k: ['move', () => f.step(-1)],
        e: m && m.stack !== 'done' && m.stack !== 'sent' ? ['done', () => f.done(m)] : undefined,
        h: live ? ['later', () => f.setLaterOpen(true)] : undefined,
        r: live ? ['reply', () => f.setReplying(true)] : undefined,
        '#': m && m.stack !== 'trash' ? ['delete', () => f.remove(m)] : undefined,
        s: m ? ['star', () => f.star(m)] : undefined,
        z: f.undo.current ? ['undo', () => f.undo.current?.()] : undefined,
        c: ['write', () => f.compose()],
        '/': ['search', () => f.refs.search.current?.focus()],
        Escape: small && f.reading ? ['back', () => f.setReading(false)] : undefined,
      }
      const action = actions[event.key]
      if (!action) return
      event.preventDefault()
      f.flash(action[0])
      action[1]()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
