'use client'

import { useEffect, useRef, type CSSProperties, type HTMLAttributes, type ReactNode, type Ref } from 'react'
import { useYouj } from '@youj/core/lib/youj/provider'
import { observeOnScreen } from '@youj/core/lib/youj/on-screen'
import { cn } from '@youj/core/lib/youj/cn'

/* A comet of accent light travels the border. The light is a conic gradient
 * on a square that turns by `rotate` (compositor-only: no style or paint work
 * per frame, no JS), centred on the ring and as wide as its diagonal, so the
 * sweep is the same angle on any box. The ring masks it down to the border.
 * Hover / focus lengthens the comet (the arc is a registered property, so it
 * transitions and reverses cleanly mid-flight) and fades in a blurred halo
 * that hugs the edge. The loop pauses offscreen and in hidden tabs. Reduced
 * motion parks the light at a fixed corner. */

const CSS = `
@property --yj-sb-arc { syntax: '<angle>'; inherits: false; initial-value: 72deg; }

@keyframes yj-sb-spin { to { rotate: 360deg; } }

.yj-sb {
  position: relative;
  isolation: isolate;
  border: var(--yj-sb-width) solid var(--color-line);
}
.yj-sb__ring, .yj-sb__halo {
  position: absolute;
  inset: calc(var(--yj-sb-width) * -1);
  border-radius: inherit;
  pointer-events: none;
  padding: var(--yj-sb-width);
  container-type: size;
  overflow: hidden;
  -webkit-mask: linear-gradient(white 0 0) content-box, linear-gradient(white 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(white 0 0) content-box exclude, linear-gradient(white 0 0);
  transition: opacity var(--yj-duration-slow) var(--ease-standard);
}
.yj-sb__ring::before, .yj-sb__halo::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: calc(hypot(100cqw, 100cqh) + var(--yj-sb-width) * 4);
  aspect-ratio: 1;
  translate: -50% -50%;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    transparent calc(360deg - var(--yj-sb-arc)),
    color-mix(in oklch, var(--color-accent) 35%, transparent) calc(360deg - var(--yj-sb-arc) * 0.45),
    var(--color-accent) calc(360deg - 4deg),
    transparent 360deg
  );
  animation: yj-sb-spin var(--yj-sb-period) linear infinite;
  transition: --yj-sb-arc var(--yj-duration-slow) var(--ease-standard);
}
.yj-sb__ring {
  z-index: 1;
  opacity: var(--yj-sb-idle-opacity);
}
/* The bloom is a thicker copy of the ring, blurred by its parent (filter runs
 * before the child's mask would), so it hugs the edge instead of flooding the surface. */
.yj-sb__glow {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  z-index: 1;
  filter: blur(calc(var(--yj-sb-width) * 6));
  opacity: 0;
  transition: opacity var(--yj-duration-slow) var(--ease-standard);
}
.yj-sb__halo { padding: calc(var(--yj-sb-width) * 3); inset: calc(var(--yj-sb-width) * -2); }

.yj-sb[data-intensify]:is(:hover, :has(:focus-visible), :focus-visible) :is(.yj-sb__ring, .yj-sb__halo)::before { --yj-sb-arc: 150deg; }
.yj-sb[data-intensify]:is(:hover, :has(:focus-visible), :focus-visible) > .yj-sb__ring { opacity: 1; }
.yj-sb[data-intensify]:is(:hover, :has(:focus-visible), :focus-visible) > .yj-sb__glow { opacity: 0.7; }

.yj-sb[data-paused] :is(.yj-sb__ring, .yj-sb__halo)::before { animation-play-state: paused; }

.yj-sb[data-reduced] :is(.yj-sb__ring, .yj-sb__halo, .yj-sb__glow) {
  transition: none;
}
.yj-sb[data-reduced] :is(.yj-sb__ring, .yj-sb__halo)::before {
  animation: none;
  transition: none;
  rotate: 200deg;
}
`

const PERIODS = { slow: 10, base: 6, fast: 3.5 } as const

export interface ShimmerOptions {
  /** How visible the light is at rest. 'hidden' only shows it on hover / focus. Default 'subtle'. */
  idle?: 'subtle' | 'visible' | 'hidden'
  /** Lengthen the comet and add a bloom on hover and keyboard focus. Default true. */
  intensify?: boolean
  /** One lap of the border. Default 'base'. */
  speed?: keyof typeof PERIODS
  /** Border width in px. Default 1. */
  borderWidth?: number
}

const IDLE_OPACITY = { subtle: 0.65, visible: 1, hidden: 0 } as const

/**
 * The shimmer on any element: spread `rootProps` on it (merging `className`
 * and `style` with your own) and render `layers` as its first children. The
 * element gets a `--color-line` border that carries the light; give it a radius.
 */
export function useShimmer<T extends HTMLElement>({
  idle = 'subtle',
  intensify = true,
  speed = 'base',
  borderWidth = 1,
}: ShimmerOptions = {}) {
  const k = useYouj()
  const ref = useRef<T>(null)

  // Pause the loop while offscreen or while the tab is hidden.
  useEffect(() => {
    const el = ref.current
    if (!el || k.reduced) return
    return observeOnScreen(el, (onScreen) => el.toggleAttribute('data-paused', !onScreen))
  }, [k.reduced])

  const rootProps = {
    ref,
    className: 'yj-sb',
    'data-intensify': intensify ? '' : undefined,
    'data-reduced': k.reduced ? '' : undefined,
    style: {
      '--yj-sb-width': `${borderWidth}px`,
      '--yj-sb-period': `calc(var(--yj-duration-deliberate) * ${PERIODS[speed]})`,
      '--yj-sb-idle-opacity': IDLE_OPACITY[idle],
    } as CSSProperties,
  }

  const layers = (
    <>
      <style href="youj-shimmer-border" precedence="youj">
        {CSS}
      </style>
      <span aria-hidden className="yj-sb__glow">
        <span className="yj-sb__halo" />
      </span>
      <span aria-hidden className="yj-sb__ring" />
    </>
  )

  return { rootProps, layers }
}

export interface ShimmerProps extends HTMLAttributes<HTMLDivElement>, ShimmerOptions {
  children?: ReactNode
}

/** Wraps anything in a border that carries a traveling point of light. Brings no look of its own. */
export function Shimmer({ idle, intensify, speed, borderWidth, className, style, children, ...rest }: ShimmerProps) {
  const { rootProps, layers } = useShimmer<HTMLDivElement>({ idle, intensify, speed, borderWidth })
  return (
    <div
      {...rest}
      {...rootProps}
      ref={rootProps.ref as Ref<HTMLDivElement>}
      style={{ ...rootProps.style, ...style }}
      className={cn(rootProps.className, className)}
    >
      {layers}
      {children}
    </div>
  )
}
