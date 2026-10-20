import { registryItems, type RegistryItem } from './registry'
import { LEVELS, taxonomy, type Level } from './taxonomy'

/* What ships, counted from the registry fragments at build time, so a number
 * on the site can't drift from the packages. */

export type Area = 'ui' | 'motion' | 'transitions' | 'effects' | 'interactions' | 'backgrounds' | 'players' | 'icons'

const MOTION_AREA = /^src\/components\/youj\/(motion|transitions|effects|players|icons|interactions|backgrounds)\//

/** The area an installable component belongs to; undefined for libs, hooks and files. */
export function areaOf(item: RegistryItem): Area | undefined {
  if (item.type === 'registry:ui') return 'ui'
  if (item.type !== 'registry:component') return undefined
  const match = MOTION_AREA.exec(item.files?.[0]?.path ?? '')
  if (!match) return undefined
  const area = match[1] as Area
  // The set's own icons are `icon-<name>` from icons/<name>.tsx; IconSwap and YoujIcon are motion for icons.
  const icon = item.name.startsWith('icon-') && item.files?.[0]?.path === `src/components/youj/icons/${item.name.slice('icon-'.length)}.tsx`
  if (area === 'icons' && !icon) return undefined
  return area
}

export interface Catalog {
  ui: number
  /** Every icon in the set, brand marks included. */
  icons: number
  /** The icons that are an owner's brand mark (`icon-brand-*`): static, and not MIT. */
  brandMarks: number
  motion: Record<Exclude<Area, 'ui' | 'icons'>, number> & { total: number }
}

export function catalog(items: Iterable<RegistryItem> = registryItems().values()): Catalog {
  const counts: Record<Area, number> = { ui: 0, motion: 0, transitions: 0, effects: 0, interactions: 0, backgrounds: 0, players: 0, icons: 0 }
  let brandMarks = 0
  for (const item of items) {
    const area = areaOf(item)
    if (area) counts[area]++
    if (area === 'icons' && item.name.startsWith('icon-brand-')) brandMarks++
  }
  const { ui, icons, ...motion } = counts
  return { ui, icons, brandMarks, motion: { ...motion, total: Object.values(motion).reduce((a, b) => a + b, 0) } }
}

/** How many items each level of the ladder holds (taxonomy.json), bottom to top. */
export function levelCounts(items = taxonomy().items): Record<Level, number> {
  const counts = Object.fromEntries(LEVELS.map((level) => [level, 0])) as Record<Level, number>
  for (const { level } of Object.values(items)) counts[level]++
  return counts
}

/** How many illustrations ship: every scene is its own item, `illustration-<id>`, naming its scene in `meta`; the kit they share isn't a scene. */
export function sceneCount(items: Iterable<RegistryItem> = registryItems().values()): number {
  return [...items].filter((item) => {
    const scene = (item as { meta?: { scene?: string } }).meta?.scene
    return scene !== undefined && item.name === `illustration-${scene}`
  }).length
}

/** The icon set's names, as the gallery and `<name>Icon` use them: `bell`, `check-circle`… */
export function iconNames(items: Iterable<RegistryItem> = registryItems().values()): string[] {
  return [...items].filter((item) => areaOf(item) === 'icons').map((item) => item.name.slice('icon-'.length))
}

/**
 * Everything `youj add <name>` brings along: the item's registry
 * dependencies, recursively, in the order they're first reached.
 */
export function dependencyClosure(name: string, items: Map<string, RegistryItem> = registryItems()): string[] {
  const seen = new Set<string>()
  const visit = (current: string) => {
    for (const raw of items.get(current)?.registryDependencies ?? []) {
      const dep = raw.replace(/^.*\/r\/|\.json$/g, '')
      if (seen.has(dep) || dep === name) continue
      seen.add(dep)
      visit(dep)
    }
  }
  visit(name)
  return [...seen]
}
