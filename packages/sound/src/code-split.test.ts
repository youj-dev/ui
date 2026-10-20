import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import ts from 'typescript'

/* Zero cost until sound is on: nothing the entry imports statically reaches
 * the player, a pack's audio or a candidate's, so an app that renders a
 * provider with this pack muted (or without it) never downloads any of them. The
 * pack's runtime fetches the player through lazy.ts's import(), a pack its audio
 * through its own import(), and a pack of your own each candidate it plays
 * through the candidates' index. Type-only imports are erased, so they don't
 * count. */

const src = import.meta.dirname

function resolveFrom(from: string, specifier: string) {
  const base = join(dirname(from), specifier)
  return [`${base}.ts`, `${base}.tsx`, join(base, 'index.ts'), base].find((path) => existsSync(path) && /\.tsx?$/.test(path))
}

/** A module's relative imports: `static` ones load with it, `dynamic` ones (import()) on demand. */
function importsOf(file: string) {
  const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
  const found = { static: [] as string[], dynamic: [] as string[] }
  const visit = (node: ts.Node) => {
    if (ts.isImportDeclaration(node) && !node.importClause?.isTypeOnly && ts.isStringLiteral(node.moduleSpecifier)) found.static.push(node.moduleSpecifier.text)
    if (ts.isExportDeclaration(node) && !node.isTypeOnly && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) found.static.push(node.moduleSpecifier.text)
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && ts.isStringLiteral(node.arguments[0]!)) found.dynamic.push(node.arguments[0].text)
    ts.forEachChild(node, visit)
  }
  visit(source)
  const local = (list: string[]) => list.filter((s) => s.startsWith('.')).flatMap((s) => resolveFrom(file, s) ?? [])
  return { static: local(found.static), dynamic: local(found.dynamic) }
}

/** Every module that loads with the entry, as paths relative to src/. */
function staticClosure(entry: string) {
  const seen = new Set<string>()
  const walk = (file: string) => {
    if (seen.has(file)) return
    seen.add(file)
    importsOf(file).static.forEach(walk)
  }
  walk(join(src, entry))
  return new Set([...seen].map((file) => relative(src, file)))
}

test('the entry never loads the player, any pack’s audio or any candidate up front', () => {
  const loaded = [...staticClosure('index.ts')]
  expect(loaded).toContain('lib/pack.ts')
  expect(loaded).toContain('lib/lazy.ts')
  expect(loaded).toContain('candidates/index.ts')
  expect(loaded).not.toContain('lib/player.ts')
  expect(loaded.filter((file) => file.endsWith('.data.ts') || (file.startsWith('candidates/') && file !== 'candidates/index.ts'))).toEqual([])
})

test('the player comes only through lazy.ts’s import(), each pack’s audio through its own, and each candidate through the candidates’ index', () => {
  const loaded = [...staticClosure('index.ts')]
  const lazily = loaded.flatMap((file) => importsOf(join(src, file)).dynamic.map((target) => [file, relative(src, target)]))
  expect(lazily).toContainEqual(['lib/lazy.ts', 'lib/player.ts'])
  expect(lazily).toContainEqual(['packs/beacon.ts', 'packs/beacon.data.ts'])
  expect(lazily).toContainEqual(['candidates/index.ts', 'candidates/tap.wood.ts'])
  const candidate = /^candidates\/\w+\.\w+\.ts$/
  expect(lazily.filter(([from]) => from === 'candidates/index.ts').every(([, target]) => candidate.test(target!))).toBe(true)
  expect(lazily.every(([from, target]) => target === 'lib/player.ts' || /^packs\/\w+\.data\.ts$/.test(target!) || (from === 'candidates/index.ts' && candidate.test(target!)))).toBe(true)
})
