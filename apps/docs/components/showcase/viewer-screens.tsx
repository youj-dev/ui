'use client'

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { useYouj } from '@youj/core'
import { cn } from '@/lib/cn'
import type { IslandView } from './preview-island'

const ORDER: IslandView[] = ['preview', 'code', 'info']
/** How far a screen slides as it crosses, px: a nudge, not a wipe. */
const SLIDE = 14

/**
 * The viewer's screens (Preview, Code, Info), one on show. Changing screens
 * crosses them: the new one fades in sliding a little from the side it
 * follows in the tab order, the old one fades out the other way, in the
 * site's base duration. Preview stays mounted (hidden, so back to it the
 * item is as it was, never reloaded); the others mount when they show. Under
 * reduced motion the change is instant.
 */
export function Screens({ view, screens }: { view: IslandView; screens: Record<IslandView, ReactNode> }) {
  const k = useYouj()
  const root = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<{ view: IslandView; leaving: IslandView | null; dir: 1 | -1 }>({ view, leaving: null, dir: 1 })
  if (state.view !== view) setState({ view, leaving: state.view, dir: ORDER.indexOf(view) > ORDER.indexOf(state.view) ? 1 : -1 })
  const { leaving, dir } = state

  // biome-ignore lint/correctness/useExhaustiveDependencies: deps are chosen by hand
  useLayoutEffect(() => {
    if (!leaving) return
    const el = root.current
    const incoming = el?.querySelector<HTMLElement>(`[data-screen="${view}"]`)
    const outgoing = el?.querySelector<HTMLElement>(`[data-screen="${leaving}"]`)
    if (k.reduced || !incoming || !outgoing || typeof incoming.animate !== 'function') {
      setState((s) => ({ ...s, leaving: null }))
      return
    }
    const sign = getComputedStyle(el!).direction === 'rtl' ? -dir : dir
    const options = { duration: k.ms('base'), easing: `cubic-bezier(${k.ease('standard').join(',')})` }
    incoming.animate([{ opacity: 0, translate: `${sign * SLIDE}px 0` }, { opacity: 1, translate: '0 0' }], options)
    const out = outgoing.animate([{ opacity: 1, translate: '0 0' }, { opacity: 0, translate: `${-sign * SLIDE}px 0` }], { ...options, fill: 'forwards' })
    const done = () => setState((s) => (s.leaving === leaving ? { ...s, leaving: null } : s))
    out.onfinish = done
    out.oncancel = done
    return () => out.cancel()
    // The change of screen only; the clock is read as it was then.
  }, [view, leaving])

  return (
    <div ref={root} className="relative flex min-h-0 min-w-0 flex-1">
      {ORDER.map((id) => {
        const on = id === view
        const out = id === leaving
        // Preview is kept mounted; Code and Info are there only while they show or leave.
        if (id !== 'preview' && !on && !out) return null
        return (
          <div key={id} data-screen={id} aria-hidden={out || undefined} inert={out || undefined} className={cn('flex min-h-0 min-w-0 flex-1', out && 'pointer-events-none absolute inset-0 z-10', !on && !out && 'hidden')}>
            {screens[id]}
          </div>
        )
      })}
    </div>
  )
}
