import { navPages, type FrameIcon, type FrameNavSection } from '../shell'

/* The pages a search field can suggest, and how a query finds them. */

export interface Page {
  id: string
  label: string
  icon?: FrameIcon
  /** Where it lives: its section, or its parent for a nested page. */
  context?: string
  /** Where the query matched in the label, for the highlight; -1 for none. */
  at: number
  length: number
}

/** Every page of the nav, the way the palette lists them: nested pages (at any depth) under their parent, a parent only through its pages. */
export function pagesOf(nav: readonly FrameNavSection[]): Page[] {
  return navPages(nav).map(({ item, section, parents }) => ({
    id: item.id,
    label: item.label,
    icon: item.icon ?? parents.find((p) => p.icon)?.icon,
    context: parents.at(-1)?.label ?? section.label,
    at: -1,
    length: 0,
  }))
}

/** Case- and accent-insensitive: "Résumé" finds "resume". */
const fold = (text: string) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

/** Where a word of `text` starts with `q`, or -1. */
function wordStart(text: string, q: string) {
  for (let i = text.indexOf(q); i >= 0; i = text.indexOf(q, i + 1)) {
    if (i === 0 || !/[\p{L}\p{N}]/u.test(text[i - 1]!)) return i
  }
  return -1
}

/**
 * The pages a query finds, best first: labels that start with it, then
 * labels with a word that does, then any match in a label, then (from two
 * characters on) pages whose section or parent has a word that does. Nav
 * order holds within each rank.
 */
export function matchPages(pages: readonly Page[], query: string): Page[] {
  const q = fold(query.trim())
  if (!q) return [...pages]
  const found: { page: Page; rank: number }[] = []
  for (const page of pages) {
    const label = fold(page.label)
    const word = wordStart(label, q)
    const at = word >= 0 ? word : label.indexOf(q)
    // Marked only where folding kept the label's length, so the mark lines up with the text.
    const marked = label.length === page.label.length ? { ...page, at, length: q.length } : page
    if (at >= 0) found.push({ page: marked, rank: at === 0 ? 0 : word > 0 ? 1 : 2 })
    else if (q.length > 1 && page.context && wordStart(fold(page.context), q) >= 0) found.push({ page, rank: 3 })
  }
  return found.sort((a, b) => a.rank - b.rank).map((f) => f.page)
}
