// Fails when a workspace package imports a package it doesn't declare, so an
// app that installs it from npm never hits "Cannot find module".
//   - Published modules (what the package's publishConfig entries reach through
//     relative imports) may import only the package's dependencies and peers.
//   - Everything else (tests, stories, scripts, configs, copy-in-only source
//     such as blocks, and private apps) may also use its devDependencies and
//     the workspace root's, which pnpm links for every package.
// The dependency direction in CLAUDE.md is enforced too: a package imports only
// the Youj packages DIRECTION allows (tests and stories included), and no
// package reaches into another through a relative path (APP_PATH_EXCEPTIONS
// lists the documented ones).
// Imports are read with the TypeScript parser, so code inside strings
// (snippets, codegen templates) doesn't count.
//
//   node scripts/check-imports.mjs
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { builtinModules } from 'node:module'
import { dirname, join, relative } from 'node:path'
import ts from 'typescript'

const root = join(import.meta.dirname, '..')
const rootPkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const SKIP_DIRS = new Set(['node_modules', 'dist', '.next', '.source', 'public', 'out', 'storybook-static', 'coverage', 'data', '__fixtures__', 'fixtures'])
const CODE = /\.(m?[jt]sx?|c[jt]s)$/
const BUILTINS = new Set(builtinModules)
// Specifiers that aren't packages: relative paths, the `@/` alias, virtual modules, URLs.
const NOT_A_PACKAGE = /^(\.|\/|@\/|node:|virtual:|https?:|data:)/

// Which Youj packages each package may import. Packages not listed are unconstrained (apps, cli, mcp, figma).
const DIRECTION = {
  '@youj/core': [],
  '@youj/miniatures': [],
  '@youj/motion': ['@youj/core'],
  '@youj/loaders': ['@youj/core'],
  '@youj/icons': ['@youj/core'],
  '@youj/illustrations': ['@youj/core'],
  '@youj/sound': ['@youj/core'],
  '@youj/react': ['@youj/core', '@youj/motion', '@youj/icons', '@youj/illustrations', '@youj/miniatures'],
}
// The published CLI fetches Youj code from the registry: its src imports no Youj package by name (it bundles core and ui source by path on purpose).
const CLI_SOURCE_DIRS = ['src']
// Files allowed to reach into an app or a package the direction rules forbid by a relative path, with the reason. Everything else in a package stays inside packages.
const APP_PATH_EXCEPTIONS = {
  // Pending Decision 11: the MCP index build reads the docs app's markdown, registry and catalogs until a shared package holds them.
  'packages/mcp/scripts/collect.ts': 'apps/docs',
  'packages/mcp/src/catalog.ts': 'apps/docs',
  'packages/mcp/src/search.ts': 'apps/docs',
  'packages/mcp/src/tools/add.ts': 'apps/docs',
  // A story that shows the docs app's builder next to the sounds it plays.
  'packages/sound/src/builder.stories.tsx': 'apps/docs',
  // A story that shows toasts with two loaders as their icon (ui doesn't declare loaders; the story reaches the source by path).
  'packages/ui/src/components/ui/toast.stories.tsx': 'packages/loaders',
}
const isYoujPackage = (name) => name.startsWith('@youj/')

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name) || name.startsWith('.')) continue
    const path = join(dir, name)
    if (statSync(path).isDirectory()) yield* walk(path)
    else if (CODE.test(name) && !name.endsWith('.d.ts')) yield path
  }
}

const packageOf = (specifier) => specifier.split('/').slice(0, specifier.startsWith('@') ? 2 : 1).join('/')

/** Every module specifier a file imports, re-exports, loads with import() or require()s. */
function moduleSpecifiers(file) {
  const code = readFileSync(file, 'utf8')
  const kind = file.endsWith('x') ? ts.ScriptKind.TSX : file.endsWith('.ts') || file.endsWith('.mts') ? ts.ScriptKind.TS : ts.ScriptKind.JS
  const source = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, false, kind)
  const out = new Set()
  const visit = (node) => {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      out.add(node.moduleSpecifier.text)
    } else if (ts.isCallExpression(node) && node.arguments.length && ts.isStringLiteralLike(node.arguments[0])) {
      const callee = node.expression
      if (callee.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(callee) && callee.text === 'require')) out.add(node.arguments[0].text)
    } else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument) && ts.isStringLiteral(node.argument.literal)) {
      out.add(node.argument.literal.text)
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  return [...out]
}

/** The file a relative specifier names, the way the bundler resolves it. */
function resolveRelative(from, specifier) {
  const base = join(dirname(from), specifier)
  return [base, `${base}.ts`, `${base}.tsx`, join(base, 'index.ts'), join(base, 'index.tsx')].find((p) => existsSync(p) && statSync(p).isFile() && CODE.test(p))
}

/** Source files a package publishes: its publishConfig entries' sources and every module they reach. */
function publishedModules(dir, pkg) {
  const starts = []
  const add = (target) => {
    if (typeof target === 'object' && target) return Object.values(target).forEach(add)
    if (typeof target !== 'string' || !/\.js$/.test(target) || !target.startsWith('./dist/')) return
    const stem = target.slice('./dist/'.length, -'.js'.length)
    if (stem.includes('*')) {
      const [folder] = stem.split('*')
      const src = join(dir, 'src', folder)
      if (existsSync(src)) for (const f of readdirSync(src)) if (/\.tsx?$/.test(f) && !/\.(test|stories)\./.test(f)) starts.push(join(src, f))
    } else {
      const file = [`${stem}.ts`, `${stem}.tsx`].map((f) => join(dir, 'src', f)).find(existsSync)
      if (file) starts.push(file)
    }
  }
  add(pkg.publishConfig?.exports)
  if (pkg.bin) for (const target of Object.values(typeof pkg.bin === 'string' ? { bin: pkg.bin } : pkg.bin)) {
    const stem = target.replace(/^\.\/dist\//, '').replace(/\.m?js$/, '')
    const file = [`${stem}.ts`, `${stem}.tsx`].map((f) => join(dir, 'src', f)).find(existsSync)
    if (file) starts.push(file)
  }
  const seen = new Set()
  const queue = [...starts]
  while (queue.length) {
    const file = queue.pop()
    if (seen.has(file)) continue
    seen.add(file)
    for (const spec of moduleSpecifiers(file)) if (spec.startsWith('.')) {
      const next = resolveRelative(file, spec)
      if (next) queue.push(next)
    }
  }
  return seen
}

const problems = []
const dirs = ['packages', 'apps'].flatMap((group) => readdirSync(join(root, group)).map((name) => join(root, group, name)))
let checked = 0
for (const dir of dirs) {
  if (!existsSync(join(dir, 'package.json'))) continue
  const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
  checked++
  const runtime = new Set([pkg.name, ...Object.keys({ ...pkg.dependencies, ...pkg.peerDependencies, ...pkg.optionalDependencies })])
  const dev = new Set([...runtime, ...Object.keys({ ...pkg.devDependencies, ...rootPkg.devDependencies })])
  // A CLI (a bin and no exports) is bundled, devDependencies and all: only what it leaves external must be installed.
  const bundled = Boolean(pkg.bin) && !pkg.exports
  const published = bundled ? new Set() : publishedModules(dir, pkg)
  for (const file of walk(dir)) {
    const shipped = published.has(file)
    const allowed = shipped ? runtime : dev
    for (const spec of moduleSpecifiers(file)) {
      const name = packageOf(spec)
      const rel = relative(root, file)
      const local = relative(dir, file)
      const direction = DIRECTION[pkg.name]
      if (isYoujPackage(name) && name !== pkg.name && ((direction && !direction.includes(name)) || (pkg.name === '@youj/cli' && CLI_SOURCE_DIRS.some((d) => local.startsWith(`${d}/`))))) {
        problems.push(`${rel}: imports ${spec}, against the dependency direction (${pkg.name} may import ${direction?.join(', ') || 'no Youj package'})`)
      }
      if (spec.startsWith('.')) {
        const target = relative(root, join(dirname(file), spec))
        const [group, targetDir] = target.split('/')
        if (group === 'apps' && !target.startsWith(`${APP_PATH_EXCEPTIONS[rel] ?? '\0'}/`) && dir.startsWith(join(root, 'packages'))) {
          problems.push(`${rel}: imports ${spec}, an app's source (packages never import apps)`)
        } else if (group === 'packages' && targetDir !== relative(join(root, 'packages'), dir) && direction && !target.startsWith(`${APP_PATH_EXCEPTIONS[rel] ?? '\0'}/`)) {
          const targetName = JSON.parse(readFileSync(join(root, group, targetDir, 'package.json'), 'utf8')).name
          if (!direction.includes(targetName)) problems.push(`${rel}: imports ${spec}, a path into ${targetName}, against the dependency direction`)
        }
      }
      // A types-only module (`mdx/types`) is declared through its @types package.
      if (NOT_A_PACKAGE.test(spec) || BUILTINS.has(name) || allowed.has(name) || (!shipped && allowed.has(`@types/${name}`))) continue
      const hint = shipped && dev.has(name) ? ' (a devDependency, but this module is published)' : ''
      problems.push(`${relative(root, file)}: imports ${spec}, which ${pkg.name} doesn't declare${hint}`)
    }
  }
}

if (problems.length) {
  console.error(problems.map((p) => `  ✗ ${p}`).join('\n'))
  console.error(`\n${problems.length} undeclared import(s)`)
  process.exit(1)
}
console.log(`imports: all ${checked} packages import only what they declare`)
