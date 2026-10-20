'use client'

import { useEffect } from 'react'
import type { ThemeInput } from '@youj/core/lib/youj/theme/contract'
import { fontOf, loadable, type FontFamily } from './fonts'

/* Web fonts on demand: the first time a theme (or a menu) shows a family, its
 * stylesheet (self-hosted, public/fonts/create/<id>.css) joins the document's head, once. Nothing loads
 * until then, and the families the page already has (a link marked
 * data-yj-font, or an @font-face of its own) load nothing. Used by the theme
 * builder, Create's preview and its Typeface menu. */

export function loadFonts(families: readonly (FontFamily | undefined)[], doc: Document = document) {
  for (const f of families) {
    if (!f || !loadable(f) || doc.head.querySelector(`link[data-yj-font="${f.id}"]`) || declared(doc, f.family)) continue
    const link = Object.assign(doc.createElement('link'), { rel: 'stylesheet', href: `/fonts/create/${f.id}.css` })
    link.dataset.yjFont = f.id
    doc.head.append(link)
  }
}

/** Whether the page declares a face for `family` itself (document.fonts lists its @font-face rules; jsdom has none). */
const declared = (doc: Document, family: string) => Boolean(doc.fonts) && [...doc.fonts].some((face) => face.family.replace(/^['"]|['"]$/g, '') === family)

/** Loads the web fonts a theme's `fonts` name, whenever they change. */
export function useThemeFonts(fonts: ThemeInput['fonts']) {
  const { sans, display, mono } = fonts ?? {}
  useEffect(() => loadFonts([sans, display, mono].map(fontOf)), [sans, display, mono])
}
