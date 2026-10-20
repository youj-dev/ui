/* Builds the MCP index from the workspace. It runs inside Vite's SSR loader
 * (scripts/build-index.ts), with the docs app as the working directory,
 * because it reads what the docs site reads, through the docs' own modules:
 *
 *  - the registry fragments and install commands (apps/docs/lib/registry.ts),
 *  - the props extractor (apps/docs/scripts/props.ts),
 *  - every docs page, rendered to Markdown (apps/docs/lib/markdown.ts),
 *  - the icon set, its swap pairs and choreography notes (the explorer's catalog),
 *  - the blocks (apps/docs/lib/showcase.ts),
 *  - the UI tokens (packages/ui/src/styles/ui.css).
 *
 * Nothing here is hand-maintained, so the index can't drift from what ships. */

import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import ts from 'typescript'
import { durations, easings, springs, staggers } from '@youj/core/lib/youj/tokens'
import { areaOf } from '../../../apps/docs/lib/catalog.ts'
import { elements, frontmatter, pageMarkdown, type MarkdownContext, type MotionSpecRow } from '../../../apps/docs/lib/markdown.ts'
import { installInfo, packageEntry, type InstallInfo, registryImportPath, registryItems, type RegistryItem } from '../../../apps/docs/lib/registry.ts'
import { sectionTrail } from '../../../apps/docs/lib/sections.ts'
import { itemHref } from '../../../apps/docs/lib/block-docs.ts'
import { taxonomyOf } from '../../../apps/docs/lib/taxonomy.ts'
import { stabilityManifest, stabilityOf } from '../../../apps/docs/lib/stability.ts'
import { blocks, docsUrl, pageFor } from '../../../apps/docs/lib/showcase.ts'
import { installedFiles } from '../../../apps/docs/scripts/installed-files.ts'
import { rewriteImports } from '../../cli/src/copy-in.ts'
import { installedExports, moduleKey } from '../../cli/src/exports.ts'
import { illustrationCategories, illustrations } from '@youj/illustrations'
import { componentFiles, extractProps } from '../../../apps/docs/scripts/props.ts'
import { EFFECTS, youjEntries, loadLucide, pairNames, TRANSITIONS } from '../../../apps/docs/components/icons/catalog.ts'
import { miniatures as miniatureMetas } from '../../miniatures/src/index.ts'
import { LOADER_CATEGORIES } from '../../loaders/src/components/youj/loaders/categories.ts'
import type { Component, Loader, Miniature, ComponentDoc, DocPage, Hook, Icon, Install, CollectedIndex, Link, Scene, ShowcaseItem, UiTokens } from '../src/types.ts'

export const SITE = 'https://www.youj.dev'
const REGISTRY = `${SITE}/r`

export async function collect(root: string): Promise<CollectedIndex> {
  const packages = join(root, 'packages')
  const content = join(root, 'apps/docs/content/docs')
  const version = (JSON.parse(readFileSync(join(packages, 'mcp/package.json'), 'utf8')) as { version: string }).version

  const props = extractProps(componentFiles(packages), root)
  const componentsIn = (path: string) =>
    Object.values(props)
      .filter((doc) => doc.file.endsWith(`/${path}`) && !doc.name.endsWith('Props'))
      .map((doc) => doc.name)
  const items = registryItems(packages)
  const stability = stabilityManifest(root)
  /** A block's label: its registry item's, else (a composition of blocks) its kind's default. */
  const showcaseStability = (registry: string | undefined) => {
    const item = registry ? items.get(registry) : undefined
    return item ? stabilityOf(item, stability) : stability.kinds.block
  }

  const ctx: MarkdownContext = {
    site: SITE,
    registry: REGISTRY,
    example(name) {
      try {
        return readFileSync(join(root, 'apps/docs/examples', `${name}.tsx`), 'utf8')
      } catch {
        return undefined
      }
    },
    props: (name) => props[name],
    install: (name, imports) => (items.has(name) ? installInfo(name, componentsIn, imports, items) : undefined),
    tokens: { durations, easings, springs, staggers },
  }

  const docs = docPages(content, ctx)
  const bySlug = new Map(docs.map((d) => [d.page.slug, d]))

  /* ── Components ── */
  const components: Component[] = []
  for (const item of items.values()) {
    const area = areaOf(item)
    const isIconTool = item.name === 'icon-swap' || item.name === 'youj-icon'
    const graphics = isGraphics(item)
    if (!area && !isIconTool && !graphics && item.name !== 'youj-presets' && item.package !== '@youj/sound') continue
    if (area === 'icons') continue
    const url = item.name === 'youj-presets' ? '/docs/motion/presets' : pageFor(item.name)
    const doc = url ? bySlug.get(url.replace(/^\/docs\/?/, '')) : undefined
    const exports = graphics ? graphicsExports(item, root) : main0(item, componentsIn)
    const install = graphicsInstall(item, toInstall(item, installInfo(item.name, componentsIn, item.name === 'illustrations' ? 'Illustration' : undefined, items)), exports)
    const sections = doc ? splitSections(doc.page.markdown) : new Map<string, string>()
    const spec = doc ? (elements(doc.raw, 'MotionSpec')[0] as { rows?: MotionSpecRow[]; reduced?: string } | undefined) : undefined
    components.push({
      name: item.name,
      title: item.title ?? item.name,
      package: graphics ? '@youj/react' : item.package,
      kind: item.package === '@youj/react' ? 'ui' : item.package === '@youj/core' ? 'core' : item.package === '@youj/sound' ? 'sound' : 'motion',
      category: graphics ? 'Illustrations' : doc ? categoryOf(doc.page) : (area ?? 'icons'),
      description: doc?.page.description ?? item.description ?? '',
      ...(doc ? { docs: doc.page.slug } : {}),
      exports,
      install,
      // A stories page (ComponentStories) keeps its intro and usage under Installation & usage, after the install command.
      ...optional('intro', prose(sections.get('') || stripInstall(sections.get('Installation & usage') ?? ''))),
      ...optional('usage', firstCode(sections.get('Usage') ?? sections.get('Installation & usage') ?? '')),
      ...optional('a11y', sections.get('Accessibility')),
      ...optional('reduced', sections.get('Reduced motion') ?? spec?.reduced),
      ...(spec?.rows?.length ? { motion: spec.rows } : {}),
      related: relatedLinks(sections.get('Related') ?? ''),
      dependencies: item.dependencies ?? [],
      stability: stabilityOf(item, stability),
      ...ladderOf(item.name),
    })
  }

  /* ── Props: every component's parts, and the icon engine's ── */
  const keep = new Set(['IconProps', 'YoujIconProps', 'IconSwapProps', 'YoujProviderProps', 'ThemeScopeProps'])
  for (const c of components) for (const name of c.exports) keep.add(name)
  const propsOut: Record<string, ComponentDoc> = {}
  for (const name of [...keep].sort()) {
    const doc = props[name]
    if (doc) propsOut[name] = { name: doc.name, props: doc.props, ...(doc.extends ? { extends: doc.extends } : {}) }
  }

  /* ── Icons ── */
  const descriptions: Record<string, string> = {}
  for (const item of items.values()) if (areaOf(item) === 'icons') descriptions[item.name.slice('icon-'.length)] = item.description ?? ''
  const icons: Icon[] = youjEntries({}, descriptions).map((e) => ({
    name: e.name,
    component: e.component,
    category: e.category,
    keywords: e.keywords,
    ...(e.states ? { states: e.states } : {}),
    defaultTrigger: e.Icon.meta.defaultTrigger,
    description: e.description,
  }))
  const lucide = (await loadLucide()).map((e) => ({ name: e.name, component: e.component, keywords: e.keywords }))

  /* ── Blocks ── */
  const sources: Record<string, string> = {}
  // What the packages export, to write each block's imports the way `youj add` does in an app on the packages (`@youj/react`, not `@/components/ui/…`).
  const exportIndex = installedExports(join(root, 'apps/docs'))
  /** The files as `youj add` writes them (`blocks/app/customers.tsx`), with the imports it gives them. A composition with no item of its own installs its blocks and has no files. */
  const filesOf = (registry: string | undefined) => {
    const item = registry ? items.get(registry) : undefined
    if (!item?.files?.length) return []
    const installed = installedFiles(item.files.map((f) => `packages/ui/${f.path}`))
    const own = new Set(installed.map((f) => moduleKey(f.path)))
    for (const file of installed) sources[file.path] = /\.tsx?$/.test(file.path) ? rewriteImports(file.code, (key) => own.has(key), exportIndex).content : file.code
    return installed.map((f) => f.path)
  }
  const link = (l: { title: string; url: string }): Link => ({ title: l.title, url: l.url })
  // The frame's parts are Create's: installed by its export, never on their own.
  const blockItems: ShowcaseItem[] = blocks().filter((b) => b.level !== 'frame').map((b) => ({
    kind: 'block',
    slug: b.slug,
    title: b.title,
    group: b.group,
    summary: b.summary,
    description: b.description,
    ...(b.registry ? { registry: b.registry } : {}),
    ...(b.stack ? { stack: b.stack } : {}),
    components: b.components.map(link),
    files: filesOf(b.registry),
    ...(b.showcase ? { theme: pickTheme(b.showcase) } : {}),
    url: itemHref(b)!,
    stability: showcaseStability(b.registry),
    level: b.level,
    category: b.category,
  }))
  /* ── Illustrations: every scene, in the explorer's order ── */
  const sceneItems = new Map([...items.values()].flatMap((item) => (sceneOf(item) ? [[sceneOf(item)!.scene, item] as const] : [])))
  const scenes: Scene[] = illustrations.flatMap((entry) => {
    const item = sceneItems.get(entry.id)
    if (!item) return []
    const file = item.files?.[0]
    const landing = file && (file.target ?? file.path.replace(/^src\//, '')).replace(/\.tsx?$/, '')
    return [
      {
        id: entry.id,
        name: entry.name,
        category: entry.category,
        tags: [...('tags' in entry && Array.isArray(entry.tags) ? (entry.tags as string[]) : [])],
        component: sceneOf(item)!.component ?? `Illustration${entry.name.replace(/[^A-Za-z0-9]/g, '')}`,
        description: item.description ?? '',
        registry: item.name,
        ...(landing ? { importPath: `@/${landing}` } : {}),
      },
    ]
  })
  const illustrationsIndex = { categories: illustrationCategories.map((c) => ({ id: c.id, name: c.name })), scenes }

  const pages = docs.map((d) => d.page)
  const builder = builderPage(bySlug.get('illustrations/draw-your-own')?.page)
  if (builder) pages.push(builder)

  return {
    meta: { schema: 1, version, site: SITE, registry: REGISTRY },
    illustrations: illustrationsIndex,
    loaders: loaderList(items),
    miniatures: miniatureList(packages),
    components: components.sort((a, b) => a.name.localeCompare(b.name)),
    props: propsOut,
    hooks: hooks(root, items, docs.map((d) => d.page)),
    blocks: blockItems,
    icons,
    lucide,
    pairs: { youj: pairNames(icons.map((i) => i.name)), lucide: pairNames(lucide.map((i) => i.name)) },
    effects: EFFECTS.map(({ id, note }) => ({ id, note })),
    transitions: TRANSITIONS.map(({ id, note }) => ({ id, note })),
    uiTokens: uiTokens(readFileSync(join(packages, 'ui/src/styles/ui.css'), 'utf8')),
    docs: pages,
    sources: Object.fromEntries(Object.entries(sources).sort(([a], [b]) => a.localeCompare(b))),
  }
}

/** The miniatures, in catalogue order: the metadata `@youj/miniatures` exports (meta only, no drawing code) and the component each `src/<id>.tsx` exports. They ship from npm only, so `registry` is the name `youj add` takes to print the install. */
function miniatureList(packages: string): Miniature[] {
  return miniatureMetas.map((meta) => {
    const source = readFileSync(join(packages, 'miniatures/src', `${meta.id}.tsx`), 'utf8')
    const component = source.match(/^export (?:const|function) ([A-Z]\w*)/m)?.[1]
    if (!component) throw new Error(`packages/miniatures/src/${meta.id}.tsx: no exported component`)
    return {
      id: meta.id,
      title: meta.name,
      component,
      category: meta.maker,
      tags: [meta.model, 'isometric', 'interactive', ...(meta.progress ? ['progress', 'loader'] : [])],
      description: meta.description,
      registry: `miniature-${meta.id}`,
    }
  })
}

/** The loaders, in gallery order: each registry item `loader-<id>` carries its own meta (see categories.ts in @youj/loaders). */
function loaderList(items: Map<string, RegistryItem>): Loader[] {
  const order = ['color', 'depth', 'geometry', 'orbs', 'mechanics', 'science', 'waves', 'signal', 'glyph', 'interface', 'software']
  const titles = (LOADER_CATEGORIES as { id: string; title: string }[]).reduce<Record<string, string>>((out, c) => ({ ...out, [c.id]: c.title }), {})
  return [...items.values()]
    .flatMap((item) => {
      const meta = (item as { meta?: { loader?: string; component?: string; category?: string; technique?: string; tags?: string[]; title?: string; order?: number } }).meta
      if (!meta?.loader || !meta.component || !meta.category) return []
      const animation: Loader & { order: number } = {
        id: meta.loader,
        title: meta.title ?? meta.loader,
        component: meta.component,
        category: meta.category,
        categoryTitle: titles[meta.category] ?? meta.category,
        technique: meta.technique ?? '',
        tags: meta.tags ?? [],
        description: item.description ?? '',
        registry: item.name,
        order: meta.order ?? 0,
      }
      return [animation]
    })
    .sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category) || a.order - b.order)
    .map(({ order: _order, ...animation }) => animation)
}

/** What a registry item says about the scene it installs (`illustration-coffee`), else undefined: the kit and `illustrations` have no `meta.scene`. */
function sceneOf(item: RegistryItem): { scene: string; component?: string } | undefined {
  const meta = (item as { meta?: { scene?: string; component?: string } }).meta
  return meta?.scene && item.name === `illustration-${meta.scene}` ? { scene: meta.scene, component: meta.component } : undefined
}

/** A registry item's component exports: those of its main file (the one named like it, else the first). */
function main0(item: RegistryItem, componentsIn: (path: string) => string[]): string[] {
  const main = (item.files ?? []).find((f) => f.path.endsWith(`/${item.name}.tsx`))
  // A folder of parts with no file named like it (the data table kit) exports every part's components.
  return main ? componentsIn(main.path) : [...new Set((item.files ?? []).flatMap((f) => componentsIn(f.path)))]
}

/** The graphics kit's shapes are `Object.assign` consts the props extractor doesn't read, so its exports come from the source: the capitalised consts and functions of the item's files. `illustrations` is drawn with `Illustration`; the illustration kit isn't exported by the package. */
function graphicsExports(item: RegistryItem, root: string): string[] {
  if (item.name === 'illustrations') return ['Illustration']
  if (item.name === 'illustration-kit') return []
  const names = (item.files ?? []).flatMap((f) => [...readFileSync(join(root, 'packages/illustrations', f.path), 'utf8').matchAll(/^export (?:const|function) ([A-Z]\w*[a-z]\w*)/gm)].map((m) => m[1]!))
  return [...new Set(names)]
}

/** The drawing kit, the ready-made scenes' set and the kit's parts: graphics items that aren't one scene. */
const isGraphics = (item: RegistryItem) => /^src\/components\/youj\/graphics\//.test(item.files?.[0]?.path ?? '') && !sceneOf(item)

/**
 * The three install shapes: a package item with an import, a package item
 * that is only stylesheet utilities (youj-presets: nothing to import), and
 * a copy-in-only item that no package exports.
 */
function toInstall(item: RegistryItem, info: InstallInfo): Install {
  const { registryCommand, registryDeps, peerDependencies } = info
  if (!info.packageCommand) return { copyOnly: true, registryCommand, registryDeps, peerDependencies, ...(info.registryImport ? { registryImport: info.registryImport } : {}) }
  // The sound package has no stylesheet: its packs (beacon, halo…) are what you import, and give to YoujProvider's `sound`.
  if (!info.packageImport && item.package === '@youj/sound') return { packageCommand: info.packageCommand, packageImport: "import { beacon } from '@youj/sound'", registryCommand, registryDeps, peerDependencies }
  if (!info.packageImport) return { packageCommand: info.packageCommand, packageStylesheet: `@import '${item.package}/styles.css'`, registryCommand, registryDeps, peerDependencies }
  return { packageCommand: info.packageCommand, packageImport: info.packageImport, registryCommand, registryDeps, peerDependencies }
}

/**
 * The graphics kit installs from `@youj/illustrations`, as its docs say;
 * the illustration kit is copy-in only, so it has no package import.
 */
function graphicsInstall(item: RegistryItem, install: Install, exports?: string[]): Install {
  if (!isGraphics(item)) return install
  const { registryCommand, registryDeps, peerDependencies } = install
  if (item.name === 'illustration-kit') return { copyOnly: true, registryCommand, registryDeps, peerDependencies }
  return { registryCommand, registryDeps, peerDependencies, packageCommand: 'pnpm add @youj/illustrations', packageImport: `import { ${exports?.length ? exports.join(', ') : 'Illustration'} } from '@youj/illustrations'` }
}

/** The illustration builder is an app route, not an MDX page: its docs are the "The builder" section of Draw your own. */
function builderPage(drawYourOwn: DocPage | undefined): DocPage | undefined {
  const body = drawYourOwn && splitSections(drawYourOwn.markdown).get('The builder')
  if (!body) return undefined
  const description = 'Build a new isometric illustration from the Youj kit in the browser: drag parts onto the floor, preview it in any theme, and take it home as code, SVG, PNG or JSON. Experimental.'
  return {
    slug: 'illustrations/build',
    url: '/illustrations/build',
    title: 'Illustration builder',
    description,
    section: 'Illustrations',
    markdown: `# Illustration builder\n\n> ${description}\n\nSource: ${SITE}/illustrations/build\n\n${body}\n`,
  }
}

const optional = <K extends string>(key: K, value: string | undefined) => (value?.trim() ? ({ [key]: value.trim() } as Record<K, string>) : {})

/** A component's level and category on the ladder (taxonomy.json), when it has one. */
function ladderOf(name: string): Pick<Component, 'level' | 'complexity' | 'levelCategory'> {
  const entry = taxonomyOf(name)
  return entry ? { level: entry.level, ...(entry.complexity && { complexity: entry.complexity }), levelCategory: entry.category } : {}
}

function pickTheme(meta: { preset?: string; theme?: string; accent?: string }) {
  return Object.fromEntries(Object.entries({ preset: meta.preset, theme: meta.theme, accent: meta.accent }).filter(([, v]) => v)) as ShowcaseItem['theme']
}

/* ── Docs ── */

/** Where a component is filed: its group ("Forms & inputs"); the chat kit, which is a group of its own, by its title; else its section. */
function categoryOf(page: DocPage): string {
  const [section, group] = page.section.split(' / ')
  return group ?? (section === 'Components' ? page.title : section!)
}

function docPages(content: string, ctx: MarkdownContext): { page: DocPage; raw: string }[] {
  const files = (readdirSync(content, { recursive: true }) as string[]).filter((f) => f.endsWith('.mdx')).sort()
  return files.map((file) => {
    const raw = readFileSync(join(content, file), 'utf8')
    const { data } = frontmatter(raw)
    // A `(group)` folder files a page in the sidebar and stays out of its URL.
    const url = docsUrl(file)
    const slug = url.replace(/^\/docs\/?/, '')
    const title = data.title ?? slug
    return {
      raw,
      page: {
        slug,
        url,
        title,
        ...(data.description ? { description: data.description } : {}),
        section: sectionTrail(slug.split('/').filter(Boolean)).join(' / '),
        markdown: pageMarkdown({ title, description: data.description, url }, raw, ctx),
      },
    }
  })
}

/** Sections of `body` under headings of `level` (`## `, `### `…), by heading. */
function headed(body: string, level: string): [string, string][] {
  return body
    .split(new RegExp(`^${level} `, 'm'))
    .slice(1)
    .map((part) => {
      const newline = part.indexOf('\n')
      return [part.slice(0, newline).trim(), part.slice(newline + 1).trim()]
    })
}

/**
 * A page's `## ` sections by heading; the opening (after the title block) is ''. A component page folds its
 * reference under `## Reference` and its examples under `## Examples`, each as `### ` parts (Motion's reduced
 * motion a `#### ` under it): those parts are sections too, so Accessibility or Reduced motion read the same
 * wherever the page puts them.
 */
export function splitSections(markdown: string): Map<string, string> {
  const body = markdown.replace(/^# .*\n(\n> .*\n)?\nSource: .*\n/, '')
  const out = new Map<string, string>()
  out.set('', body.split(/^## /m)[0]!.trim())
  for (const [name, text] of headed(body, '##')) {
    out.set(name, text)
    if (name !== 'Reference' && name !== 'Examples') continue
    for (const [sub, subText] of headed(text, '###')) {
      if (!out.has(sub)) out.set(sub, subText)
      for (const [deep, deepText] of headed(subText, '####')) if (!out.has(deep)) out.set(deep, deepText)
    }
  }
  return out
}

/** Text without code blocks. */
function prose(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** A stories page's intro: its Installation & usage up to the usage code, without the install commands (what the page's lead said before the tabs). */
function stripInstall(markdown: string): string {
  const prose = markdown
    .replace(/```(?:bash|sh|shell)[\s\S]*?```/g, '')
    // The install tabs' own lines (lib/markdown.ts InstallTabs), not the page's words.
    .replace(/^(?:Or copy the source|It brings|Package \(recommended\)|Install it)[^\n]*\n?/gm, '')
  const code = prose.indexOf('```')
  return code === -1 ? prose : prose.slice(0, code)
}

function firstCode(markdown: string): string | undefined {
  return /```(?:tsx|jsx|ts)[^\n]*\n([\s\S]*?)```/.exec(markdown)?.[1]?.trim()
}

function relatedLinks(markdown: string): Link[] {
  return [...markdown.matchAll(/^- \[([^\]]+)\]\(([^)]+)\)(?::\s*(.*))?$/gm)].map(([, title, url, note]) => ({
    title: title!,
    url: url!,
    ...(note ? { note } : {}),
  }))
}

/* ── Hooks ── */

const ENTRIES: [string, string][] = [
  ['core/src/index.ts', '@youj/core'],
  ['motion/src/index.ts', '@youj/motion'],
  ['icons/src/index.ts', '@youj/icons'],
  ['motion/src/interactions.ts', '@youj/motion/interactions'],
  ['motion/src/backgrounds.ts', '@youj/motion/backgrounds'],
  ['motion/src/players.ts', '@youj/motion/players'],
  ['ui/src/index.ts', '@youj/react'],
  // The entries for the components that need an optional peer (packages/ui/entries.json), which bring hooks such as useCommandPalette.
  ...Object.entries(JSON.parse(readFileSync(join(import.meta.dirname, '../../ui/entries.json'), 'utf8')) as Record<string, { file: string }>)
    .filter(([entry]) => entry !== '@youj/react')
    .map(([entry, { file }]): [string, string] => [`ui/${file}`, entry]),
]

/** The workspace folder of a package: `@youj/react` is packages/ui, the rest are named after their package. */
const dirOf = (pkg: string) => (pkg === '@youj/react' ? 'ui' : pkg.replace('@youj/', ''))

const kebab = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()

/** A hook's doc comment; an undocumented one is described by what it returns (useYouj → Youj's members). */
function hookDoc(checker: ts.TypeChecker, symbol: ts.Symbol, signature: ts.Signature): string {
  const own = ts.displayPartsToString(symbol.getDocumentationComment(checker)).trim()
  if (own) return own
  const returned = checker.getReturnTypeOfSignature(signature)
  const typeDoc = ts.displayPartsToString(returned.getSymbol()?.getDocumentationComment(checker) ?? []).trim()
  if (typeDoc) return typeDoc
  const members = returned.getProperties().map((m) => {
    const doc = ts.displayPartsToString(m.getDocumentationComment(checker)).trim()
    return doc ? `${m.name} (${doc.replace(/\.$/, '')})` : m.name
  })
  return members.length ? `Returns ${members.join(', ')}.` : ''
}

function hooks(root: string, items: Map<string, RegistryItem>, docs: DocPage[]): Hook[] {
  const files = ENTRIES.map(([file]) => join(root, 'packages', file))
  const program = ts.createProgram(files, {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.ReactJSX,
    strict: true,
    skipLibCheck: true,
    noEmit: true,
  })
  const checker = program.getTypeChecker()
  const out = new Map<string, Hook>()
  const docsFor = (name: string) => {
    const own = pageFor(kebab(name))
    if (own) return own.replace(/^\/docs\/?/, '')
    const heading = new RegExp(`^#{2,3} .*\\b${name}\\b`, 'm')
    return (docs.find((d) => heading.test(d.markdown)) ?? docs.find((d) => d.markdown.includes(`${name}(`)))?.slug
  }
  ENTRIES.forEach(([, entry], i) => {
    const source = program.getSourceFile(files[i]!)
    const module = source && checker.getSymbolAtLocation(source)
    if (!module) return
    for (const exported of checker.getExportsOfModule(module)) {
      if (!/^use[A-Z]/.test(exported.name) || out.has(exported.name)) continue
      const symbol = exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported
      const decl = symbol.declarations?.[0]
      if (!decl) continue
      const type = checker.getTypeOfSymbolAtLocation(symbol, decl)
      const signature = type.getCallSignatures()[0]
      if (!signature) continue
      const file = relative(join(root, 'packages'), decl.getSourceFile().fileName)
      const registry = [...items.values()].find((item) => item.files?.some((f) => `${dirOf(item.package)}/${f.path}` === file))
      const page = docsFor(exported.name)
      out.set(exported.name, {
        name: exported.name,
        import: `import { ${exported.name} } from '${entry}'`,
        signature: `${exported.name}${checker.signatureToString(signature, undefined, ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseSingleQuotesForStringLiteralType)}`,
        description: hookDoc(checker, symbol, signature),
        ...(page ? { docs: page } : {}),
        ...(registry && registry.type === 'registry:hook' ? { registry: registry.name } : {}),
      })
    }
  })
  // Registry hooks the entries don't export: they install as source only.
  for (const item of items.values()) {
    if (item.type !== 'registry:hook') continue
    const file = item.files?.[0]?.path ?? ''
    const text = readFileSync(join(root, 'packages', dirOf(item.package), file), 'utf8')
    const name = /export function (use\w+)/.exec(text)?.[1]
    if (!name || out.has(name)) continue
    const doc = /\/\*\*\s*([\s\S]*?)\*\/\s*export function/.exec(text)?.[1]?.replace(/^\s*\* ?/gm, '').trim() ?? item.description ?? ''
    out.set(name, {
      name,
      import: `import { ${name} } from '${registryImportPath(item) ?? packageEntry(item)}'`,
      signature: /export function (use\w+\([^)]*\)(?::\s*[^{]+)?)/.exec(text)?.[1]?.trim() ?? name,
      description: doc,
      registry: item.name,
    })
  }
  return [...out.values()].sort((a, b) => a.name.localeCompare(b.name))
}

/* ── UI tokens ── */

export function uiTokens(css: string): UiTokens {
  const section = css.slice(css.indexOf('/* ── 2. UI-only tokens'))
  const theme = section.slice(section.indexOf('@theme {'))
  const vars = new Map([...theme.matchAll(/^\s*(--[\w-]+):\s*([^;]+);/gm)].map(([, k, v]) => [k!, v!.trim()]))
  const pick = (prefix: string) => Object.fromEntries([...vars].filter(([k]) => k.startsWith(prefix) && !k.endsWith('--line-height')).map(([k, v]) => [k.slice(2), v]))
  const text: UiTokens['text'] = {}
  for (const [k, v] of vars) {
    if (!k.startsWith('--text-') || k.endsWith('--line-height')) continue
    text[k.slice(2)] = { size: v, ...(vars.get(`${k}--line-height`) ? { lineHeight: vars.get(`${k}--line-height`)! } : {}) }
  }
  return { radius: pick('--radius-'), control: pick('--spacing-control'), text }
}
