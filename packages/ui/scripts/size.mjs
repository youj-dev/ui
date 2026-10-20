#!/usr/bin/env node
/* What an app pays to use youj: each case is a one-line app bundled by Vite
 * against the published build (dist/, so run `pnpm build` first), measured
 * gzipped and minus the same app rendering a plain <button>. "Initial" is the
 * entry plus everything it imports statically; "lazy" is the chunks it loads
 * later (motion's feature bundles). Budgets hold the initial cost over React.
 *
 * The compiled stylesheet is measured too: an app that imports
 * @youj/react/styles.css after Tailwind gets the classes of every component
 * (its @source scans all of dist/), whether or not the app uses any, so the
 * CSS cases show what an npm-path app pays in render-blocking CSS. A copy-in
 * app (`youj add`) only has the classes of what it adds.
 *
 *   node scripts/size.mjs          report, exit 1 on a blown budget
 *   node scripts/size.mjs --json   the same numbers as JSON */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { build } from 'vite'
import tailwindcss from '@tailwindcss/vite'

const pkg = fileURLToPath(new URL('..', import.meta.url))
const packages = path.resolve(pkg, '..')
const work = path.join(pkg, 'node_modules/.cache/youj-size')

const render = (imports, tree) =>
  `import { createElement as h } from 'react'\nimport { createRoot } from 'react-dom/client'\n${imports}\ncreateRoot(document.getElementById('root')).render(${tree})\n`

/* budget: KB gzipped over React, initial load: about 5% over what each case
 * measured when set (Button 21.2, Dialog 40.2, icon 25.6, 15 components
 * 119.3, full import 323.3), so a real regression fails and noise doesn't.
 * The async Button, spinner and Motion's features are lazy chunks, reported
 * but not budgeted. */
const CASES = [
  { name: 'react', code: render('', `h('button', null, 'hi')`) },
  { name: 'Button', budget: 22.5, code: render(`import { Button } from '@youj/react'`, `h(Button, null, 'hi')`) },
  {
    name: 'Dialog',
    budget: 42,
    code: render(
      `import { Dialog, DialogTrigger, DialogContent, DialogTitle } from '@youj/react'`,
      `h(Dialog, null, h(DialogTrigger, null, 'Open'), h(DialogContent, null, h(DialogTitle, null, 'Title')))`,
    ),
  },
  { name: 'icon', budget: 27, code: render(`import { ActivityIcon } from '@youj/icons'`, `h(ActivityIcon)`) },
  {
    name: '15 components',
    budget: 125,
    code: render(
      `import { Button, Input, Dialog, DialogTrigger, DialogContent, Tabs, TabsList, TabsTrigger, Select, SelectTrigger, SelectContent, SelectItem, SelectValue, Card, Label, Switch, Checkbox, Toaster } from '@youj/react'`,
      `h(Card, null, h(Label, null, 'x'), h(Input), h(Switch), h(Checkbox), h(Tabs, null, h(TabsList, null, h(TabsTrigger, { value: 'a' }, 'a'))), h(Select, null, h(SelectTrigger, null, h(SelectValue)), h(SelectContent, null, h(SelectItem, { value: 'a' }, 'a'))), h(Dialog, null, h(DialogTrigger, null, 'o'), h(DialogContent, null, 'c')), h(Button, null, 'hi'), h(Toaster))`,
    ),
  },
  {
    name: 'full import',
    budget: 355, // the whole library; grows with each component. Per-component budgets catch regressions.
    code: `import * as ui from '@youj/react'\nimport * as icons from '@youj/icons'\nconsole.log(ui, icons)\n`,
  },
]

/* budget: KB of minified CSS / KB gzipped, from `@import 'tailwindcss'` plus
 * @youj/react/styles.css. Button-only and nothing-imported compile to the same
 * sheet: Tailwind scans dist/, not the app's imports. About 3% over when set
 * (537.8 KB, 68.5 KB gzipped); raise it with the library, on purpose. */
const CSS_CASES = [
  { name: 'CSS, nothing imported', budget: { min: 555, gz: 71 }, code: render('', `h('button', null, 'hi')`) },
  { name: 'CSS, Button only', budget: { min: 555, gz: 71 }, code: render(`import { Button } from '@youj/react'`, `h(Button, null, 'hi')`) },
]

const alias = [
  { find: /^@youj\/react\/styles\.css$/, replacement: `${pkg}/dist/styles.css` },
  { find: /^@youj\/(core|motion|icons|illustrations|loaders|sound|miniatures)\/styles\.css$/, replacement: `${packages}/$1/dist/styles.css` },
  { find: /^@youj\/react$/, replacement: `${packages}/ui/dist/index.js` },
  { find: /^@youj\/core$/, replacement: `${packages}/core/dist/index.js` },
  { find: /^@youj\/motion$/, replacement: `${packages}/motion/dist/index.js` },
  { find: /^@youj\/motion\/(icons|pieces|players)$/, replacement: `${packages}/motion/dist/$1.js` },
]

async function measure({ name, code }) {
  const file = path.join(work, `${name.replace(/\W+/g, '-')}.js`)
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
  let init = 0
  let lazy = 0
  for (const c of chunks) initial.has(c.fileName) ? (init += gz(c)) : (lazy += gz(c))
  return { initial: init, lazy }
}

async function measureCss({ name, code }) {
  const file = path.join(work, `${name.replace(/\W+/g, '-')}.js`)
  writeFileSync(path.join(work, 'app.css'), `@import 'tailwindcss';\n@import '@youj/react/styles.css';\n`)
  writeFileSync(file, `import './app.css'\n${code}`)
  const result = await build({
    configFile: false,
    root: work,
    logLevel: 'silent',
    plugins: [tailwindcss()],
    resolve: { alias, dedupe: ['react', 'react-dom'] },
    build: { write: false, rollupOptions: { input: file } },
  })
  const css = (Array.isArray(result) ? result : [result]).flatMap((r) => r.output).find((o) => o.type === 'asset' && o.fileName.endsWith('.css'))
  const source = Buffer.from(css.source)
  return { min: source.length / 1024, gz: gzipSync(source).length / 1024 }
}

rmSync(work, { recursive: true, force: true })
mkdirSync(work, { recursive: true })
const rows = []
for (const c of CASES) rows.push({ ...c, ...(await measure(c)) })
const react = rows[0].initial
const results = rows.slice(1).map((r) => ({
  name: r.name,
  initial: r.initial,
  over: r.initial - react,
  lazy: r.lazy,
  budget: r.budget,
  ok: r.initial - react <= r.budget,
}))

const css = []
for (const c of CSS_CASES) {
  const size = await measureCss(c)
  css.push({ name: c.name, ...size, budget: c.budget, ok: size.min <= c.budget.min && size.gz <= c.budget.gz })
}

const kb = (n) => n.toFixed(1).padStart(7)
if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ react, results, css }, null, 2))
} else {
  console.log(`KB gzipped. React alone: ${react.toFixed(1)}\n`)
  console.log(`${'case'.padEnd(15)}${'initial'.padStart(9)}${'+React'.padStart(9)}${'budget'.padStart(9)}${'lazy'.padStart(9)}`)
  for (const r of results) {
    console.log(`${r.name.padEnd(15)}  ${kb(r.initial)}  ${kb(r.over)}  ${kb(r.budget)}  ${kb(r.lazy)}${r.ok ? '' : '  over budget'}`)
  }
  console.log(`\nCompiled CSS (Tailwind + @youj/react/styles.css), KB\n`)
  console.log(`${'case'.padEnd(24)}${'minified'.padStart(10)}${'budget'.padStart(9)}${'gzipped'.padStart(10)}${'budget'.padStart(9)}`)
  for (const r of css) {
    console.log(`${r.name.padEnd(24)}  ${kb(r.min)}  ${kb(r.budget.min)}   ${kb(r.gz)}  ${kb(r.budget.gz)}${r.ok ? '' : '  over budget'}`)
  }
}
rmSync(work, { recursive: true, force: true })
if (results.some((r) => !r.ok) || css.some((r) => !r.ok)) {
  console.error('\nA size budget is blown. Find what grew (vite build --sourcemap on the case, or a bundle visualizer) before raising it.')
  process.exit(1)
}
