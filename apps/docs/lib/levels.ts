import { basics, CATEGORY_ORDER, ESSENTIALS, type BasicEntry } from './basics'
import { LEVEL_LABELS, type BasicLevel } from './level-paths'
import { taxonomy } from './taxonomy'

/* The level listed by category, in taxonomy.json's order, so an item filed
 * there appears with no edit here: the components (each its docs page). The
 * blocks are documented on the Blocks docs pages instead (lib/block-docs.ts). */

/** A level browsed by category: the components on their list. */
export type ListLevel = BasicLevel

/** What a card on a list is: a component of the Components list. */
export type ListEntry = BasicEntry

/** One category of a list: the components' `overlays`. */
export interface Category {
  kind: 'basics'
  level: ListLevel
  /** `overlays`: the components' category. */
  id: string
  title: string
  summary: string
  entries: ListEntry[]
  /** Essentials: its items are repeated from their own categories, so it adds nothing to the level's total. */
  repeats?: true
}

/** The group at the top of Components: the components most apps start with. */
export const ESSENTIALS_CATEGORY = 'essentials'

/** The items a level lists, in its order. */
export function levelEntries(level: ListLevel): ListEntry[] {
  return basics(level)
}

const cache = new Map<ListLevel, Category[]>()

/** A level's categories in the taxonomy's order, each with its items; the ones with nothing yet list as "soon". */
export function levelCategories(level: ListLevel): Category[] {
  const hit = cache.get(level)
  if (hit) return hit
  const entries = levelEntries(level)
  const many = LEVEL_LABELS[level].many.toLowerCase()
  const out: Category[] = Object.entries(taxonomy().levels[level].categories).map(([id, title]) => ({
    kind: 'basics',
    level,
    id,
    title,
    summary: `${title} ${many}.`,
    entries: entries.filter((e) => e.category === id),
  }))
  // The list's own order: Essentials first (each item also in its category below), then the categories basics-first.
  const rank = (id: string) => CATEGORY_ORDER.indexOf(id)
  const essentials = ESSENTIALS.flatMap((slug) => entries.filter((e) => e.slug === slug))
  const group: Category = { kind: 'basics', level, id: ESSENTIALS_CATEGORY, title: 'Essentials', summary: `The ${many} most apps start with.`, entries: essentials, repeats: true }
  const ordered = [group, ...[...out].sort((a, b) => rank(a.id) - rank(b.id))]
  cache.set(level, ordered)
  return ordered
}

export function levelCategory(level: ListLevel, id: string): Category | undefined {
  return levelCategories(level).find((c) => c.id === id)
}

/** How many things a category lists. */
export const countOf = (c: Category) => c.entries.length

/** How many items a list holds. */
export const levelTotal = (level: ListLevel) => levelCategories(level).reduce((n, c) => n + (c.repeats ? 0 : countOf(c)), 0)
