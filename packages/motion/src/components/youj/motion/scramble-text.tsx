'use client'

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type ElementType,
  type FocusEvent,
  type HTMLAttributes,
  type PointerEvent,
} from 'react'
import { useInView } from 'motion/react'
import { useYouj } from '@youj/core/lib/youj/provider'
import type { DurationToken } from '@youj/core/lib/youj/tokens'

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

export type ScrambleTrigger = 'mount' | 'view' | 'hover' | 'change'

export const GLYPHS = {
  alpha: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  alnum: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  symbols: '!<>-_\\/[]{}=+*^?#%&',
  binary: '01',
  hex: '0123456789ABCDEF',
} as const

/* Writes to React's own text node so later renders stay in sync with it. */
function write(el: HTMLElement, value: string) {
  if (el.firstChild instanceof Text) el.firstChild.nodeValue = value
  else el.textContent = value
}

export interface ScrambleTextProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** Target text. Changing it scrambles from the current text to the new one. */
  children: string
  as?: ElementType
  /** When to play. Default ['mount', 'change']. */
  trigger?: ScrambleTrigger | ScrambleTrigger[]
  /** Characters used while decoding. Default: upper-case letters and digits. */
  glyphs?: string
  /** Total time for the last character to resolve. Default 'deliberate'. */
  duration?: DurationToken
  /** How often unresolved glyphs re-roll. Default 'instant'. */
  tick?: DurationToken
  /** Called when a decode lands on the text (at once under reduced motion). */
  onComplete?: () => void
}

/**
 * Decodes toward its text through random glyphs, resolving left to right.
 * The real text stays in an sr-only copy; reduced motion shows it directly.
 * Use a monospace font (or tabular-nums) to keep the width steady.
 */
export function ScrambleText({
  children: text,
  as: Tag = 'span',
  trigger = ['mount', 'change'],
  glyphs = GLYPHS.alnum,
  duration = 'deliberate',
  tick = 'instant',
  onComplete,
  onPointerEnter,
  onFocus,
  ...rest
}: ScrambleTextProps) {
  const k = useYouj()
  const ref = useRef<HTMLElement>(null)
  const visualRef = useRef<HTMLSpanElement>(null)
  const raf = useRef(0)
  const shown = useRef(text)
  const complete = useRef(onComplete)
  complete.current = onComplete
  const triggers = Array.isArray(trigger) ? trigger : [trigger]
  const has = (t: ScrambleTrigger) => triggers.includes(t)
  const inView = useInView(ref, { once: true, amount: 0.6 })

  const play = useCallback(() => {
    const el = visualRef.current
    cancelAnimationFrame(raf.current)
    if (!el || k.reduced) {
      if (el) write(el, text)
      shown.current = text
      complete.current?.()
      return
    }
    const from = shown.current
    const total = k.ms(duration)
    const tickMs = k.ms(tick) / 2
    const length = Math.max(from.length, text.length)
    // Each position resolves at a staggered time, with jitter so it reads as decoding, not typing.
    const resolveAt = Array.from({ length }, (_, i) => (0.15 + 0.6 * (i / length) + 0.25 * Math.random()) * total)
    const pick = () => glyphs[Math.floor(Math.random() * glyphs.length)] ?? ''
    let noise = Array.from({ length }, pick)
    let lastTick = 0
    let start = 0

    const frame = (now: number) => {
      if (!start) start = now
      const t = now - start
      if (now - lastTick >= tickMs) {
        noise = noise.map(pick)
        lastTick = now
      }
      let out = ''
      let done = true
      for (let i = 0; i < length; i++) {
        const target = text[i] ?? ''
        if (t >= resolveAt[i]!) out += target
        else {
          done = false
          // Spaces stay spaces so word shapes read early.
          out += target === ' ' || (from[i] === ' ' && !target) ? target : noise[i]
        }
      }
      write(el, out)
      shown.current = out
      if (done) {
        write(el, text)
        shown.current = text
        complete.current?.()
      } else raf.current = requestAnimationFrame(frame)
    }
    frame(performance.now())
  }, [text, glyphs, duration, tick, k])

  // Layout effect: the first scrambled frame replaces the new text before it paints.
  const mounted = useRef(false)
  useIsoLayoutEffect(() => {
    const first = !mounted.current
    mounted.current = true
    if (first ? has('mount') : has('change')) play()
    else if (visualRef.current) {
      write(visualRef.current, text)
      shown.current = text
    }
  }, [text])

  useEffect(() => {
    if (inView && has('view')) play()
  }, [inView])

  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  return (
    <Tag
      ref={ref}
      {...rest}
      onPointerEnter={(e: PointerEvent<HTMLElement>) => {
        onPointerEnter?.(e)
        if (has('hover')) play()
      }}
      onFocus={(e: FocusEvent<HTMLElement>) => {
        onFocus?.(e)
        if (has('hover')) play()
      }}
    >
      <span className="sr-only select-none">{text}</span>
      <span ref={visualRef} aria-hidden className="whitespace-pre">
        {text}
      </span>
    </Tag>
  )
}
