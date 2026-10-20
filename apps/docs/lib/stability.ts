import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { registryItems, type RegistryItem } from './registry'
import { pageFor } from './showcase'

/* How settled each part of Youj is, from the repository's stability.json:
 * a label per published entry point, a default per kind of item and the
 * items that differ from it. The docs header shows a page's label
 * (components/docs/stability-badge.tsx) and the MCP index carries each
 * item's. The rule is on /docs/versioning. */

export type Stability = 'stable' | 'alpha' | 'experimental'

export type ItemKind = 'component' | 'motion' | 'interaction' | 'background' | 'player' | 'loader' | 'block' | 'hook' | 'lib' | 'icon' | 'illustration' | 'locale' | 'sound'

export interface StabilityManifest {
  packages: Record<string, Stability>
  kinds: Record<ItemKind, Stability>
  items: Record<string, Stability>
}

export const STABILITY: Record<Stability, { label: string; summary: string }> = {
  stable: { label: 'Stable', summary: 'Settled API. A breaking change comes only after a release that deprecates it and warns first.' },
  alpha: { label: 'Alpha', summary: 'The default while Youj is in alpha. Ready to use, but its API may still change in a 0.x minor release, announced in the changelog with a migration note.' },
  experimental: { label: 'Experimental', summary: 'Still being shaped. It may change or go in any minor release, without a deprecation first. Pin the version.' },
}

let manifest: StabilityManifest | undefined

export function stabilityManifest(root = join(/*turbopackIgnore: true*/ process.cwd(), '../..')): StabilityManifest {
  manifest ??= JSON.parse(readFileSync(join(root, 'stability.json'), 'utf8')) as StabilityManifest
  return manifest
}

/** What an item is, for its default label: read from its package, registry type and folder. */
export function kindOf(item: Pick<RegistryItem, 'package' | 'type' | 'files'>): ItemKind {
  const path = item.files?.[0]?.path ?? ''
  switch (item.package) {
    case '@youj/react':
      if (item.type === 'registry:ui') return 'component'
      if (item.type === 'registry:block') return 'block'
      if (item.type === 'registry:hook') return 'hook'
      return 'lib'
    case '@youj/core':
      return path.startsWith('src/locales/') ? 'locale' : 'lib'
    case '@youj/loaders':
      return 'loader'
    case '@youj/motion':
      if (path.includes('/backgrounds/')) return 'background'
      if (path.includes('/interactions/')) return 'interaction'
      if (path.includes('/players/') || path.startsWith('public/samples/')) return 'player'
      if (item.type === 'registry:lib') return 'lib'
      return 'motion'
    case '@youj/icons':
      return 'icon'
    case '@youj/illustrations':
      return 'illustration'
    case '@youj/sound':
      return 'sound'
    default:
      return 'lib'
  }
}

/** An item's label: its own entry, else its kind's default. */
export function stabilityOf(item: Pick<RegistryItem, 'name' | 'package' | 'type' | 'files'>, m = stabilityManifest()): Stability {
  return m.items[item.name] ?? m.kinds[kindOf(item)]
}

/** Docs pages about a package or an entry rather than one item. */
const PAGE_ENTRIES: Record<string, string> = {
  '/docs/cli': 'youj',
  '/docs/mcp': '@youj/mcp',
  '/docs/loaders': '@youj/loaders',
  '/docs/icons': '@youj/icons',
  '/docs/illustrations': '@youj/illustrations',
  '/docs/miniatures': '@youj/miniatures',
}

let byPage: Map<string, RegistryItem[]> | undefined

/** The label a docs page shows: its item's (the one named like the page, else the first it documents), or its entry's. */
export function pageStability(url: string): Stability | undefined {
  if (!byPage) {
    byPage = new Map()
    for (const item of registryItems().values()) {
      const page = pageFor(item.name)
      if (page) byPage.set(page, [...(byPage.get(page) ?? []), item])
    }
  }
  const items = byPage.get(url)
  const key = url.split('/').pop()
  const item = items?.find((i) => i.name === key) ?? items?.[0]
  if (item) return stabilityOf(item)
  const entry = PAGE_ENTRIES[url]
  return entry ? stabilityManifest().packages[entry] : undefined
}
