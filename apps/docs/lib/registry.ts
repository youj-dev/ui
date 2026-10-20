import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import type { CopyIn } from './copy-in.ts'
import type { Level } from './taxonomy.ts'

/* Registry items, read from each package's registry fragments
 * (packages/<pkg>/registry/*.json) — the same source the hosted /r build uses,
 * available without running it. */

export interface RegistryFile {
  path: string
  type?: string
  target?: string
}

export interface RegistryItem {
  name: string
  /** `registry:component`, `registry:ui`, `registry:lib`… */
  type?: string
  title?: string
  description?: string
  dependencies?: string[]
  registryDependencies?: string[]
  files?: RegistryFile[]
  /** A UI component's, block's or example's rung on the ladder (taxonomy.json), and a block's kind (`card`, `section`, `overlay`…). */
  meta?: { kind?: string; level?: Level; category?: string }
  /** npm name of the package that ships the item, e.g. `@youj/motion`. */
  package: string
  /** The package entry that exports it, when the package lists one (its entries.json): `@youj/react/chart`. */
  entry?: string
  /** Optional peers of the package the item needs installed beside it: `recharts`. */
  peerDependencies?: string[]
  /** The package's folder, to read the item's source from. */
  dir?: string
}

/** A package's entries.json (written by its generator): the entries, the items each exports and the optional peers it needs. */
type PackageEntries = Record<string, { items: string[]; peerDependencies: Record<string, string> }>

let cache: Map<string, RegistryItem> | undefined

export function registryItems(packagesDir = join(process.cwd(), '../../packages')): Map<string, RegistryItem> {
  if (cache) return cache
  const items = new Map<string, RegistryItem>()
  for (const pkg of readdirSync(packagesDir).sort()) {
    let fragments: string[]
    try {
      fragments = readdirSync(join(packagesDir, pkg, 'registry')).filter((f) => f.endsWith('.json'))
    } catch {
      continue
    }
    const { name, peerDependenciesMeta = {} } = JSON.parse(readFileSync(join(packagesDir, pkg, 'package.json'), 'utf8')) as {
      name: string
      peerDependenciesMeta?: Record<string, { optional?: boolean }>
    }
    // Without entries.json, an item's own dependency that's an optional peer of its package is the one to install with it
    // (lottie-player: @lottiefiles/dotlottie-react), at the range the item names.
    const optionalPeers = (item: Omit<RegistryItem, 'package'>) => (item.dependencies ?? []).filter((dep) => peerDependenciesMeta[dep.replace(/(?<=.)@.*$/, '')]?.optional)
    const entryOf = new Map<string, { entry: string; peerDependencies: string[] }>()
    if (existsSync(join(packagesDir, pkg, 'entries.json'))) {
      const entries = JSON.parse(readFileSync(join(packagesDir, pkg, 'entries.json'), 'utf8')) as PackageEntries
      for (const [entry, { items: names, peerDependencies }] of Object.entries(entries))
        for (const item of names) entryOf.set(item, { entry, peerDependencies: Object.keys(peerDependencies) })
    }
    for (const fragment of fragments.sort()) {
      const list = JSON.parse(readFileSync(join(packagesDir, pkg, 'registry', fragment), 'utf8')) as Omit<RegistryItem, 'package'>[]
      for (const item of list) items.set(item.name, { ...item, package: name, peerDependencies: optionalPeers(item), ...entryOf.get(item.name), dir: join(packagesDir, pkg) })
    }
  }
  cache = items
  return items
}

export function registryItem(name: string): RegistryItem {
  const item = registryItems().get(name)
  if (!item) throw new Error(`Unknown registry item "${name}"`)
  return item
}

/**
 * The package entry that exports the item. Motion's heavier areas have their
 * own entries, so a Dock comes from `@youj/motion/interactions` and a Reveal
 * from `@youj/motion`; each loader is its own entry (`@youj/loaders/vortex`); icons and illustrations come from their own
 * packages; a UI component that needs an optional peer comes from its entry,
 * so a Chart comes from `@youj/react/chart`.
 */
export function packageEntry(item: RegistryItem): string {
  if (item.entry) return item.entry
  const file = item.files?.[0]?.path ?? ''
  const area = /^src\/components\/youj\/(interactions|backgrounds|players)\//.exec(file)?.[1]
  // A loader is its own entry, `@youj/loaders/<id>`; the kit is the package's.
  if (item.package === '@youj/loaders') return item.name === 'loader-kit' ? item.package : `${item.package}/${item.name.replace(/^loader-/, '')}`
  return item.package === '@youj/motion' && area ? `${item.package}/${area}` : item.package
}

/**
 * The npm packages a copy-in item (a block or an example) needs in an app on
 * the packages, as `youj add` installs them: the Youj package behind each
 * component, icon, scene and motion item it uses (with the optional peers of
 * the entry it comes from), and the libraries it imports itself. Blocks it's
 * built from are copied with it, so theirs count too. Youj packages first.
 */
export function itemPackages(name: string, items = registryItems()): string[] {
  const youj = new Set<string>()
  const other = new Set<string>()
  const seen = new Set<string>()
  const visit = (ref: string) => {
    const item = items.get(ref.replace(/^.*\/r\/|\.json$/g, ''))
    if (!item || seen.has(item.name)) return
    seen.add(item.name)
    if (item.type && COPY_IN_ONLY.has(item.type)) {
      for (const dep of item.dependencies ?? []) other.add(dep.replace(/(?<=.)@.*$/, ''))
      for (const dep of item.registryDependencies ?? []) visit(dep)
      return
    }
    youj.add(item.package)
    for (const peer of item.peerDependencies ?? []) other.add(peer.replace(/(?<=.)@.*$/, ''))
  }
  visit(name)
  return [...[...youj].sort(), ...[...other].filter((p) => !youj.has(p)).sort()]
}

/** Where `youj add` puts the item's main file, as an app import: `@/components/youj/motion/reveal`. */
export function registryImportPath(item: RegistryItem): string | undefined {
  const file = item.files?.[0]
  if (!file) return undefined
  const target = file.target ?? file.path.replace(/^src\//, '')
  return `@/${target.replace(/\.tsx?$/, '')}`
}

/** The two ways to install an item, as <InstallTabs> shows them and the Markdown pages print them. */
export interface InstallInfo {
  /** Absent for a copy-in-only item (a block or an example): no package exports it. */
  packageCommand?: string
  packageImport?: string
  /** `npx @youj/cli add <item>`: copies the source in. A packaged item is also in the package, so the package import stays the way to use it. */
  registryCommand: string
  /** A copy-in-only item's import, from the path the CLI writes: `import { CtaBanner } from '@/blocks/marketing/cta-banner'`. */
  registryImport?: string
  /** Registry items the CLI brings along. */
  registryDeps: string[]
  /** Optional peers of the package that `packageCommand` installs with it: `recharts`. */
  peerDependencies: string[]
  /** What `youj add` copies when it is heavy: absent for a lean item. */
  copyIn?: CopyIn
}

/** The registry items every copy-in shares: the provider, tokens, English labels and the theme contract (`youj-core`), the motion presets and the `cn()` helpers. */
const SHARED = new Set(['youj-core', 'youj-presets', 'youj-ui-core'])
/** Shared like the core: a component's own English strings (`youj-labels-button`) come with it and are never an extra to list. */
const isShared = (name: string) => SHARED.has(name) || name.startsWith('youj-labels-')
/** Past this many lines beyond the shared items, a page says what the copy brings. */
export const HEAVY_EXTRA_LINES = 1000

const sourceLines = (item: RegistryItem) =>
  (item.files ?? []).reduce((sum, file) => {
    try {
      return sum + readFileSync(join(item.dir ?? '', file.path), 'utf8').split('\n').length - 1
    } catch {
      return sum // a generated file (core's youj.css) that is not built yet
    }
  }, 0)

/** The item and everything it names in registryDependencies, transitively, with the lines `youj add` writes. */
export function copyInFootprint(name: string, items = registryItems()): CopyIn {
  const seen = new Set<string>()
  const visit = (ref: string) => {
    const dep = ref.replace(/^.*\/r\/|\.json$/g, '')
    if (seen.has(dep) || !items.has(dep)) return
    seen.add(dep)
    for (const next of items.get(dep)!.registryDependencies ?? []) visit(next)
  }
  visit(name)
  const lines = (n: string) => sourceLines(items.get(n)!)
  return {
    items: [...seen].sort(),
    extras: [...seen].filter((n) => n !== name && !isShared(n)).sort(),
    lines: [...seen].reduce((sum, n) => sum + lines(n), 0),
    coreLines: seen.has('youj-core') ? lines('youj-core') : 0,
  }
}

/** The footprint, when the copy is heavy enough that the page should say what it brings. */
export function heavyCopyIn(name: string, items = registryItems()): CopyIn | undefined {
  // Blocks are compositions by design; the line is for components.
  if (items.get(name)?.type !== 'registry:ui') return undefined
  const copy = copyInFootprint(name, items)
  const extraLines = copy.extras.reduce((sum, n) => sum + sourceLines(items.get(n)!), 0)
  return extraLines > HEAVY_EXTRA_LINES ? copy : undefined
}

/** Blocks ship only through the CLI (root CLAUDE.md, Distribution). */
const COPY_IN_ONLY = new Set(['registry:block', 'registry:example'])

/** Components a source file exports by name (`export { CtaBanner }`, `export function Hero`), types left out. */
export function sourceExports(code: string): string[] {
  const names = new Set<string>()
  for (const [, list = ''] of code.matchAll(/^export\s*\{([^}]*)\}/gm))
    for (const part of list.split(',')) {
      const name = part.trim().split(/\s+as\s+/).pop() ?? ''
      if (/^(?:[A-Z]|use[A-Z])\w*$/.test(name)) names.add(name)
    }
  for (const [, name = ''] of code.matchAll(/^export\s+(?:function|const)\s+((?:[A-Z]|use[A-Z])\w*)/gm)) names.add(name)
  return [...names]
}

/**
 * Commands and imports for an item, from the registry fragments. `exportsOf`
 * names the components a source file exports; `imports` overrides them, for a
 * kit whose page covers one part (`ChatMessageList`). When `exportsOf` knows
 * none (a block's file), the names are read from the source; an item with no
 * exports at all fails the build rather than print a made-up import.
 */
export function installInfo(name: string, exportsOf: (path: string) => string[], imports?: string, items = registryItems()): InstallInfo {
  const item = items.get(name)
  if (!item) throw new Error(`Unknown registry item "${name}"`)
  // A folder item's main file is the one named after it (kanban/kanban.tsx).
  const files = item.files ?? []
  const main = files.find((f) => f.path.endsWith(`/${name}.tsx`)) ?? files[0]
  let exports = imports ? [imports] : main ? exportsOf(main.path) : []
  const source = main && item.dir ? join(item.dir, main.path) : undefined
  if (!exports.length && source && existsSync(source)) exports = sourceExports(readFileSync(source, 'utf8'))
  const registryCommand = `npx @youj/cli add ${name}`
  const copyIn = heavyCopyIn(name, items)
  const registryDeps = (item.registryDependencies ?? []).map((d) => d.replace(/^.*\/r\/|\.json$/g, ''))
  const copyInOnly = !!item.type && COPY_IN_ONLY.has(item.type)
  if (!exports.length) {
    if (copyInOnly) throw new Error(`No exported component found for registry item "${name}": pass imports="…"`)
    // Stylesheet-only items (youj-presets) install but have nothing to import.
    return { packageCommand: ['pnpm add', item.package, ...(item.peerDependencies ?? [])].join(' '), registryCommand, registryDeps, peerDependencies: item.peerDependencies ?? [], copyIn }
  }
  const named = `{ ${exports.join(', ')} }`
  if (copyInOnly) {
    const path = main && registryImportPath({ ...item, files: [main] })
    return { registryCommand, registryImport: path && `import ${named} from '${path}'`, registryDeps, peerDependencies: [], copyIn }
  }
  return {
    packageCommand: ['pnpm add', item.package, ...(item.peerDependencies ?? [])].join(' '),
    packageImport: `import ${named} from '${packageEntry(item)}'`,
    registryCommand,
    registryDeps,
    peerDependencies: item.peerDependencies ?? [],
    copyIn,
  }
}
