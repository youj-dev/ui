'use client'

import { useRef, type RefObject } from 'react'
import { m, useMotionValueEvent, useScroll, useSpring, useTransform, type MotionValue } from 'motion/react'
import { useYouj } from '@youj/core/lib/youj/provider'
import { useComponentLabels } from '@youj/core/lib/youj/use-component-labels'
import { scrollProgressLabels } from '@youj/core/labels'
import type { SpringToken } from '@youj/core/lib/youj/tokens'
import { cn } from '@youj/core/lib/youj/cn'
import { MotionFeatures } from '@youj/core/lib/youj/features'

export interface ScrollProgressProps {
  variant?: 'bar' | 'ring'
  /** Scroll container to track. Defaults to the page. */
  container?: RefObject<HTMLElement | null>
  axis?: 'y' | 'x'
  spring?: SpringToken
  /** Ring diameter in px. Default 36. */
  size?: number
  /** Ring stroke width in px. Default 3. */
  thickness?: number
  label?: string
  className?: string
}

/**
 * Shows how far a page or container has scrolled, as a bar or a ring,
 * spring-smoothed. With reduced motion it tracks scroll directly.
 */
export function ScrollProgress({
  variant = 'bar',
  container,
  axis = 'y',
  spring = 'smooth',
  size = 36,
  thickness = 3,
  label,
  className,
}: ScrollProgressProps) {
  const k = useYouj()
  const labels = useComponentLabels(scrollProgressLabels)
  label ??= labels.scrollProgress
  const ref = useRef<HTMLDivElement & SVGSVGElement>(null)
  const { scrollYProgress, scrollXProgress } = useScroll({ container })
  const raw = axis === 'y' ? scrollYProgress : scrollXProgress
  const smooth = useSpring(raw, k.spring(spring))
  const progress: MotionValue<number> = k.reduced ? raw : smooth
  // A round cap draws a dot at zero length; hide it until there is progress.
  const capOpacity = useTransform(progress, [0, 0.005], [0, 1])

  // Keep aria-valuenow current without re-rendering every frame.
  useMotionValueEvent(raw, 'change', (v) => {
    ref.current?.setAttribute('aria-valuenow', String(Math.round(v * 100)))
  })

  const a11y = {
    role: 'progressbar',
    'aria-label': label,
    'aria-valuemin': 0,
    'aria-valuemax': 100,
    'aria-valuenow': 0,
  } as const

  if (variant === 'ring') {
    const r = (size - thickness) / 2
    const circle = { cx: size / 2, cy: size / 2, r, fill: 'none', strokeWidth: thickness }
    return (
      <MotionFeatures>
        <svg ref={ref} {...a11y} width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={cn('-rotate-90', className)}>
          <circle {...circle} className="stroke-line" />
          <m.circle {...circle} className="stroke-accent" strokeLinecap="round" style={{ pathLength: progress, opacity: capOpacity }} />
        </svg>
      </MotionFeatures>
    )
  }

  return (
    <MotionFeatures>
      <div ref={ref} {...a11y} className={cn('h-0.5 w-full overflow-hidden', className)}>
        <m.div
          className="h-full w-full origin-left bg-accent"
          style={{ scaleX: progress }}
        />
      </div>
    </MotionFeatures>
  )
}
