import type { ComponentType } from 'react'
import { illustrationCategories, illustrations, type IllustrationProps } from '@youj/illustrations'
import { indexIcons, searchIndex, type SearchIndex } from '@/components/icons/search'

/* The explorer's catalog, read from the illustrations registry, so a scene
 * added there shows up here with no edit: its id, name, category and tags
 * from the registry entry; its one-line description and export name from its
 * registry item (the server reads those, see app/illustrations/page.tsx),
 * falling back to the naming convention for a scene whose item isn't built
 * yet. */

/** What the server knows about a scene from its registry item. */
export interface SceneDetail {
  /** The export name: `IllustrationCoffee`. */
  component: string
  /** The scene's doc comment: what it shows. */
  description: string
}

export interface SceneEntry {
  id: string
  name: string
  category: string
  categoryName: string
  tags: readonly string[]
  component: string
  description: string
  Component: ComponentType<IllustrationProps>
}

/** A block that takes an illustration (its `illustration` slot). */
export interface BlockLink {
  /** Its page on its level's list: `/docs/blocks/onboarding-and-states`. */
  href: string
  title: string
  group: string
}

export interface CategoryEntry {
  id: string
  name: string
  count: number
}

/** `server-rack` → `IllustrationServerRack`, the convention every scene's export follows. */
export const componentName = (id: string) => `Illustration${id.replace(/(^|-)([a-z0-9])/g, (_, __, c: string) => c.toUpperCase())}`

export function sceneEntries(details: Record<string, SceneDetail> = {}): SceneEntry[] {
  const names = new Map<string, string>(illustrationCategories.map((c) => [c.id, c.name]))
  return illustrations.map((entry) => {
    const { id, name, category, Component } = entry
    const tags: readonly string[] = 'tags' in entry && Array.isArray(entry.tags) ? entry.tags : []
    const detail = details[id]
    return {
      id,
      name,
      category,
      categoryName: names.get(category) ?? category,
      tags,
      component: detail?.component ?? componentName(id),
      description: detail?.description ?? '',
      Component: Component as ComponentType<IllustrationProps>,
    }
  })
}

/** Every category in the registry's order, with how many scenes it holds. */
export function categoryEntries(scenes: readonly SceneEntry[]): CategoryEntry[] {
  return illustrationCategories.map((c) => ({ id: c.id, name: c.name, count: scenes.filter((s) => s.category === c.id).length }))
}

/** Search by id, name, tags, category and what the scene shows: forgiving of typos and prefixes, as the icons' search is. */
export function indexScenes(scenes: readonly SceneEntry[]): SearchIndex<SceneEntry> {
  const describe = (s: SceneEntry) => ({ name: s.id, keywords: [s.name, ...s.tags], category: `${s.category} ${s.categoryName}`.toLowerCase(), description: s.description })
  return indexIcons(scenes, describe, scenes.map(describe))
}

export const searchScenes = (index: SearchIndex<SceneEntry>, query: string) => searchIndex(index, query)
