import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/* The ladder, from the repository's taxonomy.json: each item's level and its
 * category within that level, keyed by registry item name. The registry
 * carries the same two fields as meta.level and meta.category (UI's generator
 * writes them from this file); motion's components and the block compositions
 * have them only here. Each level browses on its own list, never mixed. */

export type Level = 'component' | 'card' | 'section' | 'frame' | 'screen'

/** Bottom to top: an item composes its own level and below, never above. */
export const LEVELS: readonly Level[] = ['component', 'card', 'section', 'frame', 'screen']

/** What a component is made of: one control, surface, mark or effect, or several cooperating parts or a model. */
export type Complexity = 'simple' | 'composite'

export interface LevelInfo {
  /** `Card`. */
  one: string
  /** `Cards`. */
  many: string
  summary: string
  /** Category id to its label, in display order: `status-and-health` → `Status & health`. */
  categories: Record<string, string>
}

/** What an overlay card opens in. */
export type Opens = 'dialog' | 'sheet' | 'popover' | 'banner'

export interface TaxonomyEntry {
  level: Level
  /** A component's complexity; no other level has one. */
  complexity?: Complexity
  /** A category id of its level. */
  category: string
  /** A card that opens over the page: what it opens in. A card without it sits in the page. */
  opens?: Opens
  /** The same data at another level (the status card and the status page), which each one's page links. */
  counterpart?: string
  /** A screen that lives inside an app's content area: Create offers it. */
  inApp?: true
  /** Kept (source, stories, registry item, `youj add`) but unlisted: left out of the docs, search, llms.txt and the MCP index. Delete the flag to list it again. */
  hidden?: true
  /** Shown as a part of this item rather than on its own. */
  partOf?: string
  /** A group of items to merge into one. */
  merge?: string
  /** A known ladder problem to fix. */
  flag?: string
}

export interface Taxonomy {
  levels: Record<Level, LevelInfo>
  items: Record<string, TaxonomyEntry>
}

let cache: Taxonomy | undefined

export function taxonomy(root = join(/*turbopackIgnore: true*/ process.cwd(), '../..')): Taxonomy {
  cache ??= JSON.parse(readFileSync(join(root, 'taxonomy.json'), 'utf8')) as Taxonomy
  return cache
}

/** An item's level and category, by registry item name (`app-percentile-trend`, `button`). */
export function taxonomyOf(name: string): TaxonomyEntry | undefined {
  return taxonomy().items[name]
}
