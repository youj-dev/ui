import { useRef } from 'react'
import { cn } from '@youj/core/lib/youj/cn'
import { packOklab } from './color'
import { fallbackBackground, useShaderBackground } from './gl'
import { NOISE_FIELD_FRAGMENT } from './noise-field.glsl'

export interface NoiseFieldProps {
  /** [lines, summit] CSS colors. Default: `--color-fg` lines, `--color-accent` summits. */
  colors?: [lines: string, summit: string]
  /** Line and tint strength, 0–1.5. Default 1. */
  intensity?: number
  /** Flow speed multiplier. Default 1. */
  speed?: number
  /** Number of contour intervals across the height range. Default 14. */
  density?: number
  /** The pointer raises a mound that bunches the contours around it. Default true. */
  interactive?: boolean
  className?: string
}

/**
 * Domain-warped flow noise read as a topographic survey: anti-aliased contour
 * lines with every fifth line emphasized, accent-tinted summits, and a fixed grid of survey marks.
 */
export function NoiseField({
  colors,
  intensity = 1,
  speed = 1,
  density = 14,
  interactive = true,
  className,
}: NoiseFieldProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [lines = 'var(--color-fg)', summit = 'var(--color-accent)'] = colors ?? []

  const { failed } = useShaderBackground(hostRef, {
    fragment: NOISE_FIELD_FRAGMENT,
    colors: ['var(--color-canvas)', lines, summit],
    speed,
    interactive,
    maxDpr: 2,
    staticTime: 24,
    uniforms: (u, info) => {
      const lab = packOklab(info.colors)
      u.vec3('uBase', lab.subarray(0, 3))
      u.vec3('uInk', lab.subarray(3, 6))
      u.vec3('uAccent', lab.subarray(6, 9))
      u.float('uIntensity', intensity)
      u.float('uDensity', density)
      // The finest octave is the faintest (0.6 × 0.38²): the low tier drops it for a third fewer noise calls.
      u.float('uOctaves', info.low ? 2 : 3)
      u.vec3('uPointer', [info.pointer.x * info.dpr, info.height - info.pointer.y * info.dpr, info.pointer.strength])
    },
  })

  return (
    <div
      ref={hostRef}
      aria-hidden
      data-fallback={failed || undefined}
      className={cn('pointer-events-none absolute inset-0 overflow-hidden bg-canvas', className)}
      style={failed ? fallbackBackground([summit]) : undefined}
    />
  )
}
