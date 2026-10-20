import { composeTheme, definePalette } from '../layers'
import { cleanStyle } from '../styles'

/** One brass, with a slate blue for information. Dusk light. Wada's combination 160: Sulphine Yellow, Pale Raw Umber and Dark Medici Blue. */
export const umberPalette = definePalette({
  id: 'umber',
  name: 'Umber',
  description: 'One brass, with a slate blue for information. Dusk light.',
  neutral: { hue: 72, chroma: 0.004, wash: 0, lift: 0.6 },
  // Sulphine Yellow: on paper a bronze, deep enough for text; in the dark the brass itself.
  accent: { light: 'oklch(0.52 0.1 86)', dark: 'oklch(0.83 0.12 90)' },
  success: { light: 'oklch(0.5 0.09 160)', dark: 'oklch(0.79 0.11 160)' },
  // Warning is the orange the brass isn't.
  warning: { light: 'oklch(0.53 0.12 50)', dark: 'oklch(0.76 0.13 55)' },
  danger: { light: 'oklch(0.52 0.17 25)', dark: 'oklch(0.71 0.15 25)' },
  // Dark Medici Blue: information in the combination's slate.
  info: { light: 'oklch(0.48 0.06 218)', dark: 'oklch(0.79 0.06 215)' },
  // In the chart roles (1 leads, 2 warm, 5 cool): brass, umber, olive, clay and the Medici slate, the dusk's own
  // colours, neighbours apart for every eye.
  chart: {
    light: ['oklch(0.56 0.11 86)', 'oklch(0.4 0.063 62)', 'oklch(0.6 0.09 112)', 'oklch(0.47 0.11 45)', 'oklch(0.47 0.065 215)'],
    dark: ['oklch(0.83 0.12 90)', 'oklch(0.64 0.07 65)', 'oklch(0.8 0.09 115)', 'oklch(0.68 0.12 45)', 'oklch(0.72 0.065 212)'],
  },
})

/** The Umber preset: the Umber palette in the Clean style. */
export const umber = composeTheme(umberPalette, cleanStyle, {
  id: 'umber',
  name: 'Umber',
  description: `${umberPalette.description} Clean style.`,
})
