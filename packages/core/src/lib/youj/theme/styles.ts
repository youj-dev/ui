import { defineStyle } from './layers'

/* The five styles: form only, any palette pairs with any of them. Each names
 * the look (bezel or classic) it's built in. The font stacks are the font
 * catalog's, so the docs, Storybook and Create load them where a style is
 * shown. */

const INTER = "'Inter Variable', ui-sans-serif, system-ui, sans-serif"
const JETBRAINS_MONO = "'JetBrains Mono Variable', ui-monospace, monospace"

/** Rounded rectangles, Inter, quiet hairlines, soft depth and sentence-case labels. The Classic look, and the default. */
export const cleanStyle = defineStyle({
  id: 'clean',
  name: 'Clean',
  description: 'Rounded rectangles in Inter, quiet hairlines, soft depth and sentence-case labels.',
  look: 'classic',
  radius: 'xl',
  controlSize: 'default',
  fonts: { sans: INTER, mono: JETBRAINS_MONO },
  motionPersonality: 'precise',
  stroke: { width: 1, ink: 0, icons: 1 },
  shadow: 'soft',
  actions: 'accent',
  controls: 'rounded',
  fields: 'outlined',
  surfaces: { gradient: 0 },
  headings: { weight: 600, tracking: -0.025 },
  labels: { case: 'none', font: 'sans' },
})

/** Instrument panels: Geist, pill actions, cards that shade toward their foot and labels in mono capitals. The Bezel look. */
export const bezelStyle = defineStyle({
  id: 'bezel',
  name: 'Bezel',
  description: 'Instrument panels in Geist: pill actions, cards that shade toward their foot and labels in mono capitals.',
  look: 'bezel',
  radius: 'lg',
  controlSize: 'comfortable',
  fonts: { sans: "'Geist', ui-sans-serif, system-ui, sans-serif", mono: "'Geist Mono', ui-monospace, monospace" },
  motionPersonality: 'precise',
  stroke: { width: 1, ink: 0, icons: 1 },
  shadow: 'soft',
  actions: 'accent',
  controls: 'pill',
  fields: 'outlined',
  surfaces: { gradient: 0.6 },
  headings: { weight: 500, tracking: -0.02 },
  labels: { case: 'upper', font: 'mono', tracking: 0.12 },
})

/** IBM Plex, small corners, outlined fields and a light shade on cards. The Classic look. */
export const classicStyle = defineStyle({
  id: 'classic',
  name: 'Classic',
  description: 'IBM Plex with small corners, outlined fields and a light shade on cards.',
  look: 'classic',
  radius: 'sm',
  controlSize: 'default',
  fonts: { sans: "'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif", mono: "'IBM Plex Mono', ui-monospace, monospace" },
  motionPersonality: 'precise',
  stroke: { width: 1, ink: 0, icons: 1 },
  shadow: 'soft',
  actions: 'accent',
  controls: 'rounded',
  fields: 'outlined',
  surfaces: { gradient: 0.3 },
  headings: { weight: 600, tracking: -0.01 },
  labels: { case: 'none', font: 'sans' },
})

/** Ink outlines, hard offset shadows, square corners, heavy titles and mono capitals. The Classic look. */
export const brutalStyle = defineStyle({
  id: 'brutal',
  name: 'Brutal',
  description: 'Ink outlines, hard offset shadows, square corners, heavy titles and mono capitals.',
  look: 'classic',
  radius: 'none',
  controlSize: 'default',
  fonts: { sans: INTER, mono: JETBRAINS_MONO },
  motionPersonality: 'precise',
  stroke: { width: 2, ink: 1, icons: 1.3 },
  shadow: 'hard',
  actions: 'accent',
  controls: 'pill',
  fields: 'outlined',
  surfaces: { gradient: 0 },
  headings: { weight: 800, tracking: -0.035 },
  labels: { case: 'upper', font: 'mono', tracking: 0.02 },
})

/** Monospace throughout, square corners, tight rows and no shadows. The Bezel look. */
export const terminalStyle = defineStyle({
  id: 'terminal',
  name: 'Terminal',
  description: 'Monospace throughout, square corners, tight rows and flat panels.',
  look: 'bezel',
  radius: 'none',
  controlSize: 'compact',
  fonts: { sans: JETBRAINS_MONO, mono: JETBRAINS_MONO },
  motionPersonality: 'precise',
  stroke: { width: 1, ink: 0, icons: 1 },
  shadow: 'none',
  actions: 'accent',
  controls: 'pill',
  fields: 'outlined',
  surfaces: { gradient: 0 },
  headings: { weight: 600, tracking: -0.01 },
  labels: { case: 'none', font: 'mono' },
})

/** Every style, in display order. */
export const styles = [cleanStyle, bezelStyle, classicStyle, brutalStyle, terminalStyle] as const

export type StyleId = (typeof styles)[number]['id']

/** The style Youj starts in: Clean. */
export const DEFAULT_STYLE: StyleId = 'clean'

export function isStyleId(id: unknown): id is StyleId {
  return styles.some((s) => s.id === id)
}

/** A style by id; Clean for an id that isn't one. */
export function styleById(id: string | null | undefined): (typeof styles)[number] {
  return styles.find((s) => s.id === id) ?? cleanStyle
}
