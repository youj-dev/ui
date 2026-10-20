// The categories' own module, not the package: the package's scenes are client modules every docs page would load.
import { illustrationCategories } from '@youj/illustrations/components/youj/graphics/illustrations/categories'
import { loaderCategories, loaderEntries } from '@/components/loaders/entries'
import { registryItems } from './registry'

export type KitName = 'loaders' | 'illustrations'

/**
 * The ids a visual kit ships, by category, read from its registry items so a
 * new one appears here with nothing to edit. For a page's text; the galleries
 * show them drawn.
 */
export function kitNameRows(kit: KitName): { category: string; ids: string[] }[] {
  if (kit === 'loaders') {
    const entries = loaderEntries()
    return loaderCategories()
      .map(({ id, title }) => ({ category: title, ids: entries.filter((entry) => entry.category === id).map((entry) => entry.id) }))
      .filter((row) => row.ids.length > 0)
  }
  const scenes = new Map<string, string[]>()
  for (const item of registryItems().values()) {
    const meta = (item as { meta?: { scene?: string; category?: string } }).meta
    if (!meta?.scene || item.name !== `illustration-${meta.scene}`) continue
    scenes.set(meta.category ?? '', [...(scenes.get(meta.category ?? '') ?? []), meta.scene])
  }
  return illustrationCategories
    .map(({ id, name }) => ({ category: name, ids: (scenes.get(id) ?? []).sort() }))
    .filter((row) => row.ids.length > 0)
}

