'use client'

import { useCallback, useContext, useEffect, useSyncExternalStore } from 'react'
import { YoujContext } from './provider-context'
import { COLOR_MODES, type ColorMode, type ColorScheme } from './settings'
import { createAttributeStore, createMediaStore, createStorageStore } from './store'

/* The visitor's light, dark or system choice, kept where ThemeScript (in
 * @youj/react) reads it before the page paints and where an uncontrolled
 * ThemeToggle keeps it: localStorage under "theme" (next-themes' key), and
 * applied as `data-theme` and `color-scheme` on <html>. setThemeMode switches
 * it from code, and every toggle and useThemeMode on the page follows. Under
 * a YoujProvider with a `mode`, that mode is the default before anything is
 * stored, and a stored choice wins over it (the provider follows the store). */

const DARK_QUERY = '(prefers-color-scheme: dark)'
export const THEME_STORAGE_KEY = 'theme'

const isThemeMode = (value: unknown): value is ColorMode => COLOR_MODES.includes(value as ColorMode)
const osDark = createMediaStore(DARK_QUERY, true)
const subscribeScheme = createAttributeStore('data-theme')
const stores = new Map<string, ReturnType<typeof createStorageStore>>()
const storeFor = (key: string) => stores.get(key) ?? stores.set(key, createStorageStore(key)).get(key)!

/** The stored choice, or undefined when there is none (or no storage). */
export function readThemeMode(storageKey = THEME_STORAGE_KEY): ColorMode | undefined {
  const value = storeFor(storageKey).read()
  return isThemeMode(value) ? value : undefined
}

/** Writes a mode's scheme onto <html>, where the palette reads it: `system` as the OS shows it now. */
export function applyThemeMode(mode: ColorMode) {
  const scheme = mode === 'system' ? (osDark.matches() ? 'dark' : 'light') : mode
  const root = document.documentElement
  root.setAttribute('data-theme', scheme)
  root.style.colorScheme = scheme
}

/** Hears the stored choice (this tab's and other tabs'), the OS scheme and `data-theme` on <html>. */
export function subscribeThemeMode(listener: () => void, storageKey = THEME_STORAGE_KEY) {
  const off = [storeFor(storageKey).subscribe(listener), osDark.subscribe(listener), subscribeScheme(listener)]
  return () => off.forEach((stop) => stop())
}

/** Switches light, dark or system from code: stores it, applies it to <html> and tells every ThemeToggle and useThemeMode. */
export function setThemeMode(mode: ColorMode, { storageKey = THEME_STORAGE_KEY }: { storageKey?: string } = {}) {
  storeFor(storageKey).write(mode)
  applyThemeMode(mode)
}

/** The mode before anything is stored, when a toggle or hook gives none: the enclosing YoujProvider's `mode`, else `system`. */
export function useDefaultThemeMode(defaultValue?: ColorMode): ColorMode {
  const { mode } = useContext(YoujContext)
  return defaultValue ?? mode ?? 'system'
}

export interface ThemeModeOptions {
  /** Match ThemeScript's and the toggles' `storageKey`. Default "theme". */
  storageKey?: string
  /** The mode before anything is stored; match ThemeScript's and the toggles' `defaultValue`. Default: YoujProvider's `mode`, else `system`. */
  defaultValue?: ColorMode
}

export interface ThemeModeState {
  /** The visitor's choice. Undefined on the server and while hydrating: only the browser knows it. */
  mode: ColorMode | undefined
  /** What <html> shows now, `system` resolved. Undefined on the server and while hydrating. */
  scheme: ColorScheme | undefined
  /** setThemeMode with this hook's storage key. */
  setMode: (mode: ColorMode) => void
}

const unknown = () => undefined

/** The visitor's light, dark or system choice, followed live, and a setter. While the choice is `system`, <html> follows the OS. */
export function useThemeMode({ storageKey = THEME_STORAGE_KEY, defaultValue: defaultProp }: ThemeModeOptions = {}): ThemeModeState {
  const defaultValue = useDefaultThemeMode(defaultProp)
  const subscribe = useCallback((listener: () => void) => subscribeThemeMode(listener, storageKey), [storageKey])
  const mode = useSyncExternalStore(subscribe, () => readThemeMode(storageKey) ?? defaultValue, unknown)
  const scheme = useSyncExternalStore(subscribe, () => (document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'), unknown)
  useEffect(() => (mode === 'system' ? osDark.subscribe(() => applyThemeMode('system')) : undefined), [mode])
  const setMode = useCallback((next: ColorMode) => setThemeMode(next, { storageKey }), [storageKey])
  return { mode, scheme, setMode }
}
