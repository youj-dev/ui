import type { CSSProperties } from 'react'
import { composeTheme, internalPresetById, paletteById, styleById } from '@youj/core/lib/youj/theme'
import { palettes } from '@youj/core/lib/youj/theme/themes'
import type { InternalThemeId as ThemeId, NeutralPage, ThemeInput } from '@youj/core/lib/youj/theme'
import { COMPACT_SIZE, DEFAULT_SIZE, ROOMY_SIZE, type SizeConfig } from '@youj/react/docs/create/size-url'
import { modePreset, SITE_PRESET } from './site-mode'
import { SITE_INK } from './site-ink'

/* What a preview can be set to, apart from the site: the site itself wears
 * Basalt in dark and Basalt's character in Graphite's colors in light (the
 * header's toggle) and
 * follows the OS's reduced-motion setting. A preview (a docs example, a block,
 * an example, Create's frame) wears the site's preset for the current mode
 * until its toolbar picks another, and can wear any shipped preset in either
 * component style and run at its own speed or in its reduced state, and
 * nothing outside it changes. The library's own DEFAULT_PRESET stays Basalt:
 * this is only about the site. */

// The site's preset per mode lives on its own, so the chrome can read it without the preset list below.
export { SITE_PRESET, modePreset } from './site-mode'

/** The site's motion personality: lively, a little shorter with a touch of bounce on arrivals. A site setting: the library's presets stay precise. */
export const SITE_MOTION = 'lively' as const

/**
 * A preset as the site wears it, on its chrome and in previews: the preset
 * with the site's motion. With a `style`, `id` names a palette and the theme is
 * that palette in that style (lib/showcase-theme's two pickers); its id stays the
 * palette's, so `data-yj-theme` names what was picked. `page` is the item's own light page (lib/showcase's
 * `page`); a `white` one still wears the gray page under white cards, since a white page would gray the cards.
 */
export const sitePreset = (id: string | null | undefined, page: NeutralPage = 'gray', mono = false, ink = false, style?: string | null) => {
  const palette = paletteById(id)
  const preset = style ? composeTheme(palette, styleById(style), { id: id ?? palette.id, name: palette.name }) : internalPresetById(id)
  // `mono`: the site's own Youj look, roomy controls (a docs example the reader hasn't re-themed). `ink`: and in light,
  // ink as the accent, so its buttons, switches and tabs are black (the component pages' examples); dark keeps the preset's.
  return {
    ...preset,
    ...(mono && { controlSize: 'comfortable' as const }),
    ...(ink && { accent: { light: SITE_INK, dark: darkOf(preset.accent) ?? SITE_INK } as ThemeInput['accent'] }),
    motionPersonality: SITE_MOTION,
    // A website's white page (`page: 'white'`) would draw its cards a gray step down: whites stay white in every
    // palette and style, so a preview keeps the palette's gray page under white cards (as the approved sheet did).
    ...(page === 'white' && { neutral: { ...palette.neutral, page: 'gray' as const } }),
  }
}

/** A theme colour's dark-mode value (a `{ light, dark }` pair's dark, or the one colour). */
const darkOf = (c: unknown) => (c && typeof c === 'object' && 'dark' in c ? (c as { dark: string }).dark : (c as string | undefined))

/** The layout density and UI scale a preview renders at: what a provider's `density` and `scaling` set. */
export type PreviewSize = SizeConfig

/** The standard size, the provider's own (roomy at 100%), which every preview starts at; compact at 90% is the option for dense pro tools. */
export { COMPACT_SIZE, DEFAULT_SIZE, ROOMY_SIZE }

/** The size an item renders at until the reader picks another (lib/preview-size): the standard size. */
export const defaultSize = (): PreviewSize => DEFAULT_SIZE

/** The six Wada palettes a preview can wear beside Youj, with the site's motion. */
const WADA = palettes.filter((palette) => palette.id !== 'youj').map((palette) => ({ ...sitePreset(palette.id), id: palette.id }))

/** The palettes a preview can wear: Youj (the site's preset for the mode, which wears the Youj palette) and the six Wada ones. */
export const PREVIEW_PRESETS = [{ ...sitePreset(SITE_PRESET.dark), id: SITE_PRESET.dark as ThemeId, name: 'Youj' }, ...WADA]

/** A preview palette's name: Youj for the site's preset of either mode (which wears the Youj palette), else the palette's. */
export const previewName = (id: string) => (id === SITE_PRESET.light || id === SITE_PRESET.dark ? 'Youj' : internalPresetById(id).name)

/** The same list for a mode: Youj as that mode's preset, then the Wada palettes. */
export const previewPresets = (dark: boolean) => [{ ...sitePreset(modePreset(dark)), id: modePreset(dark), name: 'Youj' }, ...WADA]

export const PREVIEW_SPEEDS = [2, 1, 0.5, 0.25] as const
export type PreviewSpeed = (typeof PREVIEW_SPEEDS)[number]

export interface PreviewMotion {
  /** A multiplier on every duration, spring and loop in the preview. */
  speed: PreviewSpeed
  /** The preview shows its designed reduced-motion state (the OS's setting reaches it too). */
  reduced: boolean
}

export const DEFAULT_PREVIEW_MOTION: PreviewMotion = { speed: 1, reduced: false }

export function isPreviewSpeed(value: unknown): value is PreviewSpeed {
  return PREVIEW_SPEEDS.includes(value as PreviewSpeed)
}

/** A docs example's measured height in px, on a phone and from `sm` up (lib/stage-heights.json). */
export type StageReserve = readonly [phone: number, wide: number]

/** The height a capped docs example's stage shows (px); the demo scrolls inside it. */
export const STAGE_CAP = 480
/**
 * A docs example is capped when its demo measured taller than this from `sm` up (lib/stage-heights.json): the few that
 * are far taller than a page's column, not the many (a table, a form, a type specimen) whose whole height is the demo.
 * A demo that only stacks tall on a phone reads fine there, so the phone's measure doesn't count.
 */
export const STAGE_CAP_FROM = 740

export const stageCapped = (reserve?: StageReserve) => !!reserve && reserve[1] > STAGE_CAP_FROM

/**
 * The height a docs example's stage keeps, the same before and after its demo mounts: the page's `height`, or what
 * the demo measured when that's more (scripts/stage-heights.ts), per side of `sm`. So the empty stage a frame shows
 * until it wakes is the size the demo will be, and nothing below it moves when it arrives. A `capped` stage is
 * STAGE_CAP at most, whatever the demo measured.
 */
export function stageBox(height: number, reserve?: StageReserve, capped = false): { className: string; style: CSSProperties } {
  const [phone, wide] = reserve ?? [height, height]
  const limit = capped ? STAGE_CAP : Infinity
  return {
    className: 'min-h-(--stage-min) sm:min-h-(--stage-min-sm)',
    style: { '--stage-min': `${Math.min(limit, Math.max(height, phone))}px`, '--stage-min-sm': `${Math.min(limit, Math.max(height, wide))}px` } as CSSProperties,
  }
}
