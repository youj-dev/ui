import { basalt, defineTheme } from '@youj/core/lib/youj/theme'

/* The Graphite colors the site's light chrome wears, kept here as they were tuned (the Graphite palette left the
 * library when palettes were trimmed to Youj and the six Wada ones), so the site looks as it did. */
const GRAPHITE = {
  neutral: { hue: 270, chroma: 0.012, wash: 0 },
  accent: 'oklch(0.54 0.25 268)',
  success: 'oklch(0.504 0.114 158)',
  warning: 'oklch(0.527 0.124 58)',
  danger: 'oklch(0.542 0.197 25)',
  chart: {
    light: ['oklch(0.54 0.22 266)', 'oklch(0.62 0.19 12)', 'oklch(0.46 0.19 302)', 'oklch(0.62 0.135 68)', 'oklch(0.58 0.095 200)'],
    dark: ['oklch(0.68 0.16 266)', 'oklch(0.74 0.16 12)', 'oklch(0.6 0.18 302)', 'oklch(0.83 0.14 78)', 'oklch(0.78 0.12 195)'],
  },
} as const

/**
 * The site's light theme: Basalt's character (the Clean style: Inter and
 * JetBrains Mono, sentence-case labels, radius, density, flat cards, heading
 * weight) in Graphite's colors (its ultramarine, cool neutral, status inks
 * and chart palette), on a white page: the chrome is white and its code and
 * stages take the soft gray the presets give their own pages (`page:
 * 'white'` swaps the two).
 */
export const SITE_LIGHT = defineTheme({
  ...basalt,
  id: 'site-light',
  name: 'Site light',
  description: 'Basalt’s character in Graphite’s colors: the docs site’s own light theme.',
  neutral: { ...basalt.neutral, ...GRAPHITE.neutral, page: 'white' },
  // Graphite's indigo is the accent (status, links, the illustrations); the primary actions are ink, as in dark.
  accent: GRAPHITE.accent,
  actions: 'ink',
  // Graphite's light inks as single colours, so the stylesheet holds them to AA on whatever neutral a stage gives them
  // (the cream stage's included), as it did when Graphite's were the kit's defaults. This theme is only ever light.
  success: GRAPHITE.success,
  warning: GRAPHITE.warning,
  danger: GRAPHITE.danger,
  chart: GRAPHITE.chart,
})
