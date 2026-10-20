// What `youj add <item>` copies into an app: the item, everything it names in
// registryDependencies (transitively, across UI, core, motion, icons...), and
// their lines. Shared by the budget test and the docs generator, so the number
// a docs page states is the one the registry produces.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { SOURCES, sourceItems } from '../../../scripts/youj-sources.mjs'

const root = join(import.meta.dirname, '..')
const packagesDir = join(root, '..')

export function loadItems() {
  const ui = JSON.parse(readFileSync(join(root, 'registry/ui.json'), 'utf8')).map((item) => ({ ...item, base: root }))
  const other = sourceItems().map((item) => ({ ...item, base: join(packagesDir, SOURCES.find((s) => s.name === item.package).dir) }))
  return new Map([...ui, ...other].map((item) => [item.name, item]))
}

// Generated files (core's youj.css) exist only after its registry build; they count as files, not lines.
const lineCount = (base, path) => {
  try {
    return readFileSync(join(base, path), 'utf8').split('\n').length - 1
  } catch {
    return 0
  }
}

/** @returns {{ items: string[], files: number, lines: number }} the closure of `name`, itself included */
export function footprint(name, items = loadItems()) {
  const seen = new Set()
  const visit = (n) => {
    if (seen.has(n) || !items.has(n)) return
    seen.add(n)
    for (const dep of items.get(n).registryDependencies ?? []) visit(dep.split('/').pop().replace(/\.json$/, ''))
  }
  visit(name)
  let files = 0
  let lines = 0
  for (const n of seen) {
    const { base, files: list = [] } = items.get(n)
    for (const f of list) {
      files++
      lines += lineCount(base, f.path)
    }
  }
  return { items: [...seen].sort(), files, lines }
}

/** The most-used components: how many blocks copy each one in, most first. */
export function mostUsed(count = 20, items = loadItems()) {
  const uses = new Map()
  for (const item of items.values()) {
    if (item.type !== 'registry:block') continue
    for (const dep of footprint(item.name, items).items) {
      if (dep !== item.name && items.get(dep)?.type === 'registry:ui' && items.get(dep).meta?.level === 'component') uses.set(dep, (uses.get(dep) ?? 0) + 1)
    }
  }
  return [...uses].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, count).map(([name]) => name)
}

if (process.argv[1] === import.meta.filename) {
  const items = loadItems()
  const names = process.argv.slice(2).length ? process.argv.slice(2) : mostUsed(20, items)
  for (const n of names) {
    const f = footprint(n, items)
    console.log(`${n.padEnd(22)} items ${String(f.items.length).padStart(3)}  files ${String(f.files).padStart(3)}  lines ${String(f.lines).padStart(6)}`)
  }
}
