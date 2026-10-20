import { DEFAULTS, type ThemeInput } from '@youj/core/lib/youj/theme/contract'

/* The typefaces the theme builder and Create offer: a curated set of OFL
 * families from Google Fonts, as the CSS stacks a theme's `fonts` hold, and
 * the pairings the Typeface menu lists. Plain TypeScript with no DOM, so the
 * builder, the URL format, the code export and the CLI share one list.
 *
 * The kit ships no web fonts: Inter and JetBrains Mono are the theme default
 * (the stacks name their @fontsource families, and `youj init` loads them),
 * Geist and Geist Mono are Bezel's, Charter and the
 * system faces are already on the device, and every other family loads on
 * demand where it's shown (load-fonts.ts) and exports as next/font setup or a
 * stylesheet @import (codegen.ts). A new family is one row in FAMILIES. */

export type FontKind = 'sans' | 'serif' | 'mono'

export interface FontFamily {
  /** The URL and code key: `geist`, `ibm-plex-mono`. */
  id: string
  /** Its name in menus. */
  label: string
  /** Its family name, as Google Fonts and next/font know it. */
  family: string
  kind: FontKind
  /** The stack a theme sets: the family, then the platform's own faces of its kind. */
  stack: string
  /** A web font: the css2 axes to request, and for next/font the weights of a static family (a variable one needs none). */
  web?: { axes: string; weights?: string[] }
  /** The next/font/google export, when it isn't the family with underscores. */
  nextName?: string
}

const SANS = 'ui-sans-serif, system-ui, sans-serif'
const SERIF = 'ui-serif, Georgia, serif'
const MONO = 'ui-monospace, monospace'
const FALLBACK: Record<FontKind, string> = { sans: SANS, serif: SERIF, mono: MONO }
/* The @fontsource families an app may already have: the theme default. */
const INTER = `'Inter Variable', ${SANS}`
const JETBRAINS_MONO = `'JetBrains Mono Variable', ${MONO}`

function family(id: string, name: string, kind: FontKind, web?: FontFamily['web'], label = name): FontFamily {
  return { id, label, family: name, kind, stack: `'${name}', ${FALLBACK[kind]}`, ...(web && { web }) }
}

const variable = (axes: string) => ({ axes })
const statics = (weights: string[]) => ({ axes: `wght@${weights.join(';')}`, weights })

export const FAMILIES: readonly FontFamily[] = [
  // The families an app may already load through @fontsource, as Graphite writes them.
  { id: 'inter', label: 'Inter', family: 'Inter', kind: 'sans', stack: INTER, web: variable('wght@100..900') },
  family('geist', 'Geist', 'sans', variable('wght@100..900')),
  family('ibm-plex-sans', 'IBM Plex Sans', 'sans', variable('wght@100..700')),
  family('manrope', 'Manrope', 'sans', variable('wght@200..800')),
  family('dm-sans', 'DM Sans', 'sans', variable('opsz,wght@9..40,100..1000')),
  family('plus-jakarta-sans', 'Plus Jakarta Sans', 'sans', variable('wght@200..800')),
  family('outfit', 'Outfit', 'sans', variable('wght@100..900')),
  family('space-grotesk', 'Space Grotesk', 'sans', variable('wght@300..700')),
  family('bricolage-grotesque', 'Bricolage Grotesque', 'sans', variable('opsz,wght@12..96,200..800'), 'Bricolage'),
  { id: 'system', label: 'System', family: 'system-ui', kind: 'sans', stack: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif" },
  family('instrument-serif', 'Instrument Serif', 'serif', statics(['400'])),
  family('fraunces', 'Fraunces', 'serif', variable('opsz,wght@9..144,100..900')),
  family('newsreader', 'Newsreader', 'serif', variable('opsz,wght@6..72,200..800')),
  family('source-serif-4', 'Source Serif 4', 'serif', variable('opsz,wght@8..60,200..900'), 'Source Serif'),
  family('ibm-plex-serif', 'IBM Plex Serif', 'serif', statics(['400', '500', '600', '700'])),
  // The book face on every device: nothing to load.
  { id: 'charter', label: 'Charter', family: 'Charter', kind: 'serif', stack: "Charter, 'Bitstream Charter', 'Sitka Text', Cambria, Georgia, serif" },
  { id: 'jetbrains-mono', label: 'JetBrains Mono', family: 'JetBrains Mono', kind: 'mono', stack: JETBRAINS_MONO, web: variable('wght@100..800') },
  family('geist-mono', 'Geist Mono', 'mono', variable('wght@100..900')),
  family('ibm-plex-mono', 'IBM Plex Mono', 'mono', statics(['400', '500', '600', '700'])),
  family('dm-mono', 'DM Mono', 'mono', statics(['300', '400', '500'])),
  family('space-mono', 'Space Mono', 'mono', statics(['400', '700'])),
]

const BY_ID = new Map(FAMILIES.map((f) => [f.id, f]))
const BY_STACK = new Map(FAMILIES.map((f) => [f.stack, f]))

export function fontById(id: string | undefined): FontFamily | undefined {
  return id ? BY_ID.get(id) : undefined
}

/** The catalog family a theme's stack is, if it's one of ours. */
export function fontOf(stack: string | undefined): FontFamily | undefined {
  return stack ? BY_STACK.get(stack) : undefined
}

/* ── Pairings: what the Typeface menu offers ─────────────────────────── */

export interface FontPairing {
  id: string
  label: string
  /** Menu group. */
  group: 'Sans' | 'Editorial' | 'Serif, mono and system'
  /** One line on its character. */
  note: string
  sans: string
  /** Titles, when they differ from the text. */
  display?: string
  mono: string
}

export const PAIRINGS: readonly FontPairing[] = [
  { id: 'inter', label: 'Inter', group: 'Sans', note: 'Neutral and exact: the default', sans: 'inter', mono: 'jetbrains-mono' },
  { id: 'geist', label: 'Geist', group: 'Sans', note: 'Swiss and precise, with Geist Mono', sans: 'geist', mono: 'geist-mono' },
  { id: 'ibm-plex', label: 'IBM Plex', group: 'Sans', note: 'Engineered, with a human hand', sans: 'ibm-plex-sans', mono: 'ibm-plex-mono' },
  { id: 'manrope', label: 'Manrope', group: 'Sans', note: 'Open and modern', sans: 'manrope', mono: 'jetbrains-mono' },
  { id: 'dm', label: 'DM Sans', group: 'Sans', note: 'Low contrast, friendly, with DM Mono', sans: 'dm-sans', mono: 'dm-mono' },
  { id: 'jakarta', label: 'Plus Jakarta', group: 'Sans', note: 'Crisp and a little warm', sans: 'plus-jakarta-sans', mono: 'jetbrains-mono' },
  { id: 'outfit', label: 'Outfit', group: 'Sans', note: 'Geometric and round', sans: 'outfit', mono: 'jetbrains-mono' },
  { id: 'space', label: 'Space', group: 'Sans', note: 'Quirky grotesque, with Space Mono', sans: 'space-grotesk', mono: 'space-mono' },
  { id: 'newsreader', label: 'Newsreader', group: 'Editorial', note: 'Editorial serif titles over Inter', sans: 'inter', display: 'newsreader', mono: 'jetbrains-mono' },
  { id: 'fraunces', label: 'Fraunces', group: 'Editorial', note: 'Soft serif titles over DM Sans', sans: 'dm-sans', display: 'fraunces', mono: 'jetbrains-mono' },
  { id: 'plex-serif', label: 'Plex Serif', group: 'Editorial', note: 'IBM Plex Serif titles over Plex Sans', sans: 'ibm-plex-sans', display: 'ibm-plex-serif', mono: 'ibm-plex-mono' },
  { id: 'bricolage', label: 'Bricolage', group: 'Editorial', note: 'Characterful display titles over Inter', sans: 'inter', display: 'bricolage-grotesque', mono: 'jetbrains-mono' },
  { id: 'source-serif', label: 'Source Serif', group: 'Serif, mono and system', note: 'A reading serif throughout', sans: 'source-serif-4', mono: 'jetbrains-mono' },
  { id: 'charter', label: 'Charter', group: 'Serif, mono and system', note: 'The book face on every device', sans: 'charter', mono: 'jetbrains-mono' },
  { id: 'mono', label: 'Mono', group: 'Serif, mono and system', note: 'JetBrains Mono throughout', sans: 'jetbrains-mono', mono: 'jetbrains-mono' },
  { id: 'system', label: 'System', group: 'Serif, mono and system', note: 'The platform’s own UI face', sans: 'system', mono: 'jetbrains-mono' },
]

type Fonts = NonNullable<ThemeInput['fonts']>

/** A pairing as a theme's `fonts`: the stacks, with no display when titles use the text face. */
export function pairingFonts(pairing: FontPairing): Fonts {
  const display = fontById(pairing.display)?.stack
  return { sans: fontById(pairing.sans)!.stack, mono: fontById(pairing.mono)!.stack, ...(display ? { display } : {}) }
}

/** The pairing a theme's fonts are, or undefined for a combination of its own. Unset fields are the defaults. */
export function pairingOf(fonts: ThemeInput['fonts']): FontPairing | undefined {
  const sans = fonts?.sans ?? DEFAULTS.fonts.sans
  const mono = fonts?.mono ?? DEFAULTS.fonts.mono
  return PAIRINGS.find((p) => {
    const f = pairingFonts(p)
    return f.sans === sans && f.mono === mono && f.display === fonts?.display
  })
}

/** The weight a family must be set at when it has only one (Instrument Serif's 400); undefined when it has a range. */
export function onlyWeight(f: FontFamily | undefined): number | undefined {
  return f?.web?.weights?.length === 1 ? Number(f.web.weights[0]) : undefined
}

/** The web-font families a theme's fonts name, each once. */
export function webFonts(fonts: ThemeInput['fonts']): FontFamily[] {
  const found = [fonts?.sans, fonts?.display, fonts?.mono].map(fontOf).filter((f): f is FontFamily => Boolean(f?.web))
  return [...new Set(found)]
}

/* ── Loading them ─────────────────────────────────────────────────────── */

/**
 * A family the site can serve (public/fonts/create, see apps/docs/scripts/fetch-create-fonts.mjs) under the name its stack uses.
 * Not Inter and JetBrains Mono: their stacks name the @fontsource families an
 * app (and this site) already has; not Charter or the system faces.
 */
export function loadable(f: FontFamily): boolean {
  return Boolean(f.web) && f.stack.startsWith(`'${f.family}'`)
}

/** Google Fonts' stylesheet for some families: one request, `display=swap`. */
export function googleFontsHref(families: readonly FontFamily[]): string {
  const specs = families.filter((f) => f.web).map((f) => `family=${f.family.replace(/ /g, '+')}:${f.web!.axes}`)
  return `https://fonts.googleapis.com/css2?${specs.join('&')}&display=swap`
}

/** The next/font/google export for a family: `IBM_Plex_Mono`. */
export function nextFontName(f: FontFamily): string {
  return f.nextName ?? f.family.replace(/ /g, '_')
}

/** The CSS variable next/font gives a family: `--font-ibm-plex-mono`. */
export function fontVariable(f: FontFamily): string {
  return `--font-${f.id}`
}
