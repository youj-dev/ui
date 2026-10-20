'use client'

import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react'
import {
  m,
  useMotionValue,
  useSpring,
  useTransform,
  type HTMLMotionProps,
  type MotionValue,
} from 'motion/react'
import { useYouj } from '@youj/core/lib/youj/provider'
import type { SpringToken } from '@youj/core/lib/youj/tokens'
import { cn } from '@youj/core/lib/youj/cn'
import { MotionFeatures } from '@youj/core/lib/youj/features'

const MagneticContext = createContext<{ x: MotionValue<number>; y: MotionValue<number> } | null>(null)

export interface MagneticProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  /** Fraction of the pointer offset the element follows. Default 0.35. */
  strength?: number
  /** Pull starts this many px outside the element's box and grows toward it. Default 80. */
  radius?: number
  spring?: SpringToken
  children?: ReactNode
}

/**
 * Pulls its content toward the pointer when it comes within `radius`, and
 * springs back when it leaves. Disabled for reduced motion and coarse pointers.
 */
export function Magnetic({ strength = 0.35, radius = 80, spring = 'smooth', className, style, children, ...rest }: MagneticProps) {
  const k = useYouj()
  const ref = useRef<HTMLDivElement>(null)
  const tx = useMotionValue(0)
  const ty = useMotionValue(0)
  const x = useSpring(tx, k.spring(spring))
  const y = useSpring(ty, k.spring(spring))

  useEffect(() => {
    const el = ref.current
    const reset = () => {
      tx.set(0)
      ty.set(0)
    }
    if (!el || k.reduced || !window.matchMedia('(pointer: fine)').matches) {
      reset()
      return
    }

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      // The rect includes our own translation; measure from the resting center.
      const cx = r.left + r.width / 2 - x.get()
      const cy = r.top + r.height / 2 - y.get()
      const dx = e.clientX - cx
      const dy = e.clientY - cy
      const outside = Math.hypot(Math.max(Math.abs(dx) - r.width / 2, 0), Math.max(Math.abs(dy) - r.height / 2, 0))
      // Full pull over the element, fading linearly to zero at the radius edge.
      const pull = strength * Math.max(0, 1 - outside / radius)
      tx.set(dx * pull)
      ty.set(dy * pull)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', reset)
    window.addEventListener('blur', reset)
    return () => {
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', reset)
      window.removeEventListener('blur', reset)
    }
  }, [k.reduced, strength, radius, tx, ty, x, y])

  return (
    <MotionFeatures>
      <MagneticContext.Provider value={{ x, y }}>
        <m.div ref={ref} {...rest} className={cn('inline-block', className)} style={{ ...style, x, y }}>
          {children}
        </m.div>
      </MagneticContext.Provider>
    </MotionFeatures>
  )
}

export interface MagneticInnerProps extends Omit<HTMLMotionProps<'span'>, 'children'> {
  /** How far the inner content travels relative to the shell. 0.5 = half as far. Default 0.5. */
  ratio?: number
  children?: ReactNode
}

/** Place inside a Magnetic's child (e.g. a button label) so it lags the shell, for depth. */
export function MagneticInner({ ratio = 0.5, className, style, children, ...rest }: MagneticInnerProps) {
  const ctx = useContext(MagneticContext)
  const fallback = useMotionValue(0)
  const x = useTransform(ctx?.x ?? fallback, (v) => v * (ratio - 1))
  const y = useTransform(ctx?.y ?? fallback, (v) => v * (ratio - 1))
  return (
    <m.span {...rest} className={cn('inline-block', className)} style={{ ...style, x, y }}>
      {children}
    </m.span>
  )
}
