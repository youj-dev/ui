'use client'

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { m, useInView, type Variants } from 'motion/react'
import { useYouj, useMotionBudget } from '@youj/core/lib/youj/provider'
import { staggerScale } from '@youj/core/lib/youj/budget'
import { resolveInView } from '@youj/core/lib/youj/in-view'
import type { InView } from '@youj/core/lib/youj/vocabulary'
import type { DurationToken, EasingToken, StaggerToken } from '@youj/core/lib/youj/tokens'
import { cn } from '@youj/core/lib/youj/cn'
import { revealVariants, type RevealVariant } from './reveal'
import { MotionFeatures } from '@youj/core/lib/youj/features'

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

export type SplitBy = 'chars' | 'words' | 'lines'

const DEFAULT_STEP: Record<SplitBy, StaggerToken> = { chars: 'tight', words: 'base', lines: 'loose' }

type InViewOptions = NonNullable<Parameters<typeof useInView>[1]>

export interface TextSplitProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** The text. Rendered once for assistive tech; the split copy is aria-hidden. */
  children: string
  as?: ElementType
  by?: SplitBy
  variant?: RevealVariant
  /** Clip each unit to its own box, so 'rise' slides up from behind a line. */
  mask?: boolean
  step?: StaggerToken
  /** Initial delay, in `step`s. */
  delay?: number
  /** When it plays: `false` on mount; `true` (the default) when scrolled into view, once, at 40% visible; or `{ once, amount, margin }`. */
  inView?: InView
  duration?: DurationToken
  ease?: EasingToken
  distance?: number | string
}

/** Groups words into rendered lines by their vertical offset. */
function measureLines(root: HTMLElement): number[][] {
  const lines: number[][] = []
  let lastTop = Number.NEGATIVE_INFINITY
  root.querySelectorAll<HTMLElement>('[data-word]').forEach((el, i) => {
    const top = el.offsetTop
    if (top - lastTop > 1) lines.push([])
    lines[lines.length - 1]!.push(i)
    lastTop = top
  })
  return lines
}

/**
 * Splits text into chars, words or lines and reveals them in sequence with any
 * Reveal variant. Line mode re-measures on resize and when fonts load.
 */
export function TextSplit({
  children: text,
  as: Tag = 'span',
  by = 'words',
  variant = 'rise',
  mask = false,
  step,
  delay = 0,
  inView: inViewProp,
  duration,
  ease,
  distance,
  className,
  ...rest
}: TextSplitProps) {
  const k = useYouj()
  const { tier } = useMotionBudget()
  const ref = useRef<HTMLElement>(null)
  const strutRef = useRef<HTMLSpanElement>(null)
  const when = resolveInView(inViewProp, { amount: 0.4 })
  const inView = useInView(ref, { once: when.once, amount: when.amount, margin: when.margin as InViewOptions['margin'] })
  const visible = !when.onView || inView
  const words = useMemo(() => text.split(/\s+/).filter(Boolean), [text])
  // Groups are tagged with the text they were measured for, so new text re-measures.
  const [measured, setMeasured] = useState<{ text: string; lines: number[][] } | null>(null)
  const lines = measured?.text === text ? measured.lines : null

  // Lines added by a later re-measure start settled. Only counts once units
  // have actually mounted (line mode's first commit has none yet).
  const played = useRef(false)
  const unitsMounted = by !== 'lines' || lines !== null
  useEffect(() => {
    if (visible && unitsMounted) played.current = true
  }, [visible, unitsMounted])

  const variants: Variants = useMemo(
    () => revealVariants(k, { variant, distance: distance ?? (mask ? '105%' : undefined), duration, ease }),
    [k, variant, distance, mask, duration, ease],
  )
  const units = by === 'lines' ? (lines?.length ?? 0) : by === 'words' ? words.length : words.join('').length
  // The whole spread stays within the deliberate token, and a low motion
  // budget compresses long sequences so they land in a few steps.
  const stepSec = k.stagger(step ?? DEFAULT_STEP[by])
  const spread = staggerScale(units - 1, tier, stepSec, k.duration('deliberate'))

  // Lines are measured from an invisible flat copy (the strut), so re-measuring
  // never unmounts the visible lines; state only changes if the grouping does.
  const remeasure = useCallback(() => {
    if (!strutRef.current) return
    const next = measureLines(strutRef.current)
    setMeasured((prev) =>
      prev?.text === text && JSON.stringify(prev.lines) === JSON.stringify(next) ? prev : { text, lines: next },
    )
  }, [text])

  // Before paint, so the first frame already shows grouped lines.
  useIsoLayoutEffect(() => {
    if (by === 'lines' && !k.reduced) remeasure()
  }, [by, k.reduced, remeasure])

  useEffect(() => {
    const el = ref.current
    if (by !== 'lines' || k.reduced || !el) return
    let width = el.offsetWidth
    const ro = new ResizeObserver(() => {
      if (el.offsetWidth === width) return
      width = el.offsetWidth
      remeasure()
    })
    ro.observe(el)
    let alive = true
    document.fonts?.ready.then(() => alive && remeasure())
    // A face that starts loading after `ready` resolved still changes widths.
    document.fonts?.addEventListener('loadingdone', remeasure)
    return () => {
      alive = false
      ro.disconnect()
      document.fonts?.removeEventListener('loadingdone', remeasure)
    }
  }, [by, k.reduced, remeasure])

  if (k.reduced) {
    return (
      <Tag ref={ref} {...rest} className={className}>
        {text}
      </Tag>
    )
  }

  const unit = (key: string | number, index: number, content: string, block = false) => {
    const node = (
      <m.span
        key={mask ? undefined : key}
        className={block ? 'block' : 'inline-block'}
        variants={variants}
        custom={(delay + index * spread) * stepSec}
        initial={played.current ? false : 'hidden'}
        animate={visible ? 'shown' : 'hidden'}
      >
        {content}
      </m.span>
    )
    if (!mask) return node
    return (
      <span
        key={key}
        className={cn(block ? 'block' : 'inline-block', 'overflow-hidden pb-[0.12em] -mb-[0.12em] align-top')}
      >
        {node}
      </span>
    )
  }

  let body: ReactNode
  if (by === 'lines') {
    body = lines ? lines.map((line, i) => unit(i, i, line.map((w) => words[w]).join(' '), true)) : text
  } else if (by === 'words') {
    body = words.flatMap((w, i) => [unit(i, i, w), i < words.length - 1 ? ' ' : null])
  } else {
    let n = 0
    body = words.flatMap((w, wi) => [
      <span key={wi} className="inline-block whitespace-nowrap">
        {Array.from(w).map((c, ci) => unit(ci, n++, c))}
      </span>,
      wi < words.length - 1 ? ' ' : null,
    ])
  }

  return (
    <MotionFeatures>
      <Tag ref={ref} {...rest} className={className}>
        <span className="sr-only">{text}</span>
        <span
          aria-hidden
          className={by === 'lines' ? 'block' : undefined}
          style={by === 'lines' && !lines ? { visibility: 'hidden' } : undefined}
        >
          {body}
          {/* Zero-height flat copy: the measuring source, and it keeps the element's
              intrinsic width the same before and after grouping, so shrink-to-fit
              parents don't resize it into a re-measure loop. */}
          {by === 'lines' && (
            <span ref={strutRef} className="invisible block h-0 overflow-hidden">
              {words.map((w, i) => (
                <span key={i} data-word="">
                  {w}
                  {i < words.length - 1 ? ' ' : ''}
                </span>
              ))}
            </span>
          )}
        </span>
      </Tag>
    </MotionFeatures>
  )
}
