// Writes the install test's pages into an app: every docs example (copied verbatim, as a reader
// copies it from the Code tab), every block `npx @youj/cli add` wrote (read from youj.json), the
// illustration builder's templates as its Copy code writes them, every icon, illustration, loader
// and miniature, and each sound pack, each rendered in an error boundary.
// Next.js gets one dynamic page per group (rendered per request, so one item that throws on the
// server doesn't stop the build) and, separately, one static page per example and block.
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { dirname, join } from 'node:path'

// The illustration builder's code generator is TypeScript importing its siblings without an extension.
registerHooks({
  resolve: (spec, context, next) => (context.parentURL?.includes('/packages/illustrations/src/builder/') && spec.startsWith('.') && !/\.\w+$/.test(spec) ? next(`${spec}.ts`, context) : next(spec, context)),
})
const { generateCode, installItems } = await import('../../packages/illustrations/src/builder/codegen.ts')
const { TEMPLATES } = await import('../../packages/illustrations/src/builder/templates.ts')

const root = join(import.meta.dirname, '../..')
const docs = join(root, 'apps/docs')

const write = (path, text) => {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, text)
}
const json = (path) => JSON.parse(readFileSync(path, 'utf8'))
const chunk = (list, n) => Array.from({ length: Math.ceil(list.length / n) }, (_, i) => list.slice(i * n, i * n + n))

/** The illustration builder's templates, and one on the floor's grid, as its Copy code writes them. */
const builderScenes = [...TEMPLATES.map((t) => t.scene), { ...TEMPLATES[1].scene, name: 'Shop on a grid', base: 'grid' }]

/** What the builder's code says to add first (`npx @youj/cli add illustration-kit iso-shapes …`). */
export const builderItems = [...new Set(builderScenes.flatMap((scene) => installItems(scene)))]

/** The blocks youj.json says `add` wrote, each with the module and export that renders it. */
export function addedBlocks(appDir, blockNames) {
  const lock = existsSync(join(appDir, 'youj.json')) ? json(join(appDir, 'youj.json')).items : {}
  return blockNames.flatMap((name) => {
    const files = Object.keys(lock[name]?.files ?? {}).filter((f) => f.endsWith('.tsx'))
    // The block's own file is the shallowest: blocks/app/billing.tsx, not blocks/app/billing/*.tsx.
    const file = files.sort((a, b) => a.split('/').length - b.split('/').length || a.length - b.length)[0]
    if (!file) return []
    const text = readFileSync(join(appDir, file), 'utf8')
    const own = file.split('/').pop().replace(/\.tsx$/, '').replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase())
    const exported = text.match(/^export \{[^}]*\}/m)?.[0] ?? ''
    const fn = new RegExp(`\\b${own}\\b`).test(exported) ? own : (text.match(/export function ([A-Z]\w*)/)?.[1] ?? exported.match(/\b([A-Z]\w*)/)?.[1])
    return [{ name, spec: `@/${file.replace(/^src\//, '').replace(/\.tsx$/, '')}`, fn }]
  })
}

/**
 * @param {{ appDir: string, kind: 'next' | 'vite', blocks: { name: string, spec: string, fn: string }[] }} options
 * @returns {string[]} the group ids, each a page at /e2e/<id>
 */
export function writePages({ appDir, kind, blocks }) {
  const src = kind === 'next' ? appDir : join(appDir, 'src')
  const e2e = join(src, 'e2e')
  const groups = []
  rmSync(e2e, { recursive: true, force: true })

  // Docs examples, verbatim.
  cpSync(join(docs, 'examples'), join(e2e, 'examples'), { recursive: true, filter: (p) => !/\.test\.tsx?$/.test(p) })
  const indexSource = readFileSync(join(e2e, 'examples/index.tsx'), 'utf8')
  const examples = [...indexSource.matchAll(/'([^']+)': demo\(/g)].map((m) => m[1])
  chunk(examples, 45).forEach((keys, i) => {
    const id = `examples-${String(i).padStart(2, '0')}`
    groups.push(id)
    write(join(e2e, `groups/${id}.tsx`), `'use client'\nimport { examples } from '../examples'\nimport type { Item } from '../harness'\n\nexport const items: Item[] = ${JSON.stringify(keys)}.map((id) => ({ id, C: examples[id]! }))\n`)
  })

  // Blocks, from their own module. Frame parts render inside the frame (`npx @youj/cli create` covers them).
  chunk(blocks.filter((b) => !b.name.startsWith('frame-')), 25).forEach((list, i) => {
    const id = `blocks-${String(i).padStart(2, '0')}`
    groups.push(id)
    const items = list.map((b) => `  { id: ${JSON.stringify(b.name)}, C: lazy(() => import(${JSON.stringify(b.spec)}).then((m) => ({ default: m.${b.fn} as ComponentType }))) },`)
    write(join(e2e, `groups/${id}.tsx`), `'use client'\nimport { lazy, type ComponentType } from 'react'\nimport type { Item } from '../harness'\n\nexport const items: Item[] = [\n${items.join('\n')}\n]\n`)
  })

  // The illustration builder's code, pasted as Copy code gives it, on the kit `add` copied.
  groups.push('builder')
  const builder = builderScenes.map((scene, i) => {
    const code = generateCode(scene)
    write(join(e2e, `builder/scene-${i}.tsx`), code)
    return { file: `scene-${i}`, fn: code.match(/export function (\w+)/)[1] }
  })
  write(
    join(e2e, 'groups/builder.tsx'),
    `'use client'\nimport type { Item } from '../harness'\n${builder.map((b, i) => `import { ${b.fn} as S${i} } from '../builder/${b.file}'`).join('\n')}\n\nexport const items: Item[] = [\n${builder.map((b, i) => `  { id: ${JSON.stringify(b.fn + '-' + i)}, C: S${i} },`).join('\n')}\n]\n`,
  )

  // Every icon and scene, by its export, with no props.
  for (const [id, pkg, pattern] of [
    ['icons', '@youj/icons', '/^(?!Youj)[A-Z][A-Za-z0-9]*Icon$/'],
    ['illustrations', '@youj/illustrations', '/^Illustration[A-Z]/'],
  ]) {
    groups.push(id)
    write(join(e2e, `groups/${id}.tsx`), `'use client'\nimport type { ComponentType } from 'react'\nimport * as all from '${pkg}'\nimport type { Item } from '../harness'\n\nexport const items: Item[] = Object.entries(all)\n  .filter(([name, value]) => ${pattern}.test(name) && typeof value === 'function')\n  .map(([id, C]) => ({ id, C: C as ComponentType }))\n`)
  }

  // Every loader and miniature, from its own entry, as the docs import them.
  for (const [id, pkg, prefix, props] of [
    ['loaders', '@youj/loaders', 'Loader', '{ label: "Loading", showLabel: true }'],
    ['miniatures', '@youj/miniatures', 'Miniature', '{}'],
  ]) {
    const entries = Object.keys(json(join(appDir, 'node_modules', pkg, 'package.json')).exports).filter((e) => e !== '.' && !/\.(json|css)$|\*/.test(e))
    chunk(entries, 80).forEach((list, i) => {
      const gid = `${id}-${i}`
      groups.push(gid)
      const items = list.map((e) => `  { id: ${JSON.stringify(pkg + e.slice(1))}, C: lazy(() => import(${JSON.stringify(pkg + e.slice(1))}).then(pick)) },`)
      write(
        join(e2e, `groups/${gid}.tsx`),
        `'use client'\nimport { createElement, lazy, type ComponentType } from 'react'\nimport type { Item } from '../harness'\n\nconst pick = (m: Record<string, unknown>) => {\n  const C = Object.entries(m).find(([k, v]) => k.startsWith('${prefix}') && typeof v === 'function')?.[1] as ComponentType<Record<string, unknown>> | undefined\n  if (!C) throw new Error('no ${prefix}* export')\n  return { default: () => createElement(C, ${props}) }\n}\n\nexport const items: Item[] = [\n${items.join('\n')}\n]\n`,
      )
    })
  }

  // Each sound pack on a provider; the check presses its button and switch so cues play.
  groups.push('sound')
  write(
    join(e2e, 'groups/sound.tsx'),
    `'use client'\nimport { YoujProvider } from '@youj/core'\nimport { Button, Switch } from '@youj/react'\nimport { beacon, glass, glyph, halo, rill, zephyr } from '@youj/sound'\nimport type { Item } from '../harness'\n\nexport const items: Item[] = Object.entries({ beacon, glass, glyph, halo, rill, zephyr }).map(([id, pack]) => ({\n  id,\n  C: () => (\n    <YoujProvider sound={pack}>\n      <Button data-sound-press="">Play {id}</Button>\n      <Switch aria-label={'switch ' + id} />\n    </YoujProvider>\n  ),\n}))\n`,
  )

  write(
    join(e2e, 'harness.tsx'),
    `'use client'
import { Component, Suspense, useEffect, type ComponentType, type ReactNode } from 'react'

export type Item = { id: string; C: ComponentType }

declare global {
  interface Window { __e2e?: { errors: Record<string, string>; rendered: string[] } }
}
const log = () => (window.__e2e ??= { errors: {}, rendered: [] })

class Boundary extends Component<{ id: string; children: ReactNode }, { error: string | null }> {
  state = { error: null as string | null }
  static getDerivedStateFromError(error: unknown) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
  componentDidCatch(error: unknown) {
    log().errors[this.props.id] = (error instanceof Error ? (error.stack ?? error.message) : String(error)).slice(0, 2000)
  }
  render() {
    return this.state.error ? <pre data-e2e-error={this.props.id}>{this.state.error}</pre> : this.props.children
  }
}

function Done({ id }: { id: string }) {
  useEffect(() => void log().rendered.push(id), [id])
  return null
}

/** Every item in its own boundary; \`?only=<id>\` renders one, to say which item logged an error. */
export function Harness({ items, only = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('only') }: { items: Item[]; only?: string | null }) {
  const shown = only ? items.filter((i) => i.id === only) : items
  return (
    <main style={{ display: 'grid', gap: 24, padding: 24 }}>
      <p data-e2e-count={shown.length}>{shown.length} items</p>
      {shown.map(({ id, C }) => (
        <section key={id} data-e2e-item={id} style={{ position: 'relative', minHeight: 40, maxWidth: 1200, overflow: 'hidden', contain: 'layout paint' }}>
          <Boundary id={id}>
            <Suspense fallback={<span>loading {id}</span>}>
              <C />
              <Done id={id} />
            </Suspense>
          </Boundary>
        </section>
      ))}
    </main>
  )
}
`,
  )

  if (kind === 'next') {
    for (const id of groups) {
      write(
        join(appDir, `app/e2e/${id}/page.tsx`),
        `import { Suspense } from 'react'\nimport { Group } from './group'\n\nasync function Dynamic({ searchParams }: { searchParams: Promise<{ only?: string }> }) {\n  const { only } = await searchParams\n  return <Group only={only ?? null} />\n}\n\nexport default function Page({ searchParams }: { searchParams: Promise<{ only?: string }> }) {\n  return (\n    <Suspense>\n      <Dynamic searchParams={searchParams} />\n    </Suspense>\n  )\n}\n`,
      )
      write(join(appDir, `app/e2e/${id}/group.tsx`), `'use client'\nimport { Harness } from '@/e2e/harness'\nimport { items } from '@/e2e/groups/${id}'\n\nexport function Group({ only }: { only: string | null }) {\n  return <Harness items={items} only={only} />\n}\n`)
    }
  } else {
    write(
      join(e2e, 'routes.tsx'),
      `import { lazy } from 'react'\nimport type { Item } from './harness'\n\nconst routes: Record<string, () => Promise<{ items: Item[] }>> = {\n${groups.map((id) => `  ${JSON.stringify(id)}: () => import('./groups/${id}'),`).join('\n')}\n}\n\nexport const E2E = lazy(async () => {\n  const { Harness } = await import('./harness')\n  const { items } = await routes[window.location.pathname.split('/')[2]!]!()\n  return { default: () => <Harness items={items} /> }\n})\n`,
    )
    const main = join(src, 'main.tsx')
    const source = readFileSync(main, 'utf8')
    if (!source.includes('./e2e/routes'))
      writeFileSync(
        main,
        source
          .replace(/^(import [^\n]*\n)/, `$1import { Suspense } from 'react'\nimport { E2E } from './e2e/routes'\n`)
          .replace(/(\s*)<App \/>/, `$1{window.location.pathname.startsWith('/e2e/') ? (\n$1  <Suspense>\n$1    <E2E />\n$1  </Suspense>\n$1) : (\n$1  <App />\n$1)}`),
      )
  }
  return groups
}

/** One static page per example and block (Next.js), rendered with no Suspense around it, as a page of the app would. */
export function writeStaticPages(appDir, blocks) {
  const examples = [...readFileSync(join(appDir, 'e2e/examples/index.tsx'), 'utf8').matchAll(/'([^']+)': demo\(/g)].map((m) => m[1])
  blocks = blocks.filter((b) => !b.name.startsWith('frame-'))
  const imports = []
  const entries = []
  examples.forEach((key, i) => {
    imports.push(`import E${i} from '@/e2e/examples/${key}'`)
    entries.push(`  ${JSON.stringify(`ex~${key.replace('/', '~')}`)}: E${i},`)
  })
  blocks.forEach((b, i) => {
    imports.push(`import { ${b.fn} as B${i} } from '${b.spec}'`)
    entries.push(`  ${JSON.stringify(`bl~${b.name}`)}: B${i} as unknown as ComponentType,`)
  })
  write(
    join(appDir, 'e2e/static-items.tsx'),
    `'use client'\nimport type { ComponentType } from 'react'\n${imports.join('\n')}\n\nconst items: Record<string, ComponentType> = {\n${entries.join('\n')}\n}\n\nexport const ids = Object.keys(items)\n\nexport function StaticItem({ id }: { id: string }) {\n  const C = items[id]!\n  return <C />\n}\n`,
  )
  write(join(appDir, 'e2e/static-ids.json'), JSON.stringify([...examples.map((k) => `ex~${k.replace('/', '~')}`), ...blocks.map((b) => `bl~${b.name}`)]))
  write(
    join(appDir, 'app/s/[id]/page.tsx'),
    `import ids from '@/e2e/static-ids.json'\nimport { StaticItem } from '@/e2e/static-items'\n\nexport function generateStaticParams() {\n  return ids.map((id) => ({ id }))\n}\n\nexport default async function Page({ params }: { params: Promise<{ id: string }> }) {\n  const { id } = await params\n  return <StaticItem id={decodeURIComponent(id)} />\n}\n`,
  )
}
