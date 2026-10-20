'use client'

import { useLayoutEffect, useRef, type HTMLAttributes, type ReactNode } from 'react'
import { useYouj } from '@youj/core/lib/youj/provider'
import type { MotionPersonality } from '@youj/core/lib/youj/tokens'
import type { EntranceRun } from './run'

/* The React side every look's wrapper shares (`<InspectorEntrance>`, `<LayersEntrance>`, `<RenderPassesEntrance>`): plays the look around the
 * first child on mount and whenever `play` changes, loads its code on the first play, and hides the UI for the frames
 * that takes, so it never shows before its entrance. */

export interface EntranceHostProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** The UI to play: its first element is the demo. */
  children: ReactNode
  /** Plays on mount and again whenever this changes; `false` shows the UI as it is. Default true. */
  play?: boolean | number | string
  /** Called when a run ends, also early when focus moves into the UI (not when unmounting or a new play cancels it). */
  onFinish?: () => void
}

type Start<O> = (node: HTMLElement, options: O & { reduced: boolean; personality: MotionPersonality }) => EntranceRun

/** The element the look plays on: the first child, past wrappers that render no box. */
function frameOf(host: HTMLElement) {
  let el = host.firstElementChild as HTMLElement | null
  while (el && getComputedStyle(el).display === 'contents') el = el.firstElementChild as HTMLElement | null
  return el
}

export function EntranceHost<O>({
  load,
  options,
  children,
  play = true,
  onFinish,
  ...rest
}: EntranceHostProps & { load: () => Promise<Start<O>>; options: O }) {
  const host = useRef<HTMLDivElement>(null)
  const k = useYouj()
  const latest = useRef({ options, onFinish, load, personality: k.motionPersonality })
  latest.current = { options, onFinish, load, personality: k.motionPersonality }

  // Before the first paint, so the UI doesn't show for the frames the look takes to load.
  useLayoutEffect(() => {
    const el = host.current
    if (!el || play === false || k.reduced) return
    let run: EntranceRun | undefined
    let gone = false
    el.style.opacity = '0'
    const show = () => el.style.removeProperty('opacity')
    void latest.current
      .load()
      .then((start) => {
        const node = frameOf(el)
        if (gone || !node) return
        const { options: o, onFinish: finish, personality } = latest.current
        const current = start(node, { ...o, reduced: false, personality })
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
