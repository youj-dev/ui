import { composeTheme, definePalette } from '../layers'
import { cleanStyle } from '../styles'

/**
 * Youj's own colours, the default: near-black panels with one amber signal and neon charts in dark, cool grays with
 * one electric ultramarine in light. Each colour is tuned for its mode: the dark side is what Basalt wore, the light
 * side Graphite's.
 */
export const youjPalette = definePalette({
  id: 'youj',
  name: 'Youj',
  description: 'Near-black panels, one amber signal and neon charts in dark; cool grays and one electric ultramarine in light.',
  neutral: { hue: 285, chroma: 0.008, wash: 0, lift: 1 },
  accent: { light: 'oklch(0.54 0.25 268)', dark: 'oklch(0.8 0.165 73)' },
  success: { light: 'oklch(0.504 0.114 158)', dark: 'oklch(0.85 0.165 160)' },
  warning: { light: 'oklch(0.527 0.124 58)', dark: 'oklch(0.74 0.17 50)' },
  danger: { light: 'oklch(0.542 0.197 25)', dark: 'oklch(0.665 0.175 18)' },
  // Light: calm data around the ultramarine (blue, rose, violet, amber, teal). Dark: the boards' neon (lime, hot pink,
  // violet, amber, cyan).
  chart: {
    light: ['oklch(0.54 0.22 266)', 'oklch(0.62 0.19 12)', 'oklch(0.46 0.19 302)', 'oklch(0.62 0.135 68)', 'oklch(0.58 0.095 200)'],
    dark: ['oklch(0.9 0.2 129)', 'oklch(0.67 0.21 354)', 'oklch(0.61 0.22 293)', 'oklch(0.8 0.165 73)', 'oklch(0.8 0.13 210)'],
  },
})

/** The Youj preset: the Youj palette in the Clean style, what the docs' previews wear until one is picked. Internal: the public default is Basalt, the same pair. */
export const youj = composeTheme(youjPalette, cleanStyle, {
  id: 'youj',
  name: 'Youj',
  description: `${youjPalette.description} Clean style.`,
})
