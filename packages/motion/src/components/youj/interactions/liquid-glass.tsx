'use client'

import { useRef, type PointerEvent, type ReactNode } from 'react'
import { m, useMotionValue, useSpring, useTransform, type HTMLMotionProps } from 'motion/react'
import { useYouj } from '@youj/core/lib/youj/provider'
import { cn } from '@youj/core/lib/youj/cn'
import { MotionFeatures } from '@youj/core/lib/youj/features'

/* A pane of liquid glass behind whatever it wraps. The glass is one layer
 * under the content: the backdrop blurred and saturated, a body of light thin
 * enough to show it, a bright rim, a darker lower lip and a soft drop. A
 * second layer is the specular: a highlight that sits at the pointer, and the
 * rim lit brightest nearest it.
 *
 * The pointer is read once per event as a position across the pane (-0.5 to
 * 0.5 each way) and three values spring after it on k.spring('settle'), so the
 * glass lags, overshoots and settles like something with mass: the pane leans
 * toward the pointer by `bulge` px and swells a little along that direction,
 * and the specular slides to it. A press squishes the whole thing, content
 * included, and lets it spring back. All of it is transform and two custom
 * properties; there's no WebGL and no layout. Reduced motion is the glass at
 * rest: the highlight top left, no lean, no squish. */

const CSS = `
.yj-liquid { position: relative; isolation: isolate; }
.yj-liquid__pane, .yj-liquid__shine {
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: inherit;
  pointer-events: none;
}
.yj-liquid__pane {
  --yj-liquid-body: calc(16% - 8% * var(--yj-dark, 0));
  background:
    linear-gradient(to bottom, color-mix(in oklab, var(--yj-light) calc(var(--yj-liquid-body) + 10%), transparent), color-mix(in oklab, var(--yj-light) var(--yj-liquid-body), transparent) 60%),
    color-mix(in oklab, var(--color-surface) 12%, transparent);
  -webkit-backdrop-filter: blur(var(--yj-liquid-blur, 12px)) saturate(1.8);
  backdrop-filter: blur(var(--yj-liquid-blur, 12px)) saturate(1.8);
  box-shadow:
    inset 0 0 0 1px color-mix(in oklab, var(--yj-light) calc(30% - 12% * var(--yj-dark, 0)), transparent),
    inset 0 1px 0 color-mix(in oklab, var(--yj-light) calc(70% - 30% * var(--yj-dark, 0)), transparent),
    inset 0 -1px 1px color-mix(in oklab, var(--yj-shade) 12%, transparent),
    inset 0 -10px 18px -12px color-mix(in oklab, var(--yj-light) 45%, transparent),
    0 8px 24px -10px color-mix(in oklab, var(--yj-shade) calc(28% + 20% * var(--yj-dark, 0)), transparent),
    0 1px 2px color-mix(in oklab, var(--yj-shade) 14%, transparent);
}
.yj-liquid__shine { overflow: hidden; }
.yj-liquid__shine::before, .yj-liquid__shine::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
}
/* The specular: a soft light at the pointer. */
.yj-liquid__shine::before {
  background: radial-gradient(60% 90% at var(--yj-liquid-x, 30%) var(--yj-liquid-y, 12%), color-mix(in oklab, var(--yj-light) calc(38% - 14% * var(--yj-dark, 0)), transparent), transparent 70%);
  mix-blend-mode: plus-lighter;
}
/* The rim, lit brightest nearest the pointer: the same light masked to a 1.5px ring. */
.yj-liquid__shine::after {
  padding: 1.5px;
  background: radial-gradient(70% 120% at var(--yj-liquid-x, 30%) var(--yj-liquid-y, 12%), color-mix(in oklab, var(--yj-light) 90%, transparent), transparent 70%);
  -webkit-mask: linear-gradient(white 0 0) content-box, linear-gradient(white 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(white 0 0) content-box exclude, linear-gradient(white 0 0);
}
`

export interface LiquidGlassProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  /** How far the glass leans toward the pointer, in px. 0 keeps it still (the highlight still follows). Default 4. */
  bulge?: number
  /** Blur of what's behind the glass, in px. Default 12. */
  blur?: number
  /** Squish on press. Default true. */
  squish?: boolean
  children?: ReactNode
}

/**
 * Wraps content (a button, a pill, a badge, a toolbar) in a pane of liquid
 * glass that leans toward the pointer, keeps a highlight under it and squishes
 * when pressed. Put the radius on LiquidGlass itself (`rounded-full`) so the
 * glass takes it. Static glass with reduced motion and on touch.
 */
export function LiquidGlass({
  bulge = 4,
  blur = 12,
  squish = true,
  className,
  style,
  children,
  onPointerMove,
  onPointerLeave,
  onPointerDown,
  onPointerUp,
  onPointerCancel,
  ...rest
}: LiquidGlassProps) {
  const k = useYouj()
  const ref = useRef<HTMLDivElement>(null)
  const settle = k.spring('settle')

  // Pointer across the pane, -0.5..0.5 each way; hover and press 0..1.
  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const hover = useMotionValue(0)
  const press = useMotionValue(0)
  const sx = useSpring(px, settle)
  const sy = useSpring(py, settle)
  const sh = useSpring(hover, settle)
  const sp = useSpring(press, settle)

  // The pane leans toward the pointer and swells along that direction.
  const x = useTransform(sx, (v) => v * 2 * bulge)
  const y = useTransform(sy, (v) => v * 2 * bulge)
  const scaleX = useTransform(() => 1 + sh.get() * (0.015 + Math.abs(sx.get()) * 0.03))
  const scaleY = useTransform(() => 1 + sh.get() * (0.015 + Math.abs(sy.get()) * 0.03))
  // A press flattens the whole thing, content included: wider, and shorter by twice as much.
  const squishX = useTransform(sp, (v) => 1 + v * 0.04)
  const squishY = useTransform(sp, (v) => 1 - v * 0.08)
  // The highlight rests top left and slides to the pointer while it's over the glass.
  const gx = useTransform(() => `${30 + sh.get() * ((sx.get() + 0.5) * 100 - 30)}%`)
  const gy = useTransform(() => `${12 + sh.get() * ((sy.get() + 0.5) * 100 - 12)}%`)

  const track = (e: PointerEvent<HTMLDivElement>) => {
    if (k.reduced || (e.pointerType !== 'mouse' && e.pointerType !== 'pen') || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    // The rect includes the current lean and squish; at these sizes that error is a pixel.
    px.set(Math.max(-0.5, Math.min(0.5, (e.clientX - r.left) / r.width - 0.5)))
    py.set(Math.max(-0.5, Math.min(0.5, (e.clientY - r.top) / r.height - 0.5)))
    hover.set(1)
  }
  const letGo = () => {
    px.set(0)
    py.set(0)
    hover.set(0)
    press.set(0)
  }

  const still = k.reduced
  return (
    <MotionFeatures>
      <m.div
        ref={ref}
        {...rest}
        data-slot="liquid-glass"
        data-yj-reduced={still || undefined}
        className={cn('yj-liquid', className)}
        style={
          {
            ...style,
            '--yj-liquid-blur': `${blur}px`,
            ...(still || !squish ? null : { scaleX: squishX, scaleY: squishY }),
          } as HTMLMotionProps<'div'>['style']
        }
        onPointerMove={(e) => {
          onPointerMove?.(e)
          track(e)
        }}
        onPointerLeave={(e) => {
          onPointerLeave?.(e)
          letGo()
        }}
        onPointerDown={(e) => {
          onPointerDown?.(e)
          if (squish && !still) press.set(1)
        }}
        onPointerUp={(e) => {
          onPointerUp?.(e)
          press.set(0)
        }}
        onPointerCancel={(e) => {
          onPointerCancel?.(e)
          press.set(0)
        }}
      >
        <style href="youj-liquid-glass" precedence="youj">
          {CSS}
        </style>
        <m.span aria-hidden className="yj-liquid__pane" style={still ? undefined : { x, y, scaleX, scaleY }} />
        <m.span
          aria-hidden
          className="yj-liquid__shine"
          style={still ? undefined : ({ x, y, '--yj-liquid-x': gx, '--yj-liquid-y': gy } as HTMLMotionProps<'span'>['style'])}
        />
        {children}
      </m.div>
    </MotionFeatures>
  )
}
