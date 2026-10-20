// @vitest-environment node
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { registryItems } from './registry'
import { kindOf, pageStability, STABILITY, stabilityManifest, stabilityOf } from './stability'

const root = join(process.cwd(), '../..')
const LABELS = Object.keys(STABILITY)
// The packages scripts/release.mjs publishes.
const RELEASED = ['core', 'motion', 'loaders', 'sound', 'icons', 'illustrations', 'miniatures', 'ui', 'cli', 'mcp']

/** Every entry point a released package publishes: its import paths, or its name when it's a command. */
function publishedEntries(): string[] {
  return RELEASED.flatMap((dir) => {
    const pkg = JSON.parse(readFileSync(join(root, 'packages', dir, 'package.json'), 'utf8')) as { name: string; publishConfig?: { exports?: Record<string, unknown> } }
    // Loaders and miniatures have one entry each (`@youj/loaders/<id>`), labelled together as `@youj/loaders/*`.
    const keys = [...new Set(Object.keys(pkg.publishConfig?.exports ?? {}).filter((k) => !/\.(css|json)$/.test(k)).map((k) => ((dir === 'loaders' || dir === 'miniatures') && k !== '.' ? './*' : k)))]
    if (!keys.length) return [pkg.name]
    return keys.map((k) => (k === '.' ? pkg.name : `${pkg.name}/${k.slice(2)}`))
  })
}

describe('stability.json', () => {
  const m = stabilityManifest()
  const items = registryItems()

  it('labels every published entry point, and nothing else', () => {
    expect(Object.keys(m.packages).sort()).toEqual(publishedEntries().sort())
  })

  it('names only items that exist, with a known label', () => {
    expect(Object.keys(m.items).filter((name) => !items.has(name))).toEqual([])
    for (const value of [...Object.values(m.items), ...Object.values(m.kinds), ...Object.values(m.packages)]) expect(LABELS).toContain(value)
  })

  it('gives every registry item a label', () => {
    const unlabeled = [...items.values()].filter((item) => !LABELS.includes(stabilityOf(item))).map((item) => item.name)
    expect(unlabeled).toEqual([])
  })

  // What a release promises (versioning.mdx): a stable thing may rest only on stable things.
  const named = (ref: string) => items.get(ref.replace(/^.*\/r\/(?:v[^/]+\/)?|\.json$/g, ''))

  it('never lets a stable item depend on one that is not stable', () => {
    const breaks = [...items.values()].flatMap((item) =>
      stabilityOf(item) !== 'stable' ? [] : (item.registryDependencies ?? []).flatMap((ref) => (named(ref) && stabilityOf(named(ref)!) !== 'stable' ? [`${item.name} (stable) depends on ${named(ref)!.name} (${stabilityOf(named(ref)!)})`] : [])),
    )
    expect(breaks).toEqual([])
  })

  /** The entry point an item is imported from: a sub-entry with its own label, else the package. */
  const SUB_ENTRY: Record<string, string> = { locale: 'locales/*', interaction: 'interactions', background: 'backgrounds', player: 'players' }
  const entryOf = (item: Parameters<typeof kindOf>[0]) => {
    const sub = SUB_ENTRY[kindOf(item)]
    return sub && m.packages[`${item.package}/${sub}`] ? `${item.package}/${sub}` : item.package
  }

  it('never lets a stable package export an item that is not stable', () => {
    const breaks = [...items.values()].filter((item) => m.packages[entryOf(item)] === 'stable' && stabilityOf(item) !== 'stable').map((item) => `${entryOf(item)} (stable) exports ${item.name} (${stabilityOf(item)})`)
    expect(breaks).toEqual([])
  })

  it('sorts items into the kinds the defaults describe', () => {
    const kind = (name: string) => kindOf(items.get(name)!)
    expect(kind('button')).toBe('component')
    expect(kind('reveal')).toBe('motion')
    expect(kind('dock')).toBe('interaction')
    expect(kind('aurora')).toBe('background')
    expect(kind('lottie-player')).toBe('player')
    expect(kind('loader-kit')).toBe('loader')
    expect(kind('auth-login')).toBe('block')
    expect(kind('icon-swap')).toBe('icon')
    expect(kind('sound')).toBe('sound')
  })
})

describe('pageStability', () => {
  it('reads a component page from its item, and an overview from its entry', () => {
    expect(pageStability('/docs/components/button')).toBe('alpha')
    expect(pageStability('/docs/components/presentation')).toBe('experimental')
    expect(pageStability('/docs/components/kanban')).toBe('alpha')
    expect(pageStability('/docs/loaders')).toBe('alpha')
    expect(pageStability('/docs/installation')).toBeUndefined()
  })
})
