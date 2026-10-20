'use client'

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
  type RefObject,
} from 'react'
import { cubicBezier, useInView } from 'motion/react'
import { useMotionBudget, useYouj } from '@youj/core/lib/youj/provider'
import { staggerScale } from '@youj/core/lib/youj/budget'
import { resolveInView } from '@youj/core/lib/youj/in-view'
import type { InView } from '@youj/core/lib/youj/vocabulary'
import type { DurationToken, StaggerToken } from '@youj/core/lib/youj/tokens'
import { cn } from '@youj/core/lib/youj/cn'
import { ScrambleText } from './scramble-text'

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

type InViewMargin = NonNullable<Parameters<typeof useInView>[1]>['margin']

export type TextEffectName = 'split-flap' | 'terminal' | 'decode' | 'blur-in' | 'roll'

/** Each effect's own timing: `duration` is one unit's motion, `stagger` the gap between units. */
const TIMING: Record<TextEffectName, { duration: DurationToken; stagger: StaggerToken }> = {
  'split-flap': { duration: 'fast', stagger: 'base' },
  terminal: { duration: 'instant', stagger: 'loose' },
  decode: { duration: 'deliberate', stagger: 'tight' },
  'blur-in': { duration: 'slow', stagger: 'loose' },
  roll: { duration: 'deliberate', stagger: 'tight' },
}

export interface TextEffectProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** The text. Changing it plays the effect from the old text to the new one. */
  text: string
  /** How the text arrives. Default 'blur-in'. */
  effect?: TextEffectName
  as?: ElementType
  /** When the first play starts: `false` on mount; `true` (the default) when scrolled into view, at 50% visible; or `{ once, amount, margin }`. */
  inView?: InView
  /**
   * One unit's motion: a flap's flip (split-flap, default 'fast'), a reel's
   * roll (roll, 'deliberate'), a word's blur-in ('slow') or the whole decode
   * ('deliberate'). Terminal doesn't use it.
   */
  duration?: DurationToken
  /**
   * The gap between units: characters (split-flap 'base', roll 'tight'),
   * words (blur-in 'loose') or keystrokes (terminal 'loose', varied per key).
   * A long text is compressed to land within the `deliberate` token.
   * Decode doesn't use it.
   */
  stagger?: StaggerToken
  /** The alphabet decode draws noise from, and the one split-flap and roll pass through. Default: per character, its own digits, upper- or lower-case letters. */
  glyphs?: string
  /** Terminal: a prefix shown before the text and never typed, such as `$ `. */
  prompt?: string
  /** Terminal: the block cursor. Default true. */
  cursor?: boolean
  /** Terminal: on a text change, delete back to the shared start before typing the new text. Default false (the new text types from empty). */
  erase?: boolean
  /** Called when a play lands on the text (at once under reduced motion). */
  onComplete?: () => void
}

interface Run {
  id: number
  /** The text shown before this run. */
  from: string
  to: string
  state: 'idle' | 'playing' | 'done'
}

interface EffectProps {
  run: Run
  /** One unit's duration, in ms. */
  unit: number
  stagger: StaggerToken
  glyphs?: string
  finish: (id: number) => void
}

/**
 * Renders text with a reveal: a split-flap board, a terminal typing it out,
 * a decode through random glyphs, words sharpening out of blur, or reels
 * rolling to each character. Every effect reserves the final text's box, so
 * nothing moves around it; the text itself is one visually hidden copy for
 * assistive tech, and the animated layer is aria-hidden. At rest the text is
 * plain and selectable. Reduced motion shows the final text at once.
 */
export function TextEffect({
  text,
  effect = 'blur-in',
  as: Tag = 'span',
  inView: inViewProp,
  duration,
  stagger,
  glyphs,
  prompt,
  cursor = true,
  erase = false,
  onComplete,
  className,
  ...rest
}: TextEffectProps) {
  const k = useYouj()
  const ref = useRef<HTMLElement>(null)
  const when = resolveInView(inViewProp, { amount: 0.5 })
  const seen = useInView(ref, { once: when.once, amount: when.amount, margin: when.margin as InViewMargin })
  const active = !when.onView || seen

  // A run is one play from the text shown to the new text. It's derived while
  // rendering, so a new text renders its start state in the same commit.
  const [run, setRun] = useState<Run>(() => ({ id: 0, from: '', to: text, state: k.reduced ? 'done' : 'idle' }))
  let current = run
  if (k.reduced) {
    if (run.state !== 'done' || run.to !== text) current = { id: run.id + 1, from: text, to: text, state: 'done' }
  } else if (!active) {
    if (run.state !== 'idle' || run.to !== text) current = { id: run.id + 1, from: '', to: text, state: 'idle' }
  } else if (run.state === 'idle' || run.to !== text) {
    current = { id: run.id + 1, from: run.state === 'idle' ? run.from : run.to, to: text, state: 'playing' }
  }
  if (current !== run) setRun(current)

  const latest = useRef(current)
  latest.current = current
  const complete = useRef(onComplete)
  complete.current = onComplete
  const finish = useCallback((id: number) => {
    if (latest.current.id !== id || latest.current.state !== 'playing') return
    setRun((r) => (r.id === id ? { ...r, state: 'done' } : r))
    complete.current?.()
  }, [])

  // biome-ignore lint/correctness/useExhaustiveDependencies: each new text completes at once under reduced motion
  useEffect(() => {
    if (k.reduced) complete.current?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- each new text completes at once under reduced motion
  }, [k.reduced, text])

  const props: EffectProps = {
    run: current,
    unit: k.ms(duration ?? TIMING[effect].duration),
    stagger: stagger ?? TIMING[effect].stagger,
    glyphs,
    finish,
  }
  let body: ReactNode
  if (effect === 'split-flap') body = <SplitFlap {...props} />
  else if (effect === 'roll') body = <Roll {...props} />
  else if (effect === 'terminal') body = <Terminal {...props} root={ref} prompt={prompt} cursor={cursor} erase={erase} />
  else if (effect === 'decode') body = <Decode {...props} duration={duration ?? TIMING.decode.duration} />
  else body = <BlurIn {...props} />

  return (
    <Tag
      ref={ref}
      data-slot="text-effect"
      data-yj-effect={effect}
      data-state={current.state}
      {...rest}
      className={cn('own:relative', Tag === 'span' && 'own:inline-block', className)}
    >
      <span className="sr-only select-none">{text}</span>
      <span aria-hidden className="relative block">
        {body}
      </span>
    </Tag>
  )
}

/* ---------------------------------------------------------------- shared */

/** Runs `frame(elapsed ms)` on one rAF until it returns true, then `done`. The first frame is synchronous, so it lands before paint. Returns the cancel. */
function frames(frame: (elapsed: number) => boolean, done: () => void) {
  let raf = 0
  let start = -1
  const tick = (now: number) => {
    if (start < 0) start = now
    if (frame(now - start)) done()
    else raf = requestAnimationFrame(tick)
  }
  tick(performance.now())
  return () => cancelAnimationFrame(raf)
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

/** The gap between `units` siblings in ms, compressed so a long run lands within `deliberate` (and sooner on a low motion budget). */
function useSpread(token: StaggerToken) {
  const k = useYouj()
  const { tier } = useMotionBudget()
  return (units: number) => {
    const step = k.stagger(token)
    return 1000 * step * staggerScale(units - 1, tier, step, k.duration('deliberate'))
  }
}

/* Writes to React's own text node, so later renders stay in sync with it. */
function write(el: Element, value: string) {
  if (el.firstChild instanceof Text) el.firstChild.nodeValue = value
  else el.textContent = value
}

/** Words and the whitespace between them, each word's characters numbered across the whole text. */
function words(text: string) {
  let n = 0
  return text
    .split(/(\s+)/)
    .filter(Boolean)
    .map((part) => ({ space: /^\s/.test(part), chars: Array.from(part, (ch) => ({ ch, i: n++ })) }))
}

const CLASSES = ['0123456789', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz']

/**
 * The characters a flap or reel passes through from `from` to `to`, at most
 * `max` steps: forward through the target's alphabet (its digits or letters,
 * or `glyphs`), landing on the target. A character outside it (a space,
 * punctuation) changes in one step; the same character doesn't move.
 */
function reel(from: string, to: string, max: number, glyphs?: string): string[] {
  if (from === to) return [to]
  const alphabet = glyphs ?? CLASSES.find((c) => c.includes(to))
  const end = alphabet ? alphabet.indexOf(to) : -1
  if (!alphabet || end < 0) return [from, to]
  const size = alphabet.length
  const start = alphabet.indexOf(from)
  const steps = Math.min(start < 0 ? size : (end - start + size) % size, max)
  const seq = [from]
  for (let s = steps - 1; s >= 1; s--) seq.push(alphabet[(end - s + size) % size]!)
  seq.push(to)
  return seq
}

/* ------------------------------------------------------------- blur-in */

function paintBlur(el: HTMLElement, e: number) {
  el.style.opacity = String(e)
  el.style.filter = e >= 1 ? '' : `blur(${((1 - e) * 0.3).toFixed(3)}em)`
  el.style.transform = e >= 1 ? '' : `translateY(${((1 - e) * 0.3).toFixed(3)}em)`
}

const BLURRED = { opacity: 0, filter: 'blur(0.3em)', transform: 'translateY(0.3em)' }

function BlurIn({ run, unit, stagger, finish }: EffectProps) {
  const k = useYouj()
  const root = useRef<HTMLSpanElement>(null)
  const spread = useSpread(stagger)

  useIsoLayoutEffect(() => {
    if (run.state !== 'playing' || !root.current) return
    const units = Array.from(root.current.querySelectorAll<HTMLElement>('[data-yj-unit]'))
    const step = spread(units.length)
    const ease = cubicBezier(...k.ease('enter'))
    return frames(
      (t) => {
        let done = true
        units.forEach((el, i) => {
          const p = clamp01((t - i * step) / unit)
          if (p < 1) done = false
          paintBlur(el, ease(p))
        })
        return done
      },
      () => finish(run.id),
    )
  }, [run.id, run.state])

  if (run.state === 'done') return run.to
  return (
    <span ref={root}>
      {words(run.to).map((w) =>
        w.space ? (
          w.chars.map((c) => c.ch).join('')
        ) : (
          <span key={w.chars[0]!.i} data-yj-unit="" className="inline-block" style={BLURRED}>
            {w.chars.map((c) => c.ch).join('')}
          </span>
        ),
      )}
    </span>
  )
}

/* ---------------------------------------------------------------- roll */

const ROLL_STEPS = 8
/* While the reels turn, a mask over each character's box hides the rest of
 * its reel and softens the top and bottom edges. */
const FEATHER = 'linear-gradient(to bottom, transparent, black 22%, black 78%, transparent)'
const MASKED = { maskImage: FEATHER, WebkitMaskImage: FEATHER, maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat' }

function Roll({ run, unit, stagger, glyphs, finish }: EffectProps) {
  const k = useYouj()
  const root = useRef<HTMLSpanElement>(null)
  const spread = useSpread(stagger)
  const from = Array.from(run.from)
  const turning = run.state !== 'done'

  useIsoLayoutEffect(() => {
    if (run.state !== 'playing' || !root.current) return
    const reels = Array.from(root.current.querySelectorAll<HTMLElement>('[data-yj-reel]'))
    const step = spread(reels.length)
    const ease = cubicBezier(...k.ease('enter'))
    return frames(
      (t) => {
        let done = true
        reels.forEach((el, i) => {
          const p = clamp01((t - i * step) / unit)
          if (p < 1) done = false
          const n = el.childElementCount
          el.style.transform = `translateY(${((-ease(p) * (n - 1) * 100) / n).toFixed(3)}%)`
        })
        return done
      },
      () => finish(run.id),
    )
  }, [run.id, run.state])

  return (
    <span ref={root}>
      {words(run.to).map((w) =>
        w.space ? (
          w.chars.map((c) => c.ch).join('')
        ) : (
          <span key={w.chars[0]!.i} className="inline-block whitespace-nowrap">
            {w.chars.map(({ ch, i }) => (
              <span key={i} className="relative inline-block text-center" style={turning ? MASKED : undefined}>
                <span className={turning ? 'invisible' : undefined}>{ch}</span>
                {turning && (
                  <span data-yj-reel="" className="absolute inset-x-0 top-0 select-none">
                    {reel(from[i] ?? ' ', ch, ROLL_STEPS, glyphs).map((g, j) => (
                      <span key={j} className="block whitespace-pre">
                        {g}
                      </span>
                    ))}
                  </span>
                )}
              </span>
            ))}
          </span>
        ),
      )}
    </span>
  )
}

/* ---------------------------------------------------------- split-flap */

const FLAP_STEPS = 6
const LAYER = 'absolute inset-0 select-none'
const TOP = '[clip-path:inset(0_0_50%_0)]'
const BOTTOM = '[clip-path:inset(50%_0_0_0)]'
/** How dark a leaf gets at its steepest. */
const SHADE = 0.55

/* A flip from `cur` to `next`, p from 0 to 1: the top leaf (cur's top half)
 * falls over the hinge, then the bottom leaf (next's bottom half) lands. The
 * static halves behind show next's top and cur's bottom. */
function paintFlap(cell: Element, p: number, fall: (t: number) => number, land: (t: number) => number) {
  const leafTop = cell.children[3] as HTMLElement
  const leafBottom = cell.children[4] as HTMLElement
  const first = p < 0.5
  const a = first ? fall(p * 2) : land((p - 0.5) * 2)
  leafTop.style.opacity = first ? '1' : '0'
  leafTop.style.transform = first && a > 0 ? `perspective(3em) rotateX(${(-90 * a).toFixed(2)}deg)` : ''
  leafBottom.style.opacity = first ? '0' : '1'
  leafBottom.style.transform = first ? '' : `perspective(3em) rotateX(${(90 * (1 - a)).toFixed(2)}deg)`
  ;(leafTop.lastElementChild as HTMLElement).style.opacity = first ? String(a * SHADE) : '0'
  ;(leafBottom.lastElementChild as HTMLElement).style.opacity = first ? '0' : String((1 - a) * SHADE)
}

function SplitFlap({ run, unit, stagger, glyphs, finish }: EffectProps) {
  const k = useYouj()
  const root = useRef<HTMLSpanElement>(null)
  const spread = useSpread(stagger)
  const from = Array.from(run.from)
  const seqs = Array.from(run.to, (ch, i) => reel(from[i] ?? ' ', ch, FLAP_STEPS, glyphs))
  const flipping = run.state !== 'done'

  useIsoLayoutEffect(() => {
    if (run.state !== 'playing' || !root.current) return
    const cells = Array.from(root.current.querySelectorAll('[data-yj-flap]'))
    const step = spread(cells.length)
    const fall = cubicBezier(...k.ease('exit'))
    const land = cubicBezier(...k.ease('enter'))
    const shown = cells.map(() => -1)
    return frames(
      (t) => {
        let done = true
        cells.forEach((cell, i) => {
          const seq = seqs[i]!
          const flips = seq.length - 1
          const f = Math.min(Math.max(t - i * step, 0) / unit, flips)
          if (f < flips) done = false
          const j = Math.min(Math.floor(f), flips)
          if (shown[i] !== j) {
            const cur = seq[j]!
            const next = seq[Math.min(j + 1, flips)]!
            write(cell.children[1]!, next)
            write(cell.children[2]!, cur)
            write(cell.children[3]!, cur)
            write(cell.children[4]!, next)
            shown[i] = j
          }
          paintFlap(cell, j < flips ? f - j : 0, fall, land)
        })
        return done
      },
      () => finish(run.id),
    )
  }, [run.id, run.state])

  return (
    <span ref={root}>
      {words(run.to).map((w) => (
        <span key={w.chars[0]!.i} className="inline-block whitespace-nowrap">
          {w.chars.map(({ ch, i }) => {
            const start = seqs[i]![0]!
            return (
              <span
                key={i}
                data-yj-flap=""
                className="relative mx-[0.03em] inline-block rounded-[0.12em] bg-well px-[0.14em] text-center whitespace-pre"
              >
                <span className={flipping ? 'invisible' : undefined}>{ch}</span>
                {flipping && (
                  <>
                    <span className={cn(LAYER, TOP)}>{start}</span>
                    <span className={cn(LAYER, BOTTOM)}>{start}</span>
                    <span className={cn(LAYER, TOP, 'rounded-[inherit] bg-inherit')}>
                      {start}
                      <span className="absolute inset-0 bg-shadow opacity-0" />
                    </span>
                    <span className={cn(LAYER, BOTTOM, 'rounded-[inherit] bg-inherit opacity-0')}>
                      {start}
                      <span className="absolute inset-0 bg-shadow opacity-0" />
                    </span>
                  </>
                )}
                {/* The hinge: a thin gap across the middle of the tile. */}
                <span className="pointer-events-none absolute inset-x-0 top-1/2 h-[0.05em] -translate-y-1/2 bg-canvas" />
              </span>
            )
          })}
        </span>
      ))}
    </span>
  )
}

/* ------------------------------------------------------------ terminal */

const PAUSE_AFTER = '.,;:!?'

/** A keystroke's gap, in steps: uneven like a hand on keys (fixed per position, so replays match), longer after punctuation and between words. */
function pace(n: number, previous: string | undefined) {
  const jitter = ((Math.imul(n + 1, 2654435761) >>> 0) % 1000) / 1000
  let gap = 0.55 + 0.9 * jitter
  if (previous && PAUSE_AFTER.includes(previous)) gap += 4
  else if (previous === ' ') gap += 0.6
  return gap
}

function Terminal({
  run,
  stagger,
  finish,
  root,
  prompt,
  cursor,
  erase,
}: EffectProps & { root: RefObject<HTMLElement | null>; prompt?: string; cursor: boolean; erase: boolean }) {
  const k = useYouj()
  const typed = useRef<HTMLSpanElement>(null)
  const caret = useRef<HTMLSpanElement>(null)
  const visible = useInView(root)
  const playing = run.state === 'playing'
  const start = playing && erase ? run.from : ''

  useIsoLayoutEffect(() => {
    if (run.state !== 'playing' || !typed.current) return
    const el = typed.current
    const step = k.stagger(stagger) * 1000
    const from = Array.from(start)
    const to = Array.from(run.to)
    let keep = 0
    while (keep < from.length && from[keep] === to[keep]) keep++
    // The script: each mark is a time and what the line reads from then on.
    const marks: { at: number; value: string }[] = []
    let t = 0
    for (let n = from.length - 1; n >= keep; n--) {
      t += step * 0.5
      marks.push({ at: t, value: from.slice(0, n).join('') })
    }
    if (marks.length) t += step * 4
    for (let n = keep + 1; n <= to.length; n++) {
      t += step * pace(n, to[n - 2])
      marks.push({ at: t, value: to.slice(0, n).join('') })
    }
    write(el, start)
    let shown = -1
    return frames(
      (elapsed) => {
        let next = shown
        while (next + 1 < marks.length && marks[next + 1]!.at <= elapsed) next++
        if (next !== shown) write(el, marks[next]!.value)
        shown = next
        return shown === marks.length - 1
      },
      () => finish(run.id),
    )
  }, [run.id, run.state])

  // The cursor blinks while it waits, holds still while typing, and stops offscreen.
  useEffect(() => {
    const el = caret.current
    if (!el || k.reduced || playing || !visible) return
    const blink = el.animate?.([{ opacity: 1 }, { opacity: 0 }], {
      duration: k.ms('deliberate') * 2,
      iterations: Infinity,
      easing: 'steps(2, jump-none)',
    })
    return () => blink?.cancel()
  }, [k, playing, visible])

  const caretBox = 'ms-[0.06em] inline-block h-[1em] w-[0.55em] align-[-0.14em]'
  return (
    <>
      {/* The final line, invisible: it holds the box the typing fills. While an erase runs, the old line is held too
          (both in one cell, so the box takes the wider), so a longer old line never wraps as it is deleted. */}
      <span className="invisible grid select-none">
        <span className="col-start-1 row-start-1 whitespace-pre-wrap">
          {prompt && <span data-yj-prompt="">{prompt}</span>}
          {run.to}
          {cursor && <span className={caretBox} />}
        </span>
        {start && (
          <span className="col-start-1 row-start-1 whitespace-pre-wrap">
            {prompt && <span data-yj-prompt="">{prompt}</span>}
            {start}
            {cursor && <span className={caretBox} />}
          </span>
        )}
      </span>
      <span className="absolute inset-0 whitespace-pre-wrap">
        {prompt && (
          <span data-yj-prompt="" className="select-none">
            {prompt}
          </span>
        )}
        <span ref={typed}>{run.state === 'done' ? run.to : start}</span>
        {cursor && <span ref={caret} data-yj-caret="" className={cn(caretBox, 'bg-current')} />}
      </span>
    </>
  )
}

/* -------------------------------------------------------------- decode */

/* Decode is ScrambleText, over an invisible copy of the final text that holds the box. */
function Decode({ run, glyphs, finish, duration }: EffectProps & { duration: DurationToken }) {
  const id = run.id
  return (
    <>
      <span className="invisible block whitespace-pre-wrap select-none">{run.to}</span>
      {run.state !== 'idle' && (
        <ScrambleText
          className="absolute inset-0 [&>span]:whitespace-pre-wrap"
          trigger={['mount', 'change']}
          duration={duration}
          glyphs={glyphs}
          onComplete={() => finish(id)}
        >
          {run.to}
        </ScrambleText>
      )}
    </>
  )
}
