import { composeTheme, definePalette } from '../layers'
import { cleanStyle } from '../styles'

/** One heather plum, with old rose and sage in the data. Wada's combination 162: Old Rose, Rainette Green and Lilac. */
export const heatherPalette = definePalette({
  id: 'heather',
  name: 'Heather',
  description: 'One heather plum, with old rose and sage in the data.',
  neutral: { hue: 340, chroma: 0.004, wash: 0, lift: 0.4 },
  // Lilac, deepened to a plum that reads as text on paper and lifted to the flower itself in the dark.
  accent: { light: 'oklch(0.49 0.12 335)', dark: 'oklch(0.78 0.1 335)' },
  // Rainette Green for success; Old Rose, deepened, for danger.
  success: { light: 'oklch(0.5 0.08 140)', dark: 'oklch(0.8 0.1 140)' },
  warning: { light: 'oklch(0.53 0.11 66)', dark: 'oklch(0.8 0.12 72)' },
  danger: { light: 'oklch(0.52 0.16 15)', dark: 'oklch(0.72 0.14 15)' },
  // In the chart roles (1 leads, 2 warm, 5 cool): plum, Old Rose, Rainette sage, a pale lilac and a heather violet,
  // the moor's colours, neighbours apart for every eye.
  chart: {
    light: ['oklch(0.48 0.12 335)', 'oklch(0.63 0.143 12)', 'oklch(0.46 0.083 130)', 'oklch(0.62 0.075 330)', 'oklch(0.41 0.1 295)'],
    dark: ['oklch(0.8 0.1 335)', 'oklch(0.64 0.12 12)', 'oklch(0.79 0.08 130)', 'oklch(0.9 0.055 330)', 'oklch(0.62 0.12 295)'],
  },
})

/** The Heather preset: the Heather palette in the Clean style. */
export const heather = composeTheme(heatherPalette, cleanStyle, {
  id: 'heather',
  name: 'Heather',
  description: `${heatherPalette.description} Clean style.`,
})
