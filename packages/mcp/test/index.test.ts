import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { loadIndex } from '../src/data'
import { INDEX_FILES } from '../src/types'

/* The index's shape and its links to what ships. `pnpm test` regenerates
 * the index first, so these check what the current sources produce. */

const pkg = join(import.meta.dirname, '..')
const index = loadIndex()

describe('index', () => {
  it('is for this package’s version', () => {
    const { version } = JSON.parse(readFileSync(join(pkg, 'package.json'), 'utf8')) as { version: string }
    expect(index.meta).toMatchObject({ schema: 1, version, site: 'https://www.youj.dev' })
  })

  it('has every file, and the block files in sources/, and nothing else', () => {
    expect(readdirSync(join(pkg, 'data')).sort()).toEqual([...Object.values(INDEX_FILES), 'sources'].sort())
  })

  it('covers every UI and motion component in the registry', () => {
    const registry = (area: string) =>
      readdirSync(join(pkg, '..', area, 'registry'))
        .filter((f) => f.endsWith('.json'))
        .flatMap((f) => JSON.parse(readFileSync(join(pkg, '..', area, 'registry', f), 'utf8')) as { name: string; type: string }[])
    const ui = registry('ui').filter((i) => i.type === 'registry:ui').map((i) => i.name)
    const names = new Set(index.components.map((c) => c.name))
    expect(ui.filter((name) => !names.has(name))).toEqual([])
    expect(index.icons.length).toBe(registry('icons').filter((i) => /^icon-/.test(i.name) && i.type === 'registry:component' && !['icon-swap'].includes(i.name)).length)
  })

  it('gives every block a level and a category, and the ladder’s components theirs', () => {
    for (const s of index.blocks) expect([s.level, s.category], s.slug).not.toContain(undefined)
    expect(index.blocks.find((b) => b.slug === 'app-percentile-trend')).toMatchObject({ level: 'card', category: 'trends-and-comparisons' })
    expect(index.components.find((c) => c.name === 'date-picker')).toMatchObject({ level: 'component', complexity: 'composite', levelCategory: 'pickers-and-inputs' })
    expect(index.components.find((c) => c.name === 'aurora')).toMatchObject({ level: 'component', complexity: 'simple', levelCategory: 'backgrounds' })
    expect(index.components.filter((c) => c.kind === 'ui' && !c.level).map((c) => c.name)).toEqual([])
  })

  it('links only to what it has', () => {
    const docs = new Set(index.docs.map((d) => d.slug))
    for (const c of index.components) if (c.docs) expect(docs.has(c.docs), c.name).toBe(true)
    const icons = new Set(index.icons.map((i) => i.name))
    for (const [a, b] of index.pairs.youj) expect(icons.has(a) && icons.has(b), `${a} → ${b}`).toBe(true)
    for (const s of index.blocks) for (const f of s.files) expect(existsSync(new URL(`../data/sources/`, import.meta.url)), f).toBe(true)
    for (const c of index.components) for (const e of c.exports) expect(index.props[e] ?? null, e).not.toBeUndefined()
  })
})
