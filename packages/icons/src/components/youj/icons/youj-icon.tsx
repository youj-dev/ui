import { useEffect, useLayoutEffect, useRef, useState, type ComponentType, type CSSProperties, type Ref, type RefObject, type SVGProps } from 'react'
import { animate, cubicBezier, motionValue, type AnimationPlaybackControls, type DOMKeyframesDefinition, type MotionValue, type Transition } from 'motion/react'
import { useYouj, type Youj } from '@youj/core'
import { observeOnScreen } from '@youj/core/lib/youj/on-screen'
import type { DurationToken, StaggerToken } from '@youj/core'
import { seq, seqFor } from './icon-base'
import { useIconTrigger, type IconLoop, type IconTrigger } from './use-icon-trigger'

export type YoujIconEffect =
  | 'pop'
  | 'wiggle'
  | 'spin'
  | 'draw'
  | 'nudge'
  | 'pulse'
  | 'ring'
  | 'bounce'
  | 'flip'
  | 'swing'
  | 'float'
  | 'heartbeat'
  | 'shake'
  | 'jelly'
  | 'orbit'
  | 'tilt'
  | 'zoom-in'
  | 'zoom-out'
  | 'draw-in'
  | 'draw-out'
  | 'draw-sequence'
  | 'stagger-draw'

/** How far an effect travels: amplitude for transforms, pace for draws, turns for spins and flips. */
export type YoujIconIntensity = 'subtle' | 'default' | 'strong'

/** For `nudge`. Left and right follow the reading direction: under dir="rtl" they swap. */
export type YoujIconDirection = 'up' | 'down' | 'left' | 'right'

/**
 * A lucide-react icon, or any icon component like it: it renders an `<svg>` of
 * strokes, takes `size` and `strokeWidth`, and forwards its ref. Typed by
 * shape, so lucide-react is the app's dependency, never this package's.
 */
export type LucideLikeIcon = ComponentType<SVGProps<SVGSVGElement> & { size?: number | string; strokeWidth?: number | string; ref?: Ref<SVGSVGElement> }>

export interface YoujIconProps {
  /** Any lucide-react icon component (or one shaped like it). */
  icon: LucideLikeIcon
  effect?: YoujIconEffect
  /** Default hover; `draw-in` defaults to mount, since it rests undrawn. */
  trigger?: IconTrigger
  /** Controlled: plays the effect whenever this turns true (held effects hold while it stays true). */
  active?: boolean
  intensity?: YoujIconIntensity
  direction?: YoujIconDirection
  size?: number | string
  strokeWidth?: number
  className?: string
  style?: CSSProperties
  /** Gives the icon role="img". Without it the icon is decorative (aria-hidden). */
  'aria-label'?: string
}

/* ── Effect vocabulary ──────────────────────────────────────────────────── */

interface Memo {
  /** Completed-or-targeted turns for spin and flip, so a re-trigger mid-turn keeps going forwards. */
  turns: number
  /** Bumped on every play/settle so a finished rise can tell it was superseded. */
  generation: number
  loop?: AnimationPlaybackControls
  /** Values Motion can't animate on an <svg> itself (it drops scaleX/scaleY/rotateY there), painted by hand. */
  values: Record<string, MotionValue<number>>
}

interface Run {
  svg: SVGSVGElement
  k: Youj
  /** Amplitude: 0.55 subtle, 1 default, 1.6 strong. */
  a: number
  level: 0 | 1 | 2
  /** −1 when horizontal motion should mirror (RTL, unless the glyph is already mirrored). */
  inline: 1 | -1
  direction: YoujIconDirection
  memo: Memo
}

interface Effect {
  origin?: string
  /** `continuous` effects hold while active (float); the rest replay per cycle. */
  loop?: IconLoop
  /** Rests undrawn: the pose is applied before first paint. */
  hidden?: boolean
  /** Pose that `trigger="mount"` starts from, applied before first paint. */
  from?: (r: Run) => void
  play: (r: Run) => void
  settle: (r: Run) => void
}

const AMPLITUDE = { subtle: 0.55, default: 1, strong: 1.6 } as const
const LEVEL = { subtle: 0, default: 1, strong: 2 } as const
const DRAW_PACE: DurationToken[] = ['base', 'slow', 'deliberate']
const DRAW_STAGGER: StaggerToken[] = ['tight', 'base', 'loose']
const INSTANT = { type: false } as const

const SHAPES = 'path, line, polyline, polygon, circle, ellipse, rect'
const shapesOf = (svg: SVGSVGElement) => Array.from(svg.querySelectorAll<SVGGeometryElement>(SHAPES))

/** Keyframes collapse to their last value: where a one-shot comes to rest. */
function restOf(frames: DOMKeyframesDefinition): DOMKeyframesDefinition {
  const out: Record<string, unknown> = {}
  for (const [key, v] of Object.entries(frames)) out[key] = Array.isArray(v) ? v[v.length - 1] : v
  return out as DOMKeyframesDefinition
}

/**
 * A transform one-shot. Keyframes start from `null` (the current value), so
 * re-triggering mid-flight continues from where the icon is instead of jumping.
 */
function oneShot(frames: (r: Run) => DOMKeyframesDefinition, timing: (r: Run) => Transition, extra?: Partial<Effect>): Effect {
  return {
    ...extra,
    play: (r) => void animate(r.svg, tidy(frames(r)), timing(r)),
    settle: (r) => void animate(r.svg, restOf(frames(r)), r.k.tween('fast')),
  }
}

/** Amplitude-scaled keyframes rounded to 4 decimals (1 − 0.18 is 0.8200000000000001). */
function tidy(frames: DOMKeyframesDefinition): DOMKeyframesDefinition {
  const out: Record<string, unknown> = {}
  for (const [key, v] of Object.entries(frames)) {
    out[key] = Array.isArray(v) ? v.map((x) => (typeof x === 'number' ? Math.round(x * 1e4) / 1e4 : x)) : v
  }
  return out as DOMKeyframesDefinition
}

/**
 * A value painted by hand. Motion's SVG path only animates transforms that
 * exist as CSS properties (x, y, scale, rotate), so per-axis scale and 3D
 * rotation on an <svg> go through MotionValues. Interrupting one still
 * starts from its current value.
 */
function valueFor(r: Run, key: string, initial: number, paint: () => void): MotionValue<number> {
  let v = r.memo.values[key]
  if (!v) {
    v = motionValue(initial)
    v.on('change', paint)
    r.memo.values[key] = v
  }
  return v
}

/** Whole turns (spin, flip). Settling finishes the turn forwards; a re-trigger adds turns from wherever it is. */
function turning(ease: 'enter' | 'emphasized', target: (r: Run) => { animate: (to: number, transition: Transition) => void }): Effect {
  return {
    play: (r) => {
      r.memo.turns += r.level === 2 ? 2 : 1
      const seconds = r.k.duration('deliberate') * [1.3, 1, 1.5][r.level]!
      target(r).animate(r.memo.turns * 360, { type: 'tween', duration: seconds, ease: r.k.ease(r.level === 0 ? 'standard' : ease) })
    },
    settle: (r) => target(r).animate(r.memo.turns * 360, r.k.tween('base', 'enter')),
  }
}

/** Per-axis scale through the CSS `scale` property, which composes with Motion's transform instead of fighting it. */
function jellyValues(r: Run): [MotionValue<number>, MotionValue<number>] {
  const paint = () => (r.svg.style.scale = `${sx.get()} ${sy.get()}`)
  const sx = valueFor(r, 'scaleX', 1, paint)
  const sy = valueFor(r, 'scaleY', 1, paint)
  return [sx, sy]
}

/** Invisible at `scale`: set on the element now, and on Motion's values for the entrance to start from. */
function entrancePose(r: Run, scale: number) {
  r.svg.style.opacity = '0'
  animate(r.svg, { scale, opacity: 0 }, INSTANT)
}

function hideStrokes(r: Run) {
  for (const el of shapesOf(r.svg)) {
    el.style.opacity = '0'
    el.setAttribute('pathLength', '1')
    el.setAttribute('stroke-dasharray', '0 1')
    animate(el, { pathLength: 0, pathOffset: 0, opacity: 0 }, INSTANT)
  }
}

/** Motion reads an untouched stroke's pathLength from its attribute; give it one so draws start from "drawn". */
function prime(el: SVGGeometryElement) {
  if (!el.hasAttribute('pathLength')) el.setAttribute('pathLength', '1')
}

function lengthOf(el: SVGGeometryElement) {
  try {
    return el.getTotalLength()
  } catch {
    return 1
  }
}

const easeCache = new Map<string, (t: number) => number>()
function easing(k: Youj, token: 'emphasized') {
  let fn = easeCache.get(token)
  if (!fn) easeCache.set(token, (fn = cubicBezier(...k.ease(token))))
  return fn
}

const round = (v: number) => Math.round(v * 100) / 100

const EFFECTS: Record<YoujIconEffect, Effect> = {
  /* The original eight. At default intensity these are the same choreography as before. */
  pop: oneShot(
    (r) => ({ scale: [null, 1 - 0.18 * r.a, 1 + 0.12 * r.a, 1] }),
    (r) => seq(r.k, 'deliberate', [0, 0.22, 0.55, 1], ['standard', 'enter', 'emphasized']),
  ),
  wiggle: oneShot(
    (r) => ({ rotate: [null, -12 * r.a, 10 * r.a, -6 * r.a, 3 * r.a, 0] }),
    (r) => seq(r.k, 'deliberate', [0, 0.18, 0.38, 0.58, 0.78, 1]),
  ),
  spin: turning('enter', (r) => ({ animate: (to, transition) => void animate(r.svg, { rotate: to }, transition) })),
  draw: {
    from: hideStrokes,
    play: (r) =>
      shapesOf(r.svg).forEach((el, i) => {
        const delay = i * r.k.stagger(DRAW_STAGGER[r.level]!)
        animate(el, { pathLength: [0, 1] }, { ...r.k.tween(DRAW_PACE[r.level]!, 'emphasized'), delay })
        animate(el, { opacity: [0, 1] }, { ...r.k.tween('instant', 'linear'), delay })
      }),
    settle: (r) => shapesOf(r.svg).forEach((el) => void animate(el, { pathLength: 1, opacity: 1 }, r.k.tween('fast'))),
  },
  nudge: oneShot(
    (r) => {
      const vertical = r.direction === 'up' || r.direction === 'down'
      const sign = r.direction === 'up' || r.direction === 'left' ? -1 : 1
      return { [vertical ? 'y' : 'x']: [null, 3 * r.a * sign * (vertical ? 1 : r.inline), 0] }
    },
    (r) => seq(r.k, 'slow', [0, 0.4, 1], ['exit', 'emphasized']),
  ),
  pulse: oneShot(
    (r) => ({ scale: [null, 1 + 0.15 * r.a, 1], opacity: [null, Math.max(0.2, 1 - 0.4 * r.a), 1] }),
    (r) => seq(r.k, 'deliberate', [0, 0.4, 1], ['standard', 'emphasized']),
  ),
  ring: oneShot(
    (r) => ({ rotate: [null, 14 * r.a, -11 * r.a, 7 * r.a, -3 * r.a, 0] }),
    (r) => seq(r.k, 'deliberate', [0, 0.18, 0.36, 0.54, 0.72, 1]),
    { origin: '50% 12%' },
  ),
  bounce: oneShot(
    (r) => ({ y: [null, -4 * r.a, 0, -1.5 * r.a, 0] }),
    (r) => seq(r.k, 'deliberate', [0, 0.3, 0.6, 0.8, 1], ['exit', 'enter', 'exit', 'enter']),
  ),

  /* Transforms. */
  // A coin turned once on its vertical axis, with real perspective.
  flip: turning('emphasized', (r) => {
    const depth = (r.svg.getBoundingClientRect().width || 24) * 4
    const turn = valueFor(r, 'rotateY', 0, () => (r.svg.style.transform = `perspective(${depth}px) rotateY(${turn.get()}deg)`))
    return { animate: (to, transition) => void animate(turn, to, transition) }
  }),
  // A pendulum hung from the top edge: each swing eases through the bottom and dies away.
  swing: oneShot(
    (r) => ({ rotate: [null, 15 * r.a, -11 * r.a, 7 * r.a, -4 * r.a, 1.5 * r.a, 0] }),
    (r) => seqFor(r.k, r.k.duration('deliberate') * 1.5, [0, 0.14, 0.34, 0.53, 0.7, 0.85, 1], ['standard', 'emphasized', 'emphasized', 'emphasized', 'emphasized', 'standard']),
    { origin: '50% 0%' },
  ),
  // Lifts, then bobs gently for as long as it's active.
  float: {
    loop: 'continuous',
    play: (r) => {
      const generation = ++r.memo.generation
      const lift = -3 * r.a
      animate(r.svg, { y: lift }, r.k.tween('slow', 'enter')).then(() => {
        if (generation !== r.memo.generation) return
        r.memo.loop = animate(r.svg, { y: [lift, lift * 0.4, lift] }, { ...seqFor(r.k, r.k.duration('deliberate') * 3, [0, 0.5, 1], ['emphasized', 'emphasized']), repeat: Infinity })
      })
    },
    settle: (r) => {
      r.memo.generation++
      r.memo.loop?.stop()
      animate(r.svg, { y: 0 }, r.k.tween('base'))
    },
  },
  // Lub-dub: a strong beat, a softer one, then a long release.
  heartbeat: oneShot(
    (r) => ({ scale: [null, 1 + 0.2 * r.a, 1, 1 + 0.13 * r.a, 1] }),
    (r) => seqFor(r.k, r.k.duration('deliberate') * 1.25, [0, 0.14, 0.32, 0.46, 1], ['standard', 'standard', 'standard', 'emphasized']),
  ),
  // "No": a hard horizontal shake that decays, for errors.
  shake: oneShot(
    (r) => ({ x: [null, -4 * r.a, 3.2 * r.a, -2.4 * r.a, 1.6 * r.a, -0.8 * r.a, 0] }),
    (r) => seq(r.k, 'deliberate', [0, 0.12, 0.28, 0.44, 0.6, 0.78, 1]),
  ),
  // Squash and stretch on the ground line, keeping its volume. Use sparingly.
  jelly: {
    origin: '50% 100%',
    play: (r) => {
      const [sx, sy] = jellyValues(r)
      const timing = seq(r.k, 'deliberate', [0, 0.22, 0.5, 0.76, 1])
      animate(sx, [sx.get(), 1 + 0.2 * r.a, 1 - 0.12 * r.a, 1 + 0.05 * r.a, 1], timing)
      animate(sy, [sy.get(), 1 - 0.2 * r.a, 1 + 0.12 * r.a, 1 - 0.05 * r.a, 1], timing)
    },
    settle: (r) => jellyValues(r).forEach((v) => void animate(v, 1, r.k.tween('fast'))),
  },
  // One lap around its own center: spirals out, circles, spirals back in.
  orbit: oneShot(
    (r) => {
      const ease = easing(r.k, 'emphasized')
      const radius = 3.5 * r.a
      const x: (number | null)[] = [null]
      const y: (number | null)[] = [null]
      for (let i = 1; i <= 24; i++) {
        const t = ease(i / 24)
        const reach = radius * Math.sin(Math.PI * t)
        x.push(round(reach * Math.sin(2 * Math.PI * t) * r.inline))
        y.push(round(-reach * Math.cos(2 * Math.PI * t)))
      }
      return { x, y }
    },
    (r) => ({ type: 'tween', duration: r.k.duration('deliberate') * 1.4, ease: r.k.ease('linear') }),
  ),
  // Cocks to one side and holds while active.
  tilt: {
    play: (r) => void animate(r.svg, { rotate: -12 * r.a * r.inline }, r.k.spring('snappy')),
    settle: (r) => void animate(r.svg, { rotate: 0 }, r.k.spring('snappy')),
  },
  // Dips away and zooms back in from small (mount: arrives from small).
  'zoom-in': oneShot(
    (r) => ({ scale: [null, 1 - 0.4 * r.a, 1], opacity: [null, 0, 1] }),
    (r) => seq(r.k, 'deliberate', [0, 0.18, 1], ['exit', 'enter']),
    { from: (r) => entrancePose(r, 1 - 0.4 * r.a) },
  ),
  // Dips away and lands back from large, like a stamp (mount: arrives from large).
  'zoom-out': oneShot(
    (r) => ({ scale: [null, 1 + 0.5 * r.a, 1], opacity: [null, 0, 1] }),
    (r) => seq(r.k, 'deliberate', [0, 0.18, 1], ['exit', 'enter']),
    { from: (r) => entrancePose(r, 1 + 0.5 * r.a) },
  ),

  /* Draws. */
  // Rests undrawn; draws on while active and retracts when it ends.
  'draw-in': {
    hidden: true,
    from: hideStrokes,
    play: (r) =>
      shapesOf(r.svg).forEach((el, i) => {
        prime(el)
        const delay = i * r.k.stagger('tight')
        animate(el, { pathLength: 1, pathOffset: 0 }, { ...r.k.tween(DRAW_PACE[r.level]!, 'emphasized'), delay })
        animate(el, { opacity: 1 }, { ...r.k.tween('instant', 'linear'), delay })
      }),
    settle: (r) =>
      shapesOf(r.svg).forEach((el) => {
        animate(el, { pathLength: 0 }, r.k.tween('fast', 'exit'))
        animate(el, { opacity: 0 }, { ...r.k.tween('instant', 'linear'), delay: r.k.duration('fast') - r.k.duration('instant') })
      }),
  },
  // Strokes run out through their ends while active, and grow back from them after.
  'draw-out': {
    play: (r) =>
      shapesOf(r.svg).forEach((el, i) => {
        prime(el)
        const delay = i * r.k.stagger('tight')
        const pace = DRAW_PACE[r.level]!
        animate(el, { pathLength: 0, pathOffset: 1 }, { ...r.k.tween(pace, 'emphasized'), delay })
        animate(el, { opacity: 0 }, { ...r.k.tween('instant', 'linear'), delay: delay + r.k.duration(pace) - r.k.duration('instant') })
      }),
    settle: (r) =>
      shapesOf(r.svg).forEach((el, i) => {
        const delay = i * r.k.stagger('tight')
        animate(el, { pathLength: 1, pathOffset: 0 }, { ...r.k.tween(DRAW_PACE[r.level]!, 'emphasized'), delay })
        animate(el, { opacity: 1 }, { ...r.k.tween('instant', 'linear'), delay })
      }),
  },
  // Writes the icon one stroke at a time, at a constant pen speed.
  'draw-sequence': {
    from: hideStrokes,
    play: (r) => {
      const shapes = shapesOf(r.svg)
      const weights = shapes.map((el) => Math.max(2, lengthOf(el)))
      const total = weights.reduce((s, w) => s + w, 0)
      const seconds = r.k.duration('deliberate') * [1.4, 2, 2.8][r.level]!
      let at = 0
      shapes.forEach((el, i) => {
        const duration = (seconds * weights[i]!) / total
        // Blank now, on the same channels Motion writes: a delayed animation doesn't apply its first frame until it starts.
        el.style.opacity = '0'
        el.setAttribute('pathLength', '1')
        el.setAttribute('stroke-dasharray', '0 1')
        animate(el, { pathLength: [0, 1] }, { type: 'tween', duration, ease: r.k.ease('standard'), delay: at })
        animate(el, { opacity: [0, 1] }, { ...r.k.tween('instant', 'linear'), delay: at })
        at += duration
      })
    },
    settle: (r) => shapesOf(r.svg).forEach((el) => void animate(el, { pathLength: 1, opacity: 1 }, r.k.tween('fast'))),
  },
  // A wave through the strokes: each rewinds and redraws in turn, so the icon never goes blank.
  'stagger-draw': {
    from: hideStrokes,
    play: (r) =>
      shapesOf(r.svg).forEach((el, i) => {
        prime(el)
        const delay = i * r.k.stagger(DRAW_STAGGER[r.level]!)
        animate(el, { pathLength: [null, 0, 1] }, { ...seq(r.k, DRAW_PACE[r.level]!, [0, 0.35, 1], ['exit', 'emphasized']), delay })
        animate(el, { opacity: 1 }, { ...r.k.tween('instant', 'linear'), delay })
      }),
    settle: (r) => shapesOf(r.svg).forEach((el) => void animate(el, { pathLength: 1, opacity: 1 }, r.k.tween('fast'))),
  },
}

/** The icon back to its plain self, instantly. */
function reset(svg: SVGSVGElement, memo: Memo) {
  memo.generation++
  memo.loop?.stop()
  for (const v of Object.values(memo.values)) v.destroy()
  if (memo.values.rotateY) svg.style.transform = ''
  if (memo.values.scaleX) svg.style.scale = ''
  memo.values = {}
  memo.turns = 0
  animate(svg, { x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 }, INSTANT)
  for (const el of shapesOf(svg)) {
    el.style.opacity = ''
    if (el.hasAttribute('pathLength')) animate(el, { pathLength: 1, pathOffset: 0, opacity: 1 }, INSTANT)
  }
}

/** −1 when horizontal motion should mirror: in RTL, unless the glyph is itself mirrored with CSS `scale` (which already flips it). */
function inlineSign(el: Element): 1 | -1 {
  const style = getComputedStyle(el)
  const rtl = style.direction === 'rtl'
  const mirrored = parseFloat(style.scale) < 0
  return rtl !== mirrored ? -1 : 1
}

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

/**
 * While `watch` holds, whether the element is on screen in a visible tab.
 * Continuous effects (float) can be held on by mount or a controlled
 * `active`, so they pause offscreen here rather than through the trigger.
 */
function useVisible(ref: RefObject<Element | null>, watch: boolean) {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const node = ref.current
    if (!watch || !node) return
    const stop = observeOnScreen(node, setVisible, { immediate: true })
    return () => {
      stop()
      setVisible(true)
    }
  }, [ref, watch])
  return visible
}

/**
 * Adds youj motion to any lucide-react icon: 22 effects on the same
 * triggers as the bespoke set (hover on the parent control, mount, loop,
 * none, or a controlled `active`). Transform effects move the whole glyph;
 * draw effects animate each lucide stroke's pathLength. Everything starts
 * from the icon's current pose, so re-triggering never jumps. Under reduced
 * motion the icon stays still and fully drawn (a controlled draw-out or
 * draw-in still hides it while that state holds).
 */
export function YoujIcon({
  icon: Icon,
  effect = 'pop',
  trigger,
  active,
  intensity = 'default',
  direction = 'right',
  size = 24,
  strokeWidth = 1.5,
  className,
  style,
  'aria-label': label,
}: YoujIconProps) {
  const k = useYouj()
  const ref = useRef<SVGSVGElement>(null)
  const fx = EFFECTS[effect]
  const mode = trigger ?? (effect === 'draw-in' ? 'mount' : 'hover')
  const on = useIconTrigger(ref, { trigger: mode, active, loop: fx.loop })
  // trigger="loop" already pauses offscreen; mount, hover and a controlled `active` don't.
  const visible = useVisible(ref, fx.loop === 'continuous' && on && !k.reduced && (active !== undefined || mode !== 'loop'))
  const playing = on && visible
  const memo = useRef<Memo>({ turns: 0, generation: 0, values: {} })
  const touched = useRef(false)
  const entrance = mode === 'mount' && active === undefined

  const runFor = (svg: SVGSVGElement): Run => ({
    svg,
    k,
    a: AMPLITUDE[intensity],
    level: LEVEL[intensity],
    inline: inlineSign(svg),
    direction,
    memo: memo.current,
  })

  // Before first paint: a resting pose other than the plain icon, or the pose an entrance starts from.
  useIsomorphicLayoutEffect(() => {
    const svg = ref.current
    if (!svg || k.reduced) return
    const start = fx.hidden || entrance ? fx.from : undefined
    if (start && !(fx.hidden && active)) {
      start(runFor(svg))
      touched.current = true
    }
    return () => {
      if (!touched.current) return
      reset(svg, memo.current)
      touched.current = false
    }
    // Only a new effect (or reduced motion flipping) restarts from a fresh pose.
  }, [effect, k.reduced])

  useEffect(() => {
    const svg = ref.current
    if (!svg) return
    if (k.reduced) {
      // Static: the plain icon, except that a controlled draw-in (off) or draw-out (on) stays hidden.
      if (touched.current) reset(svg, memo.current)
      touched.current = false
      const hide = (effect === 'draw-in' && active === false) || (effect === 'draw-out' && on)
      if (hide) {
        for (const el of shapesOf(svg)) el.style.opacity = '0'
        touched.current = true
      }
      return
    }
    if (!playing && !touched.current) return
    touched.current = true
    svg.style.transformOrigin = fx.origin ?? '50% 50%'
    const run = runFor(svg)
    if (playing) fx.play(run)
    else fx.settle(run)
  }, [playing, on, effect, intensity, direction, k])

  useEffect(
    () => () => {
      memo.current.loop?.stop()
      for (const v of Object.values(memo.current.values)) v.destroy()
    },
    [],
  )

  return (
    <Icon
      ref={ref}
      size={size}
      strokeWidth={strokeWidth}
      className={className ? `youj-icon shrink-0 ${className}` : 'youj-icon shrink-0'}
      // The theme's icon weight (--yj-icon-weight, 1 by default) scales the stroke.
      style={{ strokeWidth: `calc(${strokeWidth} * var(--yj-icon-weight, 1))`, ...style }}
      data-effect={effect}
      data-state={on ? 'active' : 'rest'}
      focusable="false"
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
    />
  )
}
