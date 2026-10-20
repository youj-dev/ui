import { useRef } from 'react'
import { cn } from '@youj/core/lib/youj/cn'
import { accentFamily, lightness, packOklab, rgbToOklab, type Rgb } from './color'
import { fallbackBackground, useShaderBackground } from './gl'
import { MESH_GRADIENT_FRAGMENT } from './mesh-gradient.glsl'

export interface MeshGradientProps {
  /** Up to four CSS colors for the color masses. Default: an analogous family derived from the accent token. */
  colors?: string[]
  /** How much of the field is colored vs. canvas. 0–1.5, default 1. */
  intensity?: number
  /** Drift speed multiplier. Default 1. */
  speed?: number
  /** Film grain amount, 0–1. Default 0.5. Dithering against banding is always on. */
  grain?: number
  /** The field leans toward the pointer. Default true. */
  interactive?: boolean
  className?: string
}

// Neighbors of the accent: [hue°, ΔL, chroma×]. Violet, cool cyan, and a deep rose, all quieter than the accent.
const FAMILY = [
  [40, -0.04, 0.95],
  [-50, 0.04, 0.8],
  [95, -0.1, 0.7],
] as const satisfies readonly [number, number, number][]

/**
 * Slow, luxurious flowing mesh gradient. Four color masses drift through a
 * domain-warped field and blend in OKLab; grain and dither keep it free of banding.
 */
export function MeshGradient({
  colors,
  intensity = 1,
  speed = 1,
  grain = 0.5,
  interactive = true,
  className,
}: MeshGradientProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const cache = useRef<{ source: readonly Rgb[] | null; base: Float32Array; inks: Float32Array; light: number }>({
    source: null,
    base: new Float32Array(3),
    inks: new Float32Array(12),
    light: 0,
  })
  const custom = Boolean(colors?.length)

  const { failed } = useShaderBackground(hostRef, {
    fragment: MESH_GRADIENT_FRAGMENT,
    colors: ['var(--color-canvas)', ...(custom ? colors! : ['var(--color-accent)'])],
    speed,
    interactive,
    staticTime: 40,
    uniforms: (u, info) => {
      const c = cache.current
      if (c.source !== info.colors) {
        const [base = [0, 0, 0], ...inks] = info.colors
        c.base.set(rgbToOklab(base))
        c.inks = packOklab(custom ? inks : accentFamily(inks[0] ?? base, FAMILY), 4)
        c.light = Math.min(1, Math.max(0, (lightness(base) - 0.5) / 0.3))
        c.source = info.colors
      }
      u.vec3('uBase', c.base)
      u.vec3Array('uColors', c.inks)
      u.float('uIntensity', intensity)
      u.float('uLight', c.light)
      u.float('uGrain', info.reduced ? grain * 0.5 : grain)
      const cssW = info.width / info.dpr
      const cssH = info.height / info.dpr
      u.vec3('uPointer', [info.pointer.x / cssW, 1 - info.pointer.y / cssH, info.pointer.strength])
    },
  })

  return (
    <div
      ref={hostRef}
      aria-hidden
      data-fallback={failed || undefined}
      className={cn('pointer-events-none absolute inset-0 overflow-hidden bg-canvas', className)}
      style={failed ? fallbackBackground(colors ?? ['var(--color-accent)']) : undefined}
    />
  )
}
