import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ComponentType, type CSSProperties } from 'react'
import { animate, cubicBezier, useMotionValue, type MotionValue } from 'motion/react'
import { useYouj, type Youj } from '@youj/core'
import type { EasingToken } from '@youj/core'
import { useIconTrigger, type IconTrigger } from './use-icon-trigger'
import { planMorph, readContours, toPathData, trackAt, type MorphPlan, type TrackAnchor } from './icon-morph'

export type IconSwapTransition = 'rotate' | 'scale-blur' | 'draw' | 'flip' | 'slide' | 'fold' | 'wipe' | 'zoom' | 'pop' | 'morph'
export type IconSwapDirection = 'up' | 'down' | 'left' | 'right'

/** Any icon component: a lucide-react icon or one of ours (ours are held still with `trigger="none"`). */
export type SwapIcon = ComponentType<{ size?: number | string; strokeWidth?: number; trigger?: 'none' }>

export interface IconSwapProps {
  /** Shown while inactive. */
  from: SwapIcon
  /** Shown while active. */
  to: SwapIcon
  /** Controlled state: false shows `from`, true shows `to`. Overrides the trigger. */
  active?: boolean
  /** What swaps an uncontrolled IconSwap. Default hover (a parent button or `data-yj-trigger` group counts). */
  trigger?: IconTrigger
  /**
   * Drives the swap directly instead of a state: 0 shows `from`, 1 shows
   * `to`, and a value between holds that moment of the transition (a
   * scrubber, scroll progress). A MotionValue repaints on every change
   * without re-rendering. When set, `active` and `trigger` are ignored, and
   * the state (labels, `data-state`) is whichever icon it's nearer. It's
   * painted as given under reduced motion too, as ScrollProgress tracks
   * scroll: the value is the caller's, and the swap adds no motion of its own.
   */
  progress?: number | MotionValue<number>
  transition?: IconSwapTransition
  /**
   * Travel direction for `slide` (default up) and `wipe` (default right).
   * Left and right follow the reading direction: under dir="rtl" they swap.
   */
  direction?: IconSwapDirection
  /** Accessible names for [from, to]. Without them the swap is decorative (aria-hidden), e.g. inside a labeled button. */
  labels?: readonly [string, string]
  size?: number | string
  strokeWidth?: number
  className?: string
  style?: CSSProperties
}

/* ── Choreography as a function of progress ─────────────────────────────── */

interface Pose {
  /** Translation in % of the icon box. */
  x?: number
  y?: number
  scale?: number
  rotate?: number
  rotateX?: number
  rotateY?: number
  opacity?: number
  /** Blur radius in view-box units, so it scales with the icon. */
  blur?: number
  /** clip-path inset (top, right, bottom, left) in %. */
  clip?: [number, number, number, number]
  origin?: string
}

type Vec = [number, number]

interface Choreography {
  /** Overall length for a full swap; a reversal mid-way takes the remaining share. */
  duration: (k: Youj) => number
  /** Layer poses at progress p: 0 shows `from`, 1 shows `to`. */
  poses?: (p: number, dir: Vec) => [Pose, Pose]
  depth?: boolean
  clip?: boolean
  direction?: IconSwapDirection
}

const easeCache = new Map<EasingToken, (t: number) => number>()
function easeOf(k: Youj, token: EasingToken) {
  let fn = easeCache.get(token)
  if (!fn) {
    fn = cubicBezier(...k.ease(token))
    easeCache.set(token, fn)
  }
  return fn
}

/**
 * Keyframes as a pure function of progress: `key(k, p, [0, .6], [1, 0], ['exit'])`.
 * Outside the times the value holds, so windows can overlap freely.
 */
function key(k: Youj, p: number, times: number[], values: number[], eases: EasingToken[] = []): number {
  if (p <= times[0]!) return values[0]!
  for (let i = 1; i < times.length; i++) {
    if (p > times[i]!) continue
    const t0 = times[i - 1]!
    const local = (p - t0) / (times[i]! - t0 || 1)
    return values[i - 1]! + (values[i]! - values[i - 1]!) * easeOf(k, eases[i - 1] ?? 'standard')(local)
  }
  return values[values.length - 1]!
}

function choreographies(k: Youj): Record<Exclude<IconSwapTransition, 'draw' | 'morph'>, Choreography> {
  const f = (p: number, times: number[], values: number[], eases?: EasingToken[]) => key(k, p, times, values, eases)
  return {
    // Out turns a quarter away as in turns in from the other side: one continuous rotation.
    rotate: {
      duration: (k) => k.duration('slow') + k.duration('fast'),
      poses: (p) => [
        { rotate: f(p, [0, 0.6], [0, -90], ['exit']), scale: f(p, [0, 0.6], [1, 0.4], ['exit']), opacity: f(p, [0.1, 0.5], [1, 0], ['linear']) },
        { rotate: f(p, [0.35, 1], [90, 0], ['enter']), scale: f(p, [0.35, 1], [0.4, 1], ['enter']), opacity: f(p, [0.35, 0.7], [0, 1], ['linear']) },
      ],
    },
    // Out softens and shrinks away; in sharpens into focus.
    'scale-blur': {
      duration: (k) => k.duration('slow') + k.duration('fast'),
      poses: (p) => [
        { scale: f(p, [0, 0.6], [1, 0.5], ['exit']), blur: f(p, [0, 0.6], [0, 2.5], ['exit']), opacity: f(p, [0, 0.55], [1, 0], ['standard']) },
        { scale: f(p, [0.3, 1], [0.5, 1], ['enter']), blur: f(p, [0.3, 0.9], [2.5, 0], ['enter']), opacity: f(p, [0.3, 0.75], [0, 1], ['standard']) },
      ],
    },
    // A card turned on its vertical axis: out goes edge-on, in comes round from behind.
    flip: {
      depth: true,
      duration: (k) => k.duration('deliberate'),
      poses: (p) => [
        { rotateY: f(p, [0, 0.5], [0, 90], ['exit']), scale: f(p, [0, 0.5], [1, 0.9], ['exit']), opacity: p < 0.5 ? 1 : 0 },
        { rotateY: f(p, [0.5, 1], [-90, 0], ['enter']), scale: f(p, [0.5, 1], [0.9, 1], ['enter']), opacity: p > 0.5 ? 1 : 0 },
      ],
    },
    // One strip: in pushes out through the edge of the box.
    slide: {
      clip: true,
      direction: 'up',
      duration: (k) => k.duration('slow') + k.duration('fast'),
      poses: (p, [dx, dy]) => {
        const e = f(p, [0, 1], [0, 1], ['emphasized'])
        return [
          { x: dx * 100 * e, y: dy * 100 * e, opacity: p < 1 ? 1 : 0 },
          { x: -dx * 100 * (1 - e), y: -dy * 100 * (1 - e), opacity: p > 0 ? 1 : 0 },
        ]
      },
    },
    // Hinged flaps: out folds back on its bottom edge, in swings down from the top.
    fold: {
      depth: true,
      duration: (k) => k.duration('deliberate'),
      poses: (p) => [
        { rotateX: f(p, [0, 0.5], [0, 90], ['exit']), origin: '50% 100%', opacity: p < 0.5 ? 1 : 0 },
        { rotateX: f(p, [0.5, 1], [-90, 0], ['enter']), origin: '50% 0%', opacity: p > 0.5 ? 1 : 0 },
      ],
    },
    // A hard edge sweeps across: behind it the new icon, ahead of it the old one.
    wipe: {
      direction: 'right',
      duration: (k) => k.duration('slow') + k.duration('fast'),
      poses: (p, [dx, dy]) => {
        const e = f(p, [0, 1], [0, 100], ['emphasized'])
        const r = 100 - e
        const a: Pose['clip'] = dx > 0 ? [0, 0, 0, e] : dx < 0 ? [0, e, 0, 0] : dy > 0 ? [e, 0, 0, 0] : [0, 0, e, 0]
        const b: Pose['clip'] = dx > 0 ? [0, r, 0, 0] : dx < 0 ? [0, 0, 0, r] : dy > 0 ? [0, 0, r, 0] : [r, 0, 0, 0]
        return [
          { clip: p > 0 && p < 1 ? a : undefined, opacity: p < 1 ? 1 : 0 },
          { clip: p > 0 && p < 1 ? b : undefined, opacity: p > 0 ? 1 : 0, scale: f(p, [0, 1], [0.94, 1], ['enter']) },
        ]
      },
    },
    // A push through depth: out flies past the viewer, in arrives from far away.
    zoom: {
      duration: (k) => k.duration('slow') + k.duration('fast'),
      poses: (p) => [
        { scale: f(p, [0, 0.55], [1, 1.7], ['exit']), blur: f(p, [0, 0.55], [0, 1.5], ['exit']), opacity: f(p, [0, 0.45], [1, 0], ['standard']) },
        { scale: f(p, [0.3, 1], [0.4, 1], ['enter']), opacity: f(p, [0.3, 0.65], [0, 1], ['standard']) },
      ],
    },
    // Success: in overshoots once and settles (the library's one allowed bounce).
    pop: {
      duration: (k) => k.duration('deliberate'),
      poses: (p) => [
        { scale: f(p, [0, 0.35], [1, 0.5], ['exit']), opacity: f(p, [0, 0.3], [1, 0], ['standard']) },
        { scale: f(p, [0.25, 0.65, 1], [0.3, 1.14, 1], ['enter', 'standard']), opacity: f(p, [0.25, 0.45], [0, 1], ['standard']) },
      ],
    },
  }
}

const DRAW_DURATION = (k: Youj) => k.duration('deliberate')
const MORPH_DURATION = (k: Youj) => k.duration('deliberate') + k.duration('fast')

/* ── DOM painting ───────────────────────────────────────────────────────── */

const SHAPES = 'path, line, polyline, polygon, circle, ellipse, rect'
const HIDDEN_BRANCH = 'mask, clipPath, defs, pattern, marker, symbol'
const plans = new WeakMap<object, WeakMap<object, MorphPlan>>()

function paint(el: HTMLElement, pose: Pose, px: number) {
  const t: string[] = []
  if (pose.x || pose.y) t.push(`translate(${pose.x ?? 0}%, ${pose.y ?? 0}%)`)
  if (pose.rotate) t.push(`rotate(${pose.rotate}deg)`)
  if (pose.rotateX) t.push(`rotateX(${pose.rotateX}deg)`)
  if (pose.rotateY) t.push(`rotateY(${pose.rotateY}deg)`)
  if (pose.scale !== undefined && pose.scale !== 1) t.push(`scale(${pose.scale})`)
  el.style.transform = t.join(' ')
  el.style.transformOrigin = pose.origin ?? ''
  el.style.opacity = String(pose.opacity ?? 1)
  el.style.filter = pose.blur && pose.blur > 0.01 ? `blur(${(pose.blur * px) / 24}px)` : ''
  el.style.clipPath = pose.clip ? `inset(${pose.clip.map((v) => `${v}%`).join(' ')})` : ''
}

/** The drawable strokes of a rendered icon, skipping masks and parts the icon itself hides. */
function strokesOf(layer: Element): SVGGeometryElement[] {
  return Array.from(layer.querySelectorAll<SVGGeometryElement>(SHAPES)).filter((el) => {
    if (el.closest(HIDDEN_BRANCH)) return false
    return el.style.opacity !== '0' && el.getAttribute('opacity') !== '0'
  })
}

/** Shows `length` (0–1) of a stroke, anchored at its start, end or center. */
function dash(el: SVGElement, length: number, anchor: TrackAnchor) {
  if (length >= 1) return undash(el)
  const l = Math.max(0, length)
  const offset = anchor === 'start' ? 0 : anchor === 'end' ? 1 - l : (1 - l) / 2
  el.setAttribute('pathLength', '1')
  el.setAttribute('data-swap-dash', '')
  el.style.strokeDasharray = `${l} 2`
  el.style.strokeDashoffset = `${-offset}`
  // A zero-length dash still paints a round cap.
  el.style.visibility = l <= 0.001 ? 'hidden' : ''
}

/** Restores a stroke this component dashed (and only those: youj icons drive pathLength themselves). */
function undash(el: SVGElement) {
  if (!el.hasAttribute('data-swap-dash')) return
  el.removeAttribute('data-swap-dash')
  el.removeAttribute('pathLength')
  el.style.strokeDasharray = ''
  el.style.strokeDashoffset = ''
  el.style.visibility = ''
}

function reset(wrap: HTMLElement, layers: HTMLElement[]) {
  wrap.style.perspective = ''
  wrap.style.overflow = ''
  for (const layer of layers) {
    paint(layer, {}, 24)
    for (const el of layer.querySelectorAll<SVGElement>('[data-swap-dash]')) undash(el)
  }
}

/** Offsets `stagger` sibling windows inside [start, end]. */
function windowOf(i: number, n: number, start: number, end: number): [number, number] {
  const step = n > 1 ? Math.min(0.08, (end - start) / (2 * (n - 1))) : 0
  const length = end - start - step * (n - 1)
  return [start + i * step, start + i * step + length]
}

function vector(direction: IconSwapDirection, rtl: boolean): Vec {
  switch (direction) {
    case 'up':
      return [0, -1]
    case 'down':
      return [0, 1]
    case 'left':
      return [rtl ? 1 : -1, 0]
    case 'right':
      return [rtl ? -1 : 1, 0]
  }
}

const isYouj = (Icon: SwapIcon) => 'meta' in Icon
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
const valueOf = (p: number | MotionValue<number>) => clamp01(typeof p === 'number' ? p : p.get())

/**
 * Swaps any two icons (lucide-react or youj) with a choreographed
 * transition. Every transition is a pure function of one progress value, so
 * toggling mid-swap reverses from exactly where it is, and rapid toggles
 * never jump. `morph` is a true path morph between arbitrary icons (see
 * icon-morph.ts). Pass `progress` instead of a state to drive that value
 * yourself. Under reduced motion the swap is instant.
 */
export function IconSwap({
  from: From,
  to: To,
  active,
  trigger = 'hover',
  progress: driven,
  transition = 'scale-blur',
  direction,
  labels,
  size = 24,
  strokeWidth = 1.5,
  className,
  style,
}: IconSwapProps) {
  const k = useYouj()
  const wrap = useRef<HTMLSpanElement>(null)
  const layerA = useRef<HTMLSpanElement>(null)
  const layerB = useRef<HTMLSpanElement>(null)
  const morphSvg = useRef<SVGSVGElement>(null)
  const external = driven !== undefined
  // A driven swap listens to nothing: no hover, no state.
  const triggered = useIconTrigger(wrap, external ? { trigger: 'none' } : { trigger, active })
  const [nearer, setNearer] = useState(() => driven !== undefined && valueOf(driven) >= 0.5)
  const on = external ? nearer : triggered
  const progress = useMotionValue(driven !== undefined ? valueOf(driven) : on ? 1 : 0)
  const [plan, setPlan] = useState<MorphPlan | null>(null)
  // Styles React sets once; after mount every animated property is painted imperatively.
  const [initial] = useState(() => ({ a: { opacity: on ? 0 : 1 }, b: { opacity: on ? 1 : 0 }, morph: { opacity: 0 } }))

  const table = useMemo(() => choreographies(k), [k])
  const setup = useRef({ px: 24, dir: [0, -1] as Vec })
  const latest = useRef({ k, table, transition, plan })
  latest.current = { k, table, transition, plan }

  const apply = useCallback((p: number) => {
    const w = wrap.current
    const a = layerA.current
    const b = layerB.current
    if (!w || !a || !b) return
    const { k, table, transition, plan } = latest.current
    const { px, dir } = setup.current

    if (transition === 'draw') {
      const out = strokesOf(a)
      const into = strokesOf(b)
      // At rest both icons are plain; only mid-swap are strokes dashed.
      if (p <= 0 || p >= 1) {
        for (const el of [...out, ...into]) undash(el)
        a.style.opacity = p <= 0 ? '1' : '0'
        b.style.opacity = p <= 0 ? '0' : '1'
        return
      }
      a.style.opacity = b.style.opacity = '1'
      out.forEach((el, i) => dash(el, 1 - key(k, p, windowOf(i, out.length, 0, 0.6), [0, 1], ['exit']), 'end'))
      into.forEach((el, i) => dash(el, key(k, p, windowOf(i, into.length, 0.4, 1), [0, 1], ['enter']), 'start'))
      return
    }

    if (transition === 'morph') {
      const svg = morphSvg.current
      const mid = p > 0 && p < 1 && !!plan && !!svg
      a.style.opacity = !mid && p < 0.5 ? '1' : '0'
      b.style.opacity = !mid && p >= 0.5 ? '1' : '0'
      if (!svg || !plan) return
      svg.style.opacity = mid ? '1' : '0'
      if (!mid) return
      const paths = svg.children
      plan.tracks.forEach((track, i) => {
        const el = paths[i] as SVGPathElement | undefined
        if (!el) return
        const [w0, w1] = track.window
        const local = Math.min(1, Math.max(0, (p - w0) / (w1 - w0)))
        if (track.kind !== 'morph') {
          const shown = track.kind === 'exit' ? 1 - easeOf(k, 'exit')(local) : easeOf(k, 'emphasized')(local)
          dash(el, shown, track.anchor)
          // Dashes don't reach fills, so filled strokes fade instead.
          if (track.fill[0]) el.style.fillOpacity = String(shown)
          return
        }
        const t = easeOf(k, 'emphasized')(local)
        if (!track.still) el.setAttribute('d', toPathData(trackAt(track, t), track.closed))
        if (track.fill[0] !== track.fill[1]) el.style.fillOpacity = String(track.fill[0] + (track.fill[1] - track.fill[0]) * t)
        if (track.stroke[0] !== track.stroke[1]) el.style.strokeOpacity = String(track.stroke[0] + (track.stroke[1] - track.stroke[0]) * t)
      })
      return
    }

    const [pa, pb] = table[transition].poses!(p, dir)
    paint(a, pa, px)
    paint(b, pb, px)
  }, [])

  // Measure, reset whatever the previous transition left behind, then paint the current state.
  useIsomorphicLayoutEffect(() => {
    const w = wrap.current
    const a = layerA.current
    const b = layerB.current
    if (!w || !a || !b) return
    const spec = transition === 'draw' || transition === 'morph' ? undefined : table[transition]
    const px = w.getBoundingClientRect().width || (typeof size === 'number' ? size : 24)
    const rtl = getComputedStyle(w).direction === 'rtl'
    setup.current = { px, dir: vector(direction ?? spec?.direction ?? 'up', rtl) }
    reset(w, [a, b])
    if (spec?.depth) w.style.perspective = `${px * 4}px`
    if (spec?.clip) w.style.overflow = 'hidden'
    apply(progress.get())
  }, [transition, direction, size, strokeWidth, From, To, plan, table, apply, progress])

  // Morph plans are geometry-only, so one per icon pair is shared by every instance.
  useIsomorphicLayoutEffect(() => {
    if (transition !== 'morph') {
      setPlan(null)
      return
    }
    const a = layerA.current?.querySelector('svg')
    const b = layerB.current?.querySelector('svg')
    if (!a || !b) return
    let byTo = plans.get(From)
    if (!byTo) plans.set(From, (byTo = new WeakMap()))
    let next = byTo.get(To)
    if (!next) byTo.set(To, (next = planMorph(readContours(a), readContours(b))))
    setPlan(next)
  }, [transition, From, To])

  useEffect(() => progress.on('change', apply), [progress, apply])

  // Driven: follow the caller's value. A number repaints when it changes, a MotionValue on every change without a render.
  useIsomorphicLayoutEffect(() => {
    if (driven === undefined) return
    const follow = (v: number) => {
      const p = clamp01(v)
      progress.set(p)
      setNearer(p >= 0.5)
    }
    if (typeof driven === 'number') {
      follow(driven)
      return
    }
    follow(driven.get())
    return driven.on('change', follow)
  }, [driven, progress])

  useEffect(() => {
    if (external) return
    const target = on ? 1 : 0
    if (k.reduced) {
      progress.set(target)
      return
    }
    const remaining = Math.abs(target - progress.get())
    if (!remaining) return
    const total = transition === 'draw' ? DRAW_DURATION(k) : transition === 'morph' ? MORPH_DURATION(k) : table[transition].duration(k)
    const controls = animate(progress, target, { type: 'tween', duration: total * remaining, ease: k.ease('linear') })
    return () => controls.stop()
  }, [on, external, k, table, transition, progress])

  const iconProps = (Icon: SwapIcon) => ({ size, strokeWidth, ...(isYouj(Icon) ? { trigger: 'none' as const } : {}) })
  const layer = 'pointer-events-none col-start-1 row-start-1 flex size-full items-center justify-center'

  return (
    <span
      ref={wrap}
      className={className ? `youj-icon-swap inline-grid shrink-0 align-middle ${className}` : 'youj-icon-swap inline-grid shrink-0 align-middle'}
      style={{ width: size, height: size, ...style }}
      data-state={on ? 'to' : 'from'}
      data-transition={transition}
      {...(labels ? { role: 'img', 'aria-label': labels[on ? 1 : 0] } : { 'aria-hidden': true })}
    >
      <span ref={layerA} className={layer} style={initial.a} data-layer="from">
        <From {...iconProps(From)} />
      </span>
      <span ref={layerB} className={layer} style={initial.b} data-layer="to">
        <To {...iconProps(To)} />
      </span>
      {transition === 'morph' && plan && (
        <svg
          ref={morphSvg}
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`${layer} overflow-visible`}
          // The theme's icon weight scales the stroke, as it does the icons' own.
          style={{ ...initial.morph, strokeWidth: `calc(${strokeWidth} * var(--yj-icon-weight, 1))` }}
          data-layer="morph"
          focusable="false"
        >
          {plan.tracks.map((t, i) => (
            <path
              key={i}
              d={toPathData(t.kind === 'enter' ? t.to : t.from, t.closed)}
              fill={t.fill[0] || t.fill[1] ? 'currentColor' : 'none'}
              fillOpacity={t.fill[0]}
              stroke={t.stroke[0] || t.stroke[1] ? 'currentColor' : 'none'}
              strokeOpacity={t.stroke[0]}
            />
          ))}
        </svg>
      )}
    </span>
  )
}
