'use client'

import { useEffect, useLayoutEffect, useRef, type ComponentProps, type ReactNode } from 'react'
import { AnimatePresence, animate, m, useIsPresent, type AnimationPlaybackControls, type Variants } from 'motion/react'
import { MotionFeatures, PresenceSettled, useDirection, useYouj } from '@youj/core'

/* One step of the card at a time. The outgoing step drops away fast, a
 * little toward where the visitor came from, while the incoming one slides
 * in from where they're going (mirrored in RTL) and fades up once the old one
 * has all but gone. The card morphs from the old step's height to the new
 * one's on the layout spring instead of jumping; the outgoing step is popped
 * out of flow so the new height is measured at once, and a swap mid-morph
 * starts from the height it has reached. Then focus lands on the new step's
 * heading. Reduced motion swaps in place. */

/** How far a step travels as it swaps, in px: enough to read as direction, not as a slide show. */
const TRAVEL = 16

interface StageProps {
  step: string
  /** 1 going on, -1 going back. */
  direction: 1 | -1
  children: ReactNode
}

export function Stage({ step, direction, children }: StageProps) {
  const k = useYouj()
  const ref = useRef<HTMLDivElement>(null)
  const settled = useRef<number | null>(null)
  const morph = useRef<AnimationPlaybackControls | null>(null)
  // The step each effect last handled: a re-run for the same step (Strict Mode, a Speed change) is not a swap.
  const measured = useRef(step)
  const focused = useRef(step)
  const rtl = useDirection() === 'rtl' ? -1 : 1
  const travel = direction * rtl

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

  // Before paint: pin the old height, then morph to the new step's.
  useLayoutEffect(() => {
    const el = ref.current
    if (measured.current === step || !el) return
    measured.current = step
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
    // Clip the grow and the slide, with room for focus rings and shadows.
    el.style.overflow = 'clip'
    el.style.overflowClipMargin = `${TRAVEL}px`
    const controls = animate(el, { height: [from, to] }, k.spring('smooth'))
    morph.current = controls
    controls.then(() => {
      if (morph.current !== controls) return
      morph.current = null
      el.style.height = ''
      el.style.overflow = ''
      settled.current = el.offsetHeight
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps -- measures once per step; k only times the change
  }, [step])

  // After the swap: the new step's heading takes focus, so the change is heard.
  useEffect(() => {
    if (focused.current === step) return
    focused.current = step
    ref.current?.querySelector<HTMLElement>(`[data-yj-step="${step}"] [data-yj-step-heading]`)?.focus({ preventScroll: true })
  }, [step])

  const variants: Variants = k.reduced
    ? { enter: {}, center: { opacity: 1, x: 0 }, exit: { opacity: 0, transition: { type: false } } }
    : {
        enter: (d: number) => ({ opacity: 0, x: d * TRAVEL }),
        // The old step is all but gone before the new one shows, so the two never read as one.
        center: { opacity: 1, x: 0, transition: { x: k.spring('smooth'), opacity: { ...k.tween('base', 'enter'), delay: k.duration('instant') } } },
        exit: (d: number) => ({ opacity: 0, x: d * -TRAVEL, transition: { x: k.spring('smooth'), opacity: k.tween('instant', 'exit') } }),
      }

  return (
    <MotionFeatures>
      <div ref={ref} data-slot="contact-sales-stage" className="relative">
        <AnimatePresence mode="popLayout" initial={false} custom={travel}>
          <Step key={step} data-yj-step={step} custom={travel} variants={variants} initial={k.reduced ? false : 'enter'} animate="center" exit="exit">
            <PresenceSettled>{children}</PresenceSettled>
          </Step>
        </AnimatePresence>
      </div>
    </MotionFeatures>
  )
}

/** One step. Inert while it leaves, so neither a click nor focus lands on it. */
function Step(props: ComponentProps<typeof m.div> & { 'data-yj-step': string }) {
  const present = useIsPresent()
  return <m.div {...props} inert={!present || undefined} />
}
