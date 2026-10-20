import { internalPresetById, isPaletteId, themeCss, themeProps, type NeutralPage, type InternalThemeId as ThemeId, type StyleId, type ThemeInput } from '@youj/core/lib/youj/theme'
import { SITE_PRESET, sitePreset } from '@/lib/preview'
import { SITE_LIGHT } from '@/lib/site-light'
import { fontOf, type FontFamily } from '@youj/react/docs/create/fonts'

/* The site's own frame (header, sidebar, footer, markers, the hero) wears
 * Basalt in dark and, in light, SITE_LIGHT: Basalt's character in Graphite's
 * colors, a blend the site keeps to itself (the shipped presets are
 * untouched). The Clean style and the Classic look, the library's defaults. Light or dark is the only choice the site offers,
 * held by next-themes (dark by default), which sets `data-theme` on <html> in
 * a script before first paint. So the themes are not inline on <html> but a
 * stylesheet in the server's <head> (siteThemeCss): Basalt on :root,
 * SITE_LIGHT on :root[data-theme='light']. The right one applies the moment
 * the mode is known, before hydration, with no flash, and a visit without
 * JavaScript is Basalt (dark). Portals and canvas pieces read the same
 * variables. Previews wear stock presets (lib/preview.ts: Graphite in light,
 * Basalt in dark, until a toolbar picks another) and theme only themselves;
 * a framed preview's document takes the one its page sends (lib/frame-sync). */

/** A palette the previews can wear: Youj (named by the site's preset for each mode, which wears it) or a Wada palette. */
export function isPresetId(id: unknown): id is ThemeId {
  return isPaletteId(id) || id === SITE_PRESET.light || id === SITE_PRESET.dark
}

/** Sets palette `id` in `style` (else preset `id` as it ships) on <html>, replacing whatever theme was there; on a white page in light for a website's demo (lib/preview's sitePreset). */
export function applyPreset(root: HTMLElement, id: ThemeId, page: NeutralPage = 'gray', ink = false, style?: StyleId) {
  const props = themeProps(sitePreset(id, page, false, ink, style))
  root.setAttribute('data-yj-theme', props['data-yj-theme'])
  for (const name of ['data-yj-palette', 'data-yj-style'] as const) {
    const value = props[name]
    if (value) root.setAttribute(name, value)
    else root.removeAttribute(name)
  }
  if (props['data-yj-motion']) root.setAttribute('data-yj-motion', props['data-yj-motion'])
  else root.removeAttribute('data-yj-motion')
  for (const name of Array.from(root.style)) if (name.startsWith('--yj-')) root.style.removeProperty(name)
  for (const [name, value] of Object.entries(props.style)) root.style.setProperty(name, String(value))
}

/** The marker attributes the server puts on <html>: the default mode's preset (dark, Basalt) and the site's personality (lively). */
export function siteHtmlProps() {
  const props = themeProps(sitePreset(SITE_PRESET.dark))
  return { 'data-yj-theme': props['data-yj-theme'], 'data-yj-motion': props['data-yj-motion'] }
}

/** The site's frame as one stylesheet: Basalt everywhere, SITE_LIGHT where the mode is light. */
export function siteThemeCss() {
  return (
    // The site's own chrome keeps ink actions over the Clean style's accent ones.
    themeCss({ ...internalPresetById(SITE_PRESET.dark), actions: 'ink', motionPersonality: undefined }, ':root') +
    themeCss({ ...SITE_LIGHT, motionPersonality: undefined }, ":root[data-theme='light']")
  )
}

/** The site frame's typefaces in either mode (Inter and JetBrains Mono), for the footer's colophon. */
export function sitePresetFonts(): FontFamily[] {
  const seen = new Set<string>()
  return [internalPresetById(SITE_PRESET.dark), SITE_LIGHT]
    .flatMap((theme) => {
      const fonts: ThemeInput['fonts'] = theme.fonts
      const { sans, display, mono } = fonts ?? {}
      return [sans, display, mono].map(fontOf)
    })
    .filter((f): f is FontFamily => Boolean(f))
    .filter((f) => !seen.has(f.id) && seen.add(f.id))
}

