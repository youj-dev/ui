#!/usr/bin/env node
/* What a miniature costs an app: Vite builds of the published build (dist/,
 * so run `pnpm build` first), minified and gzipped, React left out (the app
 * has it). Each miniature alone, the engine they share, each miniature's own
 * share on top of it, all of them together (the engine counted once) and the
 * catalogue (`@youj/miniatures`, metadata only).
 *
 *   node scripts/size.mjs          report, exit 1 on a blown budget
 *   node scripts/size.mjs --json   the same numbers as JSON */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { gzipSync } from 'node:zlib'
import { build } from 'vite'

const pkg = path.join(import.meta.dirname, '..')
const dist = path.join(pkg, 'dist')
const work = path.join(pkg, 'node_modules/.cache/yjm-size')
if (!existsSync(path.join(dist, 'index.js'))) {
  console.error('No dist/: run `pnpm build` first.')
  process.exit(1)
}
const manifest = JSON.parse(readFileSync(path.join(pkg, 'package.json'), 'utf8'))
const ids = Object.keys(manifest.exports)
  .filter((k) => k !== '.')
  .map((k) => k.slice(2))

/* Budgets, KB gzipped, a little over what they measured when set (engine
 * 7.77; a miniature's own share at most 13.10, the turntable; the catalogue
 * 25.71), so a regression fails and noise doesn't. A miniature's own share is
 * its lab file, drawing and all; the engine is paid once however many an app
 * uses. */
const BUDGET = { engine: 8.5, item: 14.5, catalogue: 28.5 }

async function measure(name, code) {
  const file = path.join(work, `${name}.js`)
  writeFileSync(file, code)
  const result = await build({
    configFile: false,
    root: work,
    logLevel: 'silent',
    build: { write: false, minify: true, rollupOptions: { input: file, external: [/^react(\/|$)/, /^react-dom(\/|$)/] } },
  })
  const chunks = (Array.isArray(result) ? result : [result]).flatMap((r) => r.output).filter((o) => o.type === 'chunk')
  return chunks.reduce((sum, c) => sum + gzipSync(c.code).length / 1024, 0)
}

const entry = (id) => path.join(dist, `${id}.js`)
const name = (id) => `Miniature${id.replace(/^3d/, 'three-d').replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase())}`
const use = (names) => `console.log(${names.join(', ')})\n`

rmSync(work, { recursive: true, force: true })
mkdirSync(work, { recursive: true })
const engine = await measure('engine', `import { Miniature } from ${JSON.stringify(path.join(dist, 'engine/miniature.js'))}\n${use(['Miniature'])}`)
const items = []
for (const id of ids) {
  const total = await measure(id, `import { ${name(id)} } from ${JSON.stringify(entry(id))}\n${use([name(id)])}`)
  items.push({ id, total, own: total - engine })
}
const all = await measure('all', `${ids.map((id) => `import { ${name(id)} } from ${JSON.stringify(entry(id))}`).join('\n')}\n${use(ids.map(name))}`)
const catalogue = await measure('catalogue', `import { miniatures } from ${JSON.stringify(path.join(dist, 'index.js'))}\n${use(['miniatures'])}`)
rmSync(work, { recursive: true, force: true })

const rows = [
  { name: 'engine (shared, once per app)', kb: engine, budget: BUDGET.engine },
  ...items.map((i) => ({ name: `${i.id} (own, on top of the engine)`, kb: i.own, budget: BUDGET.item, alone: i.total })),
  { name: `all ${ids.length} together`, kb: all },
  { name: 'catalogue (@youj/miniatures)', kb: catalogue, budget: BUDGET.catalogue },
].map((r) => ({ ...r, ok: r.budget === undefined || r.kb <= r.budget }))

if (process.argv.includes('--json')) console.log(JSON.stringify(rows, null, 2))
else {
  console.log('KB minified + gzipped, React excluded\n')
  for (const r of rows)
    console.log(`${r.name.padEnd(42)}${r.kb.toFixed(2).padStart(7)}${r.alone ? `   (alone ${r.alone.toFixed(2)})` : ''}${r.budget ? `   budget ${r.budget.toFixed(1)}` : ''}${r.ok ? '' : '  over budget'}`)
}
if (rows.some((r) => !r.ok)) {
  console.error('\nA size budget is blown. Find what grew before raising it.')
  process.exit(1)
}
