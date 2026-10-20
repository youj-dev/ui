/* Builds every workspace package's shadcn registry against this site's URL and
 * collects the output in public/r, so the site serves /r/<name>.json (the latest
 * alias) and /r/v<version>/<name>.json (this release's items, whose registry
 * dependencies name the same version). `npx @youj/cli` reads its own version's, so
 * copied code doesn't change with each deploy. A build writes the current version
 * only; older ones come back from the archive when YOUJ_REGISTRY_ARCHIVE is set
 * (registry-archive.ts, RELEASING.md).
 *
 * Items' npm `dependencies` get the range the owning package declares
 * (`motion@^14`, `@base-ui/react@~1.8.0`), so a copy installs what the
 * source was written against rather than whatever major is current.
 *
 * A package joins by shipping scripts/build-registry.mjs that honours
 * YOUJ_REGISTRY_URL and writes public/r/*.json (packages/motion does today;
 * packages/ui joins the same way). Item names share one namespace, so a name
 * built by two packages fails the build.
 *
 * `--out <dir>` writes the collected registry there instead of public/r (the
 * install test builds one for a local origin without touching the site's). */

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dependencyRegistryUrl, registryHomepage } from '../lib/site.ts'
import { configuredStore, restoreArchive } from './registry-archive.ts'

export interface PackageBuild {
  pkg: string
  /** Built files by name, e.g. `reveal.json`, including the package's `registry.json` index. */
  files: Map<string, string>
}

interface Manifest {
  version: string
  dependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

interface Item {
  dependencies?: string[]
  registryDependencies?: string[]
}

interface RegistryIndex {
  $schema: string
  name: string
  homepage: string
  items: { name: string }[]
}

/** Merges per-package builds into one file set with a combined `registry.json` index. */
export function mergeBuilds(builds: PackageBuild[], homepage: string): Map<string, string> {
  const out = new Map<string, string>()
  const owner = new Map<string, string>()
  const index: RegistryIndex = { $schema: 'https://ui.shadcn.com/schema/registry.json', name: 'youj', homepage, items: [] }

  for (const { pkg, files } of builds) {
    for (const [file, content] of files) {
      if (file === 'registry.json') {
        index.items.push(...(JSON.parse(content) as RegistryIndex).items)
        continue
      }
      const previous = owner.get(file)
      if (previous) throw new Error(`registry item "${file}" is built by both ${previous} and ${pkg}`)
      owner.set(file, pkg)
      out.set(file, content)
    }
  }
  out.set('registry.json', JSON.stringify(index, null, 2) + '\n')
  return out
}

/**
 * The range a package declares for each npm dependency, peers first (what apps
 * install), then its own dependencies, then devDependencies (libraries only its
 * blocks use). Youj's own packages get `^<version>`, never a `workspace:` range.
 * A range with alternatives (`^13.4.4 || ^14`) gives its newest, so the install
 * command an item turns into has no spaces or `||` for a shell to split. A range
 * that still has a space (a peer bounded as `>=1.8.0 <1.10.0`) is skipped for the
 * next declaration, which is the exact one the repo builds against.
 */
export function declaredRanges(manifest: Manifest): Map<string, string> {
  const ranges = new Map<string, string>()
  for (const deps of [manifest.peerDependencies, manifest.dependencies, manifest.devDependencies])
    for (const [name, range] of Object.entries(deps ?? {})) {
      if (ranges.has(name)) continue
      const newest = range.startsWith('workspace:') ? `^${manifest.version}` : range.split('||').at(-1)!.trim()
      if (!/\s/.test(newest)) ranges.set(name, newest)
    }
  return ranges
}

/** An item (or a registry index's items) with each unversioned npm dependency given its declared range. */
export function withRanges(content: string, ranges: Map<string, string>): string {
  const json = JSON.parse(content) as Item & { items?: Item[] }
  let changed = false
  const pin = (item: Item) => {
    if (!item.dependencies) return
    item.dependencies = item.dependencies.map((dep) => {
      const range = dep.lastIndexOf('@') > 0 ? undefined : ranges.get(dep)
      if (!range) return dep
      changed = true
      return `${dep}@${range}`
    })
  }
  pin(json)
  json.items?.forEach(pin)
  return changed ? JSON.stringify(json, null, 2) + '\n' : content
}

/** An item (or index) for /r/v<version>/: its registry dependencies on this registry point at the same version. */
export function versionedItem(content: string, base: string, version: string): string {
  const json = JSON.parse(content) as Item & { items?: Item[] }
  const prefix = `${base}/`
  let changed = false
  const point = (item: Item) => {
    if (!item.registryDependencies) return
    item.registryDependencies = item.registryDependencies.map((dep) => {
      const name = dep.startsWith(prefix) ? dep.slice(prefix.length) : ''
      if (!/^[\w.-]+\.json$/.test(name)) return dep
      changed = true
      return `${prefix}v${version}/${name}`
    })
  }
  point(json)
  json.items?.forEach(point)
  return changed ? JSON.stringify(json, null, 2) + '\n' : content
}

/** The files public/r serves: each one at the latest alias, and again under v<version>/. */
export function withVersion(files: Map<string, string>, base: string, version: string): Map<string, string> {
  const out = new Map(files)
  for (const [file, content] of files) out.set(`v${version}/${file}`, versionedItem(content, base, version))
  return out
}

async function main() {
  const app = fileURLToPath(new URL('..', import.meta.url))
  const packagesDir = join(app, '../../packages')
  const at = process.argv.indexOf('--out')
  const outDir = at > 0 && process.argv[at + 1] ? resolve(process.argv[at + 1]!) : join(app, 'public/r')
  const base = dependencyRegistryUrl()
  const env = { ...process.env, YOUJ_REGISTRY_URL: base }
  const manifest = (pkg: string) => JSON.parse(readFileSync(join(packagesDir, pkg, 'package.json'), 'utf8')) as Manifest
  // The kit releases at one version (the fixed group in .changeset/config.json); the CLI asks for its own.
  const version = manifest('cli').version

  const builds: PackageBuild[] = []
  for (const pkg of readdirSync(packagesDir).sort()) {
    const dir = join(packagesDir, pkg)
    if (!existsSync(join(dir, 'scripts/build-registry.mjs'))) continue
    try {
      execFileSync(process.execPath, ['scripts/build-registry.mjs'], { cwd: dir, env, stdio: 'pipe' })
    } catch (error) {
      const { stdout = '', stderr = '' } = error as { stdout?: Buffer; stderr?: Buffer }
      console.error(`${stdout}${stderr}`)
      throw new Error(`packages/${pkg}: registry build failed`)
    }
    const built = join(dir, 'public/r')
    const files = new Map<string, string>()
    const ranges = declaredRanges(manifest(pkg))
    for (const file of readdirSync(built).filter((f) => f.endsWith('.json'))) {
      files.set(file, withRanges(readFileSync(join(built, file), 'utf8'), ranges))
    }
    builds.push({ pkg, files })
  }

  const merged = mergeBuilds(builds, registryHomepage())
  rmSync(outDir, { recursive: true, force: true })
  mkdirSync(join(outDir, `v${version}`), { recursive: true })
  for (const [file, content] of withVersion(merged, base, version)) writeFileSync(join(outDir, file), content)
  const store = configuredStore()
  const restored = store ? await restoreArchive(store, outDir, version) : []
  console.log(`registry: ${merged.size - 1} items from ${builds.map((b) => b.pkg).join(', ')} → ${outDir} and v${version}/ (dependencies under ${base})${restored.length ? `; restored ${restored.map((v) => `v${v}`).join(', ')} from the archive` : ''}`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main().catch((error) => {
    console.error((error as Error).message)
    process.exit(1)
  })
