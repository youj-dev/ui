import { composeTheme, definePalette } from '../layers'
import { cleanStyle } from '../styles'

/** One grass green, with sky and gold in the data. Fresh and open. Wada's combination 294: Sulpher Yellow, Cream Yellow, Cossack Green and Salvia Blue. */
export const meadowPalette = definePalette({
  id: 'meadow',
  name: 'Meadow',
  description: 'One grass green, with sky and gold in the data. Fresh and open.',
  neutral: { hue: 100, chroma: 0.004, wash: 0, lift: 0.4 },
  // Cossack Green, tuned per mode: deep enough for text on the straw paper, and lifted to a spring green in the dark.
  accent: { light: 'oklch(0.5 0.11 148)', dark: 'oklch(0.79 0.13 150)' },
  // Success leans teal, so it never reads as the accent.
  success: { light: 'oklch(0.5 0.085 185)', dark: 'oklch(0.79 0.1 185)' },
  warning: { light: 'oklch(0.52 0.11 68)', dark: 'oklch(0.8 0.13 75)' },
  danger: { light: 'oklch(0.53 0.17 25)', dark: 'oklch(0.72 0.15 25)' },
  // The combination's hues in the chart roles (1 leads, 2 warm, 5 cool): grass, the cream's gold, a deep pine,
  // Salvia sky and a dusk blue, neighbours apart for every eye.
  chart: {
    light: ['oklch(0.46 0.099 148)', 'oklch(0.62 0.12 72)', 'oklch(0.4 0.06 168)', 'oklch(0.58 0.09 252)', 'oklch(0.41 0.08 258)'],
    dark: ['oklch(0.81 0.13 150)', 'oklch(0.72 0.143 76)', 'oklch(0.65 0.08 170)', 'oklch(0.79 0.08 252)', 'oklch(0.62 0.1 260)'],
  },
})

/** The Meadow preset: the Meadow palette in the Clean style. */
export const meadow = composeTheme(meadowPalette, cleanStyle, {
  id: 'meadow',
  name: 'Meadow',
  description: `${meadowPalette.description} Clean style.`,
})
