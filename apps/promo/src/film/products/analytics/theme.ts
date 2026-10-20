import { defineTheme } from '@youj/core'

/** The Ledger's own look: the FT's salmon paper, an oxford-blue ink, teal and claret for good and bad news, set in a book face. */
export const ledgerTheme = defineTheme({
  id: 'ledger',
  name: 'Ledger',
  description: 'Salmon paper, an oxford-blue ink, teal and claret for good and bad news, in a book face.',
  neutral: { hue: 55, chroma: 0.022, wash: 1 },
  accent: 'oklch(0.45 0.13 255)', // youj-allow: theme input colour
  success: 'oklch(0.52 0.09 195)', // youj-allow: theme input colour
  warning: 'oklch(0.66 0.13 70)', // youj-allow: theme input colour
  danger: 'oklch(0.5 0.17 8)', // youj-allow: theme input colour
  radius: 'sm',
  controlSize: 'default',
  fonts: {
    sans: "Charter, 'Bitstream Charter', 'Sitka Text', Cambria, Georgia, serif",
    mono: "'JetBrains Mono Variable', ui-monospace, monospace",
  },
  motionPersonality: 'calm',
})
