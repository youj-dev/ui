import { useRef } from 'react'
import { cn } from '@youj/core/lib/youj/cn'
import { packOklab } from './color'
import { fallbackBackground, useShaderBackground } from './gl'
import { DOT_MATRIX_FRAGMENT, MAX_RIPPLES } from './dot-matrix-wave.glsl'

export interface DotMatrixWaveProps {
  /** [dots, excited] CSS colors. Default: `--color-fg` dots that heat to `--color-accent`. */
  colors?: [dots: string, excited: string]
  /** Dot contrast, 0–1.5. Default 1. */
  intensity?: number
  /** Clock multiplier for the idle swell and ripple travel. Default 1. */
  speed?: number
  /** Grid pitch in CSS px. Default 22. */
  spacing?: number
  /** Pointer raises a lens of dots and leaves a wake; clicks send a ripple. Default true. */
  interactive?: boolean
  /** A pulse every few seconds while nobody is interacting, each from the next point of a fixed, evenly spread sequence across the middle of the field. Default true. */
  ambient?: boolean
  className?: string
}

/** Ripple travel in CSS px per clock second. */
const RIPPLE_SPEED = 380
/** Pointer travel (CSS px) between wake ripples. */
const WAKE_STEP = 120
/** Clock seconds of quiet before an ambient pulse. */
const AMBIENT_GAP = 3.4

interface Ripple {
  x: number
  y: number
  start: number
  amp: number
}

/**
 * A precise lattice of dots whose size and brightness ripple out from the pointer
 * and from clicks. Every dot is one analytically anti-aliased disc on a
 * device-pixel grid, evaluated at its center, so the matrix stays crisp at any DPR.
 */
export function DotMatrixWave({
  colors,
  intensity = 1,
  speed = 1,
  spacing = 22,
  interactive = true,
  ambient = true,
  className,
}: DotMatrixWaveProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [dots = 'var(--color-fg)', excited = 'var(--color-accent)'] = colors ?? []
  const state = useRef({
    ripples: [] as Ripple[],
    wake: { x: 0, y: 0, armed: false },
    lastPulse: 0,
    seed: 0,
    buffer: new Float32Array(MAX_RIPPLES * 4),
  })

  const { failed } = useShaderBackground(hostRef, {
    fragment: DOT_MATRIX_FRAGMENT,
    colors: ['var(--color-canvas)', dots, excited],
    speed,
    interactive,
    staticTime: 0.75,
    uniforms: (u, info) => {
      const s = state.current
      const cssW = info.width / info.dpr
      const cssH = info.height / info.dpr
      const add = (x: number, y: number, amp: number) => {
        s.ripples.push({ x, y, start: info.time, amp })
        if (s.ripples.length > MAX_RIPPLES) s.ripples.shift()
        s.lastPulse = info.time
      }

      if (info.reduced) {
        // One ring frozen mid-flight: the still frame still says "this matrix ripples".
        s.ripples = [{ x: cssW * 0.5, y: cssH * 0.45, start: 0, amp: 0.9 }]
      } else {
        if (s.ripples.length && s.ripples[0]!.start > info.time) s.ripples = []
        for (const press of info.pointer.presses) add(press.x, press.y, 1)

        const p = info.pointer
        if (p.strength > 0.5) {
          if (!s.wake.armed || Math.hypot(p.x - s.wake.x, p.y - s.wake.y) > WAKE_STEP) {
            if (s.wake.armed) add(p.x, p.y, 0.32)
            s.wake = { x: p.x, y: p.y, armed: true }
          }
        } else {
          s.wake.armed = false
        }

        if (ambient && p.strength < 0.1 && info.time - s.lastPulse > AMBIENT_GAP) {
          s.seed++
          add(cssW * (0.2 + 0.6 * fract(s.seed * 0.618)), cssH * (0.2 + 0.6 * fract(s.seed * 0.414 + 0.3)), 0.55)
        }
      }

      s.buffer.fill(0)
      s.ripples.forEach((r, i) => s.buffer.set([r.x * info.dpr, info.height - r.y * info.dpr, r.start, r.amp], i * 4))

      const lab = packOklab(info.colors)
      u.vec3('uBase', lab.subarray(0, 3))
      u.vec3('uDot', lab.subarray(3, 6))
      u.vec3('uAccent', lab.subarray(6, 9))
      u.float('uIntensity', intensity)
      u.float('uSpacing', Math.max(4, Math.round(spacing * info.dpr)))
      u.float('uRippleSpeed', RIPPLE_SPEED * info.dpr)
      u.vec3('uPointer', [info.pointer.x * info.dpr, info.height - info.pointer.y * info.dpr, info.reduced ? 0 : info.pointer.strength])
      u.vec4Array('uRipples', s.buffer)
    },
  })

  return (
    <div
      ref={hostRef}
      aria-hidden
      data-fallback={failed || undefined}
      className={cn('pointer-events-none absolute inset-0 overflow-hidden bg-canvas', className)}
      style={
        failed
          ? {
              ...fallbackBackground([excited]),
              backgroundImage: `radial-gradient(color-mix(in oklab, ${dots} 22%, transparent) 1.5px, transparent 1.5px)`,
              backgroundSize: `${spacing}px ${spacing}px`,
            }
          : undefined
      }
    />
  )
}

const fract = (x: number) => x - Math.floor(x)
