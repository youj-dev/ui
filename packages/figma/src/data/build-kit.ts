import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { DEFAULT_LOOK, looks } from '@youj/core/lib/youj/look'
// The presets that ship, as the public `themes` lists them: ten, which a Professional file holds as modes of one collection.
import { basalt, DEFAULT_PRESET, derivePalette, graphite, resolveTheme, shippedThemes as themes, type ThemeInput } from '@youj/core/lib/youj/theme'
import { oklchToLinear } from '@youj/core/lib/youj/theme/color'
import * as logo from '@youj/core/docs/brand/logo'
import { LAND } from '@youj/react/components/ui/dot-map.land'
import type { Kit, KitIllustrations, KitLogo, KitBlock, KitStyle, KitTheme, Mode } from '../kit'
import { kitColors, kitEffects, linearToRgba } from './colors'
import { kitIcons } from './icons'
import { kitMotion } from './motion'
import { scaleNumbers, textStyles, themeFonts, themeNumbers } from './scales'

/* The data step: everything the plugin draws, read from the code. Run by
 * scripts/build.ts (through Vite, so the TSX icons load) and by the tests. */

export const BLOCKS_DIR = new URL('../../assets/blocks/', import.meta.url)

export interface BlockEntry {
  id: string
  title: string
  kind: KitBlock['kind']
  story: string
  file: string
}

/** The shipped presets, the default (Basalt) first: it's the first mode of the Theme collection and the first of the Theme menu. Colour data is keyed by theme id, so only this list is reordered. */
function kitThemes(): KitTheme[] {
  return [...themes].sort((a, b) => Number(b.id === DEFAULT_PRESET) - Number(a.id === DEFAULT_PRESET)).map((t) => {
    const r = resolveTheme(t)
    return { id: t.id, name: t.name, description: t.description ?? '', motion: r.motionPersonality, radius: r.radius, density: r.controlSize, fonts: r.fonts }
  })
}

function kitLogo(): KitLogo {
  // The tittle's one colour per mode, from the presets the site's frame wears: Basalt in dark, Graphite's blue in light.
  const tittle = (theme: ThemeInput, mode: Mode) => linearToRgba(oklchToLinear(derivePalette(theme, mode).accent))
  return {
    grid: { ...logo.GRID },
    box: { ...logo.LOCKUP },
    letters: logo.logoLetters.map((l) => ({ ...l })),
    tittle: { ...logo.tittle.display },
    tittleColor: { dark: tittle(basalt, 'dark'), light: tittle(graphite, 'light') },
  }
}

/** Image size from PNG or JPEG bytes. */
export function imageSize(bytes: Uint8Array): { width: number; height: number } {
  if (bytes[0] === 0x89 && bytes[1] === 0x50) {
    const view = new DataView(bytes.buffer, bytes.byteOffset)
    return { width: view.getUint32(16), height: view.getUint32(20) }
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    let i = 2
    while (i < bytes.length) {
      const marker = bytes[i + 1]!
      const len = (bytes[i + 2]! << 8) | bytes[i + 3]!
      // SOF0–SOF15, except DHT (C4), JPG (C8) and DAC (CC), carry the frame size.
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { height: (bytes[i + 5]! << 8) | bytes[i + 6]!, width: (bytes[i + 7]! << 8) | bytes[i + 8]! }
      }
      i += 2 + len
    }
  }
  throw new Error('blocks: not a PNG or JPEG')
}

/** The reference screenshots scripts/blocks.ts captured, if any. */
export function kitBlocks(dir: URL = BLOCKS_DIR): KitBlock[] {
  const manifest = new URL('blocks.json', dir)
  if (!existsSync(manifest)) return []
  const entries = JSON.parse(readFileSync(manifest, 'utf8')) as BlockEntry[]
  return entries.map((e) => {
    const bytes = readFileSync(new URL(e.file, dir))
    return { id: e.id, title: e.title, kind: e.kind, story: e.story, ...imageSize(bytes), data: bytes.toString('base64') }
  })
}

export const ILLUSTRATIONS_DIR = new URL('../../assets/illustrations/', import.meta.url)

/** The illustration scenes scripts/illustrations.ts captured, if any: grouped by the registry's categories, in its order. */
export function kitIllustrations(dir: URL = ILLUSTRATIONS_DIR): KitIllustrations {
  const manifest = new URL('illustrations.json', dir)
  if (!existsSync(manifest)) return { preset: '', categories: [], scenes: [] }
  const m = JSON.parse(readFileSync(manifest, 'utf8')) as { preset: string; modes: Mode[]; categories: KitIllustrations['categories']; scenes: { id: string; name: string; category: string }[] }
  const scenes = m.scenes.map((s) => ({ ...s, svg: Object.fromEntries(m.modes.map((mode) => [mode, readFileSync(new URL(`${mode}/${s.id}.svg`, dir), 'utf8')])) as Record<Mode, string> }))
  return { preset: m.preset, categories: m.categories, scenes }
}

/** The kit's default look, which a new file is built in: Classic on Basalt (the Clean style), dark (the site's default). */
export const DEFAULTS: Kit['defaults'] = { style: DEFAULT_LOOK, theme: DEFAULT_PRESET, mode: 'dark' }

function kitStyles(): KitStyle[] {
  // The default leads: the Style menu lists it first.
  return [...looks].sort((a, b) => Number(b.id === DEFAULTS.style) - Number(a.id === DEFAULTS.style)).map((s) => ({ id: s.id, name: s.name, description: s.description }))
}

export function buildKit(): Kit {
  const { icons, categories, strokeWidth } = kitIcons()
  const body: Omit<Kit, 'hash'> = {
    themes: kitThemes(),
    styles: kitStyles(),
    defaults: DEFAULTS,
    colors: kitColors(themes),
    theme: themeNumbers(themes),
    fonts: themeFonts(themes),
    scale: scaleNumbers(strokeWidth),
    text: textStyles(),
    effects: kitEffects(themes),
    motion: kitMotion(themes),
    icons,
    categories,
    logo: kitLogo(),
    blocks: kitBlocks(),
    illustrations: kitIllustrations(),
    dotMap: { step: LAND.step, north: LAND.north, rows: [...LAND.rows] },
  }
  const hash = createHash('sha256').update(JSON.stringify(body)).digest('hex').slice(0, 8)
  return { hash, ...body }
}
