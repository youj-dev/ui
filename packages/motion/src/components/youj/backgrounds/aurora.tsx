import { useRef } from 'react'
import { cn } from '@youj/core/lib/youj/cn'
import { accentFamily, lightness, packOklab, rgbToOklab, type Rgb } from './color'
import { fallbackBackground, useShaderBackground } from './gl'
import { AURORA_FRAGMENT } from './aurora.glsl'

export interface AuroraProps {
  /** Three CSS colors, back layer to front. Default: an analogous family around the accent token. */
  colors?: [string, string, string]
  /** Brightness of the ribbons, 0–1.5. Default 1. */
  intensity?: number
  /** Drift speed multiplier. Default 1. */
  speed?: number
  /** Height of the lowest curtain edge, 0 (bottom) to 1 (top). Default 0.58. */
  horizon?: number
  /** Ribbons lean gently with the pointer. Default true. */
  interactive?: boolean
  className?: string
}

// [hue°, ΔL, chroma×] around the accent: a cool teal-leaning back layer, the accent, a violet front.
const FAMILY = [
  [-55, 0.06, 0.9],
  [38, -0.02, 0.95],
] as const satisfies readonly [number, number, number][]

/**
 * Layered curtains of light for a hero backdrop. Each layer has a bright lower
 * edge, rays that hang upward, and pulses traveling along it. It adds light on
 * dark canvases and tints on light ones.
 */
export function Aurora({ colors, intensity = 1, speed = 1, horizon = 0.58, interactive = true, className }: AuroraProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const cache = useRef<{ source: readonly Rgb[] | null; base: Float32Array; inks: Float32Array; light: number }>({
    source: null,
    base: new Float32Array(3),
    inks: new Float32Array(9),
    light: 0,
  })
  const custom = Boolean(colors?.length)

  const { failed } = useShaderBackground(hostRef, {
    fragment: AURORA_FRAGMENT,
    colors: ['var(--color-canvas)', ...(custom ? colors! : ['var(--color-accent)'])],
    speed,
    interactive,
    staticTime: 30,
    uniforms: (u, info) => {
      const c = cache.current
      if (c.source !== info.colors) {
        const [base = [0, 0, 0], ...inks] = info.colors
        const family = custom ? inks : accentFamily(inks[0] ?? base, FAMILY)
        // Back to front: teal, accent, violet.
        c.inks = packOklab(custom ? family : [family[1]!, family[0]!, family[2]!], 3)
        c.base.set(rgbToOklab(base))
        c.light = Math.min(1, Math.max(0, (lightness(base) - 0.5) / 0.3))
        c.source = info.colors
      }
      u.vec3('uBase', c.base)
      u.vec3Array('uColors', c.inks)
      u.float('uLight', c.light)
      u.float('uIntensity', intensity)
      u.float('uHorizon', horizon)
      u.vec3('uPointer', [info.pointer.x / (info.width / info.dpr), 0, info.pointer.strength])
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
