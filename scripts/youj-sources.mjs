// The source packages: @youj/core, @youj/motion, @youj/loaders, @youj/icons and
// @youj/illustrations. Each one's src/ mirrors the layout `youj add`
// writes into an app (lib/youj/…, components/youj/…, components/youj/loaders/…, components/youj/icons/…,
// components/youj/graphics/…), and no two share a path, so a file's path
// under its package's src/ names it across all of them, in the workspace and in
// an app. Code importing them (UI's components and blocks, and
// motion, icons and illustrations themselves, which import core) resolves
// imports to files here:
//   - the package builds rewrite source paths to the entry that exports them,
//     since a published package only exposes its entries;
//   - the registry builds rewrite imports to the files `shadcn add` installs,
//     and depend on the items that hold them.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import ts from 'typescript'

const packagesDir = join(import.meta.dirname, '../packages')

const coreLocales = () =>
  Object.fromEntries(
    readdirSync(join(packagesDir, 'core/src/locales'))
      .filter((f) => /^[a-z]{2}(-[A-Z]{2})?\.ts$/.test(f))
      .map((f) => [`/locales/${f.slice(0, -3)}`, `locales/${f}`]),
  )

/** @youj/loaders' entries: the kit's `.`, and one per loader (`/vortex` → components/youj/loaders/depth/vortex.tsx), as the package's generated exports list them. */
const loaderEntries = () => {
  const dir = 'components/youj/loaders'
  const entries = { '': 'index.ts' }
  for (const category of readdirSync(join(packagesDir, 'loaders/src', dir), { withFileTypes: true }).filter((d) => d.isDirectory())) {
    for (const file of readdirSync(join(packagesDir, 'loaders/src', dir, category.name)).filter((f) => f.endsWith('.tsx') && !/\.(stories|test)\.tsx$/.test(f))) {
      entries[`/${file.slice(0, -4)}`] = `${dir}/${category.name}/${file}`
    }
  }
  return entries
}

/** Each source package: its npm name, folder and public entries (subpath → file under src/). `publishedAs` names an entry that exists in the workspace only: a build points its imports at the published entry that exports the same names. */
export const SOURCES = [
  { name: '@youj/core', dir: 'core', entries: { '': 'index.ts', '/labels': 'labels.ts', '/internal': 'internal.ts', ...coreLocales() }, publishedAs: { '/labels': '/internal' } },
  { name: '@youj/motion', dir: 'motion', entries: { '': 'index.ts', '/interactions': 'interactions.ts', '/backgrounds': 'backgrounds.ts', '/players': 'players.ts' } },
  { name: '@youj/loaders', dir: 'loaders', entries: loaderEntries() },
  { name: '@youj/icons', dir: 'icons', entries: { '': 'index.ts' } },
  { name: '@youj/illustrations', dir: 'illustrations', entries: { '': 'index.ts', '/builder': 'builder.ts' } },
]

/** The source package a specifier imports (`@youj/icons/components/…` → icons), or undefined. */
export function sourceOf(specifier) {
  return SOURCES.find((s) => specifier === s.name || specifier.startsWith(`${s.name}/`))
}

/** A source package's src/ folder. */
export const srcOf = (source) => join(packagesDir, source.dir, 'src')

/** The source package that holds a file (a path under its src/), or undefined. */
export function sourceHolding(file) {
  return SOURCES.find((s) => statSync(join(srcOf(s), file), { throwIfNoEntry: false })?.isFile())
}

/** @returns {Map<string, Map<string, string>>} entry specifier → exported name → declaring file (relative to its package's src/) */
export function sourceEntries() {
  const list = SOURCES.flatMap((s) => Object.entries(s.entries).map(([sub, file]) => [`${s.name}${sub}`, join(srcOf(s), file)]))
  const program = ts.createProgram(
    list.map(([, file]) => file),
    {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      target: ts.ScriptTarget.ES2022,
      skipLibCheck: true,
      noEmit: true,
      types: [],
      // The workspace packages resolve to their source, as in each package's tsconfig.
      paths: Object.fromEntries(SOURCES.flatMap((s) => [[s.name, [join(srcOf(s), 'index.ts')]], [`${s.name}/*`, [`${srcOf(s)}/*`]]])),
    },
  )
  const checker = program.getTypeChecker()
  const entries = new Map()
  for (const [specifier, file] of list) {
    const names = new Map()
    const module = checker.getSymbolAtLocation(program.getSourceFile(file))
    for (const symbol of checker.getExportsOfModule(module)) {
      const target = symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol
      const declaration = target.declarations?.[0]
      if (!declaration) continue
      const declared = declaration.getSourceFile().fileName
      const owner = SOURCES.find((s) => declared.startsWith(`${srcOf(s)}/`))
      if (owner) names.set(symbol.name, relative(srcOf(owner), declared))
    }
    entries.set(specifier, names)
  }
  return entries
}

/** The source file a `@youj/<pkg>/<path>` specifier names, relative to that package's src/. */
export function sourceFile(specifier) {
  const source = sourceOf(specifier)
  if (!source || specifier === source.name) return undefined
  const path = specifier.slice(source.name.length + 1)
  return [`${path}.ts`, `${path}.tsx`, `${path}/index.ts`, path].find((candidate) => statSync(join(srcOf(source), candidate), { throwIfNoEntry: false })?.isFile())
}

/**
 * Where each name imported from a source specifier is declared.
 * @returns {Map<string, string>} name → file, or throws naming what isn't public
 */
export function sourceFilesFor(specifier, names, entries) {
  const entry = entries.get(specifier)
  const out = new Map()
  if (entry) {
    for (const name of names) {
      if (!entry.has(name)) throw new Error(`${specifier} doesn't export ${name}`)
      out.set(name, entry.get(name))
    }
    return out
  }
  const file = sourceFile(specifier)
  if (!file) throw new Error(`${specifier} doesn't resolve to a file in ${sourceOf(specifier)?.dir ?? 'a source package'}/src`)
  for (const name of names) out.set(name, file)
  return out
}

/** The public entry of `source` that exports every name from `file`, e.g. `@youj/motion/interactions`. */
export function sourceEntryFor(source, file, names, entries) {
  for (const [specifier, exported] of entries) {
    if (sourceOf(specifier) !== source) continue
    // A workspace-only entry (`@youj/core/labels`) isn't published, so a build never points at it.
    if (source.publishedAs?.[specifier.slice(source.name.length)]) continue
    if (names.every((name) => exported.get(name) === declaredThrough(source, file, name))) return specifier
  }
  return undefined
}

/**
 * The file that declares `name` as `file` exports it: `file` itself, or, when it only re-exports the name
 * (`export { useYouj } from './use-youj'`, `export * from './x'`), the file the re-export leads to. So an import by
 * an older source path (`@youj/core/lib/youj/provider`) still finds its entry after a module is split.
 */
export function declaredThrough(source, file, name, seen = new Set()) {
  if (seen.has(file)) return file
  seen.add(file)
  let code
  try {
    code = readFileSync(join(srcOf(source), file), 'utf8')
  } catch {
    return file
  }
  for (const ref of moduleReferences(code, file)) {
    if (ref.kind !== 'export' || !ref.specifier.startsWith('.')) continue
    const binding = ref.bindings.find((b) => b.local === name || (b.name === '*' && !b.local))
    if (!binding) continue
    const base = join(dirname(file), ref.specifier)
    const target = [`${base}.ts`, `${base}.tsx`, `${base}/index.ts`].find((candidate) => statSync(join(srcOf(source), candidate), { throwIfNoEntry: false })?.isFile())
    if (!target) continue
    if (binding.name === '*') {
      const found = declaredThrough(source, target, name, seen)
      if (found !== target || new RegExp(`export\\s+(?:async\\s+)?(?:function|const|let|class|type|interface|enum)\\s+${name}\\b`).test(readFileSync(join(srcOf(source), target), 'utf8'))) return found
      continue
    }
    return declaredThrough(source, target, binding.name, seen)
  }
  return file
}

/** The registry items of every source package, each with the package it comes from. */
export function sourceItems() {
  return SOURCES.flatMap((source) => {
    const dir = join(packagesDir, source.dir, 'registry')
    return readdirSync(dir)
      .filter((f) => f.endsWith('.json'))
      .sort()
      .flatMap((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')))
      .map((item) => ({ ...item, package: source.name }))
  })
}

/**
 * Import and export-from declarations with their module specifier and the
 * names they bind (`default` and `*` included), for rewriting by position.
 */
export function moduleReferences(code, fileName = 'module.tsx') {
  const kind = fileName.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  const source = ts.createSourceFile(fileName, code, ts.ScriptTarget.Latest, true, kind)
  const refs = []
  for (const statement of source.statements) {
    if (!(ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement)) || !statement.moduleSpecifier) continue
    const specifier = statement.moduleSpecifier.text
    const typeOnly = ts.isImportDeclaration(statement) ? Boolean(statement.importClause?.isTypeOnly) : statement.isTypeOnly
    const bindings = []
    const clause = ts.isImportDeclaration(statement) ? statement.importClause : undefined
    if (clause?.name) bindings.push({ name: 'default', local: clause.name.text, typeOnly })
    const named = clause ? clause.namedBindings : statement.exportClause
    if (named && (ts.isNamedImports(named) || ts.isNamedExports(named))) {
      for (const el of named.elements) {
        bindings.push({ name: (el.propertyName ?? el.name).text, local: el.name.text, typeOnly: typeOnly || el.isTypeOnly })
      }
    } else if (named || (ts.isExportDeclaration(statement) && !statement.exportClause)) {
      bindings.push({ name: '*', local: named?.name?.text, typeOnly })
    }
    refs.push({
      kind: ts.isImportDeclaration(statement) ? 'import' : 'export',
      specifier,
      typeOnly,
      bindings,
      start: statement.getStart(source),
      end: statement.getEnd(),
      specifierStart: statement.moduleSpecifier.getStart(source),
      specifierEnd: statement.moduleSpecifier.getEnd(),
    })
  }
  return refs
}

/**
 * Whether code reads `process` without declaring it. A copied file is typechecked in the app, and one
 * without Node's types (Vite's template types only vite/client) fails on it, so the copy-in sources
 * declare what they read: `declare const process: { env: { NODE_ENV?: string } }`.
 */
export function readsUndeclaredProcess(code, fileName = 'module.tsx') {
  if (/\bdeclare const process\b/.test(code)) return false
  const kind = fileName.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  const source = ts.createSourceFile(fileName, code, ts.ScriptTarget.Latest, true, kind)
  const reads = (node) => (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'process') || ts.forEachChild(node, reads) === true
  return reads(source)
}

/**
 * A tsdown (Rolldown) plugin for a package built on the source packages: code
 * may import them by source path (`@youj/core/lib/youj/provider`), which works
 * in the workspace, but a published package only exposes its entries, so each
 * such import points at the entry that exports those names, or the build fails.
 */
export function sourceEntryImports() {
  const entries = sourceEntries()
  return {
    name: 'youj:source-entries',
    transform: {
      filter: { id: { include: /\.tsx?$/, exclude: /node_modules/ }, code: '@youj/' },
      handler(code, id) {
        const edits = []
        for (const ref of moduleReferences(code, id)) {
          const source = sourceOf(ref.specifier)
          const published = source?.publishedAs?.[ref.specifier.slice(source.name.length)]
          if (published) {
            edits.push([ref.specifierStart, ref.specifierEnd, `'${source.name}${published}'`])
            continue
          }
          if (!source || ref.specifier === source.name || entries.has(ref.specifier)) continue
          const names = ref.bindings.map((b) => b.name)
          const file = sourceFile(ref.specifier)
          const holder = file && sourceHolding(file)
          const entry = holder && sourceEntryFor(holder, file, names, entries)
          if (!entry) this.error(`${id}: ${ref.specifier} { ${names.join(', ')} } isn't exported by a ${source.name} entry`)
          edits.push([ref.specifierStart, ref.specifierEnd, `'${entry}'`])
        }
        for (const [start, end, text] of edits.reverse()) code = code.slice(0, start) + text + code.slice(end)
        return edits.length ? { code, map: null } : null
      },
    },
  }
}
