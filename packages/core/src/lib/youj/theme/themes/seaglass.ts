import { composeTheme, definePalette } from '../layers'
import { cleanStyle } from '../styles'

/** One deep sea blue, with cream and aqua in the data. Clear and calm. Wada's combination 302: Cream Yellow, Ecru, Nile Blue and Antwarp Blue. */
export const seaglassPalette = definePalette({
  id: 'seaglass',
  name: 'Seaglass',
  description: 'One deep sea blue, with cream and aqua in the data. Clear and calm.',
  neutral: { hue: 215, chroma: 0.004, wash: 0, lift: 0.4 },
  // Antwarp Blue: a sea blue deep enough for text on the gray paper, and in the dark a sea glass that glows.
  accent: { light: 'oklch(0.5 0.093 226)', dark: 'oklch(0.79 0.09 215)' },
  success: { light: 'oklch(0.5 0.1 155)', dark: 'oklch(0.8 0.12 155)' },
  warning: { light: 'oklch(0.53 0.11 70)', dark: 'oklch(0.82 0.12 76)' },
  danger: { light: 'oklch(0.53 0.18 22)', dark: 'oklch(0.71 0.15 22)' },
  // In the chart roles (1 leads, 2 warm, 5 cool): the sea blue, the cream, a deep navy, ecru and Nile aqua; cool and
  // warm series alternate, apart in lightness.
  chart: {
    light: ['oklch(0.5 0.093 226)', 'oklch(0.61 0.12 72)', 'oklch(0.37 0.07 245)', 'oklch(0.49 0.055 75)', 'oklch(0.6 0.096 195)'],
    dark: ['oklch(0.77 0.1 220)', 'oklch(0.86 0.11 78)', 'oklch(0.62 0.1 248)', 'oklch(0.72 0.04 75)', 'oklch(0.87 0.07 192)'],
  },
})

/** The Seaglass preset: the Seaglass palette in the Clean style. */
export const seaglass = composeTheme(seaglassPalette, cleanStyle, {
  id: 'seaglass',
  name: 'Seaglass',
  description: `${seaglassPalette.description} Clean style.`,
})
