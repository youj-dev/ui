'use client'

import { useLayoutEffect, useMemo, useRef, type CSSProperties, type Key, type ReactNode, type Ref } from 'react'
import { AnimatePresence, m, useIsPresent, type HTMLMotionProps, type Transition } from 'motion/react'
import { useYouj, type Youj } from '@youj/core/lib/youj/provider'
import { cn } from '@youj/core/lib/youj/cn'
import { MotionFeatures, PresenceSettled } from '@youj/core/lib/youj/features'

/* Content that crossfades between states while the box around it morphs to
 * the new width. The outgoing content is popped out of layout (popLayout), so
 * the box measures the incoming content straight away; both blur and scale a
 * touch as they swap. The width morph is Motion layout projection, so it is
 * transform-only: the box scales, and the label counter-scales (layout
 * "position") so text never squashes. That needs the box to be a Motion
 * layout element on the same spring, which useMorphRoot provides. */

/** The spring shared by the morphing box and the label inside it. */
function morphSpring(k: Youj): Transition {
  return k.reduced ? { type: false } : k.spring('snappy')
}

export interface MorphRootProps {
  layout: true
  transition: { layout: Transition }
  style?: CSSProperties
}

/**
 * Props for the element whose box morphs around a MorphLabel: spread them on a
 * `m.button` / `m.span` (or Base UI `render={<m.button {...morph} />}`).
 * Pass the corner radius so the corners stay round while the box scales.
 */
export function useMorphRoot(radius?: number | string): MorphRootProps {
  const k = useYouj()
  return {
    layout: true,
    transition: { layout: morphSpring(k) },
    style: radius === undefined ? undefined : { borderRadius: radius },
  }
}

export interface MorphLabelProps {
  /** Identifies the content. A new value crossfades to the new children. */
  value: Key
  children: ReactNode
  /** Classes for the positioned wrapper. */
  className?: string
  /** Classes for each state's content row. Default row: `inline-flex items-center gap-2 whitespace-nowrap`. */
  contentClassName?: string
  /** The inner span, stable across values: animate it (a shake, a nudge) without fighting the layout projection. */
  ref?: Ref<HTMLSpanElement>
  /**
   * How a new state arrives. `false` (default): it crossfades in place with a
   * touch of scale and blur. `true`: it rises out of a blur while the old one
   * lifts away, for labels that read as a step forward ("Send" → "Sent").
   */
  rise?: boolean
  /**
   * `'label'` (default) swaps the whole content. `'letters'`, for plain-text
   * children: letters the two labels share at the start or end (two or more)
   * stay put and glide to their new place, and only the rest leave or arrive,
   * one after another ("Copy" → "Copied", "Save" → "Saved").
   */
  mode?: 'label' | 'letters'
}

/**
 * Crossfades between states of a label. Inside a `useMorphRoot` box the box
 * morphs to the new width; on its own the label still crossfades and glides
 * to its new position. Reduced motion swaps instantly.
 */
const HIDDEN = { opacity: 0, scale: 0.9, filter: 'blur(2px)' }
// At rest the filter goes, not just to blur(0px): a resting filter can keep a
// compositing layer that softens the text.
const SHOWN = { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }
// Rise: in from below out of a blur, out upward with less of one. The travel
// is on the spring; opacity and blur are tweens, so blur never overshoots.
const RISE_IN = { opacity: 0, y: '0.3em', filter: 'blur(4px)' }
const RISE_OUT = { opacity: 0, y: '-0.3em', filter: 'blur(2px)' }

export function MorphLabel({ value, children, className, contentClassName, ref, rise = false, mode = 'label' }: MorphLabelProps) {
  const k = useYouj()
  const letters = mode === 'letters' && (typeof children === 'string' || typeof children === 'number')
  const fade = k.tween('fast', 'standard')
  return (
    <MotionFeatures features="max">
      <m.span
        layout="position"
        transition={{ layout: morphSpring(k) }}
        className={cn('relative own:inline-flex own:items-center', className)}
      >
        <span ref={ref} className="relative inline-flex items-center">
          {letters ? (
            <Letters text={String(children)} rise={rise} className={contentClassName} />
          ) : (
            <AnimatePresence mode="popLayout" initial={false}>
              <Row
                key={value}
                // Reduced: the new content arrives final and the old leaves at once.
                initial={k.reduced ? false : rise ? RISE_IN : HIDDEN}
                animate={SHOWN}
                exit={k.reduced ? undefined : rise ? { ...RISE_OUT, transition: k.tween('instant', 'standard') } : HIDDEN}
                transition={k.reduced ? { type: false } : rise ? { default: fade, y: k.spring('snappy') } : fade}
                className={cn('inline-flex items-center gap-2 whitespace-nowrap', contentClassName)}
              >
                <PresenceSettled features="max">{children}</PresenceSettled>
              </Row>
            </AnimatePresence>
          )}
        </span>
      </m.span>
    </MotionFeatures>
  )
}

/* Letters mode. Each letter is keyed: a letter in the run the new label
 * shares with the old one at its start or end keeps the old letter's key, so
 * it stays mounted and glides (layout "position") to its new place; every
 * other letter gets a key of its own, so the old ones leave and the new ones
 * arrive. A shared run counts from two letters: one letter in common is a
 * coincidence, and gliding it would read as noise. */
const LETTER_IN = { opacity: 0, scale: 0.8, y: '0.15em', filter: 'blur(3px)' }
const LETTER_OUT = { opacity: 0, scale: 0.85, y: '-0.1em', filter: 'blur(2px)' }
const LETTER_RISE_IN = { ...LETTER_IN, y: '0.3em' }
const LETTER_RISE_OUT = { ...LETTER_OUT, y: '-0.3em' }
/** Arriving letters ripple in, but never for longer than this many steps. */
const MAX_STEPS = 6

type Glyphs = { text: string; keys: string[]; generation: number }

function glyphKeys(text: string, prev: Glyphs | null): Glyphs {
  const chars = Array.from(text)
  if (!prev) return { text, keys: chars.map((_, i) => `0:${i}`), generation: 0 }
  if (prev.text === text) return prev
  const old = Array.from(prev.text)
  const generation = prev.generation + 1
  let start = 0
  while (start < chars.length && start < old.length && chars[start] === old[start]) start++
  let end = 0
  while (end < chars.length - start && end < old.length - start && chars[chars.length - 1 - end] === old[old.length - 1 - end]) end++
  if (start < 2) start = 0
  if (end < 2) end = 0
  const keys = chars.map((_, i) =>
    i < start ? prev.keys[i]! : i >= chars.length - end ? prev.keys[old.length - (chars.length - i)]! : `${generation}:${i}`,
  )
  return { text, keys, generation }
}

function Letters({ text, rise, className }: { text: string; rise: boolean; className?: string }) {
  const k = useYouj()
  const prev = useRef<Glyphs | null>(null)
  const glyphs = useMemo(() => glyphKeys(text, prev.current), [text])
  useLayoutEffect(() => {
    prev.current = glyphs
  })
  if (k.reduced) {
    return <span className={cn('own:inline-flex own:items-center whitespace-pre', className)}>{text}</span>
  }
  const fresh = glyphs.keys.filter((key) => key.startsWith(`${glyphs.generation}:`))
  // New letters wait a beat for the old ones to clear, then ripple in.
  const handoff = glyphs.generation > 0 ? k.stagger('base') : 0
  const spring = k.spring('snappy')
  const fade = k.tween('fast', 'standard')
  return (
    <span dir="auto" className={cn('relative own:inline-flex own:items-center whitespace-pre', className)}>
      <span className="sr-only">{text}</span>
      <AnimatePresence mode="popLayout" initial={false}>
        {Array.from(text).map((char, i) => {
          const key = glyphs.keys[i]!
          const step = Math.min(fresh.indexOf(key), MAX_STEPS)
          return (
            <m.span
              key={key}
              aria-hidden
              data-letter={char}
              layout="position"
              initial={rise ? LETTER_RISE_IN : LETTER_IN}
              animate={SHOWN}
              exit={{ ...(rise ? LETTER_RISE_OUT : LETTER_OUT), transition: k.tween('instant', 'standard') }}
              transition={{
                default: { ...fade, delay: handoff + Math.max(step, 0) * k.stagger('tight') },
                scale: { ...spring, delay: handoff + Math.max(step, 0) * k.stagger('tight') },
                y: { ...spring, delay: handoff + Math.max(step, 0) * k.stagger('tight') },
                layout: morphSpring(k),
              }}
              className="inline-block"
            >
              {char}
            </m.span>
          )
        })}
      </AnimatePresence>
    </span>
  )
}

/** A state's content. While it fades out it's hidden from assistive tech, so a control's name is only ever the current label. */
function Row(props: HTMLMotionProps<'span'>) {
  const present = useIsPresent()
  return <m.span {...props} aria-hidden={!present || undefined} />
}
