'use client'

import { useRef, type HTMLAttributes, type PointerEvent, type ReactNode } from 'react'
import { m, useMotionValue, useSpring, useTransform } from 'motion/react'
import { useYouj } from '@youj/core/lib/youj/provider'
import type { SpringToken } from '@youj/core/lib/youj/tokens'
import { cn } from '@youj/core/lib/youj/cn'
import { MotionFeatures } from '@youj/core/lib/youj/features'

export interface TiltProps extends HTMLAttributes<HTMLDivElement> {
  /** Maximum rotation in degrees at the edges. Default 8. */
  max?: number
  /** CSS perspective distance in px. Default 900. */
  perspective?: number
  /** A soft highlight that tracks the pointer. */
  glare?: boolean
  /** Scale while hovered. Default 1. */
  scale?: number
  spring?: SpringToken
  children?: ReactNode
}

/**
 * Tilts toward the pointer in 3D and springs flat on leave. Put the rounded
 * corners on Tilt itself so the glare clips to them. Static with reduced motion.
 */
export function Tilt({
  max = 8,
  perspective = 900,
  glare = false,
  scale = 1,
  spring = 'smooth',
  className,
  style,
  children,
  onPointerMove,
  onPointerLeave,
  ...rest
}: TiltProps) {
  const k = useYouj()
  const ref = useRef<HTMLDivElement>(null)
  const opts = k.spring(spring)

  // Pointer position relative to the center, -0.5..0.5 on each axis.
  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const hover = useMotionValue(0)
  const sx = useSpring(px, opts)
  const sy = useSpring(py, opts)
  const sh = useSpring(hover, opts)

  const rotateY = useTransform(sx, (v) => v * 2 * max)
  const rotateX = useTransform(sy, (v) => v * -2 * max)
  const s = useTransform(sh, [0, 1], [1, scale])
  // The glare blob is twice the card's size, so 50% of it is one card width.
  const gx = useTransform(sx, (v) => `${v * 50}%`)
  const gy = useTransform(sy, (v) => `${v * 50}%`)

  const handleMove = (e: PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(e)
    if (k.reduced || e.pointerType !== 'mouse' || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    px.set((e.clientX - r.left) / r.width - 0.5)
    py.set((e.clientY - r.top) / r.height - 0.5)
    hover.set(1)
  }
  const handleLeave = (e: PointerEvent<HTMLDivElement>) => {
    onPointerLeave?.(e)
    px.set(0)
    py.set(0)
    hover.set(0)
  }

  return (
    <MotionFeatures>
      <div
        ref={ref}
        {...rest}
        className={cn('relative', className)}
        style={{ ...style, perspective }}
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
      >
        <m.div
          className="relative h-full w-full rounded-[inherit]"
          style={k.reduced ? undefined : { rotateX, rotateY, scale: s, transformStyle: 'preserve-3d' }}
        >
          {children}
          {glare && !k.reduced && (
            <m.div
              aria-hidden
              className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] mix-blend-soft-light"
              style={{ opacity: sh }}
            >
              <m.div
                className="absolute -top-1/2 -left-1/2 h-[200%] w-[200%] bg-[radial-gradient(circle_at_center,white_0%,transparent_45%)]"
                style={{ x: gx, y: gy }}
              />
            </m.div>
          )}
        </m.div>
      </div>
    </MotionFeatures>
  )
}
