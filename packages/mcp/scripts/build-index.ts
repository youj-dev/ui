/* Writes the MCP index to data/*.json, or with --check fails when it's stale.
 * data/ is not committed: build, test and pack regenerate it.
 *
 *   pnpm -F @youj/mcp generate
 *
 * The collector (scripts/collect.ts) imports the docs app's modules and the
 * icon sources (TSX), so Vite's SSR loader runs it, from the docs app's folder
 * (its modules resolve paths from there). */

import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { INDEX_FILES, type CollectedIndex, type YoujIndex } from '../src/types.ts'

const pkg = fileURLToPath(new URL('..', import.meta.url))
const root = join(pkg, '../..')
const data = join(pkg, 'data')
const check = process.argv.includes('--check')

process.chdir(join(root, 'apps/docs'))
const vite = await createServer({
  root,
  configFile: false,
  logLevel: 'error',
  appType: 'custom',
  server: { middlewareMode: true, hmr: false, ws: false },
  optimizeDeps: { noDiscovery: true, include: [] },
})

let index: CollectedIndex
try {
  const { collect } = (await vite.ssrLoadModule(join(pkg, 'scripts/collect.ts'))) as { collect: (root: string) => Promise<CollectedIndex> }
  index = await collect(root)
} finally {
  await vite.close()
}

const stale: string[] = []
mkdirSync(data, { recursive: true })
for (const [key, file] of Object.entries(INDEX_FILES) as [keyof YoujIndex, string][]) {
  const text = `${JSON.stringify(index[key], null, 2)}\n`
  const path = join(data, file)
  let current: string | null = null
  try {
    current = readFileSync(path, 'utf8')
  } catch {
    // missing: stale
  }
  if (current === text) continue
  stale.push(file)
  if (!check) writeFileSync(path, text)
}

// The block files are one file each under data/sources/, so a server reads only the ones a call needs.
const sourcesDir = join(data, 'sources')
const written = new Set<string>()
for (const [file, text] of Object.entries(index.sources)) {
  const path = join(sourcesDir, file)
  written.add(path)
  let current: string | null = null
  try {
    current = readFileSync(path, 'utf8')
  } catch {
    // missing: stale
  }
  if (current === text) continue
  stale.push(`sources/${file}`)
  if (!check) {
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, text)
  }
}
const listFiles = (dir: string): string[] => {
  try {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => (entry.isDirectory() ? listFiles(join(dir, entry.name)) : [join(dir, entry.name)]))
  } catch {
    return []
  }
}
for (const path of listFiles(sourcesDir)) {
  if (written.has(path)) continue
  stale.push(`sources/${relative(sourcesDir, path)} (removed)`)
  if (!check) rmSync(path)
}

// A file the index no longer writes (an older layout's sources.json) goes too, so data/ holds exactly the index.
const known = new Set<string>([...Object.values(INDEX_FILES), 'sources'])
for (const entry of readdirSync(data)) {
  if (known.has(entry)) continue
  stale.push(`${entry} (removed)`)
  if (!check) rmSync(join(data, entry), { recursive: true })
}

const changed = stale.filter((name) => !name.startsWith('sources/'))
const changedSources = stale.length - changed.length
const counts = `${index.components.length} components, ${index.hooks.length} hooks, ${index.icons.length} icons, ${index.illustrations.scenes.length} illustrations, ${index.loaders.length} loaders, ${index.miniatures.length} miniatures, ${index.blocks.length} blocks, ${index.docs.length} pages`
if (check && stale.length) {
  console.error(`The MCP index is stale (${[...changed, ...(changedSources ? [`${changedSources} source files`] : [])].join(', ')}). Run: pnpm -F @youj/mcp generate`)
  process.exit(1)
}
console.log(check ? `mcp index: current (${counts})` : `mcp index: ${stale.length ? `wrote ${[...changed, ...(changedSources ? [`${changedSources} source files`] : [])].join(', ')}` : 'up to date'} (${counts})`)
