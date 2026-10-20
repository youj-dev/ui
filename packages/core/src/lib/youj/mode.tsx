'use client'

import { useSyncExternalStore } from 'react'
import { createAttributeStore, createMediaStore } from './store'

/* The colour mode: light or dark. The palette follows `data-theme` on <html>
 * (or on any scope), and a page with none is dark. YoujProvider's `mode` is
 * the app's setting for it: `dark` (the default), `light`, or `system`, which
 * follows the operating system's `prefers-color-scheme`. */

export { COLOR_MODES, DEFAULT_MODE, type ColorMode, type ColorScheme } from './settings'
import type { ColorMode, ColorScheme } from './settings'

export const DARK_QUERY = '(prefers-color-scheme: dark)'

/* The OS scheme, as an external store. A server can't know it, so the server
 * snapshot is dark (the palette's default), and React uses it for the
 * hydration render too: server HTML and the first client render agree, and a
 * light-preferring client re-renders straight after. */
const osDark = createMediaStore(DARK_QUERY, true)
const serverOsDark = () => true
const subscribeNothing = () => () => {}

/** The scheme a mode draws, `system` read from the OS and followed live; null for no mode (the app sets none). */
export function useScheme(mode: ColorMode | null): ColorScheme | null {
  const system = mode === 'system'
  const dark = useSyncExternalStore(system ? osDark.subscribe : subscribeNothing, system ? osDark.matches : serverOsDark, serverOsDark)
  if (mode === null) return null
  return system ? (dark ? 'dark' : 'light') : mode
}

/* The scheme <html> shows, for an app that sets no mode and drives
 * `data-theme` another way (next-themes, ThemeToggle). */
const subscribeDocumentScheme = createAttributeStore('data-theme')
const getDocumentScheme = (): ColorScheme => (document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark')
const getServerScheme = (): ColorScheme => 'dark'

/** The scheme on <html>, followed live: light only when `data-theme="light"`, as the palette reads it. */
export function useDocumentScheme(enabled = true): ColorScheme {
  return useSyncExternalStore(enabled ? subscribeDocumentScheme : subscribeNothing, enabled ? getDocumentScheme : getServerScheme, getServerScheme)
}

export interface ModeScriptProps {
  /** Match YoujProvider's `mode`: the mode until the visitor picks one. Default `system`. */
  mode?: ColorMode
  /** For a Content-Security-Policy that allows inline scripts by nonce. */
  nonce?: string
}

/**
 * Sets `data-theme` and `color-scheme` on <html> before the page paints, from
 * the same `mode` you give YoujProvider, so `system` (or `light`) never flashes
 * the dark default. A visitor's stored choice (ThemeToggle, setThemeMode:
 * localStorage "theme") wins over `mode`, as it does in the provider. Render it in <head> of a server-rendered layout, and put
 * `suppressHydrationWarning` on <html>. With `dark`, the default, you don't
 * need it.
 */
export function ModeScript({ mode = 'system', nonce }: ModeScriptProps) {
  // `<` escaped, so nothing a caller passes can close the script.
  const arg = JSON.stringify(mode).replace(/</g, '\\u003c')
  const code = `(function(m){try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark'||t==='system')m=t}catch(e){}try{var s=m==='system'?(matchMedia('${DARK_QUERY}').matches?'dark':'light'):m==='light'?'light':'dark';var e=document.documentElement;e.setAttribute('data-theme',s);e.style.colorScheme=s}catch(e){}})(${arg})`
  // biome-ignore lint/security/noDangerouslySetInnerHtml: static script; the only argument is JSON-escaped above
  return <script nonce={nonce} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: code }} />
}
