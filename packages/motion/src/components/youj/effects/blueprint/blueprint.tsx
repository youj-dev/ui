'use client'

import { useLayoutEffect, useRef, type HTMLAttributes, type ReactNode } from 'react'
import { blueprintLabels } from '@youj/core/labels'
import { useYouj } from '@youj/core/lib/youj/provider'
import { useComponentLabels } from '@youj/core/lib/youj/use-component-labels'
import type { BlueprintOptions } from './engine'

export interface BlueprintEntranceProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'>,
    Pick<BlueprintOptions, 'duration' | 'speed' | 'phases' | 'columns'> {
  /** The UI to draft: its first element is the drawing's frame. */
  children: ReactNode
  /** Plays on mount and again whenever this changes; `false` shows the UI as it is. Default true. */
  play?: boolean | number | string
  /** Called when a run ends, also early when focus moves into the UI (not when unmounting or a new play cancels it). */
  onFinish?: () => void
}

/** The element the drawing frames: the first child, past wrappers that render no box. */
function frameOf(host: HTMLElement) {
  let el = host.firstElementChild as HTMLElement | null
  while (el && getComputedStyle(el).display === 'contents') el = el.firstElementChild as HTMLElement | null
  return el
}

/**
 * Drafts its child as an architect's blueprint (bounds, regions and parts in dotted pencil, with their numbers),
 * then inks it into the real UI. The engine loads on the first play. Under reduced motion the UI is just there.
 */
export function BlueprintEntrance({ children, play = true, duration, speed, phases, columns, onFinish, ...rest }: BlueprintEntranceProps) {
  const host = useRef<HTMLDivElement>(null)
  const k = useYouj()
  const labels = useComponentLabels(blueprintLabels)
  const latest = useRef({ duration, speed, phases, columns, labels, onFinish, personality: k.motionPersonality })
  latest.current = { duration, speed, phases, columns, labels, onFinish, personality: k.motionPersonality }

  // Before the first paint, so the UI doesn't show for the frames the engine takes to load.
  useLayoutEffect(() => {
    const el = host.current
    if (!el || play === false || k.reduced) return
    let run: { cancel(): void; finished: Promise<void> } | undefined
    let gone = false
    el.style.opacity = '0'
    const show = () => el.style.removeProperty('opacity')
    void import('./engine')
      .then(({ blueprint }) => {
        const node = frameOf(el)
        if (gone || !node) return
        const { onFinish: finish, ...options } = latest.current
        const current = blueprint(node, { ...options, reduced: false })
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
