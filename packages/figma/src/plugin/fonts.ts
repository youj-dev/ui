import type { KitTheme } from '../kit'

/* Fonts. The kit sets type in the default theme's families (Basalt: Inter
 * and JetBrains Mono, which the code ships as @fontsource-variable's
 * 'Inter Variable' and 'JetBrains Mono Variable', Figma's 'Inter' and
 * 'JetBrains Mono'), then falls back to common alternatives. Figma names their styles
 * differently from one release to the next ("Semi Bold", "SemiBold"), so
 * styles are matched by weight from what the file can actually load, with a
 * named fallback and a warning when a family is missing. */

export type Weight = 400 | 500 | 600 | 700
export type Family = 'sans' | 'mono' | 'display'

/** After the theme's own families: the ones the code ships, then common alternatives. */
const FALLBACK: Record<Family, string[]> = {
  sans: ['Inter', 'Inter Variable', 'Roboto'],
  mono: ['JetBrains Mono', 'Roboto Mono', 'Source Code Pro', 'Inter'],
  // The site's own chain is 'Youj Display', 'Geist', ui-sans-serif: without the brand face, display text sets in Geist.
  display: ['Geist', 'Inter', 'Inter Variable', 'Roboto'],
}

/** Youj Display (packages/brand-font) is the docs site's brand face, not a theme font: no theme names it, and it isn't in Figma until installed from packages/brand-font/fonts. */
const DISPLAY_FAMILY = 'Youj Display'

const GENERIC = /^(ui-sans-serif|ui-serif|ui-monospace|system-ui|sans-serif|serif|monospace|-apple-system|BlinkMacSystemFont|emoji|math)$/i

/** The named families in a CSS font-family list, generics dropped, @fontsource-variable's names as Figma knows them: "'Inter Variable', ui-sans-serif" gives ['Inter']. */
export function familiesOf(list: string): string[] {
  return list
    .split(',')
    .map((f) => f.trim().replace(/^['"]|['"]$/g, '').replace(/ Variable$/, ''))
    .filter((f) => f && !GENERIC.test(f))
}

/** The families to try for each role, in order: the theme's, then the fallbacks. */
export function wantedFamilies(theme?: Pick<KitTheme, 'fonts'>): Record<Family, string[]> {
  const chain = (role: 'sans' | 'mono') => [...new Set([...(theme ? familiesOf(theme.fonts[role]) : []), ...FALLBACK[role]])]
  return { sans: chain('sans'), mono: chain('mono'), display: [DISPLAY_FAMILY, ...FALLBACK.display] }
}

const WEIGHT_NAMES: Record<Weight, string[]> = {
  400: ['regular', 'normal', 'book', 'roman'],
  500: ['medium'],
  600: ['semibold', 'demibold'],
  700: ['bold'],
}

const norm = (s: string) => s.toLowerCase().replace(/[\s_-]/g, '')

export interface Fonts {
  font(family: Family, weight: Weight): FontName
  /** The family each role resolved to, e.g. { sans: 'Inter', mono: 'JetBrains Mono', display: 'Youj Display' }. */
  families: Record<Family, string>
  warnings: string[]
}

/** Picks the style for a weight from a family's styles, falling back to the nearest weight. */
export function pickStyle(styles: string[], weight: Weight): string | undefined {
  const upright = styles.filter((s) => !/italic|oblique/i.test(s))
  const order: Weight[] = [weight, ...([400, 500, 600, 700] as Weight[]).filter((w) => w !== weight).sort((a, b) => Math.abs(a - weight) - Math.abs(b - weight))]
  for (const w of order) {
    const hit = upright.find((s) => WEIGHT_NAMES[w].includes(norm(s)))
    if (hit) return hit
  }
  return upright[0] ?? styles[0]
}

/** Tried after the wanted families: Figma bundles Inter everywhere; the rest are common system fonts. */
const LAST_RESORT = ['Inter', 'Roboto', 'Arial', 'Helvetica']

export async function loadFonts(theme?: Pick<KitTheme, 'fonts'>): Promise<Fonts> {
  const WANTED = wantedFamilies(theme)
  const available = await figma.listAvailableFontsAsync()
  const byFamily = new Map<string, string[]>()
  for (const { fontName } of available) {
    const list = byFamily.get(fontName.family) ?? []
    list.push(fontName.style)
    byFamily.set(fontName.family, list)
  }
  const warnings: string[] = []
  const loaded = new Set<string>()
  const failed = new Set<string>()
  const id = (f: FontName) => `${f.family} ${f.style}`
  const tryLoad = async (f: FontName) => {
    if (loaded.has(id(f))) return true
    if (failed.has(id(f))) return false
    try {
      await figma.loadFontAsync(f)
      loaded.add(id(f))
      return true
    } catch (error) {
      // Listed isn't loadable: a local font whose file went missing, say.
      failed.add(id(f))
      console.warn(`Youj kit: ${id(f)} is listed but didn't load`, error)
      return false
    }
  }
  /** A family's style for a weight, loaded; the nearest style that loads; or undefined when none do. */
  const loadWeight = async (family: string, weight: Weight): Promise<FontName | undefined> => {
    const styles = byFamily.get(family) ?? []
    const first = pickStyle(styles, weight)
    const order = first ? [first, ...styles.filter((s) => s !== first && !/italic|oblique/i.test(s))] : []
    for (const style of order) if (await tryLoad({ family, style })) return { family, style }
    return undefined
  }

  const families = {} as Record<Family, string>
  const chosen = new Map<string, FontName>()
  for (const role of ['sans', 'mono', 'display'] as Family[]) {
    // The wanted families, then the ones Figma always has, then anything at all: text in some font beats no text.
    const candidates = [...new Set([...WANTED[role], ...LAST_RESORT, ...byFamily.keys()])].filter((f) => byFamily.has(f))
    let family: string | undefined
    for (const candidate of candidates) {
      if (await loadWeight(candidate, 400)) {
        family = candidate
        break
      }
    }
    if (!family) throw new Error(`No ${role} font could be loaded (tried ${WANTED[role].join(', ')} and every other family Figma listed). Check that Figma's fonts are available, then run the plugin again.`)
    if (family !== WANTED[role][0]) warnings.push(`${WANTED[role][0]} isn't available here, so ${role} text uses ${family}.${role === 'display' ? ' Install Youj Display (packages/brand-font/fonts/youj-display.otf) and run the plugin again to draw the Display styles in the brand face.' : ''}`)
    families[role] = family
    // Youj Display has one weight: loading it four times would pick the same style, so each weight maps to it.
    for (const w of [400, 500, 600, 700] as Weight[]) chosen.set(`${role}:${w}`, (await loadWeight(family, w))!)
  }
  if (failed.size) warnings.push(`Some fonts are listed but didn't load (${[...failed].join(', ')}); the kit used the nearest style that did.`)
  return {
    font: (family, weight) => chosen.get(`${family}:${weight}`)!,
    families,
    warnings,
  }
}
