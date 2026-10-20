// Assembles registry.json from registry/*.json, then (unless --check) runs
// `shadcn build` into public/r, which the docs site serves beside core's
// and UI's items (apps/docs/scripts/registry.ts).
//
//   node scripts/build-registry.mjs          write registry.json + public/r
//   node scripts/build-registry.mjs --check  validate only; exit 1 on problems
//
// The files install under lib/youj/sound/, keeping their layout, so their
// relative imports hold. Imports from @youj/core become the
// youj-core files that declare each name (`@/lib/youj/sound-cue`), the
// way UI's items import core; client modules get "use client".
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, posix, relative } from 'node:path'
import ts from 'typescript'
import { withUseClient } from '../../../scripts/use-client.mjs'

const root = join(import.meta.dirname, '..')
const check = process.argv.includes('--check')
const CORE = '@youj/core'
const coreSrc = join(root, '../core/src')
const problems = []

const fragments = (dir) =>
  readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .flatMap((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')))
const items = fragments(join(root, 'registry'))
const coreItems = fragments(join(root, '../core/registry'))
const coreByName = new Map(coreItems.map((i) => [i.name, i]))
const targetFor = (path) => path.replace(/^src\//, 'lib/youj/sound/')

/** Where each name core's entry exports is declared, relative to core's src/. */
function coreDeclarations() {
  const entry = join(coreSrc, 'index.ts')
  const program = ts.createProgram([entry], {
    jsx: ts.JsxEmit.ReactJSX,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    target: ts.ScriptTarget.ES2022,
    skipLibCheck: true,
    noEmit: true,
    types: [],
  })
  const checker = program.getTypeChecker()
  const names = new Map()
  for (const symbol of checker.getExportsOfModule(checker.getSymbolAtLocation(program.getSourceFile(entry)))) {
    const target = symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol
    const file = target.declarations?.[0]?.getSourceFile().fileName
    if (file) names.set(symbol.name, relative(coreSrc, file))
  }
  return names
}

/** Rewrites @youj/core imports and re-exports to the declaring files, as the app's `@/` imports. */
function toAppImports(code, path, declared, found = new Set()) {
  const source = ts.createSourceFile(path, code, ts.ScriptTarget.Latest, true, path.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
  const edits = []
  for (const node of source.statements) {
    const isImport = ts.isImportDeclaration(node)
    if (!(isImport || ts.isExportDeclaration(node)) || node.moduleSpecifier?.text !== CORE) continue
    const elements = isImport ? node.importClause?.namedBindings?.elements : node.exportClause?.elements
    if (!elements) {
      problems.push(`${path}: ${CORE} needs named imports to map onto registry files`)
      continue
    }
    const byFile = new Map()
    for (const element of elements) {
      const name = (element.propertyName ?? element.name).text
      const file = declared.get(name)
      if (!file) {
        problems.push(`${path}: ${CORE} doesn't export ${name}`)
        continue
      }
      found.add(file)
      const alias = `@/${file.replace(/\.tsx?$/, '')}`
      byFile.set(alias, [...(byFile.get(alias) ?? []), element.getText(source)])
    }
    const typeOnly = isImport ? node.importClause.isTypeOnly : node.isTypeOnly
    const statement = [...byFile].map(([alias, list]) => `${isImport ? 'import' : 'export'}${typeOnly ? ' type' : ''} { ${list.join(', ')} } from '${alias}'`).join('\n')
    edits.push([node.getStart(source), node.getEnd(), statement])
  }
  for (const [start, end, text] of edits.sort((a, b) => b[0] - a[0])) code = code.slice(0, start) + text + code.slice(end)
  return code
}

const declared = coreDeclarations()
const coreFiles = (name, seen = new Set()) => {
  const item = coreByName.get(name)
  if (!item || seen.has(name)) return []
  seen.add(name)
  return [...(item.files ?? []).map((f) => f.path), ...(item.registryDependencies ?? []).flatMap((d) => coreFiles(d, seen))]
}

for (const item of items) {
  if (coreByName.has(item.name)) problems.push(`${item.name}: core has an item of the same name; the docs registry serves both`)
  const own = new Set((item.files ?? []).map((f) => f.path.replace(/\.tsx?$/, '')))
  const fromCore = new Set((item.registryDependencies ?? []).flatMap((d) => coreFiles(d)))
  for (const dep of item.registryDependencies ?? []) if (!dep.includes('/') && !coreByName.has(dep)) problems.push(`${item.name}: unknown registryDependency "${dep}"`)
  for (const f of item.files ?? []) {
    if (!existsSync(join(root, f.path))) {
      problems.push(`${item.name}: missing file ${f.path}`)
      continue
    }
    f.target ??= targetFor(f.path)
    const code = readFileSync(join(root, f.path), 'utf8')
    // Relative imports must land in the item; core's names in the item's registry dependencies.
    for (const [, spec] of code.matchAll(/(?:from|import)\s*\(?\s*['"](\.{1,2}\/[^'"]+)['"]/g)) {
      const target = posix.join(dirname(f.path), spec).replace(/\.tsx?$/, '')
      if (!own.has(target) && !own.has(`${target}/index`)) problems.push(`${item.name}: ${f.path} imports ${spec}, which isn't in the item`)
    }
    const found = new Set()
    toAppImports(code, f.path, declared, found)
    for (const file of found) if (!fromCore.has(`src/${file}`)) problems.push(`${item.name}: ${f.path} needs core's ${file}, which its registry dependencies don't bring`)
  }
}

if (problems.length) {
  console.error(problems.map((p) => `  ✗ ${p}`).join('\n'))
  console.error(`\n${problems.length} registry problem(s)`)
  process.exit(1)
}

// Fragments name core's items; shadcn needs URLs, the same base the docs site serves them from.
const base = process.env.YOUJ_REGISTRY_URL ?? 'http://localhost:6006/r'
for (const item of items) item.registryDependencies = (item.registryDependencies ?? []).map((d) => (coreByName.has(d) ? `${base}/${d}.json` : d))

console.log(`registry: ${items.length} item(s)`)
if (check) process.exit(0)

writeFileSync(join(root, 'registry.json'), JSON.stringify({ $schema: 'https://ui.shadcn.com/schema/registry.json', name: 'youj-sound', homepage: base.replace(/\/r$/, ''), items }, null, 2) + '\n')
// public/r is all build output: clear it so an item that moved to another package doesn't linger here.
rmSync(join(root, 'public/r'), { recursive: true, force: true })
execFileSync('pnpm', ['exec', 'shadcn', 'build', 'registry.json', '--output', 'public/r'], { cwd: root, stdio: 'inherit' })
for (const item of items) {
  const out = join(root, 'public/r', `${item.name}.json`)
  const built = JSON.parse(readFileSync(out, 'utf8'))
  for (const file of built.files ?? []) file.content = withUseClient(file.path, toAppImports(file.content, file.path, declared))
  writeFileSync(out, JSON.stringify(built, null, 2) + '\n')
}
