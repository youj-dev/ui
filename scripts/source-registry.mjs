// Builds the shadcn registry of a source package that builds on motion
// (@youj/icons, @youj/illustrations): registry.json from its
// registry/*.json fragments, then (unless --check) `shadcn build` into public/r,
// which the docs site serves beside motion's and UI's items
// (apps/docs/scripts/registry.ts).
//
// The files install at their path under src/, which mirrors the app layout
// (scripts/youj-sources.mjs), so relative imports between them hold. Imports
// from a source package (`@youj/motion`) become the files `shadcn add`
// installs for each name (`@/lib/youj/provider`), the way UI's items import
// motion, and client modules get "use client".
//
// Both modes fail on an item whose files import something neither the item
// nor its registry dependencies bring, name an unknown registry dependency or
// an undeclared package, or use a motion preset class without youj-presets.
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join, posix } from 'node:path'
import ts from 'typescript'
import { presetClassPattern, usesPresetClass } from '../packages/core/scripts/presets.mjs'
import { sourceEntries, sourceFilesFor, sourceItems, sourceOf } from './youj-sources.mjs'
import { withUseClient } from './use-client.mjs'

const stem = (path) => path.replace(/\.(tsx?|css)$/, '').replace(/\/index$/, '')

/** Import and export-from declarations naming a source package, with the names they bind. */
function sourceReferences(code, path) {
  const source = ts.createSourceFile(path, code, ts.ScriptTarget.Latest, true, path.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
  const refs = []
  for (const node of source.statements) {
    const isImport = ts.isImportDeclaration(node)
    if (!(isImport || ts.isExportDeclaration(node)) || !node.moduleSpecifier || !sourceOf(node.moduleSpecifier.text)) continue
    const named = isImport ? node.importClause?.namedBindings : node.exportClause
    const elements = named && (ts.isNamedImports(named) || ts.isNamedExports(named)) ? named.elements : undefined
    refs.push({
      specifier: node.moduleSpecifier.text,
      isImport,
      typeOnly: isImport ? Boolean(node.importClause?.isTypeOnly) : node.isTypeOnly,
      elements: elements?.map((e) => ({ name: (e.propertyName ?? e.name).text, text: e.getText(source) })),
      start: node.getStart(source),
      end: node.getEnd(),
    })
  }
  return refs
}

/** Rewrites source-package imports to the app files that declare each name, as `@/` imports. */
function toAppImports(code, path, entries, problems) {
  const edits = []
  for (const ref of sourceReferences(code, path)) {
    if (!ref.elements) {
      problems.push(`${path}: ${ref.specifier} needs named imports to map onto registry files`)
      continue
    }
    let files
    try {
      files = sourceFilesFor(ref.specifier, ref.elements.map((e) => e.name), entries)
    } catch (error) {
      problems.push(`${path}: ${error.message}`)
      continue
    }
    const byFile = Map.groupBy(ref.elements, (e) => files.get(e.name))
    const statement = [...byFile]
      .map(([file, list]) => `${ref.isImport ? 'import' : 'export'}${ref.typeOnly ? ' type' : ''} { ${list.map((e) => e.text).join(', ')} } from '@/${stem(file)}'`)
      .join('\n')
    edits.push([ref.start, ref.end, statement])
  }
  for (const [start, end, text] of edits.sort((a, b) => b[0] - a[0])) code = code.slice(0, start) + text + code.slice(end)
  return code
}

/**
 * @param {string} root the package folder
 * @param {string} registryName the registry's `name`, e.g. `youj-icons`
 */
export function buildSourceRegistry(root, registryName) {
  const check = process.argv.includes('--check')
  const problems = []
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  const items = readdirSync(join(root, 'registry'))
    .filter((f) => f.endsWith('.json'))
    .sort()
    .flatMap((f) => {
      try {
        const parsed = JSON.parse(readFileSync(join(root, 'registry', f), 'utf8'))
        if (Array.isArray(parsed)) return parsed
        problems.push(`registry/${f}: must be an array of items`)
      } catch (e) {
        problems.push(`registry/${f}: invalid JSON (${e.message})`)
      }
      return []
    })
  const all = sourceItems()
  const byName = new Map(all.map((i) => [i.name, i]))
  const declared = new Set(Object.keys({ ...pkg.dependencies, ...pkg.peerDependencies }))
  const presetPattern = presetClassPattern()
  const entries = sourceEntries()

  const closure = (name, seen = new Set()) => {
    if (seen.has(name) || !byName.has(name)) return seen
    seen.add(name)
    for (const d of byName.get(name).registryDependencies ?? []) if (!d.includes('/')) closure(d, seen)
    return seen
  }

  const names = new Set()
  for (const item of items) {
    if (names.has(item.name)) problems.push(`duplicate item name: ${item.name}`)
    names.add(item.name)
    const owner = all.filter((i) => i.name === item.name && i.package !== pkg.name)
    if (owner.length) problems.push(`${item.name}: ${owner[0].package} has an item of the same name; the docs registry serves both`)
    for (const dep of item.registryDependencies ?? []) if (!dep.includes('/') && !byName.has(dep)) problems.push(`${item.name}: unknown registryDependency "${dep}"`)
    for (const dep of item.dependencies ?? []) {
      const base = dep.startsWith('@') ? dep.split('@').slice(0, 2).join('@') : dep.split('@')[0]
      if (!declared.has(base)) problems.push(`${item.name}: dependency "${dep}" is not in package.json dependencies or peers`)
    }
    // Every file an install brings: the item's and its registry dependencies', all in the app's layout.
    const reachable = new Set()
    for (const n of closure(item.name)) for (const f of byName.get(n).files ?? []) reachable.add(stem(f.target ?? f.path.replace(/^src\//, '')))
    for (const f of item.files ?? []) {
      const path = join(root, f.path)
      if (!existsSync(path)) {
        problems.push(`${item.name}: missing file ${f.path}`)
        continue
      }
      f.target ??= f.path.replace(/^src\//, '')
      if (!/\.tsx?$/.test(f.path)) continue
      const code = readFileSync(path, 'utf8')
      if (item.name !== 'youj-presets' && usesPresetClass(code, presetPattern) && !item.registryDependencies?.includes('youj-presets')) {
        problems.push(`${item.name}: ${f.path} uses a motion preset class, so the item needs registryDependencies "youj-presets"`)
      }
      const at = posix.dirname(f.path.replace(/^src\//, ''))
      for (const [, spec] of code.matchAll(/(?:from|import)\s*\(?\s*['"](\.{1,2}\/[^'"]+)['"]/g)) {
        if (!reachable.has(stem(posix.join(at, spec)))) problems.push(`${item.name}: ${f.path} imports ${spec}, which isn't in the item or its registry dependencies`)
      }
      for (const ref of sourceReferences(code, f.path)) {
        if (!ref.elements) continue
        try {
          for (const [name, file] of sourceFilesFor(ref.specifier, ref.elements.map((e) => e.name), entries)) {
            if (!reachable.has(stem(file))) problems.push(`${item.name}: ${f.path} imports ${name} from ${ref.specifier} (${file}), which isn't in the item or its registry dependencies`)
          }
        } catch (error) {
          problems.push(`${item.name}: ${f.path}: ${error.message}`)
        }
      }
    }
  }

  const fail = () => {
    console.error(problems.map((p) => `  ✗ ${p}`).join('\n'))
    console.error(`\n${problems.length} registry problem(s)`)
    process.exit(1)
  }
  if (problems.length) fail()

  // Fragments name items; shadcn needs URLs, the same base the docs site serves them from.
  const base = process.env.YOUJ_REGISTRY_URL ?? 'http://localhost:6006/r'
  for (const item of items) {
    if (item.registryDependencies) item.registryDependencies = item.registryDependencies.map((d) => (byName.has(d) ? `${base}/${d}.json` : d))
  }
  console.log(`registry: ${items.length} item(s)`)
  if (check) return

  writeFileSync(join(root, 'registry.json'), JSON.stringify({ $schema: 'https://ui.shadcn.com/schema/registry.json', name: registryName, homepage: base.replace(/\/r$/, ''), items }, null, 2) + '\n')
  // public/r is all build output: clear it so an item that moved to another package doesn't linger here.
  rmSync(join(root, 'public/r'), { recursive: true, force: true })
  execFileSync('pnpm', ['exec', 'shadcn', 'build', 'registry.json', '--output', 'public/r'], { cwd: root, stdio: 'inherit' })
  for (const item of items) {
    const out = join(root, 'public/r', `${item.name}.json`)
    const built = JSON.parse(readFileSync(out, 'utf8'))
    for (const file of built.files ?? []) {
      if (/\.tsx?$/.test(file.path)) file.content = withUseClient(file.path, toAppImports(file.content, file.path, entries, problems))
    }
    writeFileSync(out, JSON.stringify(built, null, 2) + '\n')
  }
  if (problems.length) fail()
}
