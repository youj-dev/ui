import { ICON_CATEGORIES, type ExplorerType, type IconCategory } from './catalog'

/* The explorer's shareable state, in the query string: what's filtered and
 * searched. Defaults are left out, so a plain /icons stays plain. The icon on
 * stage and the chain (`icon`, `chain`) are the hero's, and display
 * settings (size, stroke, color) are the viewer's own and stay out of links. */

export interface ExplorerQuery {
  q: string
  type: ExplorerType
  /** Categories to show; none is every category. */
  categories: IconCategory[]
}

export const DEFAULT_QUERY: ExplorerQuery = {
  q: '',
  type: 'animated',
  categories: [],
}

// An old `type=static` link falls back to every icon, which is what it showed.
const TYPES: readonly ExplorerType[] = ['animated', 'morph', 'swap']

const oneOf = <T extends string>(options: readonly T[], value: string | null, fallback: T): T =>
  value !== null && (options as readonly string[]).includes(value) ? (value as T) : fallback

export function parseQuery(search: string): ExplorerQuery {
  const p = new URLSearchParams(search)
  const d = DEFAULT_QUERY
  return {
    q: (p.get('q') ?? '').slice(0, 80),
    type: oneOf(TYPES, p.get('type'), d.type),
    // One category or several, comma-separated: `category=arrows,status`.
    categories: [...new Set((p.get('category') ?? '').split(','))].filter((c): c is IconCategory => (ICON_CATEGORIES as readonly string[]).includes(c)),
  }
}
