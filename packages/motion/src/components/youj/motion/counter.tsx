'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, type HTMLAttributes, type ReactNode } from 'react'
import { AnimatePresence, animate, useInView, useMotionValue, useMotionValueEvent, usePresence, type AnimationPlaybackControlsWithThen, type MotionValue } from 'motion/react'
import { useYouj, useLocale } from '@youj/core/lib/youj/provider'
import type { DurationToken, EasingToken } from '@youj/core/lib/youj/tokens'
import { cn } from '@youj/core/lib/youj/cn'
import { resolveInView } from '@youj/core/lib/youj/in-view'
import type { InView } from '@youj/core/lib/youj/vocabulary'
import { useSettledEntrances } from './settled'

type InViewMargin = NonNullable<Parameters<typeof useInView>[1]>['margin']

export interface CounterProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  value: number
  /** Starting value for the first play. Default 0. */
  from?: number
  /** 'tween' counts through values; 'roll' spins each digit like an odometer. */
  mode?: 'tween' | 'roll'
  /** Intl.NumberFormat options: currency, percent, compact notation, fraction digits. */
  format?: Intl.NumberFormatOptions
  /** A BCP 47 locale. Default: the YoujProvider locale, en-US without one. */
  locale?: string
  /** When the first play starts: `false` at once; `true` (the default) when scrolled into view, at 50% visible; or `{ amount, margin }` (it plays once). */
  inView?: InView
  /** Tween mode's duration. Roll mode rolls on the `smooth` spring. */
  duration?: DurationToken
  /** Tween mode's curve. */
  ease?: EasingToken
  /**
   * Roll mode, for a value that wraps around (60 for seconds or minutes, 24
   * for hours): a change of more than half the cycle is read as a wrap, so
   * 00 → 59 rolls one step back, and the tens wheel holds only the digits
   * the cycle reaches (0–5 for 60).
   */
  cycle?: number
}

/**
 * An animated number. Formatting is Intl.NumberFormat with tabular numerals.
 * Value changes mid-animation retarget smoothly from wherever it is. The
 * formatted final value is always available to assistive tech.
 *
 * Roll mode turns each digit on a wheel in the direction the number moved
 * (9 → 0 going up wraps forward, never back through 8…1), on the `smooth`
 * spring, so a quick run of changes keeps its momentum. Digits fade through
 * soft top and bottom edges and blur by how fast they turn, sharp again at
 * rest. A column that appears (999 → 1,000) opens its width on the spring
 * and one that goes closes it, so the figure never shoves.
 */
export function Counter({
  value,
  from = 0,
  mode = 'tween',
  format,
  locale,
  inView: inViewProp,
  duration = 'deliberate',
  ease = 'emphasized',
  cycle,
  className,
  ...rest
}: CounterProps) {
  const k = useYouj()
  const lang = useLocale(locale)
  const ref = useRef<HTMLSpanElement>(null)
  const when = resolveInView(inViewProp, { amount: 0.5 })
  const inView = useInView(ref, { once: true, amount: when.amount, margin: when.margin as InViewMargin })
  const settled = useSettledEntrances()
  const active = k.reduced || settled || !when.onView || inView
  const formatter = useMemo(() => new Intl.NumberFormat(lang, hydrationSafe(format)), [lang, format && JSON.stringify(format)])

  return (
    <span ref={ref} data-slot="counter" data-format={format?.style ?? 'decimal'} {...rest} className={cn('own:inline-block own:tabular-nums', className)}>
      <span className="sr-only">{formatter.format(value)}</span>
      {mode === 'roll' ? (
        <Roll value={active ? value : from} from={from} formatter={formatter} cycle={cycle} />
      ) : (
        <Tween value={value} from={from} active={active} formatter={formatter} duration={duration} ease={ease} />
      )}
    </span>
  )
}

interface ModeProps {
  value: number
  formatter: Intl.NumberFormat
  duration: DurationToken
  ease: EasingToken
}

function Tween({ value, from, active, formatter, duration, ease }: ModeProps & { from: number; active: boolean }) {
  const k = useYouj()
  const textRef = useRef<HTMLSpanElement>(null)
  const settled = useSettledEntrances()
  const mv = useMotionValue(k.reduced || settled ? value : from)

  useEffect(() => {
    if (!active) return
    if (k.reduced) {
      mv.jump(value)
      return
    }
    // animate() starts from the current value and velocity, so retargets are seamless.
    const controls = animate(mv, value, k.tween(duration, ease))
    return () => controls.stop()
  }, [active, value, k, duration, ease, mv])

  useMotionValueEvent(mv, 'change', (v) => {
    const node = textRef.current?.firstChild
    if (node instanceof Text) node.nodeValue = formatter.format(v)
  })

  return (
    <span ref={textRef} aria-hidden dir="ltr">
      {formatter.format(mv.get())}
    </span>
  )
}

/** Node keeps a currency's fraction digits in compact notation when `maximumFractionDigits` is set ("$1.0M") and a browser doesn't ("$1M"): server text must match the client's. */
function hydrationSafe(format?: Intl.NumberFormatOptions) {
  return format?.notation === 'compact' && format.maximumFractionDigits !== undefined && format.minimumFractionDigits === undefined ? { ...format, minimumFractionDigits: 0 } : format
}

/** The ten digits as the formatter writes them: Latin, Arabic-Indic, Devanagari… */
function digitGlyphs(formatter: Intl.NumberFormat) {
  const { locale, numberingSystem } = formatter.resolvedOptions()
  const digits = new Intl.NumberFormat(locale, { numberingSystem, useGrouping: false })
  return Array.from({ length: 10 }, (_, d) => digits.format(d))
}

const mod = (n: number, m: number) => ((n % m) + m) % m

/** Which way the number moved: +1, -1 or 0. With a cycle, a jump of more than half of it is a wrap the other way. */
function heading(from: number, to: number, cycle?: number) {
  let delta = to - from
  if (cycle && Math.abs(delta) > cycle / 2) delta -= Math.sign(delta) * cycle
  return Math.sign(delta)
}

/** The number's cells, keyed from the right so place values keep their column when the length changes. */
function cellsOf(value: number, formatter: Intl.NumberFormat, glyphs: string[]) {
  // Each character keeps the type of the Intl part it came from (integer,
  // fraction, currency, unit, percentSign…) as data-part, so a style can set
  // units and cents apart from the figure. A symbol is keyed by its place and
  // its order within the run of symbols there, so "ll" in "milliseconds" or a
  // doubled separator stays unique.
  const chars = formatter.formatToParts(value).flatMap((part) => Array.from(part.value, (char) => ({ char, part: part.type })))
  let place = 0
  let run = 0
  return chars
    .reverse()
    .map(({ char, part }) => {
      const digit = glyphs.indexOf(char)
      const key = digit >= 0 ? `d${place}` : `s${place}.${run++}${char}`
      const cell = { key, char, part, digit, place }
      if (digit >= 0) {
        place++
        run = 0
      }
      return cell
    })
    .reverse()
}

/* The soft edges: the row reaches a little past its line box on both ends,
 * where a mask fades it out, so a turning digit fades rather than being cut.
 * The negative margin keeps the line box where it was. */
const FEATHER = '0.16em'
const MASK = `linear-gradient(to bottom, transparent, black ${FEATHER}, black calc(100% - ${FEATHER}), transparent)`
const featherStyle = {
  paddingBlock: FEATHER,
  marginBlock: `-${FEATHER}`,
  maskImage: MASK,
  WebkitMaskImage: MASK,
}

function Roll({ value, from, formatter, cycle }: { value: number; from: number; formatter: Intl.NumberFormat; cycle?: number }) {
  const glyphs = useMemo(() => digitGlyphs(formatter), [formatter])
  const cells = cellsOf(value, formatter, glyphs)
  // Columns that exist on the first render start on `from`'s digits and roll
  // from there; a column that arrives later opens while it rolls in its last
  // step, so a narrow slot never shows a long spin.
  const first = useRef(true)
  const start = useMemo(() => {
    const digits = new Map<number, number>()
    for (const cell of cellsOf(from, formatter, glyphs)) if (cell.digit >= 0) digits.set(cell.place, cell.digit)
    return digits
    // Only the first render reads it.
  }, [])
  const last = useRef(from)
  const direction = heading(last.current, value, cycle)
  useEffect(() => {
    last.current = value
    first.current = false
  })

  return (
    // A number reads left to right in every script: without this, the flex row
    // of columns would lay the digits out backwards on an RTL page.
    <span aria-hidden dir="ltr" className="inline-flex" style={featherStyle}>
      <AnimatePresence initial={false}>
        {cells.map((cell) => (
          <Cell key={cell.key} part={cell.part} column={cell.digit >= 0} opens={!first.current}>
            {cell.digit >= 0 ? (
              <Column
                digit={cell.digit}
                glyphs={glyphs.slice(0, wheelSize(cell.place, cycle))}
                place={cell.place}
                direction={direction}
                start={first.current ? (start.get(cell.place) ?? 0) : mod(cell.digit - (direction || 1), wheelSize(cell.place, cycle))}
              />
            ) : (
              cell.char
            )}
          </Cell>
        ))}
      </AnimatePresence>
    </span>
  )
}

/** How many digits a place can show: ten, or fewer for the top place of a cycle (0–5 in the tens of 60). */
function wheelSize(place: number, cycle?: number) {
  if (!cycle || cycle >= 10 ** (place + 1)) return 10
  return Math.min(10, Math.max(1, Math.ceil(cycle / 10 ** place)))
}

/* A cell that arrives after the first render opens its width from zero on
 * the spring, and one that leaves closes it, so neighbours slide over instead
 * of being shoved. Driven with the standalone `animate`, which needs no
 * Motion features (see Column). */
function Cell({ part, column, opens, children }: { part: string; column: boolean; opens: boolean; children: ReactNode }) {
  const k = useYouj()
  const ref = useRef<HTMLSpanElement>(null)
  const [present, safeToRemove] = usePresence()
  const running = useRef<AnimationPlaybackControlsWithThen | null>(null)
  const closing = useRef(false)

  // From `from` px wide to the cell's own width, then let go of it.
  const open = (el: HTMLElement, from: number) => {
    running.current?.stop()
    el.style.width = ''
    const width = el.getBoundingClientRect().width
    // Held at `from` from this first paint; the spring opens it from there.
    Object.assign(el.style, { width: `${from}px`, overflow: 'clip' })
    const opening = animate(el, { width: [from, width], opacity: 1 }, { default: k.spring('smooth'), opacity: k.tween('fast', 'standard') })
    running.current = opening
    opening.then(() => {
      if (running.current !== opening) return
      el.style.width = ''
      el.style.overflow = ''
    })
  }

  useLayoutEffect(() => {
    const el = ref.current
    if (!opens || k.reduced || !el) return
    el.style.opacity = '0'
    open(el, 0)
    // Only on arrival.
  }, [])

  useEffect(() => {
    const el = ref.current
    if (present) {
      // Back before it finished closing (1,000 → 999 → 1,000): it reopens from where it got to.
      if (closing.current && el) open(el, el.getBoundingClientRect().width)
      closing.current = false
      return
    }
    if (k.reduced || !el) {
      safeToRemove?.()
      return
    }
    closing.current = true
    running.current?.stop()
    el.style.overflow = 'clip'
    const shut = animate(el, { width: [el.getBoundingClientRect().width, 0], opacity: 0 }, { default: k.spring('smooth'), opacity: k.tween('fast', 'standard') })
    running.current = shut
    shut.then(() => {
      if (running.current === shut) safeToRemove?.()
    })
  }, [present])

  useEffect(() => () => running.current?.stop(), [])

  return (
    <span ref={ref} data-part={part} data-column={column || undefined} className="relative inline-block whitespace-pre">
      {children}
    </span>
  )
}

/* A column is a wheel: each digit sits at its distance from the wheel's
 * position, wrapped around (so 9 sits just below 0), one line per step, and
 * fades with that distance. The position is a plain number that only ever
 * moves the way the whole number moved, so 9 → 0 going up turns forward one
 * step. It's a motion value on the standalone `animate`, not an `m` element:
 * under AnimatePresence initial={false} (ContentSwap, Collapse) Motion skips
 * the first animation of an `m` element whose features load after it
 * mounted, and the digits that exist at `from` get their real target in
 * exactly that window. */
function Column({ digit, glyphs, place, direction, start }: { digit: number; glyphs: string[]; place: number; direction: number; start: number }) {
  const k = useYouj()
  const size = glyphs.length
  const wheel = useRef<HTMLSpanElement>(null)
  const target = useRef(k.reduced ? digit : start)
  // Markup places the glyphs where the wheel starts; from then on paint() moves them, never React.
  const initial = useRef(target.current)
  const pos = useMotionValue(target.current)
  const running = useRef<AnimationPlaybackControlsWithThen | null>(null)

  useEffect(() => {
    const current = mod(Math.round(target.current), size)
    if (current === digit) return
    const delta = digit - current
    const step = direction > 0 ? mod(delta, size) : direction < 0 ? -mod(-delta, size) : Math.abs(delta) <= size / 2 ? delta : delta - Math.sign(delta) * size
    target.current += step
    if (k.reduced) {
      running.current?.stop()
      pos.jump(target.current)
      return
    }
    // Waits its turn in the right-to-left ripple only from rest: a column
    // already turning carries straight on with its speed.
    const moving = Math.abs(pos.getVelocity()) > 0.01
    running.current?.stop()
    const roll = animate(pos, target.current, { ...k.spring('smooth'), delay: moving ? 0 : Math.min(place, 6) * k.stagger('tight') })
    running.current = roll
    roll.then(() => {
      if (running.current === roll && wheel.current) wheel.current.style.filter = 'none'
    })
  }, [digit, direction, size, place, k, pos])

  // A cleanup that isn't a real unmount (StrictMode) must not strand the wheel
  // mid-turn: the roll effect won't restart, as it sees the target reached. So
  // it settles on the target, and the remount paints it (the ref was detached).
  useEffect(() => {
    paint(wheel.current, pos.get(), size, pos)
    return () => {
      running.current?.stop()
      pos.jump(target.current)
    }
  }, [pos, size])

  useMotionValueEvent(pos, 'change', (v) => paint(wheel.current, v, size, pos))

  return (
    <>
      {/* Sizer: one digit's box sets the column's width and line height. */}
      <span className="invisible">{glyphs[0]}</span>
      <span ref={wheel} data-wheel className="absolute inset-0">
        {glyphs.map((g, d) => (
          <span key={g} className="absolute inset-x-0 top-0 text-center" style={glyphStyle(offset(d, initial.current, size))}>
            {g}
          </span>
        ))}
      </span>
    </>
  )
}

/** A digit's distance from the wheel's position, wrapped into the half turn either side. */
const offset = (d: number, at: number, size: number) => mod(d - at + size / 2, size) - size / 2

function glyphStyle(o: number) {
  const distance = Math.abs(o)
  return { transform: `translateY(${(o * 100).toFixed(2)}%)`, opacity: distance >= 1 ? 0 : 1 - distance }
}

/* Blur follows the wheel's speed (digits per second), so a long roll smears
 * more than a one-step tick and nothing is blurred at rest. */
const BLUR_PER_SPEED = 0.003 // em per digit/s
const BLUR_MAX = 0.1

function paint(wheel: HTMLSpanElement | null, at: number, size: number, pos: MotionValue<number>) {
  if (!wheel) return
  const children = wheel.children
  for (let d = 0; d < children.length; d++) {
    const style = glyphStyle(offset(d, at, size))
    const el = children[d] as HTMLElement
    el.style.transform = style.transform
    el.style.opacity = String(style.opacity)
  }
  const blur = Math.min(Math.abs(pos.getVelocity()) * BLUR_PER_SPEED, BLUR_MAX)
  wheel.style.filter = blur < 0.004 || !pos.isAnimating() ? 'none' : `blur(${blur.toFixed(3)}em)`
}
