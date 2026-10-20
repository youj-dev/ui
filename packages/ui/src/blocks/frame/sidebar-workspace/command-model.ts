import { navPages, type FrameIcon, type FrameNavItem, type FrameNavSection } from '../shell'

/* The command sidebar's model: every page with where it sits, its go-to key,
 * and how well it matches what's typed. Plain functions, no React. */

export const DEFAULT_COPY = {
  search: 'Search pages and actions',
  placeholder: 'Search or jump to…',
  results: 'Results',
  pages: 'Pages',
  actions: 'Actions',
  recent: 'Recent',
  /** Beside an action in the results, where a page shows its path. */
  action: 'Action',
  /** Under the field while G waits for a page's key, after a G key cap. */
  goHint: 'then a page’s key',
  /** Announced when G is pressed. */
  goStatus: 'Go to: press a page’s key',
}

export type FrameSidebarCommandCopy = typeof DEFAULT_COPY

/** Something the field can run besides going to a page: "New project", "Invite people". */
export interface FrameCommandAction {
  id: string
  label: string
  icon?: FrameIcon
  /** Runs it. The sidebar clears the field afterwards. */
  onSelect?: () => void
}

export interface CommandPage {
  item: FrameNavItem
  section: FrameNavSection
  /** The groups it's nested in, outermost first. */
  parents: FrameNavItem[]
  /** Its go-to key, pressed after G. */
  key?: string
}

/** Every page (a group isn't one itself; its pages are, at any depth), in nav order. */
export function pagesOf(nav: readonly FrameNavSection[]): CommandPage[] {
  const pages: CommandPage[] = navPages(nav).map((page) => ({ ...page }))
  // Each page's key is the first letter of its name not taken by a page above it.
  const taken = new Set<string>()
  for (const page of pages) {
    const key = [...page.item.label.toLowerCase()].find((c) => /[a-z]/.test(c) && !taken.has(c))
    if (key) {
      taken.add(key)
      page.key = key
    }
  }
  return pages
}

/** How well `label` answers `query`: the start of the name, then the start of a word, then anywhere. 0 is no match. */
export function score(label: string, query: string): number {
  const l = label.toLowerCase()
  const q = query.trim().toLowerCase()
  if (!q) return 0
  if (l.startsWith(q)) return 3
  if (l.includes(` ${q}`)) return 2
  return l.includes(q) ? 1 : 0
}

/** The pages that match, best first (nav order breaks ties); a section's name matching lists its pages after the rest. */
export function rank(pages: readonly CommandPage[], query: string): CommandPage[] {
  return pages
    .map((page, order) => {
      const own = score(page.item.label, query)
      const where = Math.max(score(page.section.label ?? '', query), ...page.parents.map((p) => score(p.label, query)))
      return { page, order, s: own || (where ? where / 10 : 0) }
    })
    .filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s || a.order - b.order)
    .map((r) => r.page)
}

/** Where a page sits, for its result: "Workspace › Projects". */
export function pathOf(page: CommandPage): string {
  return [page.section.label, ...page.parents.map((p) => p.label)].filter(Boolean).join(' › ')
}
