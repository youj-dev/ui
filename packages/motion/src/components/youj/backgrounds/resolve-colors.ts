/* Token colors read from computed CSS and re-read when the theme changes, plus the static CSS stand-in
 * for when WebGL2 is unavailable. */

import type { CSSProperties } from 'react'
import { observeThemeChange } from '@youj/core/lib/youj/theme/observe'
import { parseColor, type Rgb } from './color'

/** Resolves CSS colors (tokens like `var(--color-accent)`, or any CSS color) to sRGB,
 *  in the cascade context of `host` so scoped themes apply. */
export function resolveColors(host: Element, inputs: readonly string[]): Rgb[] {
  const probe = document.createElement('span')
  probe.style.display = 'none'
  host.appendChild(probe)
  const out = inputs.map((input): Rgb => {
    probe.style.color = ''
    probe.style.color = input
    const computed = getComputedStyle(probe).color
    return parseColor(computed) ?? viaCanvas(computed) ?? [0.5, 0.5, 0.5]
  })
  probe.remove()
  return out
}

// Last resort for serialisations parseColor doesn't know (e.g. lab(), display-p3):
// let a 1x1 2D canvas convert it to sRGB bytes.
function viaCanvas(color: string): Rgb | null {
  if (!color) return null
  const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
  if (!ctx) return null
  ctx.fillStyle = color
  ctx.fillRect(0, 0, 1, 1)
  const [r = 0, g = 0, b = 0] = ctx.getImageData(0, 0, 1, 1).data
  return [r / 255, g / 255, b / 255]
}

/**
 * Calls `onChange` when the theme that applies to `host` may have changed: a
 * light/dark flip, a preset (data-yj-theme) or a new contract on <html> or on
 * any theme scope above `host` (YoujProvider, ThemeScope, themeProps).
 */
export function observeTheme(onChange: () => void, host: Element | null = null): () => void {
  return observeThemeChange(host, onChange)
}

/** Static CSS stand-in for when WebGL2 is unavailable: soft washes of the same colors over the canvas token. */
export function fallbackBackground(colors: readonly string[]): CSSProperties {
  const spots = ['18% 22%', '82% 18%', '70% 85%', '25% 80%']
  return {
    backgroundColor: 'var(--color-canvas)',
    backgroundImage: colors
      .slice(0, spots.length)
      .map((c, i) => `radial-gradient(60% 60% at ${spots[i]}, color-mix(in oklab, ${c} 28%, transparent), transparent 70%)`)
      .join(', '),
  }
}
