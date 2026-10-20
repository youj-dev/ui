import { composeTheme, definePalette } from '../layers'
import { cleanStyle } from '../styles'

/** One raw sienna, with a night blue for information. Warm and exact. Wada's combination 279: Raw Sienna, Vinaceous Cinnamon, Ecru and Dark Tyrian Blue. */
export const sandstonePalette = definePalette({
  id: 'sandstone',
  name: 'Sandstone',
  description: 'One raw sienna, with a night blue for information. Warm and exact.',
  neutral: { hue: 65, chroma: 0.004, wash: 0, lift: 0.5 },
  // Raw Sienna: a burnt orange deep enough for text on the sand, and in the dark a caramel that glows.
  accent: { light: 'oklch(0.52 0.12 55)', dark: 'oklch(0.77 0.12 62)' },
  success: { light: 'oklch(0.5 0.09 150)', dark: 'oklch(0.79 0.1 150)' },
  // Gold, a step from the sienna, so a warning is never mistaken for the accent.
  warning: { light: 'oklch(0.52 0.1 88)', dark: 'oklch(0.83 0.12 90)' },
  danger: { light: 'oklch(0.52 0.17 25)', dark: 'oklch(0.72 0.14 25)' },
  // Dark Tyrian Blue: information speaks in the combination's night blue.
  info: { light: 'oklch(0.46 0.08 243)', dark: 'oklch(0.79 0.06 240)' },
  // In the chart roles (1 leads, 2 warm, 5 cool): sienna, a deep rust, cinnamon, ecru and the night blue, three
  // warm steps apart in lightness, neighbours apart for every eye.
  chart: {
    light: ['oklch(0.56 0.12 55)', 'oklch(0.39 0.11 36)', 'oklch(0.62 0.1 38)', 'oklch(0.46 0.05 78)', 'oklch(0.34 0.072 243)'],
    dark: ['oklch(0.77 0.12 62)', 'oklch(0.6 0.13 36)', 'oklch(0.77 0.088 42)', 'oklch(0.93 0.04 78)', 'oklch(0.66 0.08 240)'],
  },
})

/** The Sandstone preset: the Sandstone palette in the Clean style. */
export const sandstone = composeTheme(sandstonePalette, cleanStyle, {
  id: 'sandstone',
  name: 'Sandstone',
  description: `${sandstonePalette.description} Clean style.`,
})
