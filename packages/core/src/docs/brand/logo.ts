/* Youj brand geometry, on the wordmark's 24-unit grid: ascender 4, x-height
 * 8.57, baseline 20, descender 24.
 *
 * Logo: the word on its own, no badge, in the text colour. The only colour
 * is the j's tittle, a square in the accent: Basalt's yellow in dark,
 * Graphite's blue in light, as the site's frame wears them. At text sizes
 * (the header's 24px) the tittle grows 1.3× about its own centre so it still
 * reads; at display sizes it's drawn as is.
 *
 * Lettering: custom lowercase (not a font), built from one stroke and one
 * bend. Stems are 2.19 and horizontals 1.95, and every corner that turns is
 * the j's hook: its outer bend (2.59 across, 3.2 down) and inner bend (0.55
 * by 1.2). The u is two stems on a flat foot turned with those bends; the o
 * is the u closed, the bends on all four corners, as wide as the u and
 * square to the x-height; the y is the u's bowl lifted 1.25 with its right
 * stem running on into the j's tail, at the j's length and depth; the j is
 * as built. All four stand flat on the x-height. The o, u and j sit 0.32
 * right of where the old V-shaped y left them, to give the y's upright stem
 * the white its diagonal used to.
 *
 * Mark: the u holding the tittle, in a square badge: the badge in the ink,
 * the u in the page's colour (the soft inverse) and the tittle in the
 * accent, standing in the u's counter as a part dropped into place. The u is
 * the wordmark's own, 0.52 of the badge wide and a unit below centre so
 * it stands on a baseline (a lowercase letter, not a capital). Favicons: the
 * mark re-drawn on whole pixels for 16 and 32 px. Block, the companion for
 * bots and communities: the same mark with its tittle built as an isometric
 * block standing in the cup.
 *
 * App icon: the mark full bleed, since the platform rounds it.
 *
 * Shared by the Storybook manager (as a data URI), the animated components,
 * the docs favicons and the Figma kit. */

export const GRID = { ascender: 4, xHeight: 8.57, baseline: 20, descender: 24 }

export const WORDMARK_WIDTH = 37.39
export const WORDMARK_VIEWBOX = `0 0 ${WORDMARK_WIDTH} 24`

/** The word's letters, one filled outline each, in reading order (each letter animates on its own). The o's counter winds the other way, so it stays open under either fill rule. */
export const wordmarkLetters: { letter: string; d: string }[] = [
  {
    letter: 'y',
    d: 'M0 8.57H2.19V15.6C2.19 16.4 2.29 16.8 2.74 16.8H7.13C7.58 16.8 7.68 16.4 7.68 15.6V8.57H9.87V20.8C9.87 23.25 8.67 24 7.28 24H4.28V22.05H7.13C7.58 22.05 7.68 21.65 7.68 20.85V18.75H2.59C1.2 18.75 0 18 0 15.55Z',
  },
  {
    letter: 'o',
    d: 'M14.24 8.57H18.93C20.32 8.57 21.52 9.32 21.52 11.77V16.8C21.52 19.25 20.32 20 18.93 20H14.24C12.85 20 11.65 19.25 11.65 16.8V11.77C11.65 9.32 12.85 8.57 14.24 8.57ZM14.39 10.52C13.94 10.52 13.84 10.92 13.84 11.72V16.85C13.84 17.65 13.94 18.05 14.39 18.05H18.78C19.23 18.05 19.33 17.65 19.33 16.85V11.72C19.33 10.92 19.23 10.52 18.78 10.52Z',
  },
  {
    letter: 'u',
    d: 'M23.27 8.57H25.46V16.85C25.46 17.65 25.56 18.05 26.01 18.05H30.4C30.85 18.05 30.95 17.65 30.95 16.85V8.57H33.14V16.8C33.14 19.25 31.94 20 30.55 20H25.86C24.47 20 23.27 19.25 23.27 16.8Z',
  },
  { letter: 'j', d: 'M35.2 8.57H37.39V20.8C37.39 23.25 36.19 24 34.8 24H31.8V22.05H34.65C35.1 22.05 35.2 21.65 35.2 20.85Z' },
]

/** The logo's letters: the word's own. */
export const logoLetters = wordmarkLetters

export type Optical = 'text' | 'display'

/** The j's tittle as a square (x, y, size): as drawn for display sizes, its top on the ascender line, centred over the
 * j's stem; for text sizes grown 1.3× about the same centre, so it reads in a 24px header. */
export const tittle: Record<Optical, { x: number; y: number; size: number }> = {
  display: { x: 35.13, y: 4, size: 2.33 },
  text: { x: 34.78, y: 3.65, size: 3.03 },
}

/** The wordmark's particle: the tittle as drawn. */
export const wordmarkParticles = [tittle.display]

/** The marketing lockup's "UI" tag: capitals in the muted ink, a word space after the word. */
export const WORDMARK_UI_WIDTH = 56.77
export const WORDMARK_UI_VIEWBOX = `0 0 ${WORDMARK_UI_WIDTH} 24`
export const uiTag: { letter: string; d: string }[] = [
  {
    letter: 'U',
    d: 'M41.96 4.23V13.8C41.96 17.64 44.16 20.21 47.45 20.21C50.74 20.21 52.93 17.64 52.93 13.8V4.23H50.69V13.66C50.69 16.31 49.4 18.23 47.45 18.23C45.5 18.23 44.2 16.31 44.2 13.66V4.23Z',
  },
  { letter: 'I', d: 'M54.53 20V4.23H56.77V20Z' },
]

const r3 = (n: number) => +n.toFixed(3)

/** A rounded rectangle as one closed outline, clockwise from its top-left corner. */
export function roundedRect(x: number, y: number, w: number, h: number, r: number) {
  const a = (dx: number, dy: number) => `A${r} ${r} 0 0 1 ${r3(dx)} ${r3(dy)}`
  return (
    `M${r3(x + r)} ${r3(y)}H${r3(x + w - r)}${a(x + w, y + r)}V${r3(y + h - r)}${a(x + w - r, y + h)}` +
    `H${r3(x + r)}${a(x, y + h - r)}V${r3(y + r)}${a(x + r, y)}Z`
  )
}

/** The logo's box on the grid, set 1em tall: half a unit above the ascender and below the descender, flush with the y's
 * stem at the start and half a unit past the j at the end, where the grown tittle overhangs it. */
export const LOCKUP = { x: 0, y: GRID.ascender - 0.5, width: r3(WORDMARK_WIDTH + 0.5), height: GRID.descender - GRID.ascender + 1 }
export const LOCKUP_VIEWBOX = `${LOCKUP.x} ${LOCKUP.y} ${LOCKUP.width} ${LOCKUP.height}`
/** The lockup's width in ems, for a lockup set 1em tall. */
export const LOCKUP_EM = LOCKUP.width / LOCKUP.height

/** The "youj UI" lockup's box: the same band, closed by the I. */
export const LOCKUP_UI_WIDTH = WORDMARK_UI_WIDTH
export const LOCKUP_UI_VIEWBOX = `${LOCKUP.x} ${LOCKUP.y} ${LOCKUP_UI_WIDTH} ${LOCKUP.height}`
export const LOCKUP_UI_EM = LOCKUP_UI_WIDTH / LOCKUP.height

/* The mark: the logo's u in a square badge on a 24-unit grid, scaled 1.264 (0.52 of the badge wide), centred across and
 * a unit below centre; the tittle 0.38 of the u's width, centred in the counter, as far off the floor as off the
 * stems. */
export const MARK_VIEWBOX = '0 0 24 24'
export const mark = {
  tile: roundedRect(0, 0, 24, 24, 2.903),
  glyph:
    'M5.76 5.774H8.529V16.243C8.529 17.255 8.656 17.761 9.225 17.761H14.775C15.344 17.761 15.471 17.255 15.471 16.243V5.774H18.24V16.18C18.24 19.278 16.723 20.226 14.965 20.226H9.035C7.277 20.226 5.76 19.278 5.76 16.18Z',
  tittle: { x: 9.629, y: 11.919, size: 4.742 },
  /** The u's x-height and baseline lines on the mark's grid. */
  xHeight: 5.774,
  baseline: 20.226,
}

export interface Glyph {
  tile: string
  glyph: string
  tittle: { x: number; y: number; size: number }
}

/** The mark hand-hinted on whole pixels for each favicon size, the u filling more of the badge than the master so it
 * reads; the bends are quarter ellipses on whole pixels. At 16 px: 2 px stems and foot, a 6 px counter and a 4 px tittle with a pixel of air on every side. At 32 px:
 * 4 px stems and foot on the face's bends, a 12 px counter and an 8 px tittle with 2 px of air. */
export const favicon = {
  16: { tile: roundedRect(0, 0, 16, 16, 2), glyph: 'M3 3H5V12H11V3H13V11A2 3 0 0 1 11 14H5A2 3 0 0 1 3 11Z', tittle: { x: 6, y: 7, size: 4 } },
  32: {
    tile: roundedRect(0, 0, 32, 32, 4),
    glyph: 'M6 6H10V22A1 2 0 0 0 11 24H21A1 2 0 0 0 22 22V6H26V22A5 6 0 0 1 21 28H11A5 6 0 0 1 6 22Z',
    tittle: { x: 12, y: 14, size: 8 },
  },
} satisfies Record<number, Glyph>

/* Block: the mark with its tittle built as an isometric block, 0.46 of the u's width, standing on the counter's floor
 * as far off it as off the stems; the drawing grown 1.1x about the badge's centre, since avatars are shown small (it
 * still clears a circle crop). Its three faces: the top in the accent, the left in the u's ink, the right the ink mixed
 * 45% into the badge. */
const BLOCK_SCALE = 1.1
const blockFaces = (() => {
  const w = 0.46 * (18.24 - 5.76)
  const e = w / Math.sqrt(3)
  const floor = 17.761
  const bottom = floor - (15.471 - 8.529 - w) / 2
  const at = (x: number, y: number) => `${r3(12 + (x - 12) * BLOCK_SCALE)} ${r3(12 + (y - 12) * BLOCK_SCALE)}`
  const [l, r] = [12 - w / 2, 12 + w / 2]
  const p = {
    top: at(12, bottom - 2 * e),
    tl: at(l, bottom - 1.5 * e),
    tr: at(r, bottom - 1.5 * e),
    mid: at(12, bottom - e),
    bl: at(l, bottom - e / 2),
    br: at(r, bottom - e / 2),
    bot: at(12, bottom),
  }
  return {
    top: `M${p.top}L${p.tr}L${p.mid}L${p.tl}Z`,
    left: `M${p.tl}L${p.mid}L${p.bot}L${p.bl}Z`,
    right: `M${p.mid}L${p.tr}L${p.br}L${p.bot}Z`,
  }
})()
export const block = { scale: BLOCK_SCALE, faces: blockFaces }

export type FaviconSize = keyof typeof favicon

/** The logo's colours in one mode: the ink (the text colour), the tittle's accent, the page's canvas and the accent's
 * contrast ink. */
export interface LockupColors {
  ink: string
  accent: string
  canvas: string
  onAccent: string
}

type Square = { x: number; y: number; size: number }
const square = ({ x, y, size }: Square, fill: string) => `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${fill}"/>`
const letters = () => logoLetters.map((l) => l.d).join('')

/** The logo as a standalone SVG (for brand images), 24px tall: the word in the ink, the tittle in the accent. */
export function lockupSvg({ ink, accent }: Pick<LockupColors, 'ink' | 'accent'>, optical: Optical = 'text') {
  const h = 24
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${LOCKUP_VIEWBOX}" width="${r3(LOCKUP_EM * h)}" height="${h}">` +
    `<path d="${letters()}" fill="${ink}"/>${square(tittle[optical], accent)}</svg>`
  )
}

/** The mark: the u cut out of the badge (even-odd), so the page shows through it, and the tittle in the accent. */
export function markOnlySvg({ ink, accent }: Pick<LockupColors, 'ink' | 'accent'>) {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${MARK_VIEWBOX}" width="24" height="24">` +
    `<path d="${mark.tile}${mark.glyph}" fill-rule="evenodd" fill="${ink}"/>${square(mark.tittle, accent)}</svg>`
  )
}

/** The mark hinted for one favicon size: the 32 design for 32 px (and the SVG icon, drawn at 2×), the 16 for 16. A tab
 * strip's colour varies, so the u is filled with the canvas rather than cut through. */
export function faviconSvg({ ink, accent, canvas }: Pick<LockupColors, 'ink' | 'accent' | 'canvas'>, size: FaviconSize = 32) {
  const g = favicon[size]
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">` +
    `<path d="${g.tile}" fill="${ink}"/><path d="${g.glyph}" fill="${canvas}"/>${square(g.tittle, accent)}</svg>`
  )
}

/** The home-screen icon: the mark full bleed and unrounded, since the platform masks it: the square in the ink, the u in
 * the canvas, the tittle in the accent. */
export function appIconSvg({ ink, accent, canvas }: Pick<LockupColors, 'ink' | 'accent' | 'canvas'>, size = 180) {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${MARK_VIEWBOX}" width="${size}" height="${size}">` +
    `<rect width="24" height="24" fill="${ink}"/><path d="${mark.glyph}" fill="${canvas}"/>${square(mark.tittle, accent)}</svg>`
  )
}

/** `a` mixed `t` of the way into `b`, both sRGB hex. */
const mixHex = (a: string, b: string, t: number) =>
  `#${[1, 3, 5]
    .map((i) =>
      Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`

/** Block, the companion for bot and community avatars: full bleed and unrounded (Slack and Discord crop it to a
 * rounded square or a circle). The square in the ink, the u in the canvas, the block's top in the accent, its left in
 * the canvas and its right the canvas mixed 45% into the ink. Colours are sRGB hex. */
export function blockSvg({ ink, accent, canvas }: Pick<LockupColors, 'ink' | 'accent' | 'canvas'>, size = 512) {
  const { faces, scale } = block
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${MARK_VIEWBOX}" width="${size}" height="${size}">` +
    `<rect width="24" height="24" fill="${ink}"/>` +
    `<path transform="translate(12 12) scale(${scale}) translate(-12 -12)" d="${mark.glyph}" fill="${canvas}"/>` +
    `<path d="${faces.top}" fill="${accent}"/><path d="${faces.left}" fill="${canvas}"/><path d="${faces.right}" fill="${mixHex(canvas, ink, 0.45)}"/></svg>`
  )
}

export const svgDataUri = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`

/* Retired with the Y mark, which led the wordmark on a 24-unit tile: the
 * wordmark scaled (13/16) so its ascender and baseline met the Y's cap line
 * (5.5) and baseline (18.5), LOCKUP_GAP grid units after the tile. The promo
 * film still composes its lockup this way (apps/promo/src/film/brand.tsx)
 * until it's redrawn around the logo. */
export const LOCKUP_GAP = 8
export const LOCKUP_WORD_SCALE = 13 / 16
export const LOCKUP_WORD_Y = 5.5 - GRID.ascender * LOCKUP_WORD_SCALE
