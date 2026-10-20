/* Extracts component props from the workspace packages' TypeScript source into
 * generated/props.json, which <PropsTable> renders at build time.
 *
 * Uses the TypeScript compiler API directly rather than a docgen wrapper, so it
 * can keep exactly what a reader needs:
 *  - only props declared in the packages (inherited DOM/motion props collapse
 *    into an "extends" note),
 *  - the type as written (`RevealVariant`), plus its literal members,
 *  - defaults from the component's destructuring, a JSDoc @default, or a
 *    trailing "Default x." sentence in the doc comment. */

import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import ts from 'typescript'
import { docsRoot, packagesDir, report, writeGenerated } from './lib.ts'

export interface PropDoc {
  name: string
  type: string
  /** Literal members, when the type is an alias of a literal union (e.g. a token name). */
  values?: string[]
  required: boolean
  default?: string
  description?: string
  /** Its JSDoc `@deprecated` text ("Since 0.3.0: use `variant`. Removed in 0.5.0."), when it's on its way out. */
  deprecated?: string
}

export interface ComponentDoc {
  name: string
  /** Source file, relative to the extraction root. */
  file: string
  props: PropDoc[]
  /** External types the props extend, which aren't listed. */
  extends?: string[]
}

const COMPILER_OPTIONS: ts.CompilerOptions = {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  jsx: ts.JsxEmit.ReactJSX,
  lib: ['lib.es2022.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'],
  types: [],
  strict: true,
  skipLibCheck: true,
  noEmit: true,
  // Core's source paths (`@youj/core/lib/youj/tokens`), which its exports map serves without an extension.
  paths: { '@youj/core/*': [fileURLToPath(new URL('../../../packages/core/src/*', import.meta.url))] },
}

const TYPE_FLAGS =
  ts.TypeFormatFlags.NoTruncation |
  ts.TypeFormatFlags.UseSingleQuotesForStringLiteralType |
  ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope

/** A default written in prose is only lifted into the Default column when it reads as code. */
const CODE_LIKE = /^(-?\d+(\.\d+)?|'[^']*'|"[^"]*"|`[^`]*`|true|false|null|undefined|\[.*\])$/

const inRepo = (node: ts.Node) => {
  const file = node.getSourceFile()
  return !file.isDeclarationFile && !file.fileName.includes('/node_modules/')
}

/** Splits "Does x. Default 0.3." into sentences without breaking decimals. */
function sentences(text: string) {
  return text.split(/(?<=\.)\s+/).filter(Boolean)
}

/** Separates a "Default …" sentence from a description. */
export function splitDefault(description: string): { description: string; default?: string } {
  const parts = sentences(description)
  const index = parts.findIndex((s) => /^Default:?\s/.test(s))
  const match = parts[index]?.match(/^Default:?\s+(.+?)\.?$/)
  if (!match) return { description }
  return { description: parts.filter((_, i) => i !== index).join(' '), default: match[1] }
}

function defaultsFromBinding(pattern: ts.BindingName): Map<string, string> {
  const out = new Map<string, string>()
  if (!ts.isObjectBindingPattern(pattern)) return out
  for (const element of pattern.elements) {
    if (element.dotDotDotToken || !element.initializer) continue
    const key = element.propertyName ?? element.name
    if (ts.isIdentifier(key) || ts.isStringLiteral(key)) out.set(key.text, element.initializer.getText())
  }
  return out
}

/** Defaults from `({ a = 1 })` or from `const { a = 1 } = props` at the top of the body. */
function componentDefaults(fn: ts.SignatureDeclaration): Map<string, string> {
  const param = fn.parameters[0]
  if (!param) return new Map()
  if (ts.isObjectBindingPattern(param.name)) return defaultsFromBinding(param.name)
  const paramName = ts.isIdentifier(param.name) ? param.name.text : undefined
  const body = 'body' in fn && fn.body && ts.isBlock(fn.body) ? fn.body : undefined
  for (const statement of body?.statements ?? []) {
    if (!ts.isVariableStatement(statement)) continue
    for (const decl of statement.declarationList.declarations) {
      if (decl.initializer && ts.isIdentifier(decl.initializer) && decl.initializer.text === paramName) {
        return defaultsFromBinding(decl.name)
      }
    }
  }
  return new Map()
}

/** Member names in source order for `type T = 'a' | 'b'` and `type T = keyof typeof obj`. */
function sourceOrder(checker: ts.TypeChecker, typeNode: ts.TypeNode | undefined): string[] {
  if (!typeNode || !ts.isTypeReferenceNode(typeNode)) return []
  let symbol = checker.getSymbolAtLocation(typeNode.typeName)
  if (symbol && symbol.flags & ts.SymbolFlags.Alias) symbol = checker.getAliasedSymbol(symbol)
  const alias = symbol?.declarations?.find(ts.isTypeAliasDeclaration)?.type
  if (!alias) return []
  if (ts.isUnionTypeNode(alias)) return alias.types.map((t) => t.getText().replace(/"/g, "'"))
  if (ts.isTypeOperatorNode(alias) && alias.operator === ts.SyntaxKind.KeyOfKeyword && ts.isTypeQueryNode(alias.type)) {
    const target = checker.getSymbolAtLocation(alias.type.exprName)?.valueDeclaration
    let init = target && ts.isVariableDeclaration(target) ? target.initializer : undefined
    while (init && (ts.isAsExpression(init) || ts.isSatisfiesExpression(init))) init = init.expression
    if (init && ts.isObjectLiteralExpression(init)) {
      return init.properties.flatMap((p) => (p.name && ts.isIdentifier(p.name) ? [`'${p.name.text}'`] : []))
    }
  }
  return []
}

function literalValues(checker: ts.TypeChecker, type: ts.Type, typeNode: ts.TypeNode | undefined): string[] | undefined {
  if (!type.isUnion()) return undefined
  const members = type.types
  const literal = members.every((t) => t.isLiteral() || t.flags & ts.TypeFlags.BooleanLiteral)
  if (!literal) return undefined
  const values = members.map((t) => checker.typeToString(t, undefined, TYPE_FLAGS))
  if (values.every((v) => v === 'true' || v === 'false')) return undefined
  const ordered = sourceOrder(checker, typeNode)
  const sameSet = ordered.length === values.length && ordered.every((v) => values.includes(v))
  return sameSet ? ordered : values
}

/**
 * `demo`: a block's default is its demo data, held in a constant (`SERVICES`),
 * which says nothing on its own page: its prose ("Default: the demo's four
 * KPIs.") reads better, and a bare constant reads as `demo`.
 */
function documentProp(checker: ts.TypeChecker, prop: ts.Symbol, defaults: Map<string, string>, demo = false): PropDoc {
  const decl = prop.declarations!.find(inRepo)!
  const type = checker.getNonNullableType(checker.getTypeOfSymbolAtLocation(prop, decl))
  const typeNode = ts.isPropertySignature(decl) || ts.isPropertyDeclaration(decl) ? decl.type : undefined

  // As written, unless the source spelling is a type-level expression a reader can't use.
  const written = typeNode?.getText().replace(/\s+/g, ' ')
  const typeText = written && !/[[\]]|typeof |Parameters<|ReturnType</.test(written) ? written : checker.typeToString(type, decl, TYPE_FLAGS)
  const values = typeText.includes('|') ? undefined : literalValues(checker, type, typeNode)

  let description = ts.displayPartsToString(prop.getDocumentationComment(checker)).trim()
  const jsdocDefault = prop.getJsDocTags(checker).find((t) => t.name === 'default' || t.name === 'defaultValue')
  let fallback = jsdocDefault ? ts.displayPartsToString(jsdocDefault.text).trim() : undefined

  const code = defaults.get(prop.name)
  const split = splitDefault(description)
  if (split.default !== undefined && (code !== undefined || fallback !== undefined || CODE_LIKE.test(split.default))) {
    description = split.description
    fallback ??= split.default
  }

  const doc: PropDoc = {
    name: prop.name,
    type: typeText,
    required: !(prop.flags & ts.SymbolFlags.Optional),
  }
  if (values) doc.values = values
  const value = demo && code !== undefined && !CODE_LIKE.test(code) ? (fallback ?? 'demo') : (code ?? fallback)
  if (value !== undefined) doc.default = value
  if (description) doc.description = description
  const deprecated = prop.getJsDocTags(checker).find((t) => t.name === 'deprecated')
  if (deprecated) doc.deprecated = ts.displayPartsToString(deprecated.text).trim() || 'Deprecated.'
  return doc
}

/** `Omit<HTMLMotionProps<'div'>, 'x'>` → `HTMLMotionProps<'div'>`, for types declared outside the repo. */
function externalBases(checker: ts.TypeChecker, decl: ts.Declaration | undefined): string[] {
  if (!decl || !ts.isInterfaceDeclaration(decl)) return []
  const out: string[] = []
  for (const clause of decl.heritageClauses ?? []) {
    for (const base of clause.types) {
      const wrapped = /^(Omit|Pick|Partial)$/.test(base.expression.getText()) ? base.typeArguments?.[0] : base
      if (!wrapped) continue
      const symbol = checker.getTypeAtLocation(wrapped).getSymbol() ?? checker.getTypeAtLocation(wrapped).aliasSymbol
      const external = !symbol?.declarations?.some(inRepo)
      if (external) out.push(wrapped.getText().replace(/"/g, "'"))
    }
  }
  return out
}

/**
 * A parameter's type references as written: `A.Props & ComponentProps<'div'>`
 * → both. A local alias or interface stands for the external types it names.
 */
function writtenBases(checker: ts.TypeChecker, typeNode: ts.TypeNode): string[] {
  const parts = ts.isIntersectionTypeNode(typeNode) ? typeNode.types : [typeNode]
  return parts.flatMap((part) => {
    if (!ts.isTypeReferenceNode(part)) return []
    let symbol = checker.getSymbolAtLocation(part.typeName)
    if (symbol && symbol.flags & ts.SymbolFlags.Alias) symbol = checker.getAliasedSymbol(symbol)
    const local = symbol?.declarations?.find(inRepo)
    if (local && ts.isTypeAliasDeclaration(local)) return writtenBases(checker, local.type)
    if (local && ts.isInterfaceDeclaration(local)) return externalBases(checker, local)
    return [part.getText().replace(/\s+/g, ' ').replace(/"/g, "'")]
  })
}

function propsInterface(checker: ts.TypeChecker, param: ts.ParameterDeclaration): ts.Declaration | undefined {
  if (!param.type || !ts.isTypeReferenceNode(param.type)) return undefined
  const symbol = checker.getSymbolAtLocation(param.type.typeName)
  const resolved = symbol && symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol
  return resolved?.declarations?.find(ts.isInterfaceDeclaration)
}

function functionLike(decl: ts.Declaration | undefined): ts.SignatureDeclaration | undefined {
  if (!decl) return undefined
  if (ts.isFunctionDeclaration(decl)) return decl
  if (ts.isVariableDeclaration(decl) && decl.initializer && (ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer))) {
    return decl.initializer
  }
  // A generic component re-typed by a cast (`const AsyncButton = Impl as <T>(props: P<T>) => ReactNode`).
  if (ts.isVariableDeclaration(decl) && decl.initializer && ts.isAsExpression(decl.initializer) && ts.isFunctionTypeNode(decl.initializer.type)) {
    return decl.initializer.type
  }
  return undefined
}

/** The docs that describe an interface (a props or data shape), not a component. */
const SHAPES = new WeakSet<ComponentDoc>()

/**
 * The components and prop shapes a module exports. For a `block`, also the
 * interfaces it re-exports from another file (its item types, declared in its
 * `data.ts`), and its defaults read as demo data.
 */
function documentModule(checker: ts.TypeChecker, sourceFile: ts.SourceFile, root: string, block = false): ComponentDoc[] {
  const moduleSymbol = checker.getSymbolAtLocation(sourceFile)
  if (!moduleSymbol) return []
  const rel = relative(root, sourceFile.fileName)
  const out: ComponentDoc[] = []

  for (const exported of checker.getExportsOfModule(moduleSymbol)) {
    // shadcn-style files export at the foot (`export { Button }`), which makes
    // the export an alias of the declaration.
    const symbol = exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported
    const name = exported.name
    // An overloaded component is documented by its first signature that isn't @deprecated (a kept old name).
    const decl = symbol.declarations?.find((d) => !ts.getJSDocDeprecatedTag(d)) ?? symbol.declarations?.[0]
    if (!decl || !/^[A-Z]/.test(name)) continue
    // Re-exports are documented where they're declared (a block's item types excepted).
    const own = decl.getSourceFile() === sourceFile
    if (!own && !(block && ts.isInterfaceDeclaration(decl) && inRepo(decl))) continue

    const fn = own ? functionLike(decl) : undefined
    const param = fn?.parameters[0]
    if (fn && param) {
      const type = checker.getTypeAtLocation(param)
      const props = type.getProperties().filter((p) => p.declarations?.some(inRepo))
      if (props.length === 0) {
        // Nothing of its own (`CheckboxPrimitive.Root.Props`, `ComponentProps<'input'>`):
        // listed so PropsTable can say what the props pass through to.
        const bases = param.type ? writtenBases(checker, param.type) : []
        if (bases.length) out.push({ name, file: rel, props: [], extends: bases })
        continue
      }
      // Defaults live in the body, which an overload signature doesn't have.
      const body = symbol.declarations?.map(functionLike).find((f) => f && 'body' in f && f.body)
      const defaults = componentDefaults(body ?? fn)
      const bases = externalBases(checker, propsInterface(checker, param))
      out.push({
        name,
        file: rel,
        props: props.map((p) => documentProp(checker, p, defaults, block)),
        ...(bases.length ? { extends: bases } : {}),
      })
      continue
    }

    // Props interfaces, and the shapes props take (`StepperStep`, `ChatSource`).
    if (ts.isInterfaceDeclaration(decl)) {
      const props = checker.getDeclaredTypeOfSymbol(symbol).getProperties().filter((p) => p.declarations?.some(inRepo))
      const bases = externalBases(checker, decl)
      const doc = {
        name,
        file: own ? rel : relative(root, decl.getSourceFile().fileName),
        props: props.map((p) => documentProp(checker, p, new Map())),
        ...(bases.length ? { extends: bases } : {}),
      }
      SHAPES.add(doc)
      out.push(doc)
    }
  }
  return out
}

export function extractProps(files: string[], root: string): Record<string, ComponentDoc> {
  const program = ts.createProgram(files, COMPILER_OPTIONS)
  const checker = program.getTypeChecker()
  const out: Record<string, ComponentDoc> = {}
  for (const file of files) {
    const sourceFile = program.getSourceFile(file)
    if (!sourceFile) continue
    for (const doc of documentModule(checker, sourceFile, root)) {
      const existing = out[doc.name]
      if (existing) throw new Error(`"${doc.name}" is exported by both ${existing.file} and ${doc.file}`)
      out[doc.name] = doc
    }
  }
  return out
}

export interface BlockDoc {
  /** The block's component, as its story names it: `AnalyticsOverview`. */
  component: string
  /** Where `youj add` writes it, without the extension: `blocks/app/analytics-overview`. */
  path: string
  /** Its exported props type, when it has one: `AnalyticsOverviewProps`. */
  propsType?: string
  props: PropDoc[]
  /** Its `copy` keys and their default strings, when it takes `copy`. */
  copy?: Record<string, string>
  /** The shapes its data props take (the interfaces it exports, `DashboardKpi`), in export order. */
  types: ComponentDoc[]
}

/**
 * Each block's props and item types, keyed by its registry name
 * (`app-analytics-overview`). Blocks are documented per block, not by export
 * name: two blocks may both export a `Service`.
 */
export function extractBlockProps(files: string[], root: string): Record<string, BlockDoc> {
  const program = ts.createProgram(files, COMPILER_OPTIONS)
  const checker = program.getTypeChecker()
  const out: Record<string, BlockDoc> = {}
  for (const file of files) {
    const sourceFile = program.getSourceFile(file)
    if (!sourceFile) continue
    const docs = documentModule(checker, sourceFile, root, true)
    const [group, name] = file.split('/src/blocks/')[1]!.replace(/\.tsx$/, '').split('/')
    const named = readStory(file)?.match(/\bcomponent:\s*([A-Z]\w*)/)?.[1]
    // The story's component, else the export named for the item (a frame part's story renders it in FramePreview: frame-account-menu's is FrameAccountMenu, not the FrameAccountItems beside it), else the first.
    const own = `${group}-${name}`.replace(/(^|-)(\w)/g, (_, _dash, c: string) => c.toUpperCase())
    const main = docs.find((d) => d.name === named) ?? docs.find((d) => d.name === own) ?? docs.find((d) => !SHAPES.has(d))
    const component = main?.name ?? named
    if (!component) continue
    const exports = checker.getExportsOfModule(checker.getSymbolAtLocation(sourceFile)!)
    const copy = copyStrings(checker, exports.find((e) => e.name === component))
    out[`${group}-${name}`] = {
      component,
      path: `blocks/${group}/${name}`,
      ...(exports.some((e) => e.name === `${component}Props`) ? { propsType: `${component}Props` } : {}),
      props: main?.props ?? [],
      types: docs.filter((d) => SHAPES.has(d) && !d.name.endsWith('Props') && d.props.length > 0),
      ...(copy ? { copy } : {}),
    }
  }
  return out
}

/** The keys of a block's `copy` prop, each with its default when that's a plain string (a function's reads as ''). */
function copyStrings(checker: ts.TypeChecker, exported: ts.Symbol | undefined): Record<string, string> | undefined {
  const symbol = exported && exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported
  const param = functionLike(symbol?.declarations?.[0])?.parameters[0]
  const copy = param && checker.getTypeAtLocation(param).getProperty('copy')
  if (!param || !copy) return undefined
  const type = checker.getNonNullableType(checker.getTypeOfSymbolAtLocation(copy, param))
  const keys = type.getProperties()
  if (keys.length === 0) return undefined
  return Object.fromEntries(
    keys.map((key) => {
      const decl = key.declarations?.[0]
      const init = decl && ts.isPropertyAssignment(decl) ? decl.initializer : undefined
      return [key.name, init && (ts.isStringLiteral(init) || ts.isNoSubstitutionTemplateLiteral(init)) ? init.text : '']
    }),
  )
}

function readStory(file: string): string | undefined {
  try {
    return readFileSync(file.replace(/\.tsx$/, '.stories.tsx'), 'utf8')
  } catch {
    return undefined
  }
}

// Stories and tests, and the per-scene copies of the illustrations (packages/motion's generate-illustrations.mjs), documented where they're written.
const SKIP = /\.(stories|test|fixtures|ssr-cases)\.tsx?$|\/(story-|test-utils)|\/illustrations\/scenes\//

/** Every component source file in the workspace packages. */
export function componentFiles(packagesDir: string): string[] {
  const files: string[] = []
  for (const pkg of readdirSync(packagesDir).sort()) {
    const dir = join(packagesDir, pkg, 'src/components')
    let entries: string[]
    try {
      entries = readdirSync(dir, { recursive: true }) as string[]
    } catch {
      continue
    }
    for (const entry of entries.sort()) {
      const file = join(dir, entry)
      if (file.endsWith('.tsx') && !SKIP.test(file)) files.push(file)
    }
  }
  return files
}

/** Every block entry: `packages/ui/src/blocks/<group>/<name>.tsx` (its parts live a folder deeper). */
export function blockFiles(packagesDir: string): string[] {
  const dir = join(packagesDir, 'ui/src/blocks')
  return (readdirSync(dir, { recursive: true }) as string[])
    .filter((entry) => entry.split('/').length === 2 && entry.endsWith('.tsx') && !SKIP.test(entry))
    .sort()
    .map((entry) => join(dir, entry))
}

function main() {
  const app = docsRoot
  const docs = extractProps(componentFiles(packagesDir), join(app, '../..'))
  const sorted = Object.fromEntries(Object.entries(docs).sort(([a], [b]) => a.localeCompare(b)))
  writeGenerated('props.json', JSON.stringify(sorted) + '\n')
  report('props', `${Object.keys(sorted).length} components and prop types → generated/props.json`)
  const blocks = extractBlockProps(blockFiles(packagesDir), join(app, '../..'))
  writeGenerated('block-props.json', JSON.stringify(blocks) + '\n')
  report('props', `${Object.keys(blocks).length} blocks → generated/block-props.json`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main()
