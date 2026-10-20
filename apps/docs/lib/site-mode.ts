import type { InternalThemeId as ThemeId } from '@youj/core/lib/youj/theme'

/* The site's preset in each color mode, apart from lib/preview's list of
 * presets: the header and the providers read it on every page, and the list
 * would bring every preset with it. */

/**
 * The stock preset in each color mode: what a preview wears until its toolbar picks one, and what
 * <html>'s marker names. The site's own frame wears Basalt in dark and, in light, SITE_LIGHT
 * (lib/site-preset): Basalt's character in Graphite's colors.
 */
export const SITE_PRESET = { light: 'graphite', dark: 'basalt' } as const satisfies Record<'light' | 'dark', ThemeId>

/** The site's preset for a mode: what a preview wears until its toolbar picks one. */
export const modePreset = (dark: boolean): ThemeId => (dark ? SITE_PRESET.dark : SITE_PRESET.light)

/**
 * Settles a switch of light and dark in one style pass: resolves the new
 * styles now, once the mode and the preset marker are both on <html>, and
 * finishes every transition that pass started, so colors switch at once
 * rather than fade. It replaces a stylesheet that blocks transitions for the
 * switch, which cost two more full passes: one to add it, one to remove it.
 */
export function settleModeSwitch() {
  void getComputedStyle(document.body).color
  for (const animation of document.getAnimations?.() ?? []) if ('transitionProperty' in animation) animation.finish()
}
