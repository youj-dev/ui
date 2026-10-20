'use client'

import { useRef, type RefObject } from 'react'
import { m, useScroll, useSpring, useTransform, type HTMLMotionProps, type MotionValue } from 'motion/react'
import { useYouj } from '@youj/core/lib/youj/provider'
import type { SpringToken } from '@youj/core/lib/youj/tokens'
import { MotionFeatures } from '@youj/core/lib/youj/features'

type ScrollOffset = NonNullable<NonNullable<Parameters<typeof useScroll>[0]>['offset']>

export interface ParallaxProps extends Omit<HTMLMotionProps<'div'>, 'style'> {
  /** Scroll progress stops (0..1 of the element's pass through `offset`). Default [0, 1]. */
  input?: number[]
  /** Output ranges, one value per `input` stop. Translate values are px. */
  x?: number[]
  y?: number[]
  scale?: number[]
  rotate?: number[]
  opacity?: number[]
  /** Scroll offsets defining progress 0 and 1. Default: from entering to leaving the viewport. */
  offset?: ScrollOffset
  container?: RefObject<HTMLElement | null>
  /** Spring-smooth the scroll input. Pass false to track it exactly. Default 'smooth'. */
  spring?: SpringToken | false
  style?: HTMLMotionProps<'div'>['style']
}

function useRange(progress: MotionValue<number>, input: number[], output: number[] | undefined, rest: number) {
  return useTransform(progress, output ? input : [0, 1], output ?? [rest, rest])
}

/**
 * Maps the element's scroll progress to translate, scale, rotate and opacity.
 * With reduced motion the element sits still at its resting state.
 */
export function Parallax({
  input = [0, 1],
  x,
  y,
  scale,
  rotate,
  opacity,
  offset = ['start end', 'end start'],
  container,
  spring = 'smooth',
  style,
  children,
  ...rest
}: ParallaxProps) {
  const k = useYouj()
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, container, offset })
  const smooth = useSpring(scrollYProgress, k.spring(spring || 'smooth'))
  const progress = spring ? smooth : scrollYProgress

  const mx = useRange(progress, input, x, 0)
  const my = useRange(progress, input, y, 0)
  const ms = useRange(progress, input, scale, 1)
  const mr = useRange(progress, input, rotate, 0)
  const mo = useRange(progress, input, opacity, 1)

  return (
    <MotionFeatures>
      <m.div
        ref={ref}
        {...rest}
        style={k.reduced ? style : { ...style, x: mx, y: my, scale: ms, rotate: mr, opacity: mo }}
      >
        {children}
      </m.div>
    </MotionFeatures>
  )
}
