import { basalt, derivePalette, formatOklch, parseColor, toHex, type Mode } from '@youj/core/lib/youj/theme'
import { faviconSvg } from '@youj/core/docs/brand/logo'
import { graphite } from '@youj/core/lib/youj/theme'
import { SITE_LIGHT } from './site-light'

/* The tab icon and the browser bar follow the site's mode, as the logo in the
 * page does: one rule for every state. The tab icon is the mark, the u
 * holding the tittle in a badge, the page's soft inverse: the badge in the
 * theme's ink (near-white in dark, near-black in light), the u in its canvas,
 * the tittle in its accent (Basalt's yellow in dark, the site's light theme's
 * blue, SITE_LIGHT's Graphite ultramarine, in light), lifted to OKLCH
 * L 0.66 on the near-black badge so it reads at 16px; the bar in its canvas.
 * The home-screen icon is the mark full bleed. A first visit follows the OS;
 * dark is what the server sends, a crawler reads and the static icons
 * (apple-touch-icon, favicon.ico) wear. The files are written by
 * `pnpm -F docs favicons` (scripts/favicons.ts) from these colors; the layout
 * links them, and a script before first paint and the providers swap them
 * with the mode. */

export const SITE_MODES = ['dark', 'light'] as const satisfies readonly Mode[]

const hex = (color: Parameters<typeof formatOklch>[0]) => toHex(parseColor(formatOklch(color))!)

/** The theme the site's frame wears in each mode (lib/site-preset). The brand keeps Graphite's blue tittle in light,
 * though the frame itself is monochrome: the mark's coloured dot is the brand, not the theme. */
const FRAME = { dark: basalt, light: { ...SITE_LIGHT, accent: graphite.accent } }

/** The tittle on a dark badge is the accent at this OKLCH lightness or more: Graphite's blue (L 0.54) reaches 5:1 on
 * the near-black badge, where it was 3.3:1. */
const DOT_ON_DARK = 0.66

/** The brand's colors in one mode, as sRGB hex (favicons and theme-color take no OKLCH): `dot` is the tittle's colour on
 * the badge, which is the page's inverse, so in light it's dark and the accent is lifted. */
export function brandColors(mode: Mode) {
  const palette = derivePalette(FRAME[mode], mode)
  const [l, c, h] = palette.accent
  const dot = mode === 'light' ? hex([Math.max(l, DOT_ON_DARK), c, h]) : hex(palette.accent)
  return { accent: hex(palette.accent), ink: hex(palette.fg), canvas: hex(palette.canvas), dot }
}

/** The tab icon for a mode: its file name under public/icons, without the extension. */
export const iconName = (mode: Mode) => (mode === 'dark' ? 'basalt-dark' : 'site-light')

/** The tab icon's SVG for a mode, as scripts/favicons.ts writes it. */
export const faviconFor = (mode: Mode) => {
  const colors = brandColors(mode)
  return faviconSvg({ ...colors, accent: colors.dot })
}

/** Each mode's tab icons and browser-bar color. */
export function brandHead() {
  const of = (mode: Mode) => ({ svg: `/icons/${iconName(mode)}.svg`, png: `/icons/${iconName(mode)}-32.png`, color: brandColors(mode).canvas })
  return { dark: of('dark'), light: of('light') }
}

/**
 * The <link rel=icon>s and <meta name=theme-color>, showing `mode`'s values
 * and carrying both modes' (`data-dark`, `data-light`, with `data-brand`
 * naming the attribute they set), for SitePresetMarker (app/providers.tsx) to
 * swap on every change of mode.
 */
export function brandTags(mode: Mode) {
  const head = brandHead()
  const own = head[mode]
  const both = (key: 'svg' | 'png' | 'color') => `data-dark="${head.dark[key]}" data-light="${head.light[key]}"`
  return (
    `<link rel="icon" type="image/png" sizes="32x32" href="${own.png}" data-brand="href" ${both('png')}>` +
    `<link rel="icon" type="image/svg+xml" href="${own.svg}" data-brand="href" ${both('svg')}>` +
    `<meta name="theme-color" content="${own.color}" data-brand="content" ${both('color')}>`
  )
}

/**
 * Before first paint, in <head>: the stored mode as next-themes stores it
 * (`theme`), else (nothing stored, "system", or storage that can't be read)
 * the OS's, as next-themes resolves it; then that mode's tags, right after
 * the script. The script
 * writes them, not React: React hydrates a <link> by its href, so one swapped
 * before hydration would be missed and a second set added. Kept tiny: it runs
 * on every page load.
 */
export function brandScript() {
  const tags = JSON.stringify({ dark: brandTags('dark'), light: brandTags('light') }).replace(/</g, '\\u003c')
  return (
    "(function(){var m='dark',t;try{t=localStorage.getItem('theme')}catch(e){}" +
    "try{m=t==='light'||t==='dark'?t:matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}catch(e){}" +
    `document.currentScript.insertAdjacentHTML('afterend',${tags}[m])})()`
  )
}
