/* The kit: everything the plugin draws, extracted from the real sources at
 * build time (src/data) and bundled into code.js. Types only, shared by the
 * data step (Node) and the plugin (Figma's sandbox). */

export type Mode = 'light' | 'dark'
/** A component style: how each component is built (packages/ui's bezel.css recipes, or none for classic). */
export type StyleId = 'bezel' | 'classic'
export type Personality = 'precise' | 'calm' | 'lively'

/** sRGB, 0–1, as Figma takes it. */
export interface Rgba {
  r: number
  g: number
  b: number
  a: number
}

export interface KitTheme {
  id: string
  name: string
  description: string
  motion: Personality
  radius: string
  density: string
  /** CSS font-family lists, as the theme declares them. */
  fonts: { sans: string; mono: string }
}

/** A colour in one mode: an alias of another kit colour, or its own value per theme. */
export type ColorValue = { alias: string } | { values: Record<string, Rgba> }

export interface KitColor {
  /** Variable name in the Color collection, e.g. `role/canvas`. */
  name: string
  /** The CSS custom property it mirrors, e.g. `--background`. */
  css: string
  /** Where it's defined and how, for the variable's description. */
  source: string
  /** What Figma lets it be picked for. */
  role: 'surface' | 'text' | 'line' | 'fill' | 'effect'
  light: ColorValue
  dark: ColorValue
}

/** A number per theme (radius, control height, density). */
export interface KitThemeNumber {
  name: string
  css: string
  source: string
  scope: 'radius' | 'size' | 'none'
  values: Record<string, number>
}

export interface KitNumber {
  name: string
  css: string
  source: string
  scope: 'gap' | 'radius' | 'size' | 'font-size' | 'line-height' | 'stroke' | 'none'
  value: number
}

export interface KitTextStyle {
  name: string
  /** The text-* size it uses, e.g. `ui` for text-ui: its Scale variables are text/ui and leading/ui. */
  token: string
  family: 'sans' | 'mono' | 'display'
  weight: 400 | 500 | 600 | 700
  size: number
  lineHeight: number
  /** Percent of the font size. */
  tracking: number
  upper: boolean
  /** The Tailwind classes that produce it. */
  classes: string
}

export interface KitShadowLayer {
  inset: boolean
  x: number
  y: number
  blur: number
  spread: number
  /** Color collection variable holding this layer's colour. */
  color: string
  /** Theme collection variable both offsets are bound to (the hard block, which only hard-shadow themes offset). */
  offset?: string
}

export interface KitEffect {
  name: string
  css: string
  description: string
  layers: KitShadowLayer[]
}

export interface KitMotion {
  personalities: Record<
    Personality,
    {
      durations: Record<string, number>
      easings: Record<string, [number, number, number, number]>
      springs: Record<string, { visualDuration: number; bounce: number }>
      staggers: Record<string, number>
    }
  >
  /** Which personality each theme picks. */
  themes: Record<string, Personality>
  usage: { durations: Record<string, string>; easings: Record<string, string>; springs: Record<string, string>; staggers: Record<string, string> }
  /** Spring response sampled over 1.6× its visual duration, 0–1 progress (may overshoot). */
  springCurves: Record<Personality, Record<string, number[]>>
}

/** One drawable piece of an icon at rest, already flattened to absolute path data in the 24-unit box. */
export type IconPart =
  | {
      kind: 'path'
      d: string
      /** `ink` follows the icon colour; `white`/`black` paint a luminance mask. */
      stroke: 'ink' | 'white' | 'black' | null
      fill: 'ink' | 'white' | 'black' | null
      strokeWidth: number
      opacity: number
      dash?: [number, number]
    }
  | {
      kind: 'mask'
      /** LUMINANCE for SVG masks (white shows, black hides); ALPHA for clip paths. */
      type: 'LUMINANCE' | 'ALPHA'
      mask: IconPart[]
      content: IconPart[]
    }

export interface KitIcon {
  name: string
  category: string
  keywords: string[]
  /** The React component, e.g. `BellIcon`. */
  component: string
  /** Labels for [rest, active] on state icons. */
  states?: [string, string]
  rest: IconPart[]
  active?: IconPart[]
}

export interface KitLogo {
  /** The lines the lettering stands on, in grid units. */
  grid: { ascender: number; xHeight: number; baseline: number; descender: number }
  /** The logo's box on that grid, the box it's set 1em tall in: the ascender-to-descender band with half a unit above and below, flush with the y. */
  box: { x: number; y: number; width: number; height: number }
  /** The word's letters, one outline each, in reading order. */
  letters: { letter: string; d: string }[]
  /** The j's tittle, a square on the same grid, as drawn for display sizes. */
  tittle: { x: number; y: number; size: number }
  /** The tittle's colour in each mode, whatever the theme: Basalt's yellow in dark, Graphite's blue in light, as the site wears them. */
  tittleColor: Record<Mode, Rgba>
}

export interface KitBlock {
  id: string
  title: string
  kind: 'Card' | 'Section' | 'Screen' | 'Frame'
  story: string
  width: number
  height: number
  /** Base64 image bytes (JPEG or PNG). */
  data: string
}

/** The isometric illustration scenes as static SVG (scripts/illustrations.ts), in the preset they were captured in, light and dark. */
export interface KitIllustrations {
  /** The preset the colours were captured from. */
  preset: string
  categories: { id: string; name: string }[]
  scenes: { id: string; name: string; category: string; svg: Record<Mode, string> }[]
}

export interface KitStyle {
  id: StyleId
  name: string
  description: string
}

export interface Kit {
  /** A hash of everything below, so a build can be named. */
  hash: string
  themes: KitTheme[]
  /** The component styles, from @youj/core's style list. */
  styles: KitStyle[]
  /** What a new file is built in: the site's default look. */
  defaults: { style: StyleId; theme: string; mode: Mode }
  colors: KitColor[]
  theme: KitThemeNumber[]
  fonts: { name: string; values: Record<string, string> }[]
  scale: KitNumber[]
  text: KitTextStyle[]
  effects: KitEffect[]
  motion: KitMotion
  icons: KitIcon[]
  categories: string[]
  logo: KitLogo
  blocks: KitBlock[]
  illustrations: KitIllustrations
  /** DotMap's land mask (dot-map.land.tsx): an equirectangular grid, `#` for land, one string per row from the north. */
  dotMap: { step: number; north: number; rows: string[] }
}
