/* `add` in an app on the packages: a block is copied in on its own, on top of the
 * library the app already installs. Its registry dependencies that a package ships
 * (components, the provider and the rest of core, icons, the stylesheets)
 * aren't copied; the block's imports of them are pointed at the package entries that
 * export them (`@/components/ui/button` → `@youj/react`). Only what no package
 * ships (other blocks, a block's parts) is copied with it. What each package ships is
 * read from the packages installed in the app (exports.ts), so it can't drift.
 * There's no shadcn underneath, so no components.json and nothing to answer. */

import { posix } from 'node:path'
import entries from '../../ui/entries.json' with { type: 'json' }
import { pathsOf } from './alias'
import { essence } from './copy'
import { KIT_COPY_IN, PACKAGES, sourcePackageOf, withCorePeer } from './constants'
import { moduleKey, parseBindings, type PackageExports } from './exports'
import type { Project } from './project'
import { dependencyRef, loadRegistryItem, type RegistryFile, type RegistryItem } from './registry'

const ENTRY_PEERS: Record<string, Record<string, string>> = Object.fromEntries(Object.entries(entries).map(([entry, e]) => [entry, e.peerDependencies]))

const CODE = /\.(tsx?|jsx?)$/

export interface CopyInFile {
  /** Where it goes, relative to the app root. */
  path: string
  content: string
  /** The registry item it comes from. */
  item: string
}

export interface CopyInPlan {
  files: CopyInFile[]
  /** Registry items copied whole: the ones asked for and the copy-in-only ones they need. */
  copied: string[]
  /** Registry dependencies left to the packages, by package. */
  fromPackages: Map<string, string[]>
  /** Items asked for that a package ships whole: nothing to copy. */
  shipped: { item: string; pkg: string }[]
  /** Imports pointed at a package entry. */
  rewritten: number
  /** Packages and optional peers the rewritten imports and the copied files need, with ranges ('' for none). */
  needs: Map<string, string>
  /** Youj packages that ship some of the dependencies but aren't installed: install them, then plan again. */
  missingPackages: string[]
  /** `@/` imports nothing could satisfy. */
  unresolved: string[]
}

/** The folder the `@/` alias points at (`src/` or the root), from tsconfig. */
export function aliasBase(project: Project): string {
  const config = project.find('tsconfig.json', 'jsconfig.json')
  const target = config ? pathsOf(project, config)?.['@/*']?.[0] : undefined
  if (target === undefined) return project.exists('src') ? 'src/' : ''
  const base = target.replace(/^\.\//, '').replace(/\*$/, '')
  return base === '' || base.endsWith('/') ? base : `${base}/`
}

/** A registry file's path under the alias (`components/ui/button.tsx`), as shadcn places it. */
export function fileTarget(file: RegistryFile): string {
  if (file.target) return file.target
  const inSrc = file.path.match(/(?:^|\/)src\/(.+)$/)?.[1]
  if (inSrc) return inSrc
  const name = file.path.slice(file.path.lastIndexOf('/') + 1)
  const folder = { 'registry:ui': 'components/ui', 'registry:hook': 'hooks', 'registry:lib': 'lib' }[file.type ?? ''] ?? 'components'
  return `${folder}/${name}`
}

/** The app path a target lands on: under the alias, except root-relative ones (`~/…`, `public/…`). */
export const appPath = (target: string, base: string) => (target.startsWith('~/') ? target.slice(2) : target.startsWith('public/') ? target : `${base}${target}`)

/** The package that ships an item: one whose modules include any of the item's code files. CSS-only items come with the stylesheet. */
function shippedBy(item: RegistryItem, index: PackageExports[]): PackageExports | 'styles' | undefined {
  const files = item.files ?? []
  if (!files.length) return item.css || item.cssVars ? 'styles' : undefined
  if (files.every((f) => f.path.endsWith('.css'))) return 'styles'
  for (const file of files.filter((f) => CODE.test(f.path))) {
    const key = moduleKey(fileTarget(file))
    const pkg = index.find((p) => p.modules.has(key))
    if (pkg) return pkg
  }
  return undefined
}

const NAMED = /^([ \t]*)(import|export)(\s+type)?\s*\{([^}]*)\}\s*from\s*(['"])(@\/[^'"]+)\5([ \t]*;?)/gm
const PINNED = /(\bfrom\s*|\bimport\s*\(?\s*)(['"])(@\/[^'"]+\.tsx?)\2/g

/** Words after which a `/` starts a regex rather than dividing. */
const BEFORE_REGEX = new Set(['return', 'typeof', 'case', 'do', 'else', 'in', 'of', 'new', 'delete', 'void', 'throw', 'yield', 'await'])

/**
 * The source with comments and the insides of strings, template text and
 * regexes blanked to spaces (same length, newlines kept), so a pattern run on
 * it meets only code: `'…orders came from'` in a copy string isn't an import.
 * A quote or slash it misreads (an apostrophe in JSX text) blanks the rest of
 * that line at most, since neither strings nor regexes span lines.
 */
export function codeOnly(src: string): string {
  const out = src.split('')
  const blank = (from: number, to: number) => {
    for (let k = from; k < Math.min(to, src.length); k++) if (out[k] !== '\n') out[k] = ' '
  }
  // The brace depth each open `${…}` started at: its `}` goes back to template text.
  const holes: number[] = []
  let depth = 0
  let i = 0
  const lineEnd = (from: number) => (src.indexOf('\n', from) < 0 ? src.length : src.indexOf('\n', from))
  const regexAllowed = () => {
    let k = i - 1
    while (k >= 0 && /\s/.test(out[k]!)) k--
    if (k < 0) return true
    const ch = out[k]!
    if (/[\w$]/.test(ch)) {
      let start = k
      while (start > 0 && /[\w$]/.test(out[start - 1]!)) start--
      return BEFORE_REGEX.has(out.slice(start, k + 1).join(''))
    }
    return '(,=:[!&|?{};+-*%~^'.includes(ch) || (ch === '>' && out[k - 1] === '=')
  }
  /** Template text from `from` (just past a backtick or a hole's `}`) to its end or next hole. */
  const templateText = (from: number) => {
    let j = from
    while (j < src.length && src[j] !== '`' && !(src[j] === '$' && src[j + 1] === '{')) j += src[j] === '\\' ? 2 : 1
    blank(from, j)
    if (src[j] === '$') {
      holes.push(depth)
      return j + 2
    }
    return j + 1
  }
  while (i < src.length) {
    const c = src[i]!
    const next = src[i + 1]
    if (c === '/' && next === '/') {
      const end = lineEnd(i)
      blank(i, end)
      i = end
    } else if (c === '/' && next === '*') {
      const close = src.indexOf('*/', i + 2)
      const end = close < 0 ? src.length : close + 2
      blank(i, end)
      i = end
    } else if (c === "'" || c === '"') {
      let j = i + 1
      while (j < src.length && src[j] !== c && src[j] !== '\n') j += src[j] === '\\' ? 2 : 1
      blank(i + 1, j)
      i = j + 1
    } else if (c === '`') i = templateText(i + 1)
    else if (c === '}' && holes.length && holes.at(-1) === depth) {
      holes.pop()
      i = templateText(i + 1)
    } else if (c === '/' && regexAllowed()) {
      let j = i + 1
      let inClass = false
      while (j < src.length && src[j] !== '\n' && (inClass || src[j] !== '/')) {
        if (src[j] === '[') inClass = true
        else if (src[j] === ']') inClass = false
        j += src[j] === '\\' ? 2 : 1
      }
      blank(i + 1, j)
      i = j + 1
    } else {
      if (c === '{') depth++
      else if (c === '}') depth--
      i++
    }
  }
  return out.join('')
}

const SPEC_AT = /(?<![\w$.])(?:from\s*|import\s*(?:\(\s*)?)(['"])/g

/** The module specifiers a file imports or re-exports (`from '…'`, `import '…'`, `import('…')`), read from code only. */
export function moduleSpecifiers(src: string, code = codeOnly(src)): string[] {
  const specs: string[] = []
  for (const m of code.matchAll(SPEC_AT)) {
    const open = m.index! + m[0].length
    const close = code.indexOf(m[1]!, open)
    if (close > open) specs.push(src.slice(open, close))
  }
  return specs
}


/** The package entry for each name imported from `@/<path>`, or null when one isn't public. */
function resolveNames(path: string, names: string[], index: PackageExports[]): Map<string, string[]> | null {
  const key = moduleKey(path)
  const owners = index.filter((p) => p.modules.has(key) || [...p.modules].some((m) => m.startsWith(`${key}/`)))
  if (!owners.length) return null
  const byEntry = new Map<string, string[]>()
  for (const name of names) {
    const found = owners.flatMap((p) => (p.names.get(name) ?? []).map((c) => ({ ...c, pkg: p.name })))
    // A name that moved to another package (`cn`, from @youj/react's lib/utils to @youj/core) is still that entry's.
    if (!found.length) found.push(...index.flatMap((p) => (p.names.get(name) ?? []).map((c) => ({ ...c, pkg: p.name }))))
    if (!found.length) return null
    const rank = (c: (typeof found)[number]) => (c.module === key ? 0 : 2) + (c.entry === c.pkg ? 0 : 1)
    const best = found.sort((a, b) => rank(a) - rank(b) || a.entry.length - b.entry.length)[0]!
    byEntry.set(best.entry, [...(byEntry.get(best.entry) ?? []), name])
  }
  return byEntry
}

const line = (keyword: string, bindings: string[], spec: string, quote: string, semi: string) => {
  const one = `${keyword} { ${bindings.join(', ')} } from ${quote}${spec}${quote}${semi}`
  return one.length <= 100 ? one : `${keyword} {\n${bindings.map((b) => `  ${b},`).join('\n')}\n} from ${quote}${spec}${quote}${semi}`
}

/**
 * Points a copied file's `@/` imports at the packages where they export every name:
 * one statement per entry, the imports of one entry merged. Imports of copied files
 * stay; the rest are returned as `needed` (a file to copy, or nothing to be had).
 */
export function rewriteImports(content: string, local: (key: string) => boolean, index: PackageExports[]): { content: string; rewritten: number; entries: Set<string>; needed: string[] } {
  const usedEntries = new Set<string>()
  const needed = new Set<string>()
  let rewritten = 0
  // First pass: what each named import becomes.
  type Plan = { start: number; end: number; indent: string; keyword: string; typeOnly: boolean; quote: string; semi: string; groups: Map<string, string[]> }
  const plans: Plan[] = []
  const code = codeOnly(content)
  for (const m of content.matchAll(NAMED)) {
    const [whole, indent, keyword, type, list, quote, spec, semi] = m as unknown as string[]
    // A statement inside a string or a comment (a code sample) isn't one.
    if (!code.startsWith(keyword!, m.index! + indent!.length)) continue
    if (local(moduleKey(spec!.slice(2)))) continue
    const texts = list!.split(',').map((t) => t.trim()).filter(Boolean)
    const names = parseBindings(list!).map((b) => b.name)
    const groups = resolveNames(spec!.slice(2), names, index)
    if (!groups) {
      needed.add(spec!)
      continue
    }
    const byText = new Map<string, string[]>()
    for (const [entry, ns] of groups) byText.set(entry, texts.filter((_, i) => ns.includes(names[i]!)))
    plans.push({ start: m.index!, end: m.index! + whole!.length, indent: indent!, keyword: keyword!, typeOnly: Boolean(type), quote: quote!, semi: semi!.trim(), groups: byText })
    rewritten++
  }
  // Imports of one entry (and type-ness) merge into the first statement that has it.
  const merged = new Map<string, { at: Plan; bindings: string[] }>()
  for (const plan of plans)
    for (const [entry, bindings] of plan.groups) {
      usedEntries.add(entry)
      if (plan.keyword !== 'import') continue
      const key = `${plan.typeOnly ? 'type ' : ''}${entry}`
      const group = merged.get(key)
      if (group) group.bindings.push(...bindings.filter((b) => !group.bindings.includes(b)))
      else merged.set(key, { at: plan, bindings: [...bindings] })
    }
  let out = content
  for (const plan of [...plans].reverse()) {
    const statements = [...plan.groups].flatMap(([entry, bindings]) => {
      const keyword = `${plan.keyword}${plan.typeOnly ? ' type' : ''}`
      if (plan.keyword !== 'import') return [line(keyword, bindings, entry, plan.quote, plan.semi)]
      const group = merged.get(`${plan.typeOnly ? 'type ' : ''}${entry}`)!
      return group.at === plan ? [line(keyword, group.bindings, entry, plan.quote, plan.semi)] : []
    })
    const text = statements.map((s) => s.replace(/^/gm, plan.indent)).join('\n')
    // A statement merged away takes its line with it.
    const end = !text && out[plan.end] === '\n' ? plan.end + 1 : plan.end
    out = out.slice(0, plan.start) + text + out.slice(end)
  }
  // The registry pins some imports of copied files to `.ts` for shadcn (packages/ui/scripts/shadcn-imports.mjs),
  // which drops it again; written as they are, the app's TypeScript refuses them without allowImportingTsExtensions.
  out = out.replace(PINNED, (whole, lead: string, quote: string, spec: string) => (local(moduleKey(spec.slice(2))) ? `${lead}${quote}${spec.replace(/\.tsx?$/, '')}${quote}` : whole))
  // Any other form of `@/` import (default, namespace, side effect) of something not copied.
  for (const spec of moduleSpecifiers(out)) if (spec.startsWith('@/') && !local(moduleKey(spec.slice(2)))) needed.add(spec)
  return { content: out, rewritten, entries: usedEntries, needed: [...needed] }
}

/**
 * A copied file's relative imports of files that aren't copied, written as `@/`
 * imports so they're pointed at the packages like the rest (the illustration
 * kit's `../iso-scene`). Relative imports of copied files stay.
 */
function aliasRelative(content: string, key: string, local: (key: string) => boolean): string {
  const code = codeOnly(content)
  let out = content
  for (const m of [...code.matchAll(SPEC_AT)].reverse()) {
    const open = m.index! + m[0].length
    const close = code.indexOf(m[1]!, open)
    const spec = content.slice(open, close)
    if (!spec.startsWith('./') && !spec.startsWith('../')) continue
    const target = moduleKey(posix.join(posix.dirname(key), spec))
    if (!local(target)) out = `${out.slice(0, open)}@/${target}${out.slice(close)}`
  }
  return out
}

/** The npm package a bare specifier names: `@scope/pkg/sub` → `@scope/pkg`, `motion/react` → `motion`. */
const packageName = (spec: string) => (spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0]!)

/**
 * Works out what `add` copies for `items` in an app on the packages: fetches them and
 * their registry dependencies from the registry in use, leaves the ones a package
 * ships, rewrites the imports, and lists what has to be installed. Writes nothing.
 */
export async function planCopyIn(project: Project, items: string[], index: PackageExports[], deps: Record<string, string>, env: NodeJS.ProcessEnv): Promise<CopyInPlan> {
  const fetched = new Map<string, RegistryItem>()
  const copied: string[] = []
  const fromPackages = new Map<string, string[]>()
  const shipped: CopyInPlan['shipped'] = []
  const missingPackages = new Set<string>()
  const roots = new Set(items.map((item) => dependencyRef(item, env)))
  let level = [...roots]
  const seen = new Set(level)
  while (level.length) {
    const jsons = await Promise.all(level.map((ref) => loadRegistryItem(ref, env)))
    const next: string[] = []
    level.forEach((ref, i) => {
      const json = jsons[i]!
      fetched.set(ref, json)
      // The kit is in the package's files but not its exports: asked for, it's copied.
      const kit = roots.has(ref) && KIT_COPY_IN.has(ref)
      const owner = kit ? undefined : shippedBy(json, index)
      const pending = !owner && !kit && !/^https?:/.test(ref) ? sourcePackageOf(ref) : undefined
      const pkg = owner === 'styles' ? 'the stylesheet' : (owner?.name ?? pending)
      if (pending && !index.some((p) => p.name === pending)) missingPackages.add(pending)
      if (pkg) {
        if (roots.has(ref)) shipped.push({ item: ref, pkg })
        else fromPackages.set(pkg, [...(fromPackages.get(pkg) ?? []), ref])
        return
      }
      copied.push(ref)
      for (const dep of json.registryDependencies ?? []) {
        const name = dependencyRef(dep, env)
        if (!seen.has(name)) {
          seen.add(name)
          next.push(name)
        }
      }
    })
    level = next
  }

  const base = aliasBase(project)
  const files = new Map<string, CopyInFile & { key: string }>()
  const add = (file: RegistryFile, item: string) => {
    const target = fileTarget(file)
    const path = appPath(target, base)
    if (!files.has(path)) files.set(path, { path, content: file.content ?? '', item, key: moduleKey(target) })
  }
  for (const ref of copied) for (const file of fetched.get(ref)!.files ?? []) add(file, ref)

  // Rewrite until nothing new is needed: a file a package has but doesn't export (a helper
  // beside a component) is copied from the item that has it, and rewritten in turn.
  const owners = new Map<string, { file: RegistryFile; item: string }>()
  for (const [ref, json] of fetched) for (const file of json.files ?? []) if (CODE.test(file.path)) owners.set(moduleKey(fileTarget(file)), { file, item: ref })
  const done = new Set<string>()
  const used = new Set<string>()
  const unresolved = new Set<string>()
  let rewritten = 0
  for (let pass = 0; pass < 10; pass++) {
    const keys = new Set([...files.values()].map((f) => f.key))
    let grew = false
    for (const file of [...files.values()].filter((f) => CODE.test(f.path) && !done.has(f.path))) {
      done.add(file.path)
      const result = rewriteImports(aliasRelative(file.content, file.key, (key) => keys.has(key)), (key) => keys.has(key), index)
      file.content = result.content
      rewritten += result.rewritten
      for (const entry of result.entries) used.add(entry)
      for (const spec of result.needed) {
        const owner = owners.get(moduleKey(spec.slice(2)))
        if (owner) {
          add(owner.file, owner.item)
          grew = true
        } else unresolved.add(spec)
      }
    }
    if (!grew) break
    // Files copied for this pass's imports may satisfy imports already rewritten elsewhere; those stay rewritten.
  }

  // What has to be installed: the packages behind the rewritten imports, their entries' optional peers, and the copied files' own imports.
  const ranges = new Map<string, string>()
  for (const json of fetched.values())
    for (const spec of json.dependencies ?? []) {
      const at = spec.lastIndexOf('@')
      if (at > 0) ranges.set(spec.slice(0, at), spec.slice(at + 1))
      else if (!ranges.has(spec)) ranges.set(spec, '')
    }
  const needs = new Map<string, string>()
  const youj = (name: string) => index.find((p) => p.name === name)
  for (const entry of used) {
    const pkg = packageName(entry)
    if (!deps[pkg]) needs.set(pkg, `^${youj(pkg)?.version ?? ''}`.replace(/\^$/, ''))
    for (const [peer, range] of Object.entries(ENTRY_PEERS[entry] ?? {})) if (!deps[peer]) needs.set(peer, range)
  }
  for (const file of files.values())
    for (const spec of moduleSpecifiers(file.content)) {
      if (spec.startsWith('@/') || spec.startsWith('.') || spec.startsWith('/')) continue
      const name = packageName(spec)
      if (name.startsWith('node:') || deps[name] || needs.has(name) || ['react', 'react-dom'].includes(name)) continue
      needs.set(name, youj(name) ? `^${youj(name)!.version}` : (ranges.get(name) ?? ''))
    }

  // An item a package ships can still need an optional peer of that package, which only the item names
  // (lottie-player: @lottiefiles/dotlottie-react); without it the app's build can't resolve the import.
  for (const { item } of shipped)
    for (const spec of fetched.get(item)?.dependencies ?? []) {
      const at = spec.lastIndexOf('@')
      const name = at > 0 ? spec.slice(0, at) : spec
      if (!deps[name] && !needs.has(name)) needs.set(name, ranges.get(name) ?? '')
    }

  for (const name of withCorePeer([...needs.keys()], deps))
    if (!needs.has(name)) needs.set(name, `^${youj(PACKAGES.core)?.version ?? youj(PACKAGES.react)?.version ?? ''}`.replace(/\^$/, ''))

  return {
    files: [...files.values()].map(({ path, content, item }) => ({ path, content, item })),
    copied,
    fromPackages,
    shipped,
    rewritten,
    needs,
    missingPackages: [...missingPackages],
    unresolved: [...unresolved],
  }
}

export interface WriteOutcome {
  created: string[]
  updated: string[]
  unchanged: number
  conflicts: string[]
}

/**
 * Writes the plan's files: a file that's there and the same as Youj's (bar
 * formatting and the `'use client'` line) stays, one you changed is kept and
 * reported, unless `overwrite`.
 */
export function writeCopyIn(project: Project, files: CopyInFile[], overwrite: boolean): WriteOutcome {
  const outcome: WriteOutcome = { created: [], updated: [], unchanged: 0, conflicts: [] }
  for (const file of files) {
    const current = project.read(file.path)
    if (current === null) outcome.created.push(file.path)
    else if (current === file.content || essence(current) === essence(file.content)) {
      outcome.unchanged++
      continue
    } else if (overwrite) outcome.updated.push(file.path)
    else {
      outcome.conflicts.push(file.path)
      continue
    }
    project.write(file.path, file.content)
  }
  return outcome
}
