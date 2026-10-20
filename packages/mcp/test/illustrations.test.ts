import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import { Catalog } from '../src/catalog'
import { loadCatalog } from '../src/data'
import { getAddCommand } from '../src/tools/add'
import { getComponent, search } from '../src/tools/components'
import { listIllustrations } from '../src/tools/illustrations'

let catalog: Catalog
beforeAll(() => {
  catalog = loadCatalog()
})
const fixtures = join(import.meta.dirname, 'fixtures')
const top = (query: string, n: number, kinds?: Parameters<Catalog['search']>[1]) =>
  catalog.search(query, kinds, n).map((h) => `${h.item.kind}:${'id' in h.item.item ? h.item.item.id : 'name' in h.item.item ? h.item.item.name : h.item.item.slug}`)

describe('illustration index', () => {
  it('has every scene the registry has, with its category and tags', () => {
    const registry = JSON.parse(readFileSync(join(import.meta.dirname, '../../illustrations/registry/illustrations.json'), 'utf8')) as { name: string; meta?: { scene: string; category: string; tags: string[] } }[]
    const items = registry.filter((i) => i.meta && i.name === `illustration-${i.meta.scene}`)
    expect(items.length).toBeGreaterThan(100)
    const byId = new Map(catalog.index.illustrations.scenes.map((s) => [s.id, s]))
    expect(items.filter((i) => !byId.has(i.meta!.scene)).map((i) => i.name)).toEqual([])
    for (const item of items) expect(byId.get(item.meta!.scene), item.name).toMatchObject({ category: item.meta!.category, tags: item.meta!.tags, registry: item.name })
    const categories = new Set(catalog.index.illustrations.categories.map((c) => c.id))
    for (const scene of byId.values()) expect(categories.has(scene.category), scene.id).toBe(true)
  })
})

describe('search', () => {
  it('finds a scene by name, category and tag', () => {
    expect(top('illustration coffee', 3)[0]).toBe('illustration:coffee')
    expect(top('coffee', 5, ['illustration'])[0]).toBe('illustration:coffee')
    expect(top('food', 12, ['illustration'])).toContain('illustration:coffee')
    expect(top('cafe', 3, ['illustration'])[0]).toBe('illustration:coffee')
    expect(top('database', 3, ['illustration'])[0]).toBe('illustration:database')
  })

  it('answers with the install command and the tool to call next', () => {
    const out = search(catalog, 'coffee', ['illustration'], 3)
    expect(out).toContain('npx @youj/cli add illustration-coffee')
    expect(out).toContain('get_component("illustration-coffee")')
  })

  it('finds the illustration builder', () => {
    const hit = catalog.search('illustration builder', ['docs'], 3)[0]!.item
    expect(hit.kind === 'docs' && hit.item.slug).toBe('illustrations/build')
    expect(top('draw my own illustration', 8)).toEqual(expect.arrayContaining([expect.stringMatching(/^(docs:illustrations\/build|component:(iso-scene|illustration-kit))$/)]))
  })
})

describe('get_add_command', () => {
  it('returns the CLI command for a scene, in a project on the package or the registry, and in none', async () => {
    const command = '```bash\nnpx @youj/cli add illustration-coffee\n```'
    expect(await getAddCommand(catalog, ['illustration-coffee'], join(fixtures, 'registry'))).toBe(command)
    expect(await getAddCommand(catalog, ['illustration-coffee'], join(fixtures, 'package'))).toContain(command)
    expect(await getAddCommand(catalog, ['Illustration-Coffee', 'IllustrationDatabase'], join(fixtures, 'registry'))).toBe('```bash\nnpx @youj/cli add illustration-coffee illustration-database\n```')
  })

  it('names the import a copied scene gets and the package route', async () => {
    const out = await getAddCommand(catalog, ['illustration-coffee'], join(fixtures, 'package'))
    expect(out).toContain("import { IllustrationCoffee } from '@/components/youj/graphics/illustrations/scenes/coffee'")
    expect(out).toContain("@youj/illustrations")
  })

  it('installs the illustration kit only through the CLI', async () => {
    const out = await getAddCommand(catalog, ['illustration-kit'], join(fixtures, 'package'))
    expect(out).toContain('npx @youj/cli add illustration-kit')
    expect(out).not.toMatch(/pnpm|npm install|yarn add|bun add/)
  })

  it('suggests a scene for a near miss and never installs a guess', async () => {
    await expect(getAddCommand(catalog, ['illustration-cofee'], join(fixtures, 'registry'))).rejects.toThrow(/Did you mean illustration-coffee/)
    await expect(getAddCommand(catalog, ['coffee'], join(fixtures, 'registry'))).rejects.toThrow('Unknown item')
  })
})

describe('get_component', () => {
  it('returns the Illustration docs', () => {
    const out = getComponent(catalog, 'Illustration')
    expect(out).toContain('# Illustrations')
    expect(out).toContain("import { Illustration } from '@youj/illustrations'")
    expect(out).toContain('scene')
    expect(out).toContain('/docs/illustrations')
    expect(out).toContain('npx @youj/cli add illustrations')
    expect(getComponent(catalog, 'illustrations')).toBe(out)
  })

  it('describes one scene', () => {
    const out = getComponent(catalog, 'illustration-coffee')
    expect(out).toContain('# Coffee illustration')
    expect(out).toContain('npx @youj/cli add illustration-coffee')
    expect(out).toContain("import { Illustration, IllustrationCoffee } from '@youj/illustrations'")
    expect(getComponent(catalog, 'IllustrationCoffee')).toBe(out)
  })

  it('says the illustration kit is copy-in only and where the builder is', () => {
    const out = getComponent(catalog, 'illustration-kit')
    expect(out).toContain('Copy-in only')
    expect(out).toContain('npx @youj/cli add illustration-kit')
    expect(out).not.toContain('pnpm add')
    expect(catalog.doc('illustrations/build')!.markdown).toMatch(/Copy code[\s\S]*npx @youj\/cli add illustration-kit iso-shapes/)
  })

  it('covers the kit’s shapes', () => {
    expect(getComponent(catalog, 'IsoBox')).toContain("from '@youj/illustrations'")
    expect(getComponent(catalog, 'iso-scene')).toContain('IsoScene')
  })
})

describe('list_illustrations', () => {
  it('lists the categories with their scenes', () => {
    const out = listIllustrations(catalog)
    expect(out).toMatch(/\*\*Food\*\* \(`food`, \d+\): .*coffee/)
    expect(out).toContain('/illustrations/build')
    expect(out).toContain('illustration-kit')
    for (const c of catalog.index.illustrations.categories) expect(out).toContain(`\`${c.id}\``)
  })

  it('lists one category with tags and the install command, by id or name', () => {
    const out = listIllustrations(catalog, 'food')
    expect(out).toMatch(/- `coffee` Coffee \(`IllustrationCoffee`; tags: cafe, drink/)
    expect(out).toContain('npx @youj/cli add illustration-<id>')
    expect(listIllustrations(catalog, 'Food')).toBe(out)
    expect(out).not.toContain('`database`')
  })

  it('names the categories when one is unknown', () => {
    expect(() => listIllustrations(catalog, 'nope')).toThrow(/Categories: data, /)
  })
})
