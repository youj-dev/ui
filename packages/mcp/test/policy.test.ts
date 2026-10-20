import { join } from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import { Catalog } from '../src/catalog'
import { loadCatalog } from '../src/data'
import { TEMPLATES } from '@youj/illustrations/builder'
import { getAddCommand } from '../src/tools/add'
import { drawIllustration, illustrationGuide } from '../src/tools/draw'
import { getComponent, search } from '../src/tools/components'
import { getIcon } from '../src/tools/icons'
import { getScene, listIllustrations } from '../src/tools/illustrations'
import { motionGuidance } from '../src/tools/motion'
import { setup } from '../src/tools/setup'
import { getShowcase, listShowcase } from '../src/tools/showcase'

/* The docs policy, checked on what the tools answer: people import from
 * @youj/react (and motion, /icons, /sound), and source is copied in
 * only with `npx youj add`. A tool answer shows neither the shadcn
 * commands nor the repository's own paths and relative imports. */

let catalog: Catalog
beforeAll(() => {
  catalog = loadCatalog()
})
const fixtures = join(import.meta.dirname, 'fixtures')

/** The answers a person could act on, one per tool call, keyed by the call. */
async function answers(): Promise<Map<string, string>> {
  const out = new Map<string, string>()
  const record = async (label: string, work: () => string | Promise<string>) => { out.set(label, await work()) }
  for (const c of catalog.index.components) {
    await record(`get_component ${c.name}`, () => getComponent(catalog, c.name))
    await record(`get_add_command ${c.name}`, () => getAddCommand(catalog, [c.name], fixtures))
    await record(`get_add_command ${c.name} (registry)`, () => getAddCommand(catalog, [c.name], join(fixtures, 'registry')))
  }
  for (const s of catalog.index.illustrations.scenes) {
    await record(`scene ${s.id}`, () => getScene(catalog, s))
    await record(`get_add_command ${s.registry}`, () => getAddCommand(catalog, [s.registry], fixtures))
  }
  await record('list_illustrations', () => listIllustrations(catalog))
  await record('get_illustration_guide', () => illustrationGuide(catalog))
  for (const { id, scene } of TEMPLATES) {
    await record(`draw_illustration ${id}`, () => drawIllustration(catalog, scene, { cwd: join(fixtures, 'package') }).text)
    await record(`draw_illustration ${id} (registry)`, () => drawIllustration(catalog, scene, { cwd: join(fixtures, 'registry') }).text)
  }
  await record('list_blocks', () => listShowcase(catalog))
  for (const item of catalog.index.blocks) {
    await record(`get_block ${item.slug}`, () => getShowcase(catalog, item.slug))
    const name = item.registry ?? item.slug
    await record(`get_add_command ${name}`, () => getAddCommand(catalog, [name], fixtures))
    await record(`get_add_command ${name} (registry)`, () => getAddCommand(catalog, [name], join(fixtures, 'registry')))
  }
  for (const icon of catalog.index.icons.slice(0, 40)) await await record(`get_icon ${icon.name}`, () => getIcon(catalog, icon.name))
  for (const query of ['button', 'illustration coffee', 'data grid', 'settings page', 'copy source', 'install', 'shadcn']) await record(`search ${query}`, () => search(catalog, query, undefined, 25))
  for (const framework of ['next-app', 'vite', 'astro'] as const) for (const mode of ['package', 'registry'] as const) await record(`setup ${framework} ${mode}`, () => setup(catalog, { framework, mode }))
  await record('motion_guidance', () => motionGuidance(catalog, 'interface sounds'))
  return out
}

describe('the docs policy', () => {
  it('never shows shadcn as the way to install', async () => {
    expect((await answers()).size).toBeGreaterThan(600)
    const bad = [...(await answers())].filter(([, text]) => /(?:npx|pnpm dlx|bunx|yarn dlx)\s+shadcn|shadcn(?:@latest)?\s+add|\/r\/[\w-]+\.json/.test(text)).map(([label]) => label)
    expect(bad).toEqual([])
  })

  it('never shows the repository’s own paths or relative imports', async () => {
    const bad = [...(await answers())].filter(([, text]) => /packages\/(?:ui|motion|mcp|cli)\/|apps\/docs\/|from '(?:\.\.\/){2,}/.test(text)).map(([label]) => label)
    expect(bad).toEqual([])
  })

  it('imports from the package, never from a copied path, except for what only the CLI copies', async () => {
    for (const [label, text] of (await answers())) {
      // A copied block or scene, or a drawn one, is imported through the app's alias; a component never is.
      if (/^(?:get_block|get_add_command|scene|draw_illustration) /.test(label)) continue
      expect(text, label).not.toMatch(/from '@\/components\//)
    }
  })

  it('never recommends a SoundProvider: sound is YoujProvider’s `sound` option', async () => {
    const bad = [...(await answers())].filter(([, text]) => /SoundProvider/.test(text)).map(([label]) => label)
    expect(bad).toEqual([])
    expect(catalog.index.docs.filter((d) => /SoundProvider/.test(d.markdown)).map((d) => d.slug)).toEqual([])
    for (const [label, text] of (await answers())) expect(text, label).not.toMatch(/<SoundProvider|import \{[^}]*SoundProvider/)
  })

  it('names no deprecated Button API: danger, and AsyncButton for work that runs on press', async () => {
    // `variant="destructive"` is shadcn's old name for `danger`, and `onAction` moved from Button to AsyncButton.
    const deprecated = /<Button\b[^>]*(?:variant="destructive"|\bonAction\b)/
    expect([...(await answers())].filter(([, text]) => deprecated.test(text)).map(([label]) => label)).toEqual([])
    expect(catalog.index.docs.filter((d) => deprecated.test(d.markdown)).map((d) => d.slug)).toEqual([])
  })

  it('copies in only with the CLI: every install command is npx youj add', async () => {
    for (const [label, text] of (await answers())) for (const [, name] of text.matchAll(/npx (\S+) (?:add|init)/g)) expect(name, label).toBe('youj')
  })

  it('shows source as the CLI writes it', async () => {
    for (const item of catalog.index.blocks.slice(0, 40)) {
      if (!item.files.length) continue
      const text = await getShowcase(catalog, item.slug, { source: true })
      expect(text, item.slug).not.toMatch(/from '(?:\.\.\/){2,}/)
      expect(text, item.slug).not.toContain("from '@youj/motion/src/")
    }
  })

  it('shows no shadcn install command in the docs pages’ code, except on the page about the shadcn CLI', async () => {
    // "Using with shadcn" documents adding @youj items with the shadcn CLI, and says when `npx youj add` is the better choice.
    const SHADCN_PAGE = 'shadcn-registry'
    const fenced = /```[^\n]*\n([\s\S]*?)```/g
    const shows = (d: (typeof catalog.index.docs)[number]) => [...d.markdown.matchAll(fenced)].some(([, body]) => /shadcn(?:@latest)?\s+add/.test(body!))
    expect(catalog.index.docs.filter(shows).map((d) => d.slug).filter((slug) => slug !== SHADCN_PAGE)).toEqual([])
    expect(catalog.index.docs.find((d) => d.slug === SHADCN_PAGE)?.markdown).toContain('npx youj add')
  })
})
