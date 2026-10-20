import { composeTheme, definePalette } from '../layers'
import { cleanStyle } from '../styles'

/** One English red, with ivory in the data. Dark first. Wada's combination 190: Ivory Buff, English Red and Black. */
export const cinnabarPalette = definePalette({
  id: 'cinnabar',
  name: 'Cinnabar',
  description: 'One English red, with ivory in the data. Dark first.',
  neutral: { hue: 50, chroma: 0.004, wash: 0, lift: 0.8 },
  // English Red: a vermilion that glows on the charcoal, and on paper a deep red-orange that reads as text.
  accent: { light: 'oklch(0.535 0.17 38)', dark: 'oklch(0.71 0.17 42)' },
  success: { light: 'oklch(0.5 0.1 155)', dark: 'oklch(0.8 0.13 155)' },
  warning: { light: 'oklch(0.53 0.11 82)', dark: 'oklch(0.84 0.13 86)' },
  // Danger leans crimson, away from the vermilion.
  danger: { light: 'oklch(0.52 0.19 10)', dark: 'oklch(0.7 0.17 6)' },
  // In the chart roles (1 leads, 2 warm, 5 cool): vermilion, a deep ember, ivory gold, ash, and the cool slate in
  // Wada's black; stepped apart in lightness so neighbours stay apart for every eye.
  chart: {
    light: ['oklch(0.54 0.17 38)', 'oklch(0.37 0.13 28)', 'oklch(0.61 0.11 82)', 'oklch(0.41 0.022 60)', 'oklch(0.57 0.036 229)'],
    dark: ['oklch(0.73 0.17 42)', 'oklch(0.56 0.16 28)', 'oklch(0.9 0.07 86)', 'oklch(0.61 0.017 60)', 'oklch(0.77 0.042 229)'],
  },
})

/** The Cinnabar preset: the Cinnabar palette in the Clean style. */
export const cinnabar = composeTheme(cinnabarPalette, cleanStyle, {
  id: 'cinnabar',
  name: 'Cinnabar',
  description: `${cinnabarPalette.description} Clean style.`,
})
