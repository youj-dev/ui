import type { ComponentType } from 'react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { installObservers, renderReduced } from '@youj/core/test-utils'
import type { IllustrationProps } from './kit'
import { illustrations } from './registry'

/* The per-scene registry items (scripts/generate-illustrations.mjs): one
 * `illustration-<id>` per registry entry, each shipping a copy of its scene
 * that stands on its own and draws exactly what the scene draws. */

beforeAll(installObservers)

interface Item {
  name: string
  categories?: string[]
  meta?: { scene: string; component: string; category: string; tags: string[] }
  registryDependencies: string[]
  dependencies: string[]
  files: { path: string }[]
}

const items: Item[] = JSON.parse(readFileSync(join(__dirname, '../../../../../registry/illustrations.json'), 'utf8'))
const byName = new Map(items.map((i) => [i.name, i]))

/** Markup with React's generated ids made positional, so two renders of one drawing compare equal. */
function markup(Component: ComponentType<IllustrationProps>) {
  const { container, unmount } = renderReduced(<Component />)
  const html = container.innerHTML
  unmount()
  const ids = new Map<string, string>()
  return html.replace(/kg-_r_[a-z0-9]+_/g, (id) => {
    if (!ids.has(id)) ids.set(id, `id${ids.size}`)
    return ids.get(id)!
  })
}

describe('illustration items', () => {
  test('the kit ships kit.tsx on the stage it draws on', () => {
    const kit = byName.get('illustration-kit')!
    expect(kit.files.map((f) => f.path)).toEqual(['src/components/youj/graphics/illustrations/kit.tsx'])
    expect(kit.registryDependencies).toContain('iso-scene')
  })

  test('every scene in the registry has its own item, and nothing else does', () => {
    const scenes = items.filter((i) => i.name !== 'illustration-kit')
    expect(scenes.map((i) => i.name)).toEqual(illustrations.map((e) => `illustration-${e.id}`))
  })

  test.each(illustrations.map((e) => [e.id, e] as const))('%s: one file, the kit, and what the registry says of it', (id, entry) => {
    const item = byName.get(`illustration-${id}`)!
    expect(item.files).toEqual([{ path: `src/components/youj/graphics/illustrations/scenes/${id}.tsx`, type: 'registry:component' }])
    expect(item.registryDependencies).toContain('illustration-kit')
    expect(item.categories).toEqual(['illustrations', entry.category])
    expect(item.meta).toMatchObject({ scene: id, category: entry.category, tags: 'tags' in entry ? entry.tags : [] })
  })

  test.each(illustrations.map((e) => [e.id, e] as const))('%s: the copy stands alone and draws what the scene draws', async (id, { Component }) => {
    const item = byName.get(`illustration-${id}`)!
    const module = (await import(`./scenes/${id}.tsx`)) as Record<string, ComponentType<IllustrationProps>>
    const Copy = module[item.meta!.component]!
    // Only the kit and the shapes: never a category file, which would bring the other scenes.
    const source = readFileSync(join(__dirname, 'scenes', `${id}.tsx`), 'utf8')
    for (const [, from] of source.matchAll(/from '(\.[^']+)'/g)) expect(from).toMatch(/^\.\.\/(kit|\.\.\/(iso|iso-[a-z-]+|tones|grids))$/)
    expect(Object.keys(module)).toEqual([item.meta!.component])
    expect(markup(Copy)).toBe(markup(Component))
  })
})
