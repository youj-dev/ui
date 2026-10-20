'use client'

import { useEffect, useLayoutEffect, useRef, type ComponentProps, type ReactNode } from 'react'
import { AnimatePresence, animate, m, useIsPresent, type AnimationPlaybackControls, type Variants } from 'motion/react'
import { MotionFeatures, PresenceSettled, useYouj } from '@youj/core'

/* One question at a time, travelling the way the survey goes: forward, the
 * answered question lifts away while the next rises in from below; back, the
 * other way round. The old one is nearly gone before the new one shows, and
 * the card's height morphs between them on the layout spring instead of
 * jumping (a swap mid-morph starts from the height it has reached). Then
 * focus lands in the new question: its field, or its heading, so it's heard.
 * Reduced motion: the questions swap in place. */

/** How far a question travels as it swaps, in px: enough to read as direction. */
const TRAVEL = 20

interface StageProps {
  /** The question (or view) on show. */
  step: string
  /** 1 going on, -1 going back. */
  direction: 1 | -1
  /** Move focus into each new view. Default true; a preview beside an editor turns it off. */
  focus?: boolean
  children: ReactNode
}

export function Stage({ step, direction, focus = true, children }: StageProps) {
  const k = useYouj()
  const ref = useRef<HTMLDivElement>(null)
  const settled = useRef<number | null>(null)
  const morph = useRef<AnimationPlaybackControls | null>(null)
  // The step each effect last handled: a re-run for the same step is not a swap.
  const measured = useRef(step)
  const focused = useRef(step)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const remember = () => {
      if (!morph.current) settled.current = el.offsetHeight
    }
    remember()
    const observer = new ResizeObserver(remember)
    observer.observe(el)
    return () => {
      observer.disconnect()
      morph.current?.stop()
      morph.current = null
    }
  }, [])

  // Before paint: pin the old height, then morph to the new question's.
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
  }, [step, k])

  // After the swap: focus the new question's field, or its heading.
  useEffect(() => {
    if (focused.current === step || !focus) return
    focused.current = step
    const view = [...(ref.current?.querySelectorAll<HTMLElement>('[data-yj-step]') ?? [])].find((el) => el.dataset.yjStep === step)
    const target = view?.querySelector<HTMLElement>('[data-yj-autofocus]') ?? view?.querySelector<HTMLElement>('[data-yj-step-heading]')
    target?.focus({ preventScroll: true })
  }, [step, focus])

  const variants: Variants = k.reduced
    ? { enter: {}, center: { opacity: 1, y: 0 }, exit: { opacity: 0, transition: { type: false } } }
    : {
        enter: (d: number) => ({ opacity: 0, y: d * TRAVEL }),
        center: { opacity: 1, y: 0, transition: { y: k.spring('smooth'), opacity: { ...k.tween('base', 'enter'), delay: k.duration('instant') } } },
        exit: (d: number) => ({ opacity: 0, y: d * -TRAVEL, transition: { y: k.spring('smooth'), opacity: k.tween('instant', 'exit') } }),
      }

  return (
    <MotionFeatures>
      <div ref={ref} data-slot="survey-stage" className="relative">
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <View
            key={step}
            data-yj-step={step}
            custom={direction}
            variants={variants}
            initial={k.reduced ? false : 'enter'}
            animate="center"
            exit="exit"
          >
            <PresenceSettled>{children}</PresenceSettled>
          </View>
        </AnimatePresence>
      </div>
    </MotionFeatures>
  )
}

/** One question. Inert while it leaves, so neither a click nor focus lands on it. */
function View(props: ComponentProps<typeof m.div> & { 'data-yj-step': string }) {
  const present = useIsPresent()
  return <m.div {...props} inert={!present || undefined} />
}
