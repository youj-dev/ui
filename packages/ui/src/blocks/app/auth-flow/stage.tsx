'use client'

import { useEffect, useLayoutEffect, useRef, type ComponentProps, type ReactNode } from 'react'
import { AnimatePresence, animate, m, useIsPresent, type AnimationPlaybackControls, type Variants } from 'motion/react'
import { MotionFeatures, PresenceSettled, useDirection, useYouj } from '@youj/core'

/* The auth flow's stage: one step at a time, in the manner of ContentSwap.
 * The outgoing step drops away fast, sliding a little toward where the
 * journey came from, while the incoming one slides in from where it's going
 * (mirrored in RTL) and fades up once the old one has all but gone. The box morphs from
 * the old step's height to the new one's on the layout spring, so the card
 * resizes instead of jumping; the outgoing step is popped out of flow, so the
 * new height is measured at once, and a swap mid-morph starts from the
 * height it has reached. Then focus lands on the new step's heading (or
 * stays in a field the step focused itself). Reduced motion swaps in place. */

/** How far a step travels as it swaps, in px: enough to read as direction, not as a slide show. */
const TRAVEL = 16

interface StepStageProps {
  step: string
  /** 1 going deeper into the journey, -1 coming back. */
  direction: 1 | -1
  children: ReactNode
}

function StepStage({ step, direction, children }: StepStageProps) {
  const k = useYouj()
  const ref = useRef<HTMLDivElement>(null)
  const settled = useRef<number | null>(null)
  const morph = useRef<AnimationPlaybackControls | null>(null)
  // The step each effect last handled: a re-run for the same step (Strict Mode, a Speed change) is not a swap.
  const measured = useRef(step)
  const focused = useRef(step)
  // Inline-end is left in RTL, so travel flips with the writing direction.
  const rtl = useDirection() === 'rtl' ? -1 : 1
  const travel = direction * rtl

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
    // Clip the grow and the slide, with room for the steps' focus rings and shadows.
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

  // After the swap: focus the news, unless the step already took focus (the code field does).
  useEffect(() => {
    if (focused.current === step) return
    focused.current = step
    const layer = ref.current?.querySelector<HTMLElement>(`[data-step="${step}"]`)
    if (!layer || layer.contains(document.activeElement)) return
    layer.querySelector<HTMLElement>('h1, h2')?.focus({ preventScroll: true })
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
      <div ref={ref} data-slot="auth-flow-stage" className="relative">
        <AnimatePresence mode="popLayout" initial={false} custom={travel}>
          <Step key={step} data-step={step} custom={travel} variants={variants} initial={k.reduced ? false : 'enter'} animate="center" exit="exit">
            <PresenceSettled>{children}</PresenceSettled>
          </Step>
        </AnimatePresence>
      </div>
    </MotionFeatures>
  )
}

/** One step. Inert while it leaves, so neither a click nor focus lands on it. */
function Step(props: ComponentProps<typeof m.div> & { 'data-step': string }) {
  const present = useIsPresent()
  return <m.div {...props} inert={!present || undefined} />
}

export { StepStage }
