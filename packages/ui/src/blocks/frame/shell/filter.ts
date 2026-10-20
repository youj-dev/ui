import type { FrameNavItem, FrameNavSection } from './model'

/* The sidebars' filter: what matches, which branches are open, and where
 * the current page shows. Plain functions, no React. */

const norm = (text: string) => text.toLocaleLowerCase()

/** The items that match `q`, at any depth: a matching page, a branch whose own name matches (with all of it), or a branch with matches inside (with only those). */
function filterItems(items: readonly FrameNavItem[], q: string): FrameNavItem[] {
  return items.flatMap((item) => {
    if (norm(item.label).includes(q)) return [item]
    if (!item.items?.length) return []
    const inner = filterItems(item.items, q)
    return inner.length ? [{ ...item, items: inner }] : []
  })
}

/** The nav with only what matches `query`; sections left empty go. */
export function filterNav(nav: FrameNavSection[], query: string): FrameNavSection[] {
  const q = norm(query.trim())
  if (!q) return nav
  return nav.map((section) => ({ ...section, items: filterItems(section.items, q) })).filter((section) => section.items.length > 0)
}

/** The branches that hold the page with `id`, outermost first (empty for a top-level page or none). */
export function branchesOf(nav: readonly FrameNavSection[], id: string | undefined): string[] {
  if (!id) return []
  const find = (items: readonly FrameNavItem[], path: string[]): string[] | undefined => {
    for (const item of items) {
      if (item.id === id) return path
      if (item.items?.length) {
        const found = find(item.items, [...path, item.id])
        if (found) return found
      }
    }
    return undefined
  }
  for (const section of nav) {
    const found = find(section.items, [])
    if (found) return found
  }
  return []
}

/** Where the current page shows: its own row, or the outermost closed branch that hides it. */
export function shownRow(nav: readonly FrameNavSection[], active: string | undefined, isOpen: (id: string) => boolean): string | undefined {
  if (!active) return undefined
  return branchesOf(nav, active).find((id) => !isOpen(id)) ?? active
}

/** A label with the part that matches `query`, for the mark: [before, match, after], or null. */
export function matchParts(text: string, query: string): [string, string, string] | null {
  const q = query.trim()
  const at = q ? norm(text).indexOf(norm(q)) : -1
  if (at < 0) return null
  return [text.slice(0, at), text.slice(at, at + q.length), text.slice(at + q.length)]
}
