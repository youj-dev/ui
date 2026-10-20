// Assembles registry.json from the per-area fragments in registry/*.json
// (registry/core.json holds youj-core), then (unless --check) runs
// `shadcn build` into public/r so Storybook serves the registry at
// /r/<name>.json. Client modules get "use client" (scripts/use-client.mjs).
//
//   node scripts/build-registry.mjs          write registry.json + public/r
//   node scripts/build-registry.mjs --check  validate only; exit 1 on problems
//
// An item's `css` may name a stylesheet: it's inlined as shadcn's `css`
// object, which `shadcn add` writes into the app's own stylesheet (that's how
// youj-presets ships). An item whose files use a preset class must depend
// on youj-presets.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { withUseClient } from '../../../scripts/use-client.mjs'
import { cssToObject, presetClassPattern, usesPresetClass } from './presets.mjs'

const root = new URL('..', import.meta.url).pathname
const check = process.argv.includes('--check')
const problems = []

// The token stylesheet ships without its Tailwind import: the consuming app
// already has one, and importing Tailwind twice duplicates every utility.
// The motion presets it imports ship separately as the youj-presets item.
const tokensCss = readFileSync(join(root, 'src/styles/youj.css'), 'utf8')
  .replace(/^@import 'tailwindcss';\n/m, '')
  .replace(/^@import '\.\/presets\.css';\n+/m, '')
mkdirSync(join(root, 'registry/generated'), { recursive: true })
writeFileSync(join(root, 'registry/generated/youj.css'), tokensCss)

// Consumer location mirrors ours minus `src/`, so `@/lib/...` and
// `@/components/...` imports resolve through the app's standard aliases.
const targetFor = (path) => path.replace(/^src\//, '')

const fragments = readdirSync(join(root, 'registry'))
  .filter((f) => f.endsWith('.json'))
  .sort()
const items = []
for (const file of fragments) {
  let parsed
  try {
    parsed = JSON.parse(readFileSync(join(root, 'registry', file), 'utf8'))
  } catch (e) {
    problems.push(`registry/${file}: invalid JSON (${e.message})`)
    continue
  }
  if (!Array.isArray(parsed)) problems.push(`registry/${file}: must be an array of items`)
  else items.push(...parsed)
}

// A file with its own target (a stand-in under registry/stubs) arrives where that says, so it's
// closed over from there: its imports resolve beside the files it replaces.
const shipsAs = new Map()
const names = new Set()
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
// Peers count: motion and the player runtimes are peers of the package, but a
// copied registry item still installs them.
const declared = new Set(Object.keys({ ...pkg.dependencies, ...pkg.peerDependencies }))
const presetPattern = presetClassPattern()
for (const item of items) {
  if (names.has(item.name)) problems.push(`duplicate item name: ${item.name}`)
  names.add(item.name)
  if (typeof item.css === 'string') {
    const path = join(root, item.css)
    if (!existsSync(path)) problems.push(`${item.name}: missing stylesheet ${item.css}`)
    else {
      try {
        item.css = cssToObject(readFileSync(path, 'utf8'))
      } catch (error) {
        problems.push(`${item.name}: ${item.css}: ${error.message}`)
      }
    }
  }
  for (const f of item.files ?? []) {
    if (!existsSync(join(root, f.path))) problems.push(`${item.name}: missing file ${f.path}`)
    else if (item.name !== 'youj-presets' && usesPresetClass(readFileSync(join(root, f.path), 'utf8'), presetPattern) && !item.registryDependencies?.includes('youj-presets')) {
      problems.push(`${item.name}: ${f.path} uses a motion preset class, so the item needs registryDependencies "youj-presets"`)
    }
    shipsAs.set(f, f.target ? `src/${f.target}` : f.path)
    f.target ??= targetFor(f.path)
  }
  for (const dep of item.dependencies ?? []) {
    const base = dep.startsWith('@') ? dep.split('@').slice(0, 2).join('@') : dep.split('@')[0]
    if (!declared.has(base)) problems.push(`${item.name}: dependency "${dep}" is not in package.json dependencies`)
  }
}
for (const item of items) {
  for (const dep of item.registryDependencies ?? []) {
    if (!dep.includes('/') && !names.has(dep)) problems.push(`${item.name}: unknown registryDependency "${dep}"`)
  }
}

// Import closure: every relative import in an item's files must land in the
// item itself or in one of its (transitive) registry dependencies, or a
// `shadcn add` of that item copies code that can't compile.
const byName = new Map(items.map((i) => [i.name, i]))
const filesOf = (name, seen = new Set()) => {
  if (seen.has(name) || !byName.has(name)) return seen
  seen.add(name)
  for (const d of byName.get(name).registryDependencies ?? []) if (!d.includes('/')) filesOf(d, seen)
  return seen
}
const stripExt = (p) => p.replace(/\.(tsx?|css)$/, '').replace(/\/index$/, '')
for (const item of items) {
  const reachable = new Set()
  for (const n of filesOf(item.name)) for (const f of byName.get(n).files ?? []) reachable.add(stripExt(shipsAs.get(f)))
  for (const f of item.files ?? []) {
    if (!/\.tsx?$/.test(f.path) || !existsSync(join(root, f.path))) continue
    const src = readFileSync(join(root, f.path), 'utf8')
    for (const [, spec] of src.matchAll(/(?:from|import)\s*\(?\s*['"](\.{1,2}\/[^'"]+)['"]/g)) {
      const target = stripExt(join(shipsAs.get(f), '..', spec))
      if (!reachable.has(target) && !reachable.has(`${target}/index`.replace(/\/index$/, ''))) {
        problems.push(`${item.name}: ${f.path} imports ${spec}, which isn't in the item or its registry dependencies`)
      }
    }
  }
}

if (problems.length) {
  console.error(problems.map((p) => `  ✗ ${p}`).join('\n'))
  console.error(`\n${problems.length} registry problem(s)`)
  process.exit(1)
}

// Local registry deps are referenced by name in fragments; shadcn needs URLs.
const base = process.env.YOUJ_REGISTRY_URL ?? 'http://localhost:6006/r'
for (const item of items) {
  if (item.registryDependencies) {
    item.registryDependencies = item.registryDependencies.map((d) => (names.has(d) ? `${base}/${d}.json` : d))
  }
}

const registry = {
  $schema: 'https://ui.shadcn.com/schema/registry.json',
  name: 'youj',
  homepage: base.replace(/\/r$/, ''),
  items,
}
console.log(`registry: ${items.length} items from ${fragments.length} fragment(s)`)
if (check) process.exit(0)

writeFileSync(join(root, 'registry.json'), JSON.stringify(registry, null, 2) + '\n')
// public/r is all build output: clear it so an item that moved to another package doesn't linger here.
rmSync(join(root, 'public/r'), { recursive: true, force: true })
execFileSync('pnpm', ['exec', 'shadcn', 'build', 'registry.json', '--output', 'public/r'], { cwd: root, stdio: 'inherit' })

// Server components can import the copies too: shadcn keeps the directive for
// `rsc: true` apps and strips it for the rest.
for (const item of items) {
  const out = join(root, 'public/r', `${item.name}.json`)
  const built = JSON.parse(readFileSync(out, 'utf8'))
  for (const file of built.files ?? []) file.content = withUseClient(file.path, file.content)
  writeFileSync(out, JSON.stringify(built, null, 2) + '\n')
}
