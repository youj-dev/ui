#!/usr/bin/env node
/* What sound costs an app: a Button app bundled by Vite against the published
 * builds (dist/, so build core, motion, ui and sound first), then the same app
 * under a YoujProvider, then with `sound={beacon}`, then with a pack of its own (definePack, one
 * built-in candidate and one file). "Initial" is the entry plus everything it
 * imports statically, gzipped; "lazy" is the chunks it loads later: the
 * player and the pack's audio, fetched only once sound is on.
 *
 *   node scripts/size.mjs          report, exit 1 on a blown budget
 *   node scripts/size.mjs --json   the same numbers as JSON */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import path from 'node:path'
import { build } from 'vite'

const pkg = path.join(import.meta.dirname, '..')
const packages = path.resolve(pkg, '..')
const work = path.join(pkg, 'node_modules/.cache/youj-size')

const render = (imports, tree) =>
  `import { createElement as h } from 'react'\nimport { createRoot } from 'react-dom/client'\n${imports}\ncreateRoot(document.getElementById('root')).render(${tree})\n`

/* Budgets, KB gzipped, a little over what each measured when set (0.55,
 * 1.33, 24.75 for the Glass pack, the first default, and 0.96 for a pack of your own; Beacon, the default now, is smaller), so a real
 * regression fails and noise doesn't. The first load is what an app pays for
 * having sound at all, beyond the provider (the lazy handle and the pack's
 * loader); the player and the pack's audio are lazy, and budgeted too,
 * since they're what turning sound on costs. A pack of your own adds
 * definePack and the candidates' loaders to the first load; the candidates'
 * audio is never in it. */
const BUDGET = { initial: 0.8, player: 1.5, pack: 25, custom: 1.2 }

const alias = [
  { find: /^@youj\/react$/, replacement: `${packages}/ui/dist/index.js` },
  { find: /^@youj\/core$/, replacement: `${packages}/core/dist/index.js` },
  { find: /^@youj\/motion$/, replacement: `${packages}/motion/dist/index.js` },
  { find: /^@youj\/sound$/, replacement: `${packages}/sound/dist/index.js` },
]

async function measure(name, code) {
  const file = path.join(work, `${name}.js`)
  writeFileSync(file, code)
  const result = await build({
    configFile: false,
    root: work,
    logLevel: 'silent',
    resolve: { alias, dedupe: ['react', 'react-dom'] },
    build: { write: false, rollupOptions: { input: file } },
  })
  const chunks = (Array.isArray(result) ? result : [result]).flatMap((r) => r.output).filter((o) => o.type === 'chunk')
  const byName = new Map(chunks.map((c) => [c.fileName, c]))
  const initial = new Set()
  const visit = (c) => {
    if (initial.has(c.fileName)) return
    initial.add(c.fileName)
    for (const dep of c.imports) visit(byName.get(dep))
  }
  chunks.filter((c) => c.isEntry).forEach(visit)
  const gz = (c) => gzipSync(c.code).length / 1024
  const lazy = chunks.filter((c) => !initial.has(c.fileName))
  const moduleOf = (c, pattern) => Object.keys(c.modules).some((id) => pattern.test(id))
  const candidate = /sound\/dist\/candidates\/\w+\.\w+\.js$/
  return {
    initial: [...initial].reduce((sum, f) => sum + gz(byName.get(f)), 0),
    player: lazy.filter((c) => moduleOf(c, /sound\/dist\/lib\/player\.js$/)).reduce((sum, c) => sum + gz(c), 0),
    pack: lazy.filter((c) => moduleOf(c, /sound\/dist\/packs\/\w+\.data\.js$/)).reduce((sum, c) => sum + gz(c), 0),
    candidatesUpFront: [...initial].filter((f) => moduleOf(byName.get(f), candidate)).length,
  }
}

rmSync(work, { recursive: true, force: true })
mkdirSync(work, { recursive: true })
const button = await measure(
  'button',
  render(`import { YoujProvider } from '@youj/core'\nimport { Button } from '@youj/react'`, `h(YoujProvider, null, h(Button, null, 'hi'))`),
)
const sound = await measure(
  'sound',
  render(
    `import { YoujProvider } from '@youj/core'\nimport { Button } from '@youj/react'\nimport { beacon } from '@youj/sound'`,
    `h(YoujProvider, { sound: beacon }, h(Button, null, 'hi'))`,
  ),
)
const custom = await measure(
  'custom',
  render(
    `import { YoujProvider } from '@youj/core'\nimport { Button } from '@youj/react'\nimport { candidates, definePack } from '@youj/sound'\nconst sounds = definePack({ sounds: { tap: candidates.tap.wood, error: '/sounds/error.wav' } })`,
    `h(YoujProvider, { sound: sounds }, h(Button, null, 'hi'))`,
  ),
)
rmSync(work, { recursive: true, force: true })

const results = [
  { name: 'sound, first load', kb: sound.initial - button.initial, budget: BUDGET.initial },
  { name: 'player (lazy)', kb: sound.player, budget: BUDGET.player },
  { name: 'Beacon pack (lazy)', kb: sound.pack, budget: BUDGET.pack },
  { name: 'own pack, first load', kb: custom.initial - sound.initial, budget: BUDGET.custom },
].map((r) => ({ ...r, ok: r.kb <= r.budget }))
// A candidate's audio in the first load would cost every app that plays one, whether sound is on or not.
if (sound.candidatesUpFront || custom.candidatesUpFront) results.push({ name: 'candidates’ audio, first load', kb: 0, budget: 0, ok: false })

if (process.argv.includes('--json')) console.log(JSON.stringify(results, null, 2))
else {
  console.log(`KB gzipped, over a Button app (${button.initial.toFixed(1)} KB)\n`)
  for (const r of results) console.log(`${r.name.padEnd(22)}${r.kb.toFixed(2).padStart(8)}  budget ${r.budget.toFixed(1).padStart(5)}${r.ok ? '' : '  over budget'}`)
}
if (results.some((r) => !r.ok)) {
  console.error('\nA size budget is blown. Find what grew before raising it.')
  process.exit(1)
}
