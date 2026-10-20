'use client'

import { useLayoutEffect, useRef, type HTMLAttributes, type ReactNode, type Ref } from 'react'
import {
  AnimatePresence,
  animate,
  m,
  useIsPresent,
  type AnimationPlaybackControls,
  type TargetAndTransition,
} from 'motion/react'
import { useYouj } from '@youj/core/lib/youj/provider'
import { cn } from '@youj/core/lib/youj/cn'
import { MotionFeatures, PresenceSettled } from '@youj/core/lib/youj/features'

/* Skeleton → content. The placeholder drops away quickly while the content
 * resolves into focus (a touch of blur and rise, decelerating), and the box
 * morphs from the placeholder's height to the content's so what sits below
 * moves instead of jumping. The outgoing layer is popped out of flow, so the
 * box can measure the incoming one straight away; a swap mid-morph starts
 * from the current height. Height is a layout animation by design: the page
 * below has to move with it. It works in both directions (refetch → skeleton). */

export interface ContentSwapProps extends HTMLAttributes<HTMLDivElement> {
  /** Show the fallback instead of the content. */
  loading: boolean
  /** Stands in while loading: usually a skeleton shaped like the content. Hidden from assistive tech. */
  fallback: ReactNode
  /** Announced politely while loading, e.g. "Loading invoices". Off by default. */
  loadingLabel?: string
  children: ReactNode
}

/** Crossfades a loading placeholder into content while the height follows. Reduced motion swaps instantly. */
export function ContentSwap({ loading, fallback, loadingLabel, className, children, ...rest }: ContentSwapProps) {
  const k = useYouj()
  const ref = useRef<HTMLDivElement>(null)
  const settled = useRef<number | null>(null)
  const morph = useRef<AnimationPlaybackControls | null>(null)
  const first = useRef(true)

  // Remember the resting height, so a swap knows where it starts.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const remember = () => {
      if (!morph.current) settled.current = el.offsetHeight
    }
    remember()
    const ro = new ResizeObserver(remember)
    ro.observe(el)
    return () => {
      ro.disconnect()
      morph.current?.stop()
      morph.current = null
    }
  }, [])

  // Before paint: pin the old height, then morph to the new content's height.
  // Keyed on `loading` only: a Speed or reduced-motion change is not a swap.
  useLayoutEffect(() => {
    const el = ref.current
    if (first.current || !el) {
      first.current = false
      return
    }
    const running = morph.current
    const from = running ? el.offsetHeight : settled.current
    running?.stop()
    morph.current = null
    el.style.height = ''
    const to = el.offsetHeight
    if (k.reduced || from === null || Math.abs(to - from) < 1) {
      el.style.overflow = ''
      settled.current = to
      return
    }
    el.style.height = `${from}px`
    el.style.overflow = 'hidden'
    const controls = animate(el, { height: [from, to] }, k.tween('base', 'standard'))
    morph.current = controls
    controls.then(() => {
      if (morph.current !== controls) return
      morph.current = null
      el.style.height = ''
      el.style.overflow = ''
      settled.current = el.offsetHeight
    })
  }, [loading])

  return (
    <MotionFeatures>
      <div {...rest} ref={ref} aria-busy={loading || undefined} className={cn('relative', className)}>
        <AnimatePresence mode="popLayout" initial={false}>
          {loading ? (
            <Layer key="fallback" aria-hidden from={{ opacity: 0 }} to={{ opacity: 1 }}>
              {fallback}
            </Layer>
          ) : (
            <Layer key="content" from={CONTENT_FROM} to={CONTENT_TO}>
              {children}
            </Layer>
          )}
        </AnimatePresence>
        {loadingLabel && (
          <span role="status" className="sr-only">
            {loading ? loadingLabel : ''}
          </span>
        )}
      </div>
    </MotionFeatures>
  )
}

/* The content resolves into focus. It ends on `filter: none`: a lingering
 * blur(0px) would make it a containing block for fixed-position descendants. */
const CONTENT_FROM: TargetAndTransition = { opacity: 0, y: 4, filter: 'blur(4px)' }
const CONTENT_TO: TargetAndTransition = { opacity: 1, y: 0, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }

interface LayerProps {
  from: TargetAndTransition
  to: TargetAndTransition
  children: ReactNode
  'aria-hidden'?: boolean
  /** AnimatePresence's popLayout measures the leaving side through it. */
  ref?: Ref<HTMLDivElement>
}

/** One side of the swap. The outgoing side drops away fast and is inert while it does;
 * the incoming side waits one stagger step so the two barely double-expose. */
function Layer({ from, to, children, ...rest }: LayerProps) {
  const k = useYouj()
  const present = useIsPresent()
  return (
    <m.div
      {...rest}
      inert={!present || undefined}
      initial={k.reduced ? false : from}
      animate={{ ...to, transition: k.reduced ? { type: false } : { ...k.tween('base', 'enter'), delay: k.stagger('base') } }}
      exit={k.reduced ? undefined : { opacity: 0, transition: k.tween('fast', 'standard') }}
    >
      <PresenceSettled>{children}</PresenceSettled>
    </m.div>
  )
}
