'use client'

import { useSyncExternalStore } from 'react'
import { DEFAULT_STYLE, isStyleId, styles, type StyleId } from '@youj/core/lib/youj/theme'
import type { InternalThemeId as ThemeId } from '@youj/core/lib/youj/theme'
import { PREVIEW_PRESETS } from '@/lib/preview'
import { isPresetId } from '@/lib/site-preset'
import { useModePreset } from '@/lib/site-theme'
import { createStoreSignal } from '@/lib/store-signal'

/* The look the Blocks and Examples previews wear, chosen once at the top of
 * the docs' block previews, and shared by every preview on the page: a preset (the site's for the mode, Graphite in light and Basalt in
 * dark, or any other the library ships), named by its palette, and a style
 * (Clean, the default, Bezel, Classic, Brutal or Terminal), which brings its
 * look. It never reaches the site around them. A preset is
 * the mode's until one is picked, so the previews follow the site's toggle;
 * a picked one, the mode's
 * own included, stays whatever the mode. The choice lives in the query string
 * (`?theme=meadow&look=brutal`: the palette, then the style; nothing for a default), so a view is a
 * link, and in storage, so it carries across pages whose links don't name
 * it: the preset for this tab, the style (which the docs' previews share,
 * components/docs/preview-live) for every visit. Anything stale (a preset the library no longer ships, the old
 * `site` and `custom`) reads as the default. */

export const SHOWCASE_THEME_PARAM = 'theme'
export const SHOWCASE_LOOK_PARAM = 'look'
export const SHOWCASE_THEME_KEY = 'youj-showcase-theme'
export const SHOWCASE_LOOK_KEY = 'youj-showcase-look'

interface Axis<T extends string> {
  param: string
  key: string
  /** What no choice means: a constant, or null where it depends on the site's mode. */
  fallback: T | null
  read: (value: unknown) => T | null
  /** Where a choice is remembered: this tab for the preset, every visit for the style. */
  storage: () => Storage
}

const PRESET: Axis<ThemeId> = { param: SHOWCASE_THEME_PARAM, key: SHOWCASE_THEME_KEY, fallback: null, read: (v) => (isPresetId(v) ? v : null), storage: () => sessionStorage }
const STYLE: Axis<StyleId> = { param: SHOWCASE_LOOK_PARAM, key: SHOWCASE_LOOK_KEY, fallback: DEFAULT_STYLE, read: (v) => (isStyleId(v) ? v : null), storage: () => localStorage }

function stored<T extends string>(axis: Axis<T>): T | null {
  try {
    return axis.read(axis.storage().getItem(axis.key))
  } catch {
    return null
  }
}

function fromUrl<T extends string>(axis: Axis<T>): T | null {
  return axis.read(new URLSearchParams(window.location.search).get(axis.param))
}

/** The page's choice on one axis: the URL's, else this tab's last, else the default (null for the preset: the mode's). */
function snapshot<T extends string>(axis: Axis<T>): T | null {
  return fromUrl(axis) ?? stored(axis) ?? axis.fallback
}

const { subscribe, notify } = createStoreSignal((wake) => {
  window.addEventListener('popstate', wake)
  return () => window.removeEventListener('popstate', wake)
})

/** Writes a choice into this URL (no param for the default), without a navigation or a history entry. */
function writeUrl<T extends string>(axis: Axis<T>, value: T | null) {
  const url = new URL(window.location.href)
  if (value === null || value === axis.fallback) url.searchParams.delete(axis.param)
  else url.searchParams.set(axis.param, value)
  if (url.href !== window.location.href) window.history.replaceState(null, '', url)
}

function remember<T extends string>(axis: Axis<T>, value: T) {
  try {
    axis.storage().setItem(axis.key, value)
  } catch {
    // Storage blocked: the URL still carries it.
  }
}

function forget<T extends string>(axis: Axis<T>) {
  try {
    axis.storage().removeItem(axis.key)
  } catch {
    // Storage blocked: nothing was remembered.
  }
}

function set<T extends string>(axis: Axis<T>, value: T | null) {
  if (value === null) forget(axis)
  else remember(axis, value)
  writeUrl(axis, value)
  notify()
}

/** Picks a preset for the previews; null returns them to the site's own for the mode (what choosing the "default" chip does). */
export const setShowcasePreset = (id: ThemeId | null) => set(PRESET, id)
export const setShowcaseLook = (style: StyleId) => set(STYLE, style)

/** A docs preview's pick of the style: remembered and shared like the galleries', but a docs page's address never names it. */
export function setPreviewLook(style: StyleId) {
  remember(STYLE, style)
  notify()
}

/** The previews' preset: null until hydration, so nothing claims one the server couldn't know. */
export function useShowcasePreset(): ThemeId | null {
  const modeDefault = useModePreset()
  const picked = useSyncExternalStore(
    subscribe,
    () => snapshot(PRESET),
    () => null,
  )
  return picked ?? modeDefault
}

/** The preset the tab picked, or null while it follows the site's mode (and before hydration). */
export function useShowcasePickedPreset(): ThemeId | null {
  return useSyncExternalStore(
    subscribe,
    () => snapshot(PRESET),
    () => null,
  )
}

/** The previews' component style: null until hydration, as for the preset. */
export function useShowcaseLook(): StyleId | null {
  return useSyncExternalStore(
    subscribe,
    () => snapshot(STYLE),
    () => null,
  )
}

/** An inline edge a new look sweeps in from. */
export type SweepEdge = 'start' | 'end'

/** Where a newly picked preset sweeps in from: the side the bar's selection moved away from, so it follows the key. */
export function sweepEdge(before: ThemeId, after: ThemeId): SweepEdge {
  const order: ThemeId[] = PREVIEW_PRESETS.map((theme) => theme.id)
  return order.indexOf(after) > order.indexOf(before) ? 'start' : 'end'
}

/** Where a newly picked style sweeps in from, as for a preset. */
export function lookEdge(before: StyleId, after: StyleId): SweepEdge {
  const order: string[] = styles.map((s) => s.id)
  return order.indexOf(after) > order.indexOf(before) ? 'start' : 'end'
}

/** A sweep's clip-path, closed at `edge` and open, in a document running left to right or not. */
export function sweepClip(edge: SweepEdge, rtl: boolean): [string, string] {
  const fromLeft = (edge === 'start') !== rtl
  return [fromLeft ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)', 'inset(0 0 0 0)']
}
