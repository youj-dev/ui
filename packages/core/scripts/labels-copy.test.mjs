import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import ts from 'typescript'

/* What a copy of the dictionary type-checks as. `youj add` writes the files of youj-core (the labels types the provider takes),
 * youj-labels (the generated labels.ts and use-labels.ts) and every component's labels module into lib/youj/, and strict TypeScript
 * then reads them together with the blocks that call useLabels(). This lays the files out as the registry lists them, compiles a
 * block's use of them, and holds each module to the package's signatures. */

const root = join(import.meta.dirname, '..')
const read = (path) => readFileSync(join(root, path), 'utf8')
const items = (fragment) => JSON.parse(read(`registry/${fragment}.json`))

/** The files of those items, at the path they land on in an app (`target`, else the path without `src/`). */
function copy() {
  const files = new Map()
  const names = new Set(['youj-labels', ...items('labels-components').map((item) => item.name)])
  const all = [...items('core'), ...items('labels'), ...items('labels-components')]
  for (const item of all.filter((i) => i.name === 'youj-core' || names.has(i.name))) {
    for (const file of item.files) {
      const target = file.target ?? file.path.replace(/^src\//, '')
      if (target.startsWith('lib/youj/labels') || target === 'lib/youj/use-labels.ts') files.set(`/app/${target}`, read(file.path))
    }
  }
  // What use-labels.ts reads from the provider (which youj-core copies whole) and from React.
  files.set('/app/lib/youj/provider.ts', "import type { YoujLabels } from './labels-types'\nexport declare function useLabelOverrides(): Partial<YoujLabels> | null\n")
  files.set('/app/react.d.ts', "declare module 'react' {\n  export function useMemo<T>(factory: () => T, deps: unknown[]): T\n}\n")
  return files
}

function program(files) {
  const folders = new Set()
  for (const file of files.keys()) for (let dir = dirname(file); dir !== '/'; dir = dirname(dir)) folders.add(dir)
  const options = { strict: true, noEmit: true, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, skipLibCheck: true, types: [] }
  const host = ts.createCompilerHost(options)
  const { fileExists, readFile, directoryExists, getSourceFile } = host
  host.fileExists = (file) => files.has(file) || (!file.startsWith('/app/') && fileExists(file))
  host.readFile = (file) => files.get(file) ?? (file.startsWith('/app/') ? undefined : readFile(file))
  host.directoryExists = (dir) => folders.has(dir) || (!dir.startsWith('/app') && directoryExists(dir))
  host.getSourceFile = (file, languageVersion, ...rest) => (files.has(file) ? ts.createSourceFile(file, files.get(file), languageVersion) : getSourceFile(file, languageVersion, ...rest))
  return ts.createProgram({ rootNames: [...files.keys()], options, host })
}

function diagnostics(usage) {
  const files = copy()
  files.set('/app/block.ts', usage)
  return ts.getPreEmitDiagnostics(program(files)).map((d) => `${d.file?.fileName.replace('/app/', '')}(${d.file ? d.file.getLineAndCharacterOfPosition(d.start).line + 1 : 0}): ${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`)
}

/**
 * Where a component's module takes a function's arguments otherwise than YoujLabels says. A component types the labels it reads by
 * its module (`useComponentLabels(timelineLabels)` returns the module's own type), so a default that makes an optional argument
 * required fails the calls the interface allows.
 */
function argumentDifferences() {
  const files = copy()
  const exportNames = items('labels-components').flatMap((item) => item.files.map((file) => file.path.replace(/^.*\/(\w+)\.ts$/, '$1')))
  expect(exportNames.length, 'the label modules').toBeGreaterThan(100)
  files.set('/app/probe.ts', ["import type { YoujLabels } from './lib/youj/labels-types'", 'export type { YoujLabels }', ...exportNames.map((name) => `export { ${name} } from './lib/youj/labels/${name}'`)].join('\n'))
  const built = program(files)
  const checker = built.getTypeChecker()
  const exported = checker.getExportsOfModule(checker.getSymbolAtLocation(built.getSourceFile('/app/probe.ts')))
  const resolve = (name) => checker.getAliasedSymbol(exported.find((e) => e.name === name))
  const dictionary = checker.getDeclaredTypeOfSymbol(resolve('YoujLabels'))
  const typeAt = (symbol) => checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration ?? symbol.declarations[0])
  const call = (symbol) => checker.getSignaturesOfType(typeAt(symbol), ts.SignatureKind.Call)[0]
  const found = []
  for (const name of exportNames) {
    for (const key of checker.getPropertiesOfType(typeAt(resolve(name)))) {
      const theirs = checker.getPropertyOfType(dictionary, key.name)
      if (!theirs) found.push(`${name}.${key.name}: not in YoujLabels`)
      else {
        const [a, b] = [call(theirs), call(key)]
        if (Boolean(a) !== Boolean(b)) found.push(`${name}.${key.name}: a string in one, a function in the other`)
        else if (a && (a.minArgumentCount !== b.minArgumentCount || a.parameters.length !== b.parameters.length))
          found.push(`${name}.${key.name}: YoujLabels takes ${a.minArgumentCount} to ${a.parameters.length} arguments, the module ${b.minArgumentCount} to ${b.parameters.length}`)
      }
    }
  }
  return found
}

describe('the copied label dictionary', () => {
  test('compiles under strict TypeScript, with useLabels() as the package types it', () => {
    expect(diagnostics("import { useLabels } from './lib/youj/use-labels'\nexport const labels = useLabels\n")).toEqual([])
  }, 60_000)

  test('reads a key as the string or the function it is, as the frame blocks need', () => {
    const usage = `import { useLabels } from './lib/youj/use-labels'
const labels = useLabels()
// A block hands these to props typed string | undefined, or calls them.
export const props: { 'aria-label'?: string; title?: string } = { 'aria-label': labels.search, title: labels.remove('Ada') }
export const position: string = labels.waveformPosition('0:10', '1:20')
`
    expect(diagnostics(usage)).toEqual([])
  }, 60_000)

  test('is not open: a key that is not in the dictionary does not compile', () => {
    const usage = "import { useLabels } from './lib/youj/use-labels'\nexport const nope = useLabels().notAKey\n"
    expect(diagnostics(usage).join('\n')).toContain("block.ts(2): Property 'notAKey' does not exist")
  }, 60_000)

  test("has every component's module take a function's arguments as the dictionary does", () => {
    expect(argumentDifferences()).toEqual([])
  }, 60_000)
})
