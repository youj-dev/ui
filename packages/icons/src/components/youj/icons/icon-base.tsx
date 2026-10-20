import { useCallback, useEffect, useId, useMemo, useRef, type CSSProperties, type ReactNode, type Ref } from 'react'
import { m, useMotionValue, type MotionStyle, type TargetAndTransition, type Transition, type Variants } from 'motion/react'
import { useYouj, type Youj } from '@youj/core'
import { MotionFeatures } from '@youj/core'
import type { DurationToken, EasingToken } from '@youj/core'
import { useIconTrigger, type IconLoop, type IconTrigger } from './use-icon-trigger'

export type { IconLoop, IconTrigger } from './use-icon-trigger'

/** Gallery order. Add a category here, never in individual stories. */
export const ICON_CATEGORIES = [
  'navigation',
  'arrows',
  'ai',
  'actions',
  'editor',
  'files',
  'status',
  'media',
  'communication',
  'people',
  'commerce',
  'data',
  'development',
  'devices',
  'security',
  'time',
  'location',
  'weather',
  'system',
  'brand',
] as const

export type IconCategory = (typeof ICON_CATEGORIES)[number]

export interface IconProps {
  /** Rendered width and height. Default 24. */
  size?: number | string
  /** Stroke width in viewBox units. Default 1.5. */
  strokeWidth?: number
  className?: string
  style?: CSSProperties
  /** Gives the icon role="img". Without it the icon is decorative (aria-hidden). */
  'aria-label'?: string
  /** What plays the choreography. Hover also listens to a hovered/focused parent button or `data-yj-trigger` group. */
  trigger?: IconTrigger
  /** Controlled state for state icons (menu → close, play → pause…). Overrides the trigger. */
  active?: boolean
  ref?: Ref<SVGSVGElement>
}

export interface IconMeta {
  name: string
  category: IconCategory
  keywords: string[]
  /** Labels for [rest, active] on state icons, e.g. ['menu', 'close']. */
  states?: [string, string]
  defaultTrigger: IconTrigger
}

/** Per-part variants. Every part defines `rest` and `active`; `from` is the pre-mount pose for `trigger="mount"`. */
export type IconVariants = Record<string, Variants>

export interface IconContext {
  /** Unique, stable id prefix for masks and clip paths. */
  id: string
}

export interface IconDefinition<V extends IconVariants> {
  name: string
  category: IconCategory
  keywords?: string[]
  states?: [string, string]
  defaultTrigger?: IconTrigger
  loop?: IconLoop
  variants: (k: Youj) => V
  render: (v: V, ctx: IconContext) => ReactNode
}

export type YoujIconComponent = ((props: IconProps) => ReactNode) & { meta: IconMeta; displayName?: string }

/** A variant's resting values: keyframes collapse to their last value, transitions are dropped. */
function pose(target: Variants[string] | undefined): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  if (!target || typeof target === 'function') return out
  for (const [key, value] of Object.entries(target)) {
    if (key === 'transition' || key === 'transitionEnd') continue
    out[key] = Array.isArray(value) ? value[value.length - 1] : value
  }
  return out
}

/**
 * Parts without a `from` pose start at rest, so `trigger="mount"` never flashes
 * an unstyled frame. Under reduced motion every variant becomes its final pose
 * with no transition.
 */
function prepare<V extends IconVariants>(parts: V, reduced: boolean): V {
  const out: IconVariants = {}
  for (const [part, variants] of Object.entries(parts)) {
    const from = variants.from ?? (pose(variants.rest) as TargetAndTransition)
    if (!reduced) {
      out[part] = { ...variants, from }
      continue
    }
    out[part] = {}
    for (const label of Object.keys(variants)) {
      out[part]![label] = { ...pose(variants[label]), transition: { type: false } } as TargetAndTransition
    }
  }
  return out as V
}

export function createIcon<V extends IconVariants>(def: IconDefinition<V>): YoujIconComponent {
  const meta: IconMeta = {
    name: def.name,
    category: def.category,
    keywords: def.keywords ?? [],
    states: def.states,
    defaultTrigger: def.defaultTrigger ?? 'hover',
  }

  function Icon({
    size = 24,
    strokeWidth = 1.5,
    className,
    style,
    'aria-label': label,
    trigger = meta.defaultTrigger,
    active,
    ref,
  }: IconProps) {
    const k = useYouj()
    const local = useRef<SVGSVGElement | null>(null)
    const id = useId()
    const on = useIconTrigger(local, { trigger, active, loop: def.loop })
    const variants = useMemo(() => prepare(def.variants(k), k.reduced), [k])
    // The theme's icon weight (--yj-icon-weight, 1 by default) scales the stroke. Motion keeps an
    // svg's first style and doesn't follow a changed style prop, so the stroke rides a motion
    // value, which it does: a new strokeWidth redraws the icon.
    const weighted = `calc(${strokeWidth} * var(--yj-icon-weight, 1))`
    const stroke = useMotionValue(weighted)
    useEffect(() => stroke.set(weighted), [stroke, weighted])
    const setRef = useCallback(
      (node: SVGSVGElement | null) => {
        local.current = node
        if (typeof ref === 'function') ref(node)
        else if (ref) ref.current = node
      },
      [ref],
    )

    return (
      <m.svg
        ref={setRef}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className ? `youj-icon shrink-0 ${className}` : 'youj-icon shrink-0'}
        style={{ strokeWidth: stroke, ...style }}
        data-icon={def.name}
        data-state={on ? 'active' : 'rest'}
        initial={trigger === 'mount' && !k.reduced && active === undefined ? 'from' : false}
        animate={on ? 'active' : 'rest'}
        focusable="false"
        {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
      >
        {def.render(variants, { id: `ki${id.replace(/[^a-zA-Z0-9]/g, '')}` })}
      </m.svg>
    )
  }

  // The boundary lets the icon animate without a YoujProvider above it.
  const Component = ((props: IconProps) => (
    <MotionFeatures>
      <Icon {...props} />
    </MotionFeatures>
  )) as YoujIconComponent
  Component.meta = meta
  Component.displayName = `${def.name.replace(/(^|-)(\w)/g, (_, __, c: string) => c.toUpperCase())}Icon`
  return Component
}

/* ── Choreography helpers ───────────────────────────────────────────────── */

/**
 * Pivot a part around a point in viewBox units. Motion owns transform-origin
 * on SVG, so the pivot is given as fractions of the 24-unit view box.
 */
export function origin(x: number, y: number): MotionStyle {
  return { originX: x / 24, originY: y / 24, transformBox: 'view-box' }
}

/**
 * A keyframed tween. `times` are 0–1 offsets, `eases` one token per segment
 * (defaults to `standard` throughout).
 */
export function seq(k: Youj, token: DurationToken, times: number[], eases?: EasingToken[], delay = 0): Transition {
  return seqFor(k, k.duration(token), times, eases, delay)
}

/** Same as seq, for a length in seconds derived from tokens (e.g. `k.duration('slow') * 2`). */
export function seqFor(k: Youj, seconds: number, times: number[], eases?: EasingToken[], delay = 0): Transition {
  return {
    type: 'tween',
    duration: seconds,
    times,
    ease: (eases ?? times.slice(1).map((): EasingToken => 'standard')).map((e) => k.ease(e)),
    delay,
  }
}

/** Tween with a delay. */
export function after(k: Youj, delay: number, token: DurationToken, ease: EasingToken = 'standard'): Transition {
  return { ...k.tween(token, ease), delay }
}

/**
 * "Fully drawn" overshoots 1: Chrome measures dashed paths about 1% short, so a
 * closed stroke drawn to exactly 1 leaves a notch where its ends meet (visible
 * from ~128px). 1.03 covers the error with no visible effect on the draw.
 */
export const FULL_DRAW = 1.03

/**
 * Stroke draw-on. Opacity rides along so a round cap never shows as a stray
 * dot while the path length is zero.
 */
export function drawIn(k: Youj, token: DurationToken = 'slow', delay = 0, ease: EasingToken = 'emphasized'): TargetAndTransition {
  return {
    pathLength: [0, FULL_DRAW],
    opacity: [0, 1],
    transition: {
      pathLength: { ...k.tween(token, ease), delay },
      opacity: { ...k.tween('instant', 'linear'), delay },
    },
  }
}

/** Retract a stroke back to its start, then hide it. */
export function drawOut(k: Youj, token: DurationToken = 'fast', delay = 0): TargetAndTransition {
  return {
    pathLength: 0,
    opacity: 0,
    transition: {
      pathLength: { ...k.tween(token, 'exit'), delay },
      opacity: { ...k.tween('instant', 'linear'), delay: delay + k.duration(token) - k.duration('instant') },
    },
  }
}

/** Fully drawn, settling quickly from wherever the stroke was. */
export function drawn(k: Youj, token: DurationToken = 'fast', delay = 0): TargetAndTransition {
  return {
    pathLength: FULL_DRAW,
    opacity: 1,
    transition: { pathLength: { ...k.tween(token, 'standard'), delay }, opacity: { ...k.tween('instant', 'linear'), delay } },
  }
}

export const hidden: TargetAndTransition = { pathLength: 0, opacity: 0 }
