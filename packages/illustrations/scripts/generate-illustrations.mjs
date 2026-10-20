// One registry item per illustration, generated from the illustrations
// registry, so `shadcn add illustration-<id>` (or `youj add
// illustration-<id>`) copies in just that scene and the kit it's drawn with.
//
//   node scripts/generate-illustrations.mjs          write the files
//   node scripts/generate-illustrations.mjs --check  exit 1 if any is stale or missing
//
// Scenes are written in category files (food.tsx holds coffee, restaurant and
// groceries) and listed in illustrations/registry.tsx; neither changes for
// this. For each entry the generator pulls the scene's function out of its
// category file with exactly what it uses (the helpers and constants it
// references, found through the TypeScript binder, and helpers another scene
// file exports, inlined) into illustrations/scenes/<id>.tsx, with the imports
// it needs pointed one folder up. Those files are what the items ship, so
// they're typechecked with the package, and a scene that can't stand alone
// fails here or in tsc rather than in someone's app.
//
// It writes registry/illustrations.json: `illustration-kit` (kit.tsx) and an
// `illustration-<id>` item per scene, with the scene's doc comment as its
// description, its category and tags as `categories` and `meta`, and its
// registry dependencies read from its imports. build-registry.mjs builds them
// with the other fragments, so the docs serve them at /r/illustration-<id>.json.
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join, posix, relative } from 'node:path'
import ts from 'typescript'

const root = join(import.meta.dirname, '..')
const check = process.argv.includes('--check')
const DIR = 'src/components/youj/graphics/illustrations'
const OUT = `${DIR}/scenes`
const REGISTRY = `${DIR}/registry.tsx`
const CATEGORIES = `${DIR}/categories.ts`
const KIT = `${DIR}/kit.tsx`
const FRAGMENT = 'registry/illustrations.json'
const problems = []

const read = (path) => readFileSync(join(root, path), 'utf8')
const sourceOf = (path) => ts.createSourceFile(path, read(path), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)

/* ── The registry: its entries and categories, read from the source ───────── */

/** An expression without its `as const` and `satisfies …`. */
const bare = (node) => (ts.isAsExpression(node) || ts.isSatisfiesExpression(node) || ts.isParenthesizedExpression(node) ? bare(node.expression) : node)

function literalOf(node) {
  node = bare(node)
  if (ts.isStringLiteralLike(node)) return node.text
  if (ts.isArrayLiteralExpression(node)) return node.elements.map(literalOf)
  if (ts.isIdentifier(node)) return { identifier: node.text }
  if (ts.isObjectLiteralExpression(node)) {
    return Object.fromEntries(node.properties.filter(ts.isPropertyAssignment).map((p) => [p.name.getText(), literalOf(p.initializer)]))
  }
  return undefined
}

function readRegistry() {
  const importedFrom = new Map()
  const arrays = {}
  // The categories live in their own file, which registry.tsx re-exports.
  for (const statement of [...sourceOf(REGISTRY).statements, ...sourceOf(CATEGORIES).statements]) {
    if (ts.isImportDeclaration(statement) && statement.importClause?.namedBindings && ts.isNamedImports(statement.importClause.namedBindings)) {
      for (const spec of statement.importClause.namedBindings.elements) importedFrom.set(spec.name.text, statement.moduleSpecifier.text)
    }
    if (ts.isVariableStatement(statement)) {
      for (const d of statement.declarationList.declarations) if (ts.isIdentifier(d.name) && d.initializer) arrays[d.name.text] = literalOf(d.initializer)
    }
  }
  const categories = arrays.illustrationCategories ?? []
  const entries = (arrays.illustrations ?? []).map((e) => {
    const component = e.Component?.identifier
    const from = importedFrom.get(component)
    if (!component || !from) problems.push(`${REGISTRY}: "${e.id}" names a Component this file doesn't import`)
    return { id: e.id, name: e.name, category: e.category, tags: Array.isArray(e.tags) ? e.tags : [], component, file: from && `${posix.join(DIR, from)}.tsx` }
  })
  return { categories, entries }
}

/* ── Extraction: a scene and exactly what it uses ─────────────────────────── */

const { categories, entries } = readRegistry()
const sceneFiles = [...new Set(entries.map((e) => e.file).filter(Boolean))]
// The scene files together, so an import from one into another resolves to its declaration.
const siblings = readdirSync(join(root, DIR)).filter((f) => /\.tsx?$/.test(f) && !/\.(test|stories)\.tsx?$/.test(f))
const program = ts.createProgram(
  siblings.map((f) => join(root, DIR, f)),
  { noResolve: true, noLib: true, types: [], jsx: ts.JsxEmit.Preserve, allowJs: false, target: ts.ScriptTarget.Latest },
)
const checker = program.getTypeChecker()
const fileAt = (path) => program.getSourceFile(join(root, path))

/** The top-level statement a node sits in. */
function topLevel(node) {
  while (node.parent && !ts.isSourceFile(node.parent)) node = node.parent
  return node.parent ? node : undefined
}

/** A path inside the illustrations folder that's a scene file (not the kit or the registry). */
const isSceneModule = (path) => path.startsWith(`${DIR}/`) && path !== KIT && path !== REGISTRY && !path.startsWith(`${OUT}/`)

/** `./kit` from `…/illustrations/food.tsx` → `src/…/illustrations/kit`; a package (`react`) as it's written. */
const resolveFrom = (file, specifier) => (specifier.startsWith('.') ? posix.join(posix.dirname(file), specifier) : specifier)

/** Where an exported name is declared in a scene file: its statement. */
function exportedStatement(path, name) {
  const file = fileAt(path)
  if (!file) return undefined
  return file.statements.find((s) => {
    if (ts.isFunctionDeclaration(s) || ts.isClassDeclaration(s) || ts.isInterfaceDeclaration(s) || ts.isTypeAliasDeclaration(s)) return s.name?.text === name
    if (ts.isVariableStatement(s)) return s.declarationList.declarations.some((d) => ts.isIdentifier(d.name) && d.name.text === name)
    return false
  })
}

/**
 * The statements a scene needs, per file, and the imports they use. Starts at
 * the scene's function and follows every identifier the binder resolves to a
 * top-level declaration of the same file, or to an import (an import from
 * another scene file is followed into that file).
 */
function closure(entry) {
  const statements = new Map() // path → Set<statement>
  const imports = new Map() // `${module}\0${name}` → { module, name, local, typeOnly, declarationTypeOnly }
  const queue = []
  const add = (path, statement) => {
    const set = statements.get(path) ?? new Set()
    if (set.has(statement)) return
    set.add(statement)
    statements.set(path, set)
    queue.push([path, statement])
  }
  const start = exportedStatement(entry.file, entry.component)
  if (!start) {
    problems.push(`${entry.file}: no exported ${entry.component} for "${entry.id}"`)
    return { statements, imports }
  }
  add(entry.file, start)
  while (queue.length) {
    const [path, statement] = queue.shift()
    const file = fileAt(path)
    const visit = (node) => {
      if (ts.isIdentifier(node)) {
        const symbol = ts.isShorthandPropertyAssignment(node.parent) && node.parent.name === node ? checker.getShorthandAssignmentValueSymbol(node.parent) : checker.getSymbolAtLocation(node)
        const declaration = symbol?.declarations?.[0]
        if (declaration && declaration.getSourceFile() === file) {
          if (ts.isImportSpecifier(declaration)) {
            const decl = declaration.parent.parent.parent
            const module = resolveFrom(path, decl.moduleSpecifier.text)
            const name = (declaration.propertyName ?? declaration.name).text
            const target = [`${module}.tsx`, `${module}.ts`].find((p) => existsSync(join(root, p)))
            if (target && isSceneModule(target)) {
              // A helper another scene file exports: inlined, so the item doesn't need that file.
              const found = exportedStatement(target, name)
              if (found) add(target, found)
              else problems.push(`${path}: imports ${name} from ${decl.moduleSpecifier.text}, which doesn't declare it`)
            } else {
              imports.set(`${module}\0${name}`, {
                module,
                name,
                local: declaration.name.text,
                typeOnly: declaration.isTypeOnly || decl.importClause.isTypeOnly,
              })
            }
          } else if (ts.isImportClause(declaration) || ts.isNamespaceImport(declaration)) {
            problems.push(`${path}: ${node.text} is a default or namespace import; scenes import by name`)
          } else {
            const owner = topLevel(declaration)
            if (owner && owner !== statement) add(path, owner)
          }
        }
      }
      ts.forEachChild(node, visit)
    }
    ts.forEachChild(statement, visit)
  }
  return { statements, imports }
}

/** A statement's text with the comments directly above it (a doc comment), not a file's header further up. */
function textOf(file, statement, keepExport) {
  const text = file.getFullText()
  let from = statement.getStart(file)
  const comments = ts.getLeadingCommentRanges(text, statement.pos) ?? []
  for (let i = comments.length - 1; i >= 0; i--) {
    const between = text.slice(comments[i].end, from)
    if ((between.match(/\n/g) ?? []).length > 1) break
    from = comments[i].pos
  }
  let body = text.slice(from, statement.end)
  if (!keepExport) {
    const exported = statement.modifiers?.find((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    if (exported) {
      const at = exported.getStart(file) - from
      body = body.slice(0, at) + body.slice(at + 'export'.length).replace(/^\s+/, '')
    }
  }
  return body
}

/** The first sentence or two of a statement's doc comment, as plain text. */
function docOf(statement) {
  const doc = ts.getJSDocCommentsAndTags(statement).find(ts.isJSDoc)
  const comment = typeof doc?.comment === 'string' ? doc.comment : (doc?.comment ?? []).map((part) => part.text).join('')
  return comment.replace(/\s+/g, ' ').trim()
}

/* ── Output ────────────────────────────────────────────────────────────────── */

const toSpecifier = (from, module) => {
  const rel = posix.relative(posix.dirname(from), module)
  return rel.startsWith('.') ? rel : `./${rel}`
}

function sceneFile(entry) {
  const out = `${OUT}/${entry.id}.tsx`
  const { statements, imports } = closure(entry)
  const own = fileAt(entry.file)
  // Inlined helpers from other scene files first (they may be used at load time), then the scene's own file, each in source order.
  const files = [...statements.keys()].sort((a, b) => Number(a === entry.file) - Number(b === entry.file))
  const names = new Map()
  const blocks = []
  for (const path of files) {
    const file = fileAt(path)
    const list = [...statements.get(path)].sort((a, b) => a.pos - b.pos)
    for (const statement of list) {
      const declared = ts.isVariableStatement(statement) ? statement.declarationList.declarations.map((d) => d.name.getText()) : [statement.name?.text]
      for (const name of declared) {
        if (names.has(name) && names.get(name) !== path) problems.push(`${entry.id}: ${name} is declared in both ${names.get(name)} and ${path}; rename one`)
        names.set(name, path)
      }
      const isScene = path === entry.file && declared.includes(entry.component)
      blocks.push(textOf(file, statement, isScene))
    }
  }
  // Imports grouped by module, in the order the scene's file imports them.
  const byModule = new Map()
  for (const imp of imports.values()) {
    const list = byModule.get(imp.module) ?? []
    list.push(imp)
    byModule.set(imp.module, list)
  }
  const order = own.statements.filter(ts.isImportDeclaration).map((d) => resolveFrom(entry.file, d.moduleSpecifier.text))
  const modules = [...byModule.keys()].sort((a, b) => (order.indexOf(a) + 1 || 999) - (order.indexOf(b) + 1 || 999))
  const importLines = modules.map((module) => {
    const list = byModule.get(module).sort((a, b) => a.local.localeCompare(b.local, 'en', { sensitivity: 'base' }) || a.local.localeCompare(b.local))
    const allTypes = list.every((i) => i.typeOnly)
    const specifiers = list.map((i) => `${!allTypes && i.typeOnly ? 'type ' : ''}${i.name === i.local ? i.name : `${i.name} as ${i.local}`}`)
    const specifier = module.startsWith('src/') ? toSpecifier(out, module) : module
    return `import ${allTypes ? 'type ' : ''}{ ${specifiers.join(', ')} } from '${specifier}'`
  })
  const directive = /^(?:\s|\/\/[^\n]*\n|\/\*[\s\S]*?\*\/)*['"]use client['"]/.test(own.getFullText()) ? `'use client'\n\n` : ''
  const source = posix.relative(OUT, entry.file)
  const header = `// Generated by scripts/generate-illustrations.mjs from ${source}: the ${entry.name} scene on its own,\n// for \`shadcn add illustration-${entry.id}\`. Edit it there, then run \`pnpm -F @youj/illustrations generate\`.\n`
  return {
    path: out,
    content: `${directive}${header}\n${importLines.join('\n')}\n\n${blocks.join('\n\n')}\n`,
    description: docOf(start(entry)),
    imports: modules,
  }
}

const start = (entry) => exportedStatement(entry.file, entry.component)

/* ── Registry items ────────────────────────────────────────────────────────── */

// The motion items by the files they ship, from every other fragment: a scene's imports name the items it depends on.
const itemByFile = new Map()
for (const fragment of readdirSync(join(root, 'registry')).filter((f) => f.endsWith('.json') && `registry/${f}` !== FRAGMENT)) {
  for (const item of JSON.parse(read(`registry/${fragment}`))) {
    if (item.name === 'illustrations') continue
    for (const file of item.files ?? []) if (!itemByFile.has(file.path)) itemByFile.set(file.path, item.name)
  }
}
itemByFile.set(KIT, 'illustration-kit')

const pkg = JSON.parse(read('package.json'))
const declared = new Set(Object.keys({ ...pkg.dependencies, ...pkg.peerDependencies }))
const packageOf = (specifier) => specifier.split('/').slice(0, specifier.startsWith('@') ? 2 : 1).join('/')

/** The items and packages a file's imports need. */
function needs(path, modules) {
  const registryDependencies = new Set()
  const dependencies = new Set()
  for (const module of modules) {
    if (module.startsWith('src/')) {
      const file = [`${module}.tsx`, `${module}.ts`].find((p) => existsSync(join(root, p)))
      const item = file && itemByFile.get(file)
      if (item) registryDependencies.add(item)
      else problems.push(`${path}: imports ${module}, which no registry item ships`)
    } else if (!['react', 'react-dom'].includes(packageOf(module))) {
      if (!declared.has(packageOf(module))) problems.push(`${path}: imports ${module}, which isn't a dependency of the package`)
      dependencies.add(packageOf(module))
    }
  }
  return { registryDependencies: [...registryDependencies].sort(), dependencies: [...dependencies].sort() }
}

const kitFile = sourceOf(KIT)
const kitModules = kitFile.statements.filter(ts.isImportDeclaration).map((d) => resolveFrom(KIT, d.moduleSpecifier.text))
const categoryName = new Map(categories.map((c) => [c.id, c.name]))

const generated = entries.filter((e) => e.file && e.component).map((entry) => ({ entry, ...sceneFile(entry) }))

const items = [
  {
    name: 'illustration-kit',
    type: 'registry:component',
    title: 'Illustration kit',
    description:
      "What every illustration is drawn with: the stage (one volume for every scene, so any scene swaps for any other), groups that move as one object, turned and extruded solids (Lathe, Prism), marks on a face, links between points, and the inks they're drawn in. Each illustration-<id> item installs one scene on top of it.",
    ...needs(KIT, kitModules),
    files: [{ path: KIT, type: 'registry:component' }],
  },
  ...generated.map(({ entry, path, description, imports }) => {
    const { registryDependencies, dependencies } = needs(path, imports)
    const category = categoryName.get(entry.category) ?? entry.category
    return {
      name: `illustration-${entry.id}`,
      type: 'registry:component',
      title: `${entry.name} illustration`,
      description: `${description ? `${description.replace(/\.?$/, '.')} ` : ''}One isometric scene from the ${category} illustrations, on its own: it assembles as it comes into view, its hero part floats, and it comes apart on hover. Decorative unless titled; reduced motion draws it finished and still.`,
      categories: ['illustrations', entry.category],
      meta: { scene: entry.id, component: entry.component, category: entry.category, tags: entry.tags },
      dependencies,
      registryDependencies: registryDependencies.includes('illustration-kit') ? registryDependencies : ['illustration-kit', ...registryDependencies],
      files: [{ path, type: 'registry:component' }],
    }
  }),
]

for (const entry of entries) if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(entry.id ?? '')) problems.push(`${REGISTRY}: "${entry.id}" isn't a kebab-case id`)

if (problems.length) {
  console.error(problems.map((p) => `  ✗ ${p}`).join('\n'))
  console.error(`\n${problems.length} illustration item problem(s)`)
  process.exit(1)
}

/* The whole set's item (`illustrations`, in registry/graphics.json) ships
 * every category file the registry imports. A file it doesn't list yet is
 * added to it here, a line in the list's own format before registry.tsx, so a
 * new category file needs no hand edit there; lines already listed (by hand
 * or by an earlier run) are left as they are. */
const GRAPHICS = 'registry/graphics.json'
function withEveryCategoryFile(text) {
  const listed = new Set(JSON.parse(text).find((i) => i.name === 'illustrations')?.files.map((f) => f.path) ?? [])
  const missing = sceneFiles.filter((p) => !listed.has(p))
  if (!missing.length) return text
  const anchor = text.match(new RegExp(`^([ \\t]*)\\{ "path": "${REGISTRY.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}", "type": "registry:component" \\}`, 'm'))
  if (!anchor) {
    problems.push(`${GRAPHICS}: the illustrations item doesn't list ${REGISTRY}; add ${missing.join(', ')} to it by hand`)
    return text
  }
  const lines = missing.map((p) => `${anchor[1]}{ "path": "${p}", "type": "registry:component" },\n`).join('')
  return text.slice(0, anchor.index) + lines + text.slice(anchor.index)
}
const graphics = withEveryCategoryFile(read(GRAPHICS))
if (problems.length) {
  console.error(problems.map((p) => `  ✗ ${p}`).join('\n'))
  process.exit(1)
}

const targets = new Map([[FRAGMENT, JSON.stringify(items, null, 2) + '\n'], [GRAPHICS, graphics], ...generated.map((g) => [g.path, g.content])])
const existing = existsSync(join(root, OUT)) ? readdirSync(join(root, OUT)).map((f) => `${OUT}/${f}`) : []
const orphans = existing.filter((p) => !targets.has(p))
const current = (p) => (existsSync(join(root, p)) ? readFileSync(join(root, p), 'utf8') : null)

if (check) {
  const missing = [...targets].filter(([p]) => current(p) === null).map(([p]) => p)
  const stale = [...targets].filter(([p, next]) => current(p) !== null && current(p) !== next).map(([p]) => p)
  if (missing.length || stale.length || orphans.length) {
    const lines = [...missing.map((p) => `missing: ${p}`), ...stale.map((p) => `stale: ${p}`), ...orphans.map((p) => `no scene: ${p}`)]
    console.error(`illustration items out of date (run pnpm -F @youj/illustrations generate):\n  ${lines.join('\n  ')}`)
    process.exit(1)
  }
} else {
  mkdirSync(join(root, OUT), { recursive: true })
  for (const [p, next] of targets) if (current(p) !== next) writeFileSync(join(root, p), next)
  for (const p of orphans) rmSync(join(root, p))
}
console.log(`illustrations: ${generated.length} scene items and the kit${check ? ', current' : ` → ${relative(root, join(root, OUT))}/, ${FRAGMENT}`}`)

