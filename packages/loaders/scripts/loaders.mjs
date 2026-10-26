// Writes the loaders' generated files from each loader's own `meta`, one registry
// fragment per category folder, so loaders added in different categories never
// touch the same file, and the package's per-loader entries:
//   registry/loaders-<category>.json   one registry item per loader (`loader-<id>`)
//   package.json "exports" and "publishConfig.exports"
//                                      one entry per loader, `@youj/loaders/<id>`, beside the
//                                      kit's `.` (tsdown.config.ts builds exactly these)
// A wildcard can't map the category folders, so this script owns the entries.
// A loader is a .tsx in a category folder (not a story or a test) that exports
// `meta` (categories.ts, LoaderMeta), `scene` and `Loader<Id>`. A .ts beside it
// is a helper of that category, shipped with the loaders that import it.
//
//   node scripts/loaders.mjs          write them
//   node scripts/loaders.mjs --check  fail when one is missing or stale (part of verify)
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import ts from 'typescript'
import { readTextIfExists } from '../../../scripts/read-text.mjs'

const root = new URL('..', import.meta.url).pathname
const DIR = 'src/components/youj/loaders'
const check = process.argv.includes('--check')
const problems = []
const stale = []

/** The category ids and techniques, as categories.ts lists them. */
function lists() {
  const file = join(root, DIR, 'categories.ts')
  const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true)
  const found = {}
  const visit = (node) => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) found[node.name.text] = node.initializer
    ts.forEachChild(node, visit)
  }
  visit(source)
  return {
    categories: literal(found.LOADER_CATEGORIES).map((c) => c.id),
    techniques: literal(found.LOADER_TECHNIQUES),
  }
}
const pascal = (id) => id.replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase())

/** A plain literal (object, array, string, number, boolean) from its syntax. */
function literal(node) {
  if (ts.isSatisfiesExpression(node) || ts.isAsExpression(node) || ts.isParenthesizedExpression(node)) return literal(node.expression)
  if (ts.isObjectLiteralExpression(node)) {
    const out = {}
    for (const prop of node.properties) {
      if (!ts.isPropertyAssignment(prop)) throw new Error('meta may hold only plain properties')
      out[prop.name.getText().replace(/^['"]|['"]$/g, '')] = literal(prop.initializer)
    }
    return out
  }
  if (ts.isArrayLiteralExpression(node)) return node.elements.map(literal)
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text
  if (ts.isNumericLiteral(node)) return Number(node.text)
  if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.MinusToken) return -literal(node.operand)
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false
  throw new Error(`meta may hold only literals, not \`${node.getText()}\``)
}

/** The file's exported `meta`, the beats its scene loops in, and the names it exports. */
function read(file) {
  const code = readFileSync(file, 'utf8')
  const source = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  let meta
  let beats
  const exported = new Set()
  for (const statement of source.statements) {
    const isExported = ts.canHaveModifiers(statement) && ts.getModifiers(statement)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    if (!isExported) continue
    if (ts.isFunctionDeclaration(statement) && statement.name) exported.add(statement.name.text)
    if (ts.isVariableStatement(statement)) {
      for (const decl of statement.declarationList.declarations) {
        if (!ts.isIdentifier(decl.name)) continue
        exported.add(decl.name.text)
        if (decl.name.text === 'meta' && decl.initializer) meta = literal(decl.initializer)
        if (decl.name.text === 'scene' && decl.initializer) {
          const object = [decl.initializer, decl.initializer.expression].find((n) => n && ts.isObjectLiteralExpression(n))
          const prop = object?.properties.find((p) => ts.isPropertyAssignment(p) && p.name.getText() === 'beats')
          if (prop && ts.isNumericLiteral(prop.initializer)) beats = Number(prop.initializer.text)
        }
      }
    }
  }
  const locals = [...code.matchAll(/from\s+'\.\/([\w-]+)'/g)].map((m) => m[1])
  return { meta, beats, exported, locals }
}

const { categories: CATEGORIES, techniques: TECHNIQUES } = lists()
const ids = new Set()
const entries = []
const titles = new Set()
const write = (path, content) => {
  const full = join(root, path)
  if (readTextIfExists(full) === content) return
  if (check) stale.push(path)
  else writeFileSync(full, content)
}

const folders = readdirSync(join(root, DIR), { withFileTypes: true }).filter((f) => f.isDirectory()).map((f) => f.name)
for (const folder of folders) if (!CATEGORIES.includes(folder)) problems.push(`${DIR}/${folder}: not a category (${CATEGORIES.join(', ')})`)

for (const category of CATEGORIES) {
  const dir = join(root, DIR, category)
  if (!existsSync(dir)) {
    problems.push(`${DIR}/${category}: missing`)
    continue
  }
  const files = readdirSync(dir).filter((f) => f.endsWith('.tsx') && !/\.(stories|test)\.tsx$/.test(f))
  const pieces = []
  const orders = new Map()
  for (const file of files) {
    const id = file.replace(/\.tsx$/, '')
    const path = `${DIR}/${category}/${file}`
    let parsed
    try {
      parsed = read(join(dir, file))
    } catch (error) {
      problems.push(`${path}: ${error.message}`)
      continue
    }
    const { meta, beats, exported, locals } = parsed
    const component = `Loader${pascal(id)}`
    const where = (msg) => problems.push(`${path}: ${msg}`)
    if (!meta) {
      where('exports no `meta`')
      continue
    }
    if (meta.id !== id) where(`meta.id "${meta.id}" isn't the file's name, "${id}"`)
    if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(id)) where('the id must be kebab-case')
    if (meta.category !== category) where(`meta.category "${meta.category}" isn't its folder, "${category}"`)
    if (!TECHNIQUES.includes(meta.technique)) where(`meta.technique must be one of ${TECHNIQUES.join(', ')}`)
    if (typeof meta.title !== 'string' || !meta.title) where('meta.title is missing')
    if (typeof meta.description !== 'string' || meta.description.length < 40) where('meta.description needs a sentence or two')
    if (!Array.isArray(meta.tags) || !meta.tags.length) where('meta.tags needs a few search words')
    if (typeof meta.order !== 'number') where('meta.order is missing')
    else if (orders.has(meta.order)) where(`meta.order ${meta.order} is already ${orders.get(meta.order)}'s in ${category}; orders are unique within a category`)
    else orders.set(meta.order, id)
    const ROLES = ['c1', 'c2', 'c3', 'c4', 'success']
    if (
      meta.colors !== undefined &&
      (!Array.isArray(meta.colors) ||
        !meta.colors.length ||
        meta.colors.length > 4 ||
        meta.colors.some((c) => typeof c?.part !== 'string' || !c.part || !['ink', 'accent'].includes(c.mono) || (c.role !== undefined && !ROLES.includes(c.role))))
    )
      where('meta.colors lists its colored parts, one to four, `c1` first: { part, mono: ink | accent, role? }')
    if (!exported.has(component)) where(`exports no ${component}`)
    if (!exported.has('scene')) where('exports no `scene`')
    else if (typeof beats !== 'number') where('its scene needs `beats` as a number written out')
    if (ids.has(id)) where(`another loader is already called "${id}"`)
    if (titles.has(meta.title)) where(`another loader is already titled "${meta.title}"`)
    ids.add(id)
    titles.add(meta.title)
    if (!existsSync(join(dir, `${id}.stories.tsx`))) where(`has no ${id}.stories.tsx`)
    const helpers = locals.map((name) => [`${name}.ts`, `${name}.tsx`].find((f) => existsSync(join(dir, f)))).filter(Boolean)
    pieces.push({ id, component, meta, beats, path, helpers: helpers.map((f) => `${DIR}/${category}/${f}`) })
  }
  for (const p of pieces) entries.push([p.id, p.path])
  pieces.sort((a, b) => a.meta.order - b.meta.order || a.id.localeCompare(b.id))

  const items = pieces.map((p) => ({
    name: `loader-${p.id}`,
    type: 'registry:component',
    title: `${p.meta.title} loader`,
    description: `${p.meta.description} One of the Youj loaders: a polite status with one API (size, color, speed, label, paused), drawn on a shared ticker only while it’s on screen; reduced motion holds a still frame.`,
    categories: ['loaders', category],
    meta: { loader: p.id, component: p.component, category, technique: p.meta.technique, order: p.meta.order, title: p.meta.title, tags: p.meta.tags, beats: p.beats, ...(p.meta.colors && { colors: p.meta.colors }) },
    dependencies: [],
    registryDependencies: ['loader-kit'],
    files: [p.path, ...p.helpers].map((path) => ({ path, type: 'registry:component' })),
  }))
  write(`registry/loaders-${category}.json`, JSON.stringify(items, null, 2) + '\n')
}

/** package.json's exports: the kit's `.` and one entry per loader, sorted by id (the rest of the manifest is kept). */
{
  const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  const sorted = entries.sort(([a], [b]) => a.localeCompare(b))
  manifest.exports = { '.': './src/index.ts', ...Object.fromEntries(sorted.map(([id, path]) => [`./${id}`, `./${path}`])) }
  const built = (path) => path.replace(/^\.\/src\//, './dist/').replace(/\.tsx?$/, '')
  manifest.publishConfig.exports = {
    '.': { types: './dist/index.d.ts', default: './dist/index.js' },
    ...Object.fromEntries(sorted.map(([id, path]) => [`./${id}`, { types: `${built(`./${path}`)}.d.ts`, default: `${built(`./${path}`)}.js` }])),
    './package.json': './package.json',
  }
  write('package.json', JSON.stringify(manifest, null, 2) + '\n')
}

if (problems.length) {
  console.error(problems.map((p) => `  ✗ ${p}`).join('\n'))
  console.error(`\n${problems.length} loader problem(s)`)
  process.exit(1)
}
if (stale.length) {
  console.error(`Stale or missing: ${stale.join(', ')}\nRun \`pnpm -F @youj/loaders loaders:generate\`.`)
  process.exit(1)
}
console.log(`loaders: ${ids.size} in ${CATEGORIES.length} categories${check ? ', generated files current' : ''}`)
