'use client'

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { AnimatePresence, m, useDragControls, useIsPresent, useMotionValue, useTransform, type PanInfo, type Variants } from 'motion/react'
import { MotionFeatures, PresenceSettled, useDirection, useYouj } from '@youj/core'
import { cn } from '../../../lib/utils'

/* The deck: the question on top as a card, the ones still ahead peeking out
 * below it, fewer as you near the end. The top card follows a finger sideways
 * and tilts with it; let go past a third of its width, or flicked, and it
 * flies off the way it was thrown and the next card rises to the top (thrown
 * towards the reading start, it goes on; the other way, back). A throw that
 * can't go on (no answer yet) springs back and shakes. Going back, the last
 * card flies in from where it left. Controls inside the card (a slider, a
 * ranking's grips, a field) keep their own gestures. Reduced motion: cards
 * cross-fade and nothing tilts. */

/** How far a card must travel, in px, or how fast, in px/s, to be thrown. */
const THROW = 96
const FLICK = 450

interface DeckStackProps {
  /** The card on top, keyed: a new key deals a new card. */
  step: string
  /** 1 when the deck went on, -1 back. */
  direction: 1 | -1
  /** Cards still ahead, drawn peeking below (up to two). */
  ahead: number
  /** A throw: 1 to go on, -1 back. Returns whether the deck moved. */
  onThrow?: (direction: 1 | -1) => boolean
  children: ReactNode
  className?: string
}

const SHAKE: Variants = { rest: { x: 0 }, odd: { x: [0, -7, 7, -3, 0] }, even: { x: [0, -7, 7, -3, 0] } }

const NO_DRAG = '[data-slot=slider], [data-slot=sortable-list], input, textarea, select, [contenteditable]'

export function DeckStack({ step, direction, ahead, onThrow, children, className }: DeckStackProps) {
  const k = useYouj()
  const ref = useRef<HTMLDivElement>(null)
  // A new card on top: focus its field, or its heading, so it's heard.
  const focused = useRef(step)
  useEffect(() => {
    if (focused.current === step) return
    focused.current = step
    const card = [...(ref.current?.querySelectorAll<HTMLElement>('[data-yj-step]') ?? [])].find((el) => el.dataset.yjStep === step)
    const target = card?.querySelector<HTMLElement>('[data-yj-autofocus]') ?? card?.querySelector<HTMLElement>('[data-yj-step-heading]')
    target?.focus({ preventScroll: true })
  }, [step])
  // Thrown towards the reading start goes on: left in a left-to-right language, right in a right-to-left one.
  const start = useDirection() === 'rtl' ? 1 : -1
  const variants: Variants = k.reduced
    ? {
        enter: { opacity: 0 },
        center: { opacity: 1, transition: k.tween('base', 'enter') },
        exit: { opacity: 0, transition: k.tween('fast', 'exit') },
      }
    : {
        // Going on, the new card rises from the stack; going back, it flies in from where it left.
        enter: (d: number) =>
          d > 0 ? { opacity: 0.6, scale: 0.94, y: 14, x: 0, rotate: 0 } : { opacity: 0, x: `${start * 115}%`, rotate: start * 9, scale: 1, y: 0 },
        center: { opacity: 1, scale: 1, y: 0, x: 0, rotate: 0, transition: { default: k.spring('smooth'), opacity: k.tween('fast', 'enter') } },
        // Going on, the old card is thrown off; going back, it sinks into the stack.
        exit: (d: number) =>
          d > 0
            ? { opacity: 0, x: `${start * 115}%`, rotate: start * 9, transition: { default: k.spring('smooth'), opacity: k.tween('base', 'exit') } }
            : { opacity: 0, scale: 0.94, y: 14, transition: { default: k.spring('smooth'), opacity: k.tween('fast', 'exit') } },
      }

  return (
    <MotionFeatures features="max">
      <div ref={ref} className={cn('relative', className)}>
        {/* The cards still ahead, peeking out below the top one. */}
        {[2, 1].map((depth) =>
          ahead >= depth ? (
            <div
              key={depth}
              aria-hidden
              className="absolute inset-0 origin-bottom rounded-3xl border border-line bg-surface shadow-sm transition-[translate,scale,opacity] yj-duration-base ease-standard"
              style={{ translate: `0 ${depth * 12}px`, scale: `${1 - depth * 0.05}`, opacity: 1 - depth * 0.3 }}
            />
          ) : null,
        )}
        <AnimatePresence initial={false} custom={direction}>
          <Card key={step} step={step} variants={variants} custom={direction} onThrow={onThrow} start={start} reduced={k.reduced}>
            <PresenceSettled>{children}</PresenceSettled>
          </Card>
        </AnimatePresence>
      </div>
    </MotionFeatures>
  )
}

interface CardProps {
  step: string
  variants: Variants
  custom: number
  onThrow?: (direction: 1 | -1) => boolean
  /** -1 when the reading start is on the left. */
  start: number
  reduced: boolean
  children: ReactNode
}

function Card({ step, variants, custom, onThrow, start, reduced, children }: CardProps) {
  const k = useYouj()
  // A card on its way out takes neither a press nor focus.
  const present = useIsPresent()
  const controls = useDragControls()
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-320, 0, 320], reduced ? [0, 0, 0] : [-9, 0, 9])
  const [shakes, setShakes] = useState(0)

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!onThrow || event.button !== 0 || (event.target as HTMLElement).closest(NO_DRAG)) return
    controls.start(event)
  }

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (!onThrow) return
    const travel = info.offset.x
    const thrown = Math.abs(travel) > THROW || Math.abs(info.velocity.x) > FLICK
    if (!thrown) return
    // Towards the reading start goes on; the other way goes back.
    const way: 1 | -1 = Math.sign(travel || info.velocity.x) === start ? 1 : -1
    if (!onThrow(way) && way === 1 && !reduced) setShakes((n) => n + 1)
  }

  return (
    <m.div
      variants={variants}
      custom={custom}
      initial="enter"
      animate="center"
      exit="exit"
      drag={onThrow ? 'x' : false}
      dragListener={false}
      dragControls={controls}
      dragSnapToOrigin
      onPointerDown={onPointerDown}
      onDragEnd={onDragEnd}
      style={{ x, rotate }}
      data-yj-step={step}
      inert={!present || undefined}
      className="absolute inset-0 flex flex-col overflow-hidden rounded-3xl border border-line bg-surface shadow-lg"
    >
      {/* A throw that can't go on shakes the card: it says no without words (the reason is said under the question). */}
      <m.div
        className="flex min-h-0 flex-1 flex-col"
        variants={SHAKE}
        animate={shakes ? (shakes % 2 ? 'odd' : 'even') : 'rest'}
        transition={k.tween('base', 'standard')}
      >
        {children}
      </m.div>
    </m.div>
  )
}
