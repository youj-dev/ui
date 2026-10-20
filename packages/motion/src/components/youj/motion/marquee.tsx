'use client'

import { useEffect, useRef, useState, type HTMLAttributes, type ReactNode } from 'react'
import { m, useAnimationFrame, useInView, useMotionValue } from 'motion/react'
import { useDirection, useYouj } from '@youj/core/lib/youj/provider'
import { cn } from '@youj/core/lib/youj/cn'
import { MotionFeatures } from '@youj/core/lib/youj/features'

export type MarqueeDirection = 'left' | 'right' | 'up' | 'down'

export interface MarqueeProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  /** Which way the content travels. Left and right follow the reading direction: under RTL the row mirrors and they swap. Default 'left'. */
  direction?: MarqueeDirection
  /** Pixels per second at time scale 1. Default 40. */
  speed?: number
  /** Ease to a stop while hovered. Default true. Keyboard focus inside always stops it and brings the focused item into view. */
  pauseOnHover?: boolean
  /** Width of the faded edges in px. 0 disables. Default 48. */
  fade?: number
  /** Space between items and between copies, in px. Default 48. */
  gap?: number
}

/**
 * A seamless loop. The content is measured and repeated enough times to fill
 * the track, then translated by one copy's length per cycle. Only one copy
 * (the second: one inert copy leads it, so the track can shift either way) is
 * real; the rest are inert and hidden from assistive tech. Tabbing in stops
 * the loop at once and eases the focused item clear of the faded edges by
 * the shortest route, so focus never lands half hidden. The viewport clips
 * (overflow: clip) rather than hiding overflow, so the browser can't scroll
 * it on focus and open a gap.
 * Under RTL the whole loop mirrors: copies run from the right edge and
 * 'left' travels toward it, so new items still enter from the reading end.
 * Pauses offscreen and in hidden tabs; with reduced motion it becomes a
 * static, wrapping row.
 */
export function Marquee({
  children,
  direction = 'left',
  speed = 40,
  pauseOnHover = true,
  fade = 48,
  gap = 48,
  className,
  style,
  onPointerEnter,
  onPointerLeave,
  onFocus,
  onBlur,
  ...rest
}: MarqueeProps) {
  const k = useYouj()
  const vertical = direction === 'up' || direction === 'down'
  // −1 mirrors a horizontal loop under RTL, where the copies are laid out from the right.
  const rtl = useDirection() === 'rtl'
  const flip = !vertical && rtl ? -1 : 1
  const rootRef = useRef<HTMLDivElement>(null)
  const copyRef = useRef<HTMLDivElement>(null)
  const inView = useInView(rootRef)
  const [copies, setCopies] = useState(3)
  const length = useRef(0)
  // How far the loop has traveled into the current copy. The real copy sits at -phase.
  const phase = useRef(0)
  const velocity = useRef(1)
  const held = useRef(false)
  // While keyboard focus is inside: the phase that shows the focused item.
  const focusPhase = useRef<number | null>(null)
  const translate = useMotionValue(0)

  useEffect(() => {
    const root = rootRef.current
    const copy = copyRef.current
    if (!root || !copy || k.reduced) return
    const measure = () => {
      const copyLen = vertical ? copy.offsetHeight : copy.offsetWidth
      const rootLen = vertical ? root.offsetHeight : root.offsetWidth
      length.current = copyLen
      // One leading copy, then enough to fill the track from any phase in [-1, 2] copies.
      if (copyLen > 0) setCopies(Math.ceil(rootLen / copyLen) + 3)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(root)
    ro.observe(copy)
    return () => ro.disconnect()
  }, [vertical, k.reduced])

  useAnimationFrame((_, delta) => {
    const L = length.current
    if (k.reduced || !inView || !L) return
    // Clamp long frames (tab switches) so the loop never jumps.
    const dt = Math.min(delta, k.ms('instant'))
    if (focusPhase.current !== null) {
      // Ease the focused item into view; the loop itself stays stopped.
      phase.current += (focusPhase.current - phase.current) * (1 - Math.exp(-dt / k.ms('base')))
    } else {
      // Hover eases velocity toward zero over roughly a 'slow' duration.
      const target = held.current ? 0 : 1
      velocity.current += (target - velocity.current) * (1 - Math.exp(-dt / k.ms('slow')))
      const forward = direction === 'left' || direction === 'up'
      const step = (speed * velocity.current * dt) / 1000 / k.timeScale
      // Every copy is identical, so wrapping by a copy length is invisible.
      phase.current = (((phase.current + (forward ? step : -step)) % L) + L) % L
    }
    translate.set(flip * (-L - phase.current))
  })

  const hold = (on: boolean) => {
    if (pauseOnHover) held.current = on
  }

  /* Brings the focused item clear of the faded edges. The loop's phase can be
   * shifted by whole copies without a visible change, so it first takes the
   * equivalent phase that needs the least travel, then eases from there. */
  const reveal = (target: Element) => {
    const root = rootRef.current
    const copy = copyRef.current
    // Any focus inside holds the loop where it is (a focusable root included).
    velocity.current = 0
    focusPhase.current = phase.current
    const L = length.current
    if (!root || !copy || !L || !copy.contains(target)) return
    const r = root.getBoundingClientRect()
    const c = copy.getBoundingClientRect()
    const t = target.getBoundingClientRect()
    const rootLen = vertical ? r.height : r.width
    const start = vertical ? t.top - c.top : flip < 0 ? c.right - t.right : t.left - c.left
    const size = vertical ? t.height : t.width
    const edge = Math.min(fade, Math.max(0, (rootLen - size) / 2))
    // The track is covered for phases within [-1, 2] copies.
    const covered = (p: number) => p >= -L && p <= 2 * L
    let best: { from: number; to: number; travel: number } | undefined
    for (let n = -2; n <= 2; n++) {
      const from = phase.current + n * L
      const at = start - from
      const to = start - Math.min(Math.max(at, edge), Math.max(edge, rootLen - edge - size))
      if (!covered(from) || !covered(to)) continue
      if (!best || Math.abs(to - from) < best.travel) best = { from, to, travel: Math.abs(to - from) }
    }
    if (!best) return
    phase.current = best.from
    focusPhase.current = best.to
  }

  const axis = vertical ? 'to bottom' : 'to right'
  const mask =
    fade > 0 && !k.reduced
      ? `linear-gradient(${axis}, transparent, black ${fade}px, black calc(100% - ${fade}px), transparent)`
      : undefined

  const item = (i: number) => (
    <div
      key={i}
      ref={i === 1 ? copyRef : undefined}
      aria-hidden={i !== 1 || undefined}
      inert={i !== 1 || undefined}
      className={cn('flex shrink-0 items-center', vertical && 'flex-col')}
      style={vertical ? { gap, paddingBottom: gap } : { gap, paddingInlineEnd: gap }}
    >
      {children}
    </div>
  )

  if (k.reduced) {
    return (
      <div
        {...rest}
        className={cn('flex items-center justify-center', vertical ? 'flex-col overflow-y-auto' : 'flex-wrap', className)}
        style={{ ...style, columnGap: gap, rowGap: gap / 2 }}
      >
        {children}
      </div>
    )
  }

  return (
    <MotionFeatures>
      <div
        {...rest}
        // flow-root: the viewport's negative margins stay inside this box.
        className={cn('flow-root', className)}
        style={style}
        onPointerEnter={(e) => {
          onPointerEnter?.(e)
          hold(true)
        }}
        onPointerLeave={(e) => {
          onPointerLeave?.(e)
          hold(false)
        }}
        onFocus={(e) => {
          onFocus?.(e)
          reveal(e.target)
        }}
        onBlur={(e) => {
          onBlur?.(e)
          if (!e.currentTarget.contains(e.relatedTarget)) focusPhase.current = null
        }}
      >
        {/* The viewport clips the loop's axis and carries the fade. It reaches a
            few px past the box on the other axis (net zero in layout), so a
            focus ring on an item isn't cut off by the mask. */}
        <div
          ref={rootRef}
          className={cn(vertical ? 'h-full -mx-1 overflow-y-clip px-1' : '-my-1 overflow-x-clip py-1')}
          style={{ maskImage: mask, WebkitMaskImage: mask }}
        >
          <m.div
            className={cn('flex w-max', vertical && 'h-max w-auto flex-col')}
            style={vertical ? { y: translate } : { x: translate }}
          >
            {Array.from({ length: copies }, (_, i) => item(i))}
          </m.div>
        </div>
      </div>
    </MotionFeatures>
  )
}
