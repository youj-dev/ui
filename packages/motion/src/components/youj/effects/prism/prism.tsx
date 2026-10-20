'use client'

import { useLayoutEffect, useRef, type HTMLAttributes, type ReactNode } from 'react'
import { useYouj } from '@youj/core/lib/youj/provider'
import type { PrismOptions } from './engine'

export interface PrismEntranceProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'>,
    Pick<PrismOptions, 'duration' | 'speed' | 'phases' | 'marks'> {
  /** The UI to build: its first element is the frame. */
  children: ReactNode
  /** Plays on mount and again whenever this changes; `false` shows the UI as it is. Default true. */
  play?: boolean | number | string
  /** Called when a run ends, also early when focus moves into the UI (not when unmounting or a new play cancels it). */
  onFinish?: () => void
}

/** The element the run frames: the first child, past wrappers that render no box. */
function frameOf(host: HTMLElement) {
  let el = host.firstElementChild as HTMLElement | null
  while (el && getComputedStyle(el).display === 'contents') el = el.firstElementChild as HTMLElement | null
  return el
}

/**
 * Locks its child in piece by piece out of its color channels: each piece arrives as three faint offset copies that
 * slide together and snap into register as the real piece. The engine loads on the first play. Under reduced motion
 * the UI is just there.
 */
export function PrismEntrance({ children, play = true, duration, speed, phases, marks, onFinish, ...rest }: PrismEntranceProps) {
  const host = useRef<HTMLDivElement>(null)
  const k = useYouj()
  const latest = useRef({ duration, speed, phases, marks, onFinish, personality: k.motionPersonality })
  latest.current = { duration, speed, phases, marks, onFinish, personality: k.motionPersonality }

  // Before the first paint, so the UI doesn't show for the frames the engine takes to load.
  useLayoutEffect(() => {
    const el = host.current
    if (!el || play === false || k.reduced) return
    let run: { cancel(): void; finished: Promise<void> } | undefined
    let gone = false
    el.style.opacity = '0'
    const show = () => el.style.removeProperty('opacity')
    void Promise.all([import('./engine'), import('../entrance/ready')])
      .then(async ([{ prism }, { ready }]) => {
        const node = frameOf(el)
        if (gone || !node) return
        // the demo is read once, so it's read at rest: its fonts in, its own mount animations over
        await ready(node)
        if (gone) return
        const { onFinish: finish, ...options } = latest.current
        const current = prism(node, { ...options, reduced: false })
        run = current
        void current.finished.then(() => {
          if (!gone && run === current) finish?.()
        })
      })
      // The effect is decoration: if its code can't load, the UI just shows.
      .catch(() => {})
      .finally(show)
    return () => {
      gone = true
      show()
      run?.cancel()
    }
  }, [play, k.reduced])

  return (
    <div ref={host} {...rest}>
      {children}
    </div>
  )
}
