import { aliasBase, appPath, fileTarget } from './copy-in'
import { importSpecifier } from './alias'
import { dependencyRef, fetchRegistryItem, type RegistryItem } from './registry'
import type { Project } from './project'

/* What `add` says about items it copied or would copy: the files a dry run
 * stands for, and the import line that uses what was added. Both read the
 * registry's items the way the copy does, so they match what lands. */

/** The items and every Youj item they depend on, each fetched once (an item the registry can't give is left out). */
export async function withDependencies(items: string[], env: NodeJS.ProcessEnv): Promise<Map<string, RegistryItem>> {
  const found = new Map<string, RegistryItem>()
  const queue = [...items]
  for (let ref = queue.shift(); ref; ref = queue.shift()) {
    if (found.has(ref)) continue
    const item = await fetchRegistryItem(ref, env)
    if (!item) continue
    found.set(ref, item)
    for (const dep of item.registryDependencies ?? []) queue.push(dependencyRef(dep, env))
  }
  return found
}

/** What a registry app's `add --dry-run` would do to the files: new ones listed, the rest counted. */
export async function previewFiles(project: Project, items: string[], env: NodeJS.ProcessEnv = process.env): Promise<string> {
  const base = aliasBase(project)
  const fresh: string[] = []
  const differing: string[] = []
  let same = 0
  for (const item of (await withDependencies(items, env)).values()) {
    for (const file of item.files ?? []) {
      const path = appPath(fileTarget(file), base)
      const current = project.read(path)
      if (current === null) fresh.push(path)
      else if (current === file.content) same++
      else differing.push(path)
    }
  }
  return [
    ...(fresh.length ? [`copy ${fresh.length} new file${fresh.length === 1 ? '' : 's'}:`, ...fresh.map((f) => `  + ${f}`)] : []),
    ...(differing.length ? [`keep your version of ${differing.length} file${differing.length === 1 ? '' : 's'} that differ (--overwrite replaces ${differing.length === 1 ? 'it' : 'them'}):`, ...differing.map((f) => `  ~ ${f}`)] : []),
    ...(same ? [`${same} file${same === 1 ? '' : 's'} already in place`] : []),
    ...(!fresh.length && !differing.length && !same ? ['nothing the registry could give'] : []),
  ].join('\n')
}

const EXPORT = /^export\s+(?:default\s+)?(?:async\s+)?(?:function|const|class)\s+([A-Z]\w*)/gm
/** An `export { A, type B, C as D }` list, how the kit's blocks and components export (`export type { … }` is no match). */
const EXPORT_LIST = /^export\s*\{([^}]*)\}/gm

/** The capitalized names a module exports, as an importer says them: its declarations, then its export lists (types left out). */
function exportedNames(source: string): string[] {
  const listed = [...source.matchAll(EXPORT_LIST)]
    .flatMap((m) => m[1]!.split(','))
    .map((part) => part.trim())
    .filter((part) => part && !part.startsWith('type '))
    .map((part) => part.split(/\s+as\s+/).at(-1)!)
    .filter((name) => /^[A-Z]/.test(name))
  return [...new Set([...[...source.matchAll(EXPORT)].map((m) => m[1]!), ...listed])]
}

/**
 * `import { MarketingNavbar } from '@/blocks/marketing/navbar'` for each item
 * that was copied: the first code file the registry lists for it, and the
 * capitalized names it exports. An item with no such file (a stylesheet, a
 * hook) has no line.
 */
export async function importLines(project: Project, items: string[], env: NodeJS.ProcessEnv = process.env): Promise<string[]> {
  const base = aliasBase(project)
  const from = project.find('app/layout.tsx', 'src/app/layout.tsx', 'src/main.tsx', 'src/index.tsx') ?? `${base}index.tsx`
  const lines: string[] = []
  for (const ref of items) {
    const item = await fetchRegistryItem(ref, env)
    const file = item?.files?.find((f) => /\.[jt]sx$/.test(f.path))
    if (!file) continue
    const path = appPath(fileTarget(file), base)
    const source = project.read(path)
    if (source === null) continue
    const names = exportedNames(source)
    if (names.length) lines.push(`import { ${names.slice(0, 4).join(', ')} } from '${importSpecifier(project, from, path.replace(/\.[jt]sx?$/, ''))}'`)
  }
  return lines
}
