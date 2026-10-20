import { useLayoutEffect, useRef } from 'react'
import { themeProps, type ThemeInput } from './theme/contract'
import type { ColorScheme } from './mode'

/* What a top-level provider writes on <html>, and puts back on unmount. Only
 * the first top-level provider mounted claims a slot, so a page with several
 * root providers (previews, each in its own theme) keeps its own. `apply`
 * writes `value` and returns what restores the document; it must be a stable
 * function. */
interface OwnerSlot {
  current: symbol | null
}

function useDocumentOwner<T>(slot: OwnerSlot, value: T | null, apply: (value: T) => () => void) {
  const id = useRef(Symbol('yj-document-owner'))
  useLayoutEffect(() => {
    if (value === null || (slot.current && slot.current !== id.current)) return
    slot.current = id.current
    const restore = apply(value)
    return () => {
      slot.current = null
      restore()
    }
  }, [slot, value, apply])
}

const themeOwner: OwnerSlot = { current: null }
function applyTheme(theme: ThemeInput) {
  const root = document.documentElement
  const props = themeProps(theme)
  const attrs = { 'data-yj-theme': props['data-yj-theme'], 'data-yj-palette': props['data-yj-palette'], 'data-yj-style': props['data-yj-style'], 'data-yj-motion': props['data-yj-motion'] }
  const vars = Object.entries(props.style ?? {}) as [string, string][]
  const was = Object.fromEntries(Object.keys(attrs).map((name) => [name, root.getAttribute(name)]))
  const wasVars = vars.map(([name]) => [name, root.style.getPropertyValue(name)] as const)
  for (const [name, value] of Object.entries(attrs)) {
    if (value === undefined) root.removeAttribute(name)
    else root.setAttribute(name, value)
  }
  for (const [name, value] of vars) root.style.setProperty(name, String(value))
  return () => {
    for (const [name, value] of Object.entries(was)) {
      if (value === null) root.removeAttribute(name)
      else root.setAttribute(name, value)
    }
    for (const [name, value] of wasVars) {
      if (value) root.style.setProperty(name, value)
      else root.style.removeProperty(name)
    }
  }
}

/* The one top-level provider that themes the page: a theme picker above the
 * whole app changes the document, not only this provider's subtree. It writes
 * the same attributes themeProps() puts on <html> on the server. */
export function useDocumentTheme(theme: ThemeInput | null) {
  useDocumentOwner(themeOwner, theme, applyTheme)
}

const modeOwner: OwnerSlot = { current: null }
function applyScheme(scheme: ColorScheme) {
  const root = document.documentElement
  const was = { theme: root.getAttribute('data-theme'), scheme: root.style.colorScheme }
  root.setAttribute('data-theme', scheme)
  root.style.colorScheme = scheme
  return () => {
    if (was.theme === null) root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', was.theme)
    root.style.colorScheme = was.scheme
  }
}

/* The top-level provider's mode, on the document: `data-theme` and
 * `color-scheme` on <html>, the same attributes ModeScript writes before paint. */
export function useDocumentMode(scheme: ColorScheme | null) {
  useDocumentOwner(modeOwner, scheme, applyScheme)
}
