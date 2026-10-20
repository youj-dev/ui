'use client'

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { animate, useMotionValue, useScroll, useSpring, useTransform, type MotionValue } from 'motion/react'
import { useYouj } from '@youj/core'
import { smoothstep } from './projection'

type ScrollOffset = NonNullable<NonNullable<Parameters<typeof useScroll>[0]>['offset']>

export type StackMode = 'assembled' | 'exploded'

export interface StackProgressOptions {
  /** The element whose pass through the viewport drives the separation. */
  target: RefObject<HTMLElement | null>
  /** Scroll offsets for progress 0 and 1. Default: from entering the viewport to leaving it. */
  offset?: ScrollOffset
  /** The slice of that progress over which the stack comes apart. Default [0, 1]. */
  range?: readonly [number, number]
  /** Let the scroll drive it. Off, only the control does. Default true. */
  scroll?: boolean
}

export interface StackProgress {
  /** Separation, 0 assembled to 1 apart: hand it to LayerStack. */
  explode: MotionValue<number>
  /** The raw scroll progress through `offset`, for anything else the scene ties to the scroll. */
  progress: MotionValue<number>
  /** Which way the stack is, for a toggle: the control's choice, or wherever the scroll has it. */
  mode: StackMode
  /** Take over from the scroll. The scroll gets it back once the stage has left the viewport, or at once with `null`. */
  choose: (mode: StackMode | null) => void
}

/**
 * Drives a LayerStack's separation from the scroll, with a control that can
 * take over. The scroll's progress is shaped (a gentle S, so the planes ease
 * off the card and into place) and spring-smoothed on the `smooth` token;
 * the control springs there on the same token, and a reversal mid-flight
 * carries its velocity. Under reduced motion there's no scroll link: the
 * stack starts apart (the diagram) and the control switches instantly.
 */
export function useStackProgress({ target, offset = ['start end', 'end start'], range = [0, 1], scroll = true }: StackProgressOptions): StackProgress {
  const k = useYouj()
  const [manual, setManual] = useState<StackMode | null>(null)
  const [scrolled, setScrolled] = useState<StackMode>('assembled')

  const { scrollYProgress } = useScroll({ target, offset })
  const [a, b] = range
  const shaped = useTransform(scrollYProgress, (v) => smoothstep(a, b, v))
  const smooth = useSpring(shaped, k.spring('smooth'))
  const explode = useMotionValue(0)

  const following = scroll && !k.reduced && manual === null
  const settings = useRef({ following })
  settings.current = { following }

  // The scroll leads while nobody has used the control.
  useEffect(() => {
    if (!following) return
    explode.set(smooth.get())
    return smooth.on('change', (v) => {
      if (settings.current.following) explode.set(v)
    })
  }, [following, smooth, explode])

  // The control, or reduced motion's still frame.
  useEffect(() => {
    if (following) return
    const to = (manual ?? (k.reduced || !scroll ? 'exploded' : 'assembled')) === 'exploded' ? 1 : 0
    if (k.reduced) {
      explode.set(to)
      return
    }
    const run = animate(explode, to, k.spring('smooth'))
    return () => run.stop()
  }, [following, manual, k, scroll, explode])

  // The toggle reads where the scroll has the stack (a render only when it crosses halfway).
  useEffect(() => {
    let last: StackMode | null = null
    return explode.on('change', (v) => {
      const next: StackMode = v > 0.5 ? 'exploded' : 'assembled'
      if (next === last) return
      last = next
      setScrolled(next)
    })
  }, [explode])

  // Once the stage has left the viewport, the scroll takes it back.
  useEffect(() => {
    const el = target.current
    if (!el || manual === null || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([entry]) => {
      if (entry && !entry.isIntersecting) setManual(null)
    })
    io.observe(el)
    return () => io.disconnect()
  }, [target, manual])

  const choose = useCallback((next: StackMode | null) => setManual(next), [])
  const still: StackMode = k.reduced || !scroll ? 'exploded' : 'assembled'
  const mode = manual ?? (following ? scrolled : still)
  return { explode, progress: scrollYProgress, mode, choose }
}
