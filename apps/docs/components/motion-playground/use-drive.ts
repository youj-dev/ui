'use client'

import { useCallback, useEffect, useRef } from 'react'
import { animate, useMotionValue, type AnimationPlaybackControls, type Transition } from 'motion/react'
import type { PlotHandle } from './plot'

/**
 * One number, animated the way the code on the page animates it, with the
 * plot following along: every frame adds the value's progress (0 where this
 * run started, 1 at its target) at the animation's own clock, divided by the
 * time scale, so the trace is in the token's milliseconds. A new target
 * mid-flight starts a new run from wherever the value is; a spring carries
 * its velocity into it, and the trace shows that.
 */
export function useDrive(initial: number) {
  const value = useMotionValue(initial)
  const plot = useRef<PlotHandle>(null)
  const run = useRef<{ controls: AnimationPlaybackControls; from: number; to: number; scale: number } | null>(null)

  const stop = useCallback(() => {
    run.current?.controls.stop()
    run.current = null
  }, [])

  /** Animates to `to`; instantly when `reduced`, with no trace to draw. */
  const go = useCallback(
    (to: number, transition: Transition, { scale, reduced }: { scale: number; reduced: boolean }) => {
      stop()
      const from = value.get()
      if (reduced || from === to) {
        value.jump(to)
        plot.current?.rest()
        return
      }
      plot.current?.begin()
      plot.current?.point(0, 0)
      const controls = animate(value, to, transition)
      const current = { controls, from, to, scale }
      run.current = current
      controls.then(() => {
        if (run.current === current) run.current = null
      })
    },
    [value, stop],
  )

  /** Puts the value somewhere at once, ending any run. */
  const jump = useCallback(
    (to: number) => {
      stop()
      value.jump(to)
    },
    [value, stop],
  )

  useEffect(
    () =>
      value.on('change', (v) => {
        const current = run.current
        if (!current || current.to === current.from) return
        plot.current?.point((current.controls.time * 1000) / current.scale, (v - current.from) / (current.to - current.from))
      }),
    [value],
  )

  useEffect(() => stop, [stop])

  return { value, plot, go, jump }
}
