import { DEFAULT_TONE_ROLES, LOADER_CATEGORIES, TONE_ROLE_COLORS, type LoaderToneRole } from '@youj/loaders'
import { registryItems } from '@/lib/registry'
import type { LoaderEntry, CategoryEntry } from './catalog'

/* Server-side: every loader from its registry item (`loader-<id>`,
 * written by packages/loaders' scripts/loaders.mjs from the loader's
 * own meta), in gallery order, so one added there shows up here with
 * nothing else to edit. */

interface LoaderMeta {
  loader: string
  component: string
  category: string
  technique: string
  order: number
  title: string
  tags: string[]
  beats: number
  colors: { part: string; role?: string }[]
}

type Found = Omit<LoaderEntry, 'number'> & { order: number }

export const loaderCategories = (): CategoryEntry[] => LOADER_CATEGORIES.map(({ id, title, blurb }) => ({ id, title, blurb }))

export function loaderEntries(): LoaderEntry[] {
  const rank = new Map<string, number>(LOADER_CATEGORIES.map((c, i) => [c.id, i]))
  const found: Found[] = []
  for (const item of registryItems().values()) {
    const meta = (item as { meta?: Partial<LoaderMeta> }).meta
    if (!item.name.startsWith('loader-') || !meta?.loader || !meta.component) continue
    found.push({
      id: meta.loader,
      title: meta.title ?? meta.loader,
      component: meta.component,
      category: meta.category ?? 'depth',
      technique: meta.technique ?? 'mixed',
      tags: meta.tags ?? [],
      // The item's description leads with the loader's own; the rest is the set's shared line.
      description: (item.description ?? '').split(' One of the Youj loaders')[0]!,
      beats: meta.beats ?? 4,
      ...(meta.colors?.length && { colors: meta.colors.map(({ part, role }, i) => {
          const named = (role ?? DEFAULT_TONE_ROLES[i]!) as LoaderToneRole
          return { part, role: named, color: TONE_ROLE_COLORS[named] }
        }) }),
      order: meta.order ?? 99,
    })
  }
  return found
    .sort((a, b) => (rank.get(a.category) ?? 99) - (rank.get(b.category) ?? 99) || a.order - b.order || a.id.localeCompare(b.id))
    .map(({ order: _order, ...entry }, i) => ({ ...entry, number: i + 1 }))
}
