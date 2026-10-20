import { basalt } from './basalt'
import { brutal } from './brutal'
import { cinnabar, cinnabarPalette } from './cinnabar'
import { graphite } from './graphite'
import { heather, heatherPalette } from './heather'
import { meadow, meadowPalette } from './meadow'
import { sandstone, sandstonePalette } from './sandstone'
import { seaglass, seaglassPalette } from './seaglass'
import { terminal } from './terminal'
import { umber, umberPalette } from './umber'
import { youj, youjPalette } from './youj'

export { basalt, brutal, cinnabar, graphite, heather, meadow, sandstone, seaglass, terminal, umber, youj }
export { cinnabarPalette, heatherPalette, meadowPalette, sandstonePalette, seaglassPalette, umberPalette, youjPalette }

/**
 * The built-in presets, in display order: each a named pair of a palette and a style. Graphite and Basalt are the Youj
 * palette in the Clean style (Graphite, the light default, Basalt the dark one and the contract's baseline, see
 * DEFAULTS); Terminal and Brutal are it in the Terminal and Brutal styles. Meadow, Sandstone, Cinnabar, Umber, Seaglass
 * and Heather are their palettes in Clean, each matching a backdrop (the motion package's Atmosphere scenes and the
 * docs' photographs), drawn from Sanzo Wada's A Dictionary of Color Combinations. Bezel is a style any of them can
 * take. Youj (the Youj palette in Clean, as Basalt) is internal: the docs' previews start in it.
 */
export const themes = [graphite, terminal, brutal, basalt, youj, meadow, sandstone, cinnabar, umber, seaglass, heather] as const

/** The presets that ship: what the public `themes` export lists. */
export const shippedThemes = [graphite, terminal, brutal, basalt, meadow, sandstone, cinnabar, umber, seaglass, heather] as const

/** A shipped preset's id: what the public API accepts. */
export type ThemeId = (typeof shippedThemes)[number]['id']

/** Any preset's id, Youj included. Internal: the docs site and Storybook. */
export type InternalThemeId = (typeof themes)[number]['id']

/**
 * A starting suggestion, not a brand default: the preset `npx @youj/cli init --yes`, Create, MCP and the Figma kit start
 * from, and the docs site's dark mode (its light mode wears Graphite, the same palette and style). Apps pick their own.
 * Basalt: the Youj palette in the Clean style, so it matches what a bare provider draws.
 */
export const DEFAULT_PRESET: ThemeId = 'basalt'

/**
 * The palettes, in display order: Youj (the default) and the six drawn from Sanzo Wada, each matching a backdrop of
 * the same name.
 */
export const palettes = [youjPalette, meadowPalette, sandstonePalette, cinnabarPalette, umberPalette, seaglassPalette, heatherPalette] as const

/** A palette's id. */
export type PaletteId = (typeof palettes)[number]['id']

/** The palette Youj starts in. */
export const DEFAULT_PALETTE: PaletteId = 'youj'

export function isPaletteId(id: unknown): id is PaletteId {
  return palettes.some((p) => p.id === id)
}

/** A palette by id; Youj's for an id that isn't one. */
export function paletteById(id: string | null | undefined): (typeof palettes)[number] {
  return palettes.find((p) => p.id === id) ?? youjPalette
}

declare const process: { env: { NODE_ENV?: string } }
const warnedPresets = new Set<string>()

/** Dev only, once per id: a named preset that doesn't exist falls back to Graphite, which is rarely what a typo wanted. Empty ids are "none picked", not mistakes. */
function warnUnknownPreset(id: string | null | undefined, known: readonly { id: string }[]) {
  if (!id || process.env.NODE_ENV === 'production' || warnedPresets.has(id)) return
  warnedPresets.add(id)
  console.warn(`[youj] Unknown theme preset "${id}". Using Graphite. Presets: ${known.map((t) => t.id).join(', ')}.`)
}

/** A shipped preset by id; Graphite (with a development warning) for an id that isn't one, Youj included. No id is Graphite quietly. */
export function presetById(id: string | null | undefined): (typeof shippedThemes)[number] {
  const found = shippedThemes.find((t) => t.id === id)
  if (!found) warnUnknownPreset(id, shippedThemes)
  return found ?? graphite
}

/** Any preset by id, Youj included; Graphite (with a development warning) for an id that isn't one. Internal. */
export function internalPresetById(id: string | null | undefined): (typeof themes)[number] {
  const found = themes.find((t) => t.id === id)
  if (!found) warnUnknownPreset(id, themes)
  return found ?? graphite
}
