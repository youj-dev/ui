import type { CSSProperties } from 'react'
import { motionPersonalities, type MotionTokens } from '@youj/core'
import { derivePalette, formatOklch, PALETTE_TOKENS, internalPresetById, RADIUS, CONTROL_SIZE, type Palette } from '@youj/core/lib/youj/theme'
import { mixOklab } from '@youj/core/lib/youj/theme/color'
import type { PresetId } from './beats'

/* A theme as numbers, so the film can move between two of them smoothly:
 * the palette from the library's own derivation (derivePalette, the JS
 * mirror of youj.css, kept in step by its tests), mixed in OKLab; the
 * motion personality's tokens; the corner radius and the density. Nothing
 * here is invented: every value is read off a preset. */

export type Scheme = 'dark' | 'light'

export interface Tuning {
  palette: Palette
  motion: MotionTokens
  /** --yj-radius in px. */
  radius: number
  /** --yj-density: −1, 0 or 1 (control heights move 4px a step). */
  density: number
}

const REM = 16

export function tuningOf(id: PresetId, scheme: Scheme): Tuning {
  const theme = internalPresetById(id)
  return {
    palette: derivePalette(theme, scheme),
    motion: motionPersonalities[theme.motionPersonality ?? 'precise'],
    radius: parseFloat(RADIUS[theme.radius ?? 'md']) * REM,
    density: CONTROL_SIZE[theme.controlSize ?? 'default'],
  }
}

const mix = (a: number, b: number, t: number) => a + (b - a) * t

function mixMotion(a: MotionTokens, b: MotionTokens, t: number): MotionTokens {
  const each = <K extends string, V>(x: Record<K, V>, y: Record<K, V>, f: (u: V, v: V) => V) =>
    Object.fromEntries(Object.keys(x).map((k) => [k, f(x[k as K], y[k as K])])) as Record<K, V>
  return {
    durations: each(a.durations, b.durations, (u, v) => mix(u, v, t)),
    staggers: each(a.staggers, b.staggers, (u, v) => mix(u, v, t)),
    easings: each(a.easings, b.easings, (u, v) => u.map((n, i) => mix(n, v[i]!, t)) as unknown as typeof u),
    springs: each(a.springs, b.springs, (u, v) => ({ visualDuration: mix(u.visualDuration, v.visualDuration, t), bounce: mix(u.bounce, v.bounce, t) })),
  }
}

/** `t` of the way from `a` to `b`: colours in OKLab, numbers linearly. */
export function mixTuning(a: Tuning, b: Tuning, t: number): Tuning {
  if (t <= 0) return a
  if (t >= 1) return b
  const palette = Object.fromEntries(PALETTE_TOKENS.map((k) => [k, mixOklab(b.palette[k], a.palette[k], t)])) as Palette
  return { palette, motion: mixMotion(a.motion, b.motion, t), radius: mix(a.radius, b.radius, t), density: mix(a.density, b.density, t) }
}

/** The palette as the `--color-*` tokens every youj surface paints with, for a subtree's style. */
export function paletteVars(palette: Palette): CSSProperties {
  const vars: Record<string, string> = {}
  for (const token of PALETTE_TOKENS) if (token !== 'input') vars[`--color-${token}`] = formatOklch(palette[token])
  return vars as CSSProperties
}
