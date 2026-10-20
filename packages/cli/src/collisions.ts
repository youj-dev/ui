/* Files of the app's own where Youj's go: a shadcn app's components/ui/button.tsx,
 * its lib/utils.ts. `add` and `init` keep the user's version of a file they
 * changed, which is right for a file of Youj's they edited, and wrong for a
 * shadcn component that a Youj component then imports: its names and props
 * differ, and the app stops compiling. This module tells the two apart, finds
 * the Youj imports a kept file can't satisfy, and merges lib/utils.ts (shadcn's
 * `cn` and the app's helpers, plus Youj's) so neither side loses anything. */

import { posix } from 'node:path'
import { aliasBase, codeOnly } from './copy-in'
import type { Project } from './project'

/**
 * Source that's recognisably Youj's: it imports the core (lib/youj,
 * components/youj), names Youj or uses its `yj-` classes. Most Youj files do;
 * a few small ones (label, kbd) don't, so the absence proves nothing alone.
 */
export const isYoujSource = (content: string) => /youj|\byj-/i.test(content)

/** Source built on Radix, as shadcn's older styles are: never Youj's (Youj is built on Base UI). */
export const isRadixSource = (content: string) => /from\s*['"](?:@radix-ui\/[\w-]+|radix-ui)['"]/.test(content)

/**
 * Whether the app's `current` file is something other than Youj's (shadcn's),
 * rather than Youj's file edited: built on Radix, or unmarked where Youj's own
 * version (`incoming`, when it's known) is marked.
 */
export const isForeign = (current: string, incoming?: string) => isRadixSource(current) || (incoming !== undefined && !isYoujSource(current) && isYoujSource(incoming))

/**
 * shadcn's lib/utils.ts as `shadcn init` writes it, and nothing else: `cn`
 * over clsx and tailwind-merge, or (shadcn 4) `export { cn } from "cn"`.
 */
export function isStockUtils(content: string): boolean {
  if (/^\s*export\s*\{\s*cn\s*\}\s*from\s*['"]cn['"];?\s*$/.test(content)) return true
  const names = exportedNames(content)
  return names !== null && names.size === 1 && names.has('cn') && /twMerge\(\s*clsx\(\s*inputs\s*\)\s*\)/.test(content)
}

/**
 * The names a module exports, or null when it re-exports a whole module
 * (`export * from`), whose names can't be read without following it.
 */
export function exportedNames(content: string): Set<string> | null {
  const code = codeOnly(content)
  const names = new Set<string>()
  if (/(^|[\s;])export\s*\*\s*from/.test(code)) return null
  for (const m of code.matchAll(/(?:^|[\s;])export\s+(?:declare\s+)?(?:default\s+)?(?:async\s+)?(?:function\*?|const|let|var|class|interface|type|enum|abstract\s+class|namespace)\s+([\w$]+)/g)) names.add(m[1]!)
  if (/(^|[\s;])export\s+default\b/.test(code)) names.add('default')
  for (const m of code.matchAll(/(?:^|[\s;])export\s+(?:type\s+)?\{([^}]*)\}/g)) {
    for (const part of content.slice(m.index!, m.index! + m[0].length).replace(/^[\s;]*export\s+(?:type\s+)?\{/, '').replace(/\}$/, '').split(',')) {
      const name = part.trim().replace(/^type\s+/, '').split(/\s+as\s+/).pop()?.trim()
      if (name) names.add(name)
    }
  }
  for (const m of code.matchAll(/(?:^|[\s;])export\s*\*\s*as\s+([\w$]+)/g)) names.add(m[1]!)
  return names
}

export interface ImportOf {
  spec: string
  /** The names it imports by name (`default` for a default import); empty for a namespace or side-effect import. */
  names: string[]
}

/** The static imports and re-exports of a module, read from code only. */
export function importsOf(content: string): ImportOf[] {
  const code = codeOnly(content)
  const out: ImportOf[] = []
  // The clause stops at the next import or export: without semicolons, a local `export { A }` followed by
  // `export { B } from './b'` would otherwise read as one statement, and A as imported from ./b.
  const re = /(?:^|[\s;])(import|export)\s+(type\s+)?((?:(?!\b(?:import|export)\b)[^'";])*?)\s*from\s*(['"])([^'"\n]*)\4/g
  for (const m of content.matchAll(re)) {
    // A statement inside a string or a comment isn't one.
    if (!code.slice(m.index!, m.index! + m[0].length).includes(m[1]!)) continue
    const clause = m[3]!.trim()
    const names: string[] = []
    const braces = clause.match(/\{([^}]*)\}/)
    if (braces)
      for (const part of braces[1]!.split(',')) {
        const name = part.trim().replace(/^type\s+/, '').split(/\s+as\s+/)[0]?.trim()
        if (name) names.push(name)
      }
    const head = clause.replace(/\{[^}]*\}/, '').replace(/,\s*$/, '').trim()
    if (m[1] === 'import' && head && !head.startsWith('*')) names.push('default')
    out.push({ spec: m[5]!, names })
  }
  return out
}

const EXTENSIONS = ['', '.tsx', '.ts', '.jsx', '.js', '/index.tsx', '/index.ts', '/index.jsx', '/index.js']

/** The app file an import from `file` lands on: `@/…` through the alias, `./…` beside it. Null for packages and files that aren't there. */
export function resolveImport(project: Project, file: string, spec: string, base = aliasBase(project)): string | null {
  let target: string
  if (spec.startsWith('@/')) target = `${base}${spec.slice(2)}`
  else if (spec.startsWith('.')) target = posix.normalize(posix.join(posix.dirname(file), spec))
  else return null
  for (const ext of EXTENSIONS) if (/\.[cm]?[jt]sx?$/.test(target + ext) && project.read(target + ext) !== null) return target + ext
  return null
}

export interface Broken {
  /** The app's own file that Youj's code imports. */
  file: string
  /** Whether it's shadcn's (or any non-Youj) version rather than an edited copy of Youj's. */
  foreign: boolean
  /** The Youj files that import it. */
  importers: string[]
  /** Names they import that it doesn't export. */
  missing: string[]
}

/**
 * Youj files (`importers`) importing a file of the app's own (`kept`) that
 * can't stand in for Youj's: one that isn't Youj's at all (shadcn's button:
 * the names may match, the props don't), or one that lacks a name they import.
 * `incoming` holds Youj's version of a kept file, where it's known.
 */
export function brokenImports(project: Project, kept: string[], importers: string[], incoming: Map<string, string> = new Map()): Broken[] {
  const base = aliasBase(project)
  const keep = new Set(kept)
  const found = new Map<string, Broken>()
  for (const importer of importers) {
    const content = project.read(importer)
    if (content === null || !/\.[jt]sx?$/.test(importer)) continue
    for (const { spec, names } of importsOf(content)) {
      const target = resolveImport(project, importer, spec, base)
      if (!target || !keep.has(target)) continue
      const source = project.read(target) ?? ''
      const exported = exportedNames(source)
      const missing = exported ? names.filter((n) => !exported.has(n)) : []
      const foreign = isForeign(source, incoming.get(target))
      if (!missing.length && !foreign) continue
      const entry = found.get(target) ?? { file: target, foreign, importers: [], missing: [] }
      if (!entry.importers.includes(importer)) entry.importers.push(importer)
      for (const name of missing) if (!entry.missing.includes(name)) entry.missing.push(name)
      found.set(target, entry)
    }
  }
  return [...found.values()]
}

/** What a list of broken files says, one line each. */
export function describeBroken(broken: Broken[]): string {
  const short = (path: string) => path.slice(path.lastIndexOf('/') + 1)
  return broken
    .map((b) => {
      const who = b.importers.map(short)
      const by = `${who.slice(0, 3).join(', ')}${who.length > 3 ? ` and ${who.length - 3} more` : ''}`
      const what = b.missing.length ? `${by} import${who.length === 1 ? 's' : ''} ${b.missing.slice(0, 4).join(', ')}${b.missing.length > 4 ? ', …' : ''}, which it doesn't export` : `imported by ${by}`
      return `  ${b.file}${b.foreign ? " (not Youj's: shadcn's, or your own)" : ''}: ${what}`
    })
    .join('\n')
}

/** The lines a merged lib/utils.ts ends with: the app's own helpers, moved beside it. */
export const UTILS_LOCAL = './utils.local'
const LOCAL_MARK = '// Your own helpers, from the lib/utils.ts you had before Youj'
const LOCAL_BLOCK = `\n${LOCAL_MARK} (now in utils.local.ts).\n// Youj's cn above does what shadcn's did, and knows Youj's tokens.\nexport * from '${UTILS_LOCAL}'\n`

export type UtilsMerge =
  /** Youj's file, as it is: the app had shadcn's stock one (only `cn`). */
  | { kind: 'replace'; content: string }
  /** Youj's file re-exporting the app's helpers, which move to lib/utils.local.ts (`local`, unless they're there already). */
  | { kind: 'merge'; content: string; local?: { path: string; content: string }; shadowed: string[] }
  /** The app's file is Youj's already (modulo formatting), merged or not. */
  | { kind: 'same' }
  /** Can't merge safely (a lib/utils.local.ts of the app's own is in the way): keep it. */
  | { kind: 'conflict' }

/**
 * lib/utils.ts, which every Youj UI item imports `cn` and its helpers from,
 * and which a shadcn app has its own of. Youj's `cn` does what shadcn's does
 * (and knows Youj's tokens), so shadcn's stock file is simply replaced; one
 * with the app's own helpers moves to lib/utils.local.ts and Youj's file
 * re-exports it, so `import { formatDate } from '@/lib/utils'` keeps working.
 * Where both define a name, Youj's wins (listed in `shadowed`). `same`
 * compares two versions of the file modulo formatting.
 */
export function mergeUtils(project: Project, path: string, current: string, incoming: string, same: (a: string, b: string) => boolean): UtilsMerge {
  const merged = `${incoming.trimEnd()}\n${LOCAL_BLOCK}`
  // Merged before: Youj's part is what precedes the mark. A newer one replaces it; the helpers stay where they are.
  if (current.includes(LOCAL_MARK)) return same(current.slice(0, current.indexOf(LOCAL_MARK)), incoming) ? { kind: 'same' } : { kind: 'merge', content: merged, shadowed: [] }
  if (same(current, incoming)) return { kind: 'same' }
  if (isStockUtils(current)) return { kind: 'replace', content: incoming }
  const local = localPath(path)
  const existing = project.read(local)
  if (existing !== null && existing !== current) return { kind: 'conflict' }
  const theirs = exportedNames(current) ?? new Set<string>()
  const ours = exportedNames(incoming) ?? new Set<string>()
  return { kind: 'merge', content: merged, local: { path: local, content: current }, shadowed: [...theirs].filter((n) => ours.has(n) && n !== 'cn') }
}

const localPath = (path: string) => path.replace(/utils\.([jt]sx?)$/, 'utils.local.$1')

/** Whether a path is the app's lib/utils (where shadcn and Youj both put `cn`). */
export const isUtilsPath = (path: string) => /(^|\/)lib\/utils\.[jt]s$/.test(path)
