/* What the installed Youj packages export, read from their own export maps and
 * type entries: which entry exports each name, and the module (a path that mirrors
 * where `add` copies the same file: components/ui/button, lib/youj/provider…)
 * each name is declared in. `add` uses it to point a copied block at the packages,
 * and `doctor` to spot copies of what they ship. Nothing here is a hand-kept list. */

import { existsSync, readdirSync, readFileSync, realpathSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'

/** The packages whose modules a copied item can come from. */
export const SOURCE_PACKAGES = ['@youj/react', '@youj/core', '@youj/motion', '@youj/loaders', '@youj/icons', '@youj/illustrations', '@youj/sound'] as const

export interface PackageExports {
  name: string
  version: string
  /** Every module the package has (its type files), as app-relative paths without extension: `components/ui/button`. */
  modules: Set<string>
  /** Exported name → the entries exporting it (`@youj/react/chart`) and the module it's declared in. */
  names: Map<string, { entry: string; module: string }[]>
}

const EXT = /(\.d)?\.(ts|tsx|mts|js|mjs)$/
/** `components/ui/chat/index` and `components/ui/chat` are one module. */
export const moduleKey = (path: string) => path.replace(EXT, '').replace(/\/index$/, '')

/** The package's manifest path in the app: in node_modules (walking up for hoisted workspaces), or beside @youj/react in pnpm's store. */
function locate(root: string, name: string): string | null {
  const direct = locateDirect(root, name)
  if (direct) return direct
  const react = locateDirect(root, '@youj/react')
  const sibling = react && join(dirname(realpathSync(react)), '../..', name, 'package.json')
  return sibling && existsSync(sibling) ? sibling : null
}

function locateDirect(root: string, name: string): string | null {
  let dir = resolve(root)
  for (;;) {
    const file = join(dir, 'node_modules', name, 'package.json')
    if (existsSync(file)) return file
    const parent = dirname(dir)
    if (parent === dir) return null
    dir = parent
  }
}

type ExportTarget = string | { types?: string; import?: string | { types?: string }; default?: string } | null

/** The type (or source) file an export-map entry points at. */
function typesOf(target: ExportTarget): string | null {
  if (typeof target === 'string') return /\.(ts|tsx)$/.test(target) ? target : target.replace(/\.m?js$/, '.d.ts')
  if (!target) return null
  if (target.types) return target.types
  if (typeof target.import === 'object' && target.import?.types) return target.import.types
  const js = typeof target.import === 'string' ? target.import : target.default
  return js ? js.replace(/\.m?js$/, '.d.ts') : null
}

const COMMENTS = /\/\*[\s\S]*?\*\/|\/\/[^\n]*/g
const SPEC = `\\s*from\\s*['"]([^'"]+)['"]`

interface Binding {
  name: string
  local: string
}

/** `a, type B, c as d` → bindings (type-only or not, a name is a name). */
export function parseBindings(list: string): Binding[] {
  return list
    .split(',')
    .map((part) => part.trim().replace(/^type\s+/, ''))
    .filter(Boolean)
    .map((part) => {
      const [name, local] = part.split(/\s+as\s+/)
      return { name: name!.trim(), local: (local ?? name)!.trim() }
    })
}

/**
 * The names a type or source entry file exports, with the file each is declared in:
 * `import { A } from './x.js'` + `export { A }` (what the packages' builds emit),
 * `export { A } from './x'` and `export * from './x'` (their sources).
 */
function readEntry(file: string, seen = new Set<string>()): Map<string, string> {
  const out = new Map<string, string>()
  if (seen.has(file) || !existsSync(file)) return out
  seen.add(file)
  const text = readFileSync(file, 'utf8').replace(COMMENTS, '')
  const target = (spec: string) => {
    const base = resolve(dirname(file), spec)
    const stem = base.replace(EXT, '')
    return [`${stem}.d.ts`, `${stem}.ts`, `${stem}.tsx`, `${stem}/index.d.ts`, `${stem}/index.ts`].find((f) => existsSync(f)) ?? `${stem}.d.ts`
  }
  const imported = new Map<string, { name: string; file: string }>()
  for (const m of text.matchAll(new RegExp(`import\\s+(?:type\\s+)?\\{([^}]*)\\}${SPEC}`, 'g')))
    for (const b of parseBindings(m[1]!)) imported.set(b.local, { name: b.name, file: target(m[2]!) })
  for (const m of text.matchAll(new RegExp(`export\\s+(?:type\\s+)?\\{([^}]*)\\}(?:${SPEC})?`, 'g'))) {
    const from = m[2] && target(m[2])
    for (const b of parseBindings(m[1]!)) out.set(b.local, from ?? imported.get(b.name)?.file ?? file)
  }
  for (const m of text.matchAll(new RegExp(`export\\s+\\*${SPEC}`, 'g'))) {
    const inner = target(m[1]!)
    for (const [name, at] of readEntry(inner, seen)) if (!out.has(name)) out.set(name, at)
  }
  // Declarations in the entry itself (`export const x`, `export function f`).
  for (const m of text.matchAll(/export\s+(?:declare\s+)?(?:const|let|function|class|interface|type|enum)\s+([\w$]+)/g)) if (!out.has(m[1]!)) out.set(m[1]!, file)
  return out
}

function walkTypes(dir: string, base: string, into: Set<string>, depth = 8) {
  let entries
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const entry of entries) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (depth > 0 && entry.name !== 'node_modules' && !entry.name.startsWith('_')) walkTypes(path, base, into, depth - 1)
    } else if (/\.d\.ts$/.test(entry.name) || (/\.tsx?$/.test(entry.name) && !/\.(test|stories)\.tsx?$/.test(entry.name))) {
      into.add(moduleKey(relative(base, path).split(sep).join('/')))
    }
  }
}

/** One installed package's exports, or null when it isn't installed. */
export function packageExports(root: string, name: string): PackageExports | null {
  const manifest = locate(root, name)
  if (!manifest) return null
  const pkg = JSON.parse(readFileSync(manifest, 'utf8')) as { name: string; version: string; exports?: Record<string, ExportTarget> }
  const dir = dirname(manifest)
  const main = typesOf(pkg.exports?.['.'] ?? null)
  if (!main) return null
  // Modules are paths under the folder the main entry sits in (dist/ or src/), which mirrors the app's layout.
  const base = dirname(join(dir, main))
  const modules = new Set<string>()
  walkTypes(base, base, modules)
  const names = new Map<string, { entry: string; module: string }[]>()
  for (const [key, value] of Object.entries(pkg.exports ?? {})) {
    if (key.includes('*') || key === './package.json' || /\.css$/.test(key)) continue
    const types = typesOf(value)
    if (!types) continue
    const entry = key === '.' ? pkg.name : `${pkg.name}/${key.replace(/^\.\//, '')}`
    for (const [exported, file] of readEntry(join(dir, types))) {
      const module = moduleKey(relative(base, file).split(sep).join('/'))
      names.set(exported, [...(names.get(exported) ?? []), { entry, module }])
    }
  }
  return { name: pkg.name, version: pkg.version, modules, names }
}

/** Every installed Youj package's exports. */
export function installedExports(root: string): PackageExports[] {
  return SOURCE_PACKAGES.map((name) => packageExports(root, name)).filter((p): p is PackageExports => p !== null)
}
