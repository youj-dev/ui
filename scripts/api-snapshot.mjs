// The public API of each published package, as a committed snapshot in
// api/<package>.api.md: every entry point (publishConfig.exports), every
// export of it, its signature as written (with the defaults a component
// destructures) and, for a component, the props its package declares.
// Inherited DOM, Base UI and motion props aren't listed: they're not ours.
//
//   pnpm api:update    regenerate after an intended API change, then commit api/
//   pnpm check:api     fail when the API changed and the snapshot didn't (part of pnpm verify)
//
// A diff in api/ is the review prompt: a removed export, a renamed or
// narrowed prop, a changed default is a breaking change (a minor while 0.x,
// with a changeset and an upgrade note); an addition is a patch.
// Uses the TypeScript compiler API; no api-extractor.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'
import { readTextIfExists } from './read-text.mjs'

const TYPE_FLAGS =
  ts.TypeFormatFlags.NoTruncation |
  ts.TypeFormatFlags.UseSingleQuotesForStringLiteralType |
  ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope |
  ts.TypeFormatFlags.WriteArrowStyleSignature
// Inferred constants (a token table, a scene list) are API too, but a type
// past this length says little more than its first part, and only churns.
const MAX_TYPE = 600

const printer = ts.createPrinter({ removeComments: true, newLine: ts.NewLineKind.LineFeed })
const STRIP = new Set([ts.SyntaxKind.ExportKeyword, ts.SyntaxKind.DefaultKeyword, ts.SyntaxKind.DeclareKeyword, ts.SyntaxKind.AsyncKeyword])
const modifiers = (node) => node.modifiers?.filter((m) => !STRIP.has(m.kind))

/** `import("/abs/path/src/x").Foo` → `Foo`, so the snapshot is the same on every machine. */
const normalize = (text) => text.replace(/import\("[^"]*"\)\./g, '').replace(/[ \t]+$/gm, '')

/** The package's published entries, mapped to the source files the workspace resolves them to. */
export function packageEntries(dir) {
  const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
  const published = manifest.publishConfig?.exports
  if (!published) return []
  const entries = []
  for (const key of Object.keys(published)) {
    const source = manifest.exports?.[key]
    if (typeof source !== 'string' || !/\.tsx?$/.test(source)) continue
    const name = key === '.' ? manifest.name : `${manifest.name}/${key.slice(2)}`
    if (!key.includes('*')) {
      entries.push({ entry: name, file: join(dir, source) })
      continue
    }
    // `./locales/*` → `./src/locales/*.ts`: one entry per file in that folder.
    const [prefix, suffix] = source.split('*')
    const folder = join(dir, prefix)
    for (const f of readdirSync(folder).sort()) {
      if (!f.endsWith(suffix) || /\.(test|stories)\./.test(f)) continue
      entries.push({ entry: name.replaceAll('*', () => f.slice(0, -suffix.length)), file: join(folder, f) })
    }
  }
  return entries
}

function compilerOptions(dir) {
  const config = join(dir, 'tsconfig.json')
  const parsed = existsSync(config) ? ts.getParsedCommandLineOfConfigFile(config, {}, { ...ts.sys, onUnRecoverableConfigFileDiagnostic: () => {} }) : undefined
  return { ...(parsed?.options ?? { strict: true, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, target: ts.ScriptTarget.ES2022 }), noEmit: true, skipLibCheck: true }
}

const isComponentName = (name) => /^[A-Z]/.test(name)
const inPackage = (decl) => !decl.getSourceFile().isDeclarationFile && !decl.getSourceFile().fileName.includes('/node_modules/')

/** A prop's type: union members sorted (the checker's order shifts with unrelated edits), `undefined` dropped from an optional one. */
function propType(checker, type, decl, optional) {
  if (!type.isUnion()) return checker.typeToString(type, decl, TYPE_FLAGS)
  let members = type.types.map((t) => checker.typeToString(t, decl, TYPE_FLAGS))
  if (members.includes('true') && members.includes('false')) members = [...members.filter((m) => m !== 'true' && m !== 'false'), 'boolean']
  if (optional) members = members.filter((m) => m !== 'undefined')
  return [...new Set(members)].sort().join(' | ')
}

/** The props a component takes that its own workspace declares, sorted; inherited DOM, Base UI and motion props aren't ours. */
function ownProps(checker, type, at) {
  return checker
    .getPropertiesOfType(checker.getNonNullableType(type))
    .filter((prop) => prop.declarations?.some(inPackage))
    .map((prop) => {
      const decl = prop.declarations.find(inPackage)
      const optional = Boolean(prop.flags & ts.SymbolFlags.Optional)
      const deprecated = ts.getJSDocDeprecatedTag(decl) ? ' /* deprecated */' : ''
      // As written when it's written (`ReactNode`, not its expansion); else the checker's, normalized.
      const written = (ts.isPropertySignature(decl) || ts.isPropertyDeclaration(decl)) && decl.type ? decl.type.getText().replace(/\s+/g, ' ') : undefined
      return `${prop.name}${optional ? '?' : ''}: ${written ?? propType(checker, checker.getTypeOfSymbolAtLocation(prop, at ?? decl), decl, optional)}${deprecated}`
    })
    .sort()
}

const propsLine = (props) => (props.length ? `\n  props: { ${props.join('; ')} }` : '')
const cap = (text) => (text.length > MAX_TYPE ? `${text.slice(0, MAX_TYPE)}…` : text)

/**
 * An inferred constant is data (a theme, a label pack, the scene list): its
 * shape is the API, not every value. An object prints its keys, a tuple its
 * length, anything else its type, capped.
 */
function dataType(checker, type, decl) {
  if (checker.isTupleType(type)) return `readonly [${checker.getTypeArguments(type).length} items]`
  if (!checker.isArrayType(type) && type.flags & ts.TypeFlags.Object && !type.getCallSignatures().length) {
    const keys = checker.getPropertiesOfType(type).map((p) => p.name)
    if (keys.length) return cap(`{ ${keys.sort().join('; ')} }`)
  }
  return cap(checker.typeToString(type, decl, TYPE_FLAGS))
}

function signature(checker, sf, name, params, typeParameters, returnType, node) {
  // An inferred return type, printed as text (the printer writes the identifier as it is).
  const type = returnType ?? ts.factory.createTypeReferenceNode(cap(checker.typeToString(checker.getReturnTypeOfSignature(checker.getSignatureFromDeclaration(node)), node, TYPE_FLAGS)))
  const fn = ts.factory.createFunctionDeclaration(undefined, undefined, name, typeParameters, params, type, undefined)
  return printer.printNode(ts.EmitHint.Unspecified, fn, sf)
}

/** One declaration, printed without bodies, comments or export keywords. */
function render(checker, name, decl) {
  const sf = decl.getSourceFile()
  const print = (node) => printer.printNode(ts.EmitHint.Unspecified, node, sf)
  const f = ts.factory
  const id = f.createIdentifier(name)
  const fn = (params, typeParameters, type, node) => {
    const text = signature(checker, sf, id, params, typeParameters, type, node)
    return isComponentName(name) && params[0] ? text + propsLine(ownProps(checker, checker.getTypeAtLocation(params[0]))) : text
  }

  if (ts.isFunctionDeclaration(decl)) return fn(decl.parameters, decl.typeParameters, decl.type, decl)
  if (ts.isVariableDeclaration(decl)) {
    const init = decl.initializer
    if (!decl.type && init && (ts.isArrowFunction(init) || ts.isFunctionExpression(init))) return fn(init.parameters, init.typeParameters, init.type, init)
    // Annotated: the type as written (its props are under that type's own export).
    if (decl.type) return `const ${name}: ${decl.type.getText(sf).replace(/\s+/g, ' ')}`
    const type = checker.getTypeAtLocation(decl.name)
    const call = type.getCallSignatures()[0]
    if (!call) return `const ${name}: ${dataType(checker, type, decl)}`
    // forwardRef, memo or a factory's component: its props come from the call signature.
    const typeText = cap(checker.typeToString(type, decl, TYPE_FLAGS))
    const text = `const ${name}: ${typeText}`
    const first = call.parameters[0]
    // A named component type (`YoujIconComponent`) lists its props under its own export.
    const named = /^[\w.]+(<.*>)?$/.test(typeText) && !/^(ForwardRefExoticComponent|MemoExoticComponent|NamedExoticComponent)</.test(typeText)
    return isComponentName(name) && first && !named ? text + propsLine(ownProps(checker, checker.getTypeOfSymbolAtLocation(first, decl), decl)) : text
  }
  if (ts.isInterfaceDeclaration(decl)) return print(f.updateInterfaceDeclaration(decl, modifiers(decl), id, decl.typeParameters, decl.heritageClauses, decl.members))
  if (ts.isTypeAliasDeclaration(decl)) return print(f.updateTypeAliasDeclaration(decl, modifiers(decl), id, decl.typeParameters, decl.type))
  if (ts.isEnumDeclaration(decl)) return print(f.updateEnumDeclaration(decl, modifiers(decl), id, decl.members))
  if (ts.isClassDeclaration(decl)) {
    const members = decl.members.filter((m) => !m.modifiers?.some((x) => x.kind === ts.SyntaxKind.PrivateKeyword) && !(m.name && ts.isPrivateIdentifier(m.name)))
    const heads = members.map((m) => {
      if (ts.isMethodDeclaration(m)) return f.updateMethodDeclaration(m, m.modifiers, m.asteriskToken, m.name, m.questionToken, m.typeParameters, m.parameters, m.type, undefined)
      if (ts.isConstructorDeclaration(m)) return f.updateConstructorDeclaration(m, m.modifiers, m.parameters, undefined)
      if (ts.isPropertyDeclaration(m)) return f.updatePropertyDeclaration(m, m.modifiers, m.name, m.questionToken, m.type, undefined)
      return m
    })
    return print(f.updateClassDeclaration(decl, modifiers(decl), id, decl.typeParameters, decl.heritageClauses, heads))
  }
  if (ts.isModuleDeclaration(decl)) return `namespace ${name}`
  // An `export default` expression or anything else: its type.
  return `${name}: ${checker.typeToString(checker.getTypeAtLocation(decl), decl, TYPE_FLAGS)}`
}

/** The package's API as Markdown: one section per entry, one block per export. */
export function snapshotPackage(dir) {
  const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
  const entries = packageEntries(dir)
  const program = ts.createProgram(
    entries.map((e) => e.file),
    compilerOptions(dir),
  )
  const checker = program.getTypeChecker()
  const out = [
    `# ${manifest.name} public API`,
    '',
    'Generated by `pnpm api:update` (scripts/api-snapshot.mjs). Do not edit by hand.',
    'A change here is a change to what users import: see RELEASING.md for the bump it needs.',
  ]
  for (const { entry, file } of entries) {
    const sf = program.getSourceFile(file)
    const moduleSymbol = sf && checker.getSymbolAtLocation(sf)
    const exports = moduleSymbol ? checker.getExportsOfModule(moduleSymbol) : []
    out.push('', `## ${entry}`, '')
    if (!exports.length) {
      out.push('(no exports)')
      continue
    }
    const blocks = []
    for (const symbol of [...exports].sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))) {
      const target = symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol
      const decls = target.declarations ?? []
      // An overloaded function's implementation isn't callable from outside.
      const callable = decls.filter((d) => !(ts.isFunctionDeclaration(d) && d.body && decls.some((o) => o !== d && ts.isFunctionDeclaration(o))))
      const typeOnly = !(target.flags & ts.SymbolFlags.Value) || symbol.declarations?.some((d) => ts.isTypeOnlyImportOrExportDeclaration?.(d))
      const lines = callable.map((d) => render(checker, symbol.name, d))
      blocks.push(`${typeOnly && !lines.some((l) => /^(interface|type|enum) /.test(l)) ? 'type ' : ''}${lines.join('\n') || symbol.name}`)
    }
    out.push('```ts', normalize(blocks.join('\n\n')), '```')
  }
  return `${out.join('\n')}\n`
}

/** The packages that publish a library (bins only, like the CLI, have no import API). */
export function apiPackages(root) {
  const dirs = readdirSync(join(root, 'packages')).sort()
  return dirs
    .map((d) => join(root, 'packages', d))
    .filter((dir) => existsSync(join(dir, 'package.json')) && packageEntries(dir).length > 0)
}

export const snapshotFile = (root, dir) => {
  const { name } = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
  return join(root, 'api', `${name.replace(/^@/, '').replaceAll('/', '-')}.api.md`)
}

/** Writes (or, with `check`, compares) every snapshot. Returns the files that were or would be out of date. */
export function run({ root, check = false, packages = apiPackages(root) }) {
  const stale = []
  for (const dir of packages) {
    const file = snapshotFile(root, dir)
    const text = snapshotPackage(dir)
    const current = readTextIfExists(file)
    if (current === text) continue
    stale.push({ file, before: current ?? '', after: text })
    if (!check) {
      mkdirSync(dirname(file), { recursive: true })
      writeFileSync(file, text)
    }
  }
  return stale
}

/** Names that two packages may both export: each is one idea with one meaning, deliberately shared. Anything else is a clash. */
export const SHARED_NAMES = new Set([])

/** The names a snapshot's entries export (the declarations that start a line: `function X`, `type X`, `const X`…). */
export function exportedNames(snapshot) {
  return new Set([...snapshot.matchAll(/^(?:type )?(?:declare )?(?:function|const|let|var|class|interface|type|enum|namespace) ([A-Za-z_$][\w$]*)/gm)].map((m) => m[1]))
}

/**
 * The names that more than one package exports: `{ name, packages }` each, minus `allowed`. Two packages
 * exporting the same name means an auto-import or an AI assistant can pick the wrong one.
 * `snapshots` is `{ [package name]: snapshot text }`.
 */
export function duplicateNames(snapshots, allowed = SHARED_NAMES) {
  const owners = new Map()
  for (const [pkg, text] of Object.entries(snapshots)) {
    for (const name of exportedNames(text)) owners.set(name, [...(owners.get(name) ?? []), pkg])
  }
  return [...owners]
    .filter(([name, packages]) => packages.length > 1 && !allowed.has(name))
    .map(([name, packages]) => ({ name, packages }))
    .sort((a, b) => (a.name < b.name ? -1 : 1))
}

/** The first lines that differ, so a failed check says what changed. */
export function changedLines(before, after, max = 12) {
  const a = new Set(before.split('\n'))
  const b = new Set(after.split('\n'))
  const removed = [...a].filter((l) => l.trim() && !b.has(l)).map((l) => `- ${l}`)
  const added = [...b].filter((l) => l.trim() && !a.has(l)).map((l) => `+ ${l}`)
  const lines = [...removed, ...added]
  return lines.length > max ? [...lines.slice(0, max), `  … and ${lines.length - max} more lines`] : lines
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = join(import.meta.dirname, '..')
  const check = process.argv.includes('--check')
  const stale = run({ root, check })
  const rel = (f) => f.slice(root.length + 1)
  if (check && stale.length) {
    console.error(`The public API changed, and its snapshot didn't:\n`)
    for (const s of stale) console.error(`${rel(s.file)}\n${changedLines(s.before, s.after).join('\n')}\n`)
    console.error('If the change is intended: pnpm api:update, commit api/, and add a changeset (RELEASING.md says which bump).')
    process.exit(1)
  }
  const snapshots = Object.fromEntries(apiPackages(root).map((dir) => [JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')).name, readFileSync(snapshotFile(root, dir), 'utf8')]))
  const clashes = duplicateNames(snapshots)
  if (clashes.length) {
    console.error('A name is exported by more than one package:\n')
    for (const c of clashes) console.error(`  ${c.name}: ${c.packages.join(', ')}`)
    console.error('\nRename one (a prefix, as MiniatureToaster), or move it to the internal entry. A name two packages share on purpose goes in SHARED_NAMES (scripts/api-snapshot.mjs).')
    process.exit(1)
  }
  console.log(check ? 'api: snapshots current' : stale.length ? `api: wrote ${stale.map((s) => rel(s.file)).join(', ')}` : 'api: up to date')
}
