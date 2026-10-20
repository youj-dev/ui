// Generates the package entries (src/index.ts, and src/<entry>.ts for the
// components that need an optional peer; see OPTIONAL_ENTRIES), entries.json
// and the registry fragment (registry/ui.json) from the source files, so
// parallel component work never conflicts on shared lists. Run after adding a
// component or hook, or changing its imports:
//
//   node scripts/generate.mjs          write the files
//   node scripts/generate.mjs --check  exit 1 if any is stale
//
// Each src/components/ui/<name>.tsx becomes registry item <name>. A component
// folder, src/components/ui/<name>/, becomes one item <name> holding its
// index.ts and the files named after it (<name>*.tsx, not stories, tests,
// fixtures or SSR cases), and exposes its public API from that index.ts. Any
// other file in the folder is an item of its own (data-table/table.tsx →
// `table`), installed at the same path so relative imports hold, and made
// public only through the folder's index. Each src/hooks/<name>.ts becomes a
// registry:hook item. Each src/blocks/<group>/<name>.tsx becomes a registry:block
// item `<group>-<name>` installed at blocks/<group>/<name>.tsx; a block split into
// parts adds the files of its sibling folder src/blocks/<group>/<name>/, installed
// beside it. Blocks are not exported from the index. Their npm dependencies and registry dependencies (the components,
// hooks and youj-ui-core they import relatively, and the motion items
// holding what they import from @youj/motion) come from their imports, and
// using a motion preset class (yj-pop, yj-duration-fast…) adds youj-presets.
// A component's description is the first sentence of its story's docs
// description; a hook's is its JSDoc.
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, posix, relative, sep } from 'node:path'
import ts from 'typescript'
import { presetClassPattern, usesPresetClass } from '../../core/scripts/presets.mjs'
import { sourceItems } from '../../../scripts/youj-sources.mjs'
import { moduleReferences, motionEntries, motionFilesFor, sourceOf } from './motion-exports.mjs'

const root = join(import.meta.dirname, '..')
const check = process.argv.includes('--check')
const problems = []

const NOT_SHIPPED = /\.(stories|test|fixtures|ssr-cases)\.tsx?$/
const list = (dir, pattern) =>
  existsSync(join(root, dir)) ? readdirSync(join(root, dir)).filter((f) => pattern.test(f) && !NOT_SHIPPED.test(f)).sort() : []
/** Like `list`, through nested folders too (`components/mail-list.tsx`), as `/`-separated paths. */
const listDeep = (dir, pattern) =>
  existsSync(join(root, dir))
    ? readdirSync(join(root, dir), { recursive: true })
        .map((f) => f.split(sep).join('/'))
        .filter((f) => pattern.test(f) && !NOT_SHIPPED.test(f))
        .sort()
    : []
const isDir = (path) => statSync(join(root, path)).isDirectory()

/** Every item built from source: its name, files, and the module @youj/react re-exports. */
// `<name>.<part>.tsx` beside a flat component is part of it, not a component:
// a chunk it loads lazily (button.press.tsx). It ships in the component's item
// and stays out of the index, so nothing but that lazy import reaches it.
const companion = /^([\w-]+)\.[\w-]+\.tsx?$/
const flat = list('src/components/ui', /\.tsx?$/)
const units = [
  ...flat
    .filter((f) => f.endsWith('.tsx') && !companion.test(f))
    .map((f) => ({
      name: f.replace(/\.tsx$/, ''),
      kind: 'ui',
      files: [f, ...flat.filter((c) => c.match(companion)?.[1] === f.replace(/\.tsx$/, ''))].map((c) => `src/components/ui/${c}`),
      entry: `src/components/ui/${f}`,
    })),
  ...readdirSync(join(root, 'src/components/ui'))
    .filter((d) => isDir(`src/components/ui/${d}`))
    .sort()
    .flatMap((d) => {
      const files = list(`src/components/ui/${d}`, /\.tsx?$/)
      const own = (f) => f === 'index.ts' || f.startsWith(d)
      return [
        { name: d, kind: 'ui', folder: true, files: files.filter(own).map((f) => `src/components/ui/${d}/${f}`), entry: `src/components/ui/${d}/index.ts` },
        ...files
          .filter((f) => !own(f))
          .map((f) => ({ name: f.replace(/\.tsx?$/, ''), kind: 'ui', folder: true, files: [`src/components/ui/${d}/${f}`], entry: `src/components/ui/${d}/${f}`, internal: true })),
      ]
    }),
  ...list('src/hooks', /\.tsx?$/).map((f) => ({ name: f.replace(/\.tsx?$/, ''), kind: 'hook', files: [`src/hooks/${f}`], entry: `src/hooks/${f}` })),
  ...(existsSync(join(root, 'src/blocks')) ? readdirSync(join(root, 'src/blocks')) : [])
    .filter((g) => isDir(`src/blocks/${g}`))
    .sort()
    .flatMap((g) =>
      list(`src/blocks/${g}`, /\.tsx$/).map((f) => {
        const name = f.replace(/\.tsx$/, '')
        // A block too big for one file keeps its entry and splits the rest into a sibling folder of the same name.
        const parts = existsSync(join(root, `src/blocks/${g}/${name}`)) ? listDeep(`src/blocks/${g}/${name}`, /\.tsx?$/).map((p) => `src/blocks/${g}/${name}/${p}`) : []
        return { name: `${g}-${name}`, kind: 'block', files: [`src/blocks/${g}/${f}`, ...parts], entry: `src/blocks/${g}/${f}` }
      }),
    ),
]
for (const unit of units) {
  if (unit.folder && !existsSync(join(root, unit.entry))) problems.push(`src/components/ui/${unit.name}/ needs an index.ts that exports its public API`)
}
const fromSrc = (file) => file.replace(/^src\//, '').replace(/\.tsx?$/, '').replace(/\/index$/, '')
const itemByPath = new Map([['lib/utils', 'youj-ui-core'], ['lib/safe-href', 'youj-ui-core'], ...units.flatMap((u) => u.files.map((f) => [fromSrc(f), u.name]))])

// The source packages' items (motion, icons, illustrations) by the files they ship, from their registry fragments.
const motionItemByFile = new Map()
for (const item of sourceItems()) {
  for (const file of item.files ?? []) {
    // A stand-in file (registry/stubs) answers for the file it replaces in the app.
    const path = file.target ? `src/${file.target}` : file.path
    if (!motionItemByFile.has(path) && item.name !== 'icons') motionItemByFile.set(path, item.name)
  }
}
const entries = motionEntries()

// react and react-dom come with the app; everything else is a dependency.
const SKIP = new Set(['react', 'react-dom'])
const packageName = (specifier) => specifier.split('/').slice(0, specifier.startsWith('@') ? 2 : 1).join('/')

// Acronyms keep their capitals in display names ("App AI Workspace", not "App Ai Workspace").
const ACRONYMS = { ai: 'AI', api: 'API', cms: 'CMS', cta: 'CTA', faq: 'FAQ', otp: 'OTP', kpi: 'KPI', sso: 'SSO', seo: 'SEO', csv: 'CSV', url: 'URL', ui: 'UI', id: 'ID', pdf: 'PDF', crm: 'CRM', sms: 'SMS', json: 'JSON', qr: 'QR', cpu: 'CPU', rss: 'RSS', svg: 'SVG', mcp: 'MCP', cli: 'CLI', saas: 'SaaS' }
const title = (name) => name.split('-').map((w) => ACRONYMS[w] ?? w[0].toUpperCase() + w.slice(1)).join(' ')
const firstSentence = (text) => text.match(/^.*?[.!?](?=\s+[A-Z`(]|$)/)?.[0] ?? text

/** First sentence of the story's `parameters.docs.description.component`. */
function storyDescription(unit) {
  const story = join(root, unit.folder && !unit.internal ? `src/components/ui/${unit.name}/${unit.name}.stories.tsx` : unit.entry.replace(/\.tsx?$/, '.stories.tsx'))
  if (!existsSync(story)) return undefined
  const source = readFileSync(story, 'utf8')
  const m = source.match(/component:\s*'((?:[^'\\]|\\.)*)'/) ?? source.match(/component:\s*"((?:[^"\\]|\\.)*)"/)
  return m ? firstSentence(m[1].replace(/\\(.)/g, '$1')) : undefined
}

/**
 * What a block is (screen, section, card, overlay or fragment), from its
 * story's `parameters.showcase.kind`: the docs frame it by it, and the
 * registry item carries it as `meta.kind` so the CLI and the MCP can say
 * where it goes ("inside a page").
 */
const BLOCK_KINDS = ['screen', 'section', 'card', 'overlay', 'fragment']
function storyKind(unit) {
  const story = join(root, unit.entry.replace(/\.tsx?$/, '.stories.tsx'))
  const kind = existsSync(story) ? readFileSync(story, 'utf8').match(/\bshowcase:\s*\{[^{}]*\bkind:\s*['"](\w+)['"]/)?.[1] : undefined
  if (!BLOCK_KINDS.includes(kind)) problems.push(`${unit.entry}: its story needs parameters.showcase.kind, one of ${BLOCK_KINDS.join(', ')}`)
  return kind
}

/**
 * Where an item sits on the ladder, from the repository's taxonomy.json: its
 * level (component, card, section, frame, screen) and its
 * category within that level, and a component's complexity (simple or
 * composite). The item carries them as meta.level, meta.complexity and
 * meta.category, beside a block's meta.kind; `pnpm check:taxonomy` holds the
 * file to the registry.
 */
const taxonomy = JSON.parse(readFileSync(join(root, '../../taxonomy.json'), 'utf8')).items
function ladder(unit) {
  const entry = taxonomy[unit.name]
  if (!entry?.level || !entry.category) problems.push(`${unit.entry}: ${unit.name} needs a level and a category in taxonomy.json`)
  return { level: entry?.level, ...(entry?.complexity && { complexity: entry.complexity }), category: entry?.category, ...(entry?.inApp && { inApp: true }), ...(entry?.hidden && { hidden: true }) }
}

/** The JSDoc directly above the file's first exported function. */
function jsDocDescription(code) {
  const m = code.match(/\/\*\*((?:(?!\*\/)[\s\S])*)\*\/\s*export function/)
  return m ? m[1].split('\n').map((line) => line.replace(/^\s*\*\s?/, '').trim()).filter(Boolean).join(' ') : undefined
}

const presetPattern = presetClassPattern()

function itemFor(unit) {
  const dependencies = new Set()
  const registryDependencies = new Set()
  for (const file of unit.files) {
    const code = readFileSync(join(root, file), 'utf8')
    // A preset class (yj-pop, yj-duration-fast…) is CSS the item needs installed.
    if (usesPresetClass(code, presetPattern)) registryDependencies.add('youj-presets')
    // A chunk loaded on demand (Button's spinner) is still copied in with the item.
    const specifiers = [...moduleReferences(code, file).map((ref) => ref.specifier), ...[...code.matchAll(/import\(\s*['"](\.{1,2}\/[^'"]+)['"]\s*\)/g)].map((m) => m[1])]
    for (const specifier of specifiers.filter((s) => s.startsWith('.'))) {
      const target = posix.join(posix.dirname(file.replace(/^src\//, '')), specifier)
      const item = itemByPath.get(target)
      if (item && item !== unit.name) registryDependencies.add(item)
    }
    for (const ref of moduleReferences(code, file)) {
      const { specifier } = ref
      if (specifier.startsWith('.')) {
        const target = posix.join(posix.dirname(file.replace(/^src\//, '')), specifier)
        const item = itemByPath.get(target)
        if (!item) problems.push(`${file}: imports ${specifier} (src/${target}), which isn't a component, a hook, lib/utils or lib/safe-href`)
        else if (item !== unit.name) registryDependencies.add(item)
      } else if (sourceOf(specifier)) {
        try {
          const names = ref.bindings.map((b) => b.name)
          for (const source of new Set(motionFilesFor(specifier, names, entries).values())) {
            const item = motionItemByFile.get(`src/${source}`)
            if (item) registryDependencies.add(item)
            else problems.push(`${file}: ${specifier} is in ${sourceOf(specifier).dir}'s src/${source}, which no registry item ships`)
          }
        } catch (error) {
          problems.push(`${file}: ${error.message}`)
        }
      } else if (!SKIP.has(packageName(specifier))) {
        dependencies.add(packageName(specifier))
      }
    }
  }
  const hook = unit.kind === 'hook'
  const block = unit.kind === 'block'
  const code = readFileSync(join(root, unit.entry), 'utf8')
  const description = hook ? jsDocDescription(code) : storyDescription(unit)
  return {
    name: unit.name,
    type: hook ? 'registry:hook' : block ? 'registry:block' : 'registry:ui',
    title: hook ? (code.match(/export function (use\w+)/)?.[1] ?? title(unit.name)) : title(unit.name),
    ...(description && { description }),
    ...(!hook && { meta: { ...(block && { kind: storyKind(unit) }), ...ladder(unit) } }),
    dependencies: [...dependencies].sort(),
    registryDependencies: [...registryDependencies].sort(),
    // A folder or a block keeps its layout in the app, so its files' relative imports still resolve.
    files: unit.files.map((path) => ({
      path,
      type: hook ? 'registry:hook' : block ? 'registry:component' : 'registry:ui',
      ...((unit.folder || block) && { target: path.replace(/^src\//, '') }),
    })),
  }
}

const core = {
  name: 'youj-ui-core',
  type: 'registry:lib',
  title: 'Youj UI core',
  description:
    "cn() (re-exported from youj-core), safeHref and safeLink (the links built from data), and ui.css: radius, density, focus, elevation, scrollbars (yj-scrollbar) and the reduced: variant, built on youj's colour roles. Import ui.css right after youj.css.",
  registryDependencies: ['youj-core'],
  files: [
    { path: 'src/lib/utils.ts', type: 'registry:lib', target: 'lib/utils.ts' },
    { path: 'src/lib/safe-href.ts', type: 'registry:lib', target: 'lib/safe-href.ts' },
    { path: 'src/styles/ui.css', type: 'registry:file', target: 'styles/ui.css' },
  ],
}

/* Looks (core's LOOKS): each but classic is a stylesheet of
 * recipes keyed on data-yj-look, src/styles/<id>.css, shipped as an item of its
 * own so an app on the registry copies only the look it uses (bezel, the
 * default, unless it picks classic). It installs beside ui.css and is imported
 * right after it. The package's styles.css carries every look already
 * (tsdown.config.ts). */
const lookSource = readFileSync(join(root, '../core/src/lib/youj/look.ts'), 'utf8')
const defaultLook = lookSource.match(/export const DEFAULT_LOOK: YoujLook = '([\w-]+)'/)[1]
const lookIds = lookSource
  .match(/export const LOOKS = \[([^\]]+)\]/)[1]
  .split(',')
  .map((id) => id.trim().replace(/^'|'$/g, ''))
  .filter((id) => id && id !== 'classic')
const lookItems = lookIds.map((id) => {
  const path = `src/styles/${id}.css`
  if (!existsSync(join(root, path))) problems.push(`the ${id} look has no stylesheet: ${path}`)
  const name = id[0].toUpperCase() + id.slice(1)
  return {
    name: `youj-look-${id}`,
    type: 'registry:lib',
    title: `${name} look`,
    description:
      id === defaultLook
        ? `The ${name} look, the default: recipes keyed on data-yj-look="${id}" that change how components are built, with any theme. Import styles/${id}.css right after ui.css; a root YoujProvider writes data-yj-look="${id}" itself (without one, put it on <html>).`
        : `The ${name} look: recipes keyed on data-yj-look="${id}" that change how components are built, with any theme. Import styles/${id}.css right after ui.css, then set look="${id}" on YoujProvider (or data-yj-look="${id}" on any element).`,
    registryDependencies: ['youj-ui-core'],
    files: [{ path, type: 'registry:file', target: `styles/${id}.css` }],
  }
})

/* The shadcn compat sheet: shadcn's token names on youj's roles, for an app
 * that already speaks shadcn. Opt in; youj's own source never reads it. */
const shadcnCompat = {
  name: 'youj-shadcn-compat',
  type: 'registry:lib',
  title: 'shadcn compatibility',
  description:
    "shadcn's token names (background, foreground, card, muted, primary, border, input, ring, sidebar...) on youj's colour roles, so code written for shadcn keeps working beside youj. Opt in: import styles/shadcn.css right after ui.css. shadcn's accent stays unmapped, since accent is youj's brand colour.",
  registryDependencies: ['youj-ui-core'],
  files: [{ path: 'src/styles/shadcn.css', type: 'registry:file', target: 'styles/shadcn.css' }],
}

const registry = [core, ...lookItems, shadcnCompat, ...units.map(itemFor)]
const registryJson = JSON.stringify(registry, null, 2) + '\n'

/* The screens Create offers to add to a frame: every screen taxonomy.json
 * tags inApp, with its component (the story's `component:`), its label and
 * its category. Two files, so Create's plain config (which the CLI inlines)
 * holds data only, and the preview alone loads each screen, when it's shown. */
/** A name in sentence case, as a nav item reads: `week-calendar` → `Week calendar`, `api-keys` → `API keys`. */
const sentence = (name) => name.split('-').map((w, i) => ACRONYMS[w] ?? (i ? w : w[0].toUpperCase() + w.slice(1))).join(' ')
const screenLevel = JSON.parse(readFileSync(join(root, '../../taxonomy.json'), 'utf8')).levels.screen.categories
const inApp = units
  .filter((u) => u.kind === 'block' && taxonomy[u.name]?.inApp)
  .map((u) => {
    const story = join(root, u.entry.replace(/\.tsx?$/, '.stories.tsx'))
    const component = existsSync(story) ? readFileSync(story, 'utf8').match(/\bcomponent:\s*([A-Z]\w*)/)?.[1] : undefined
    if (!component) problems.push(`${u.entry}: an inApp screen's story needs \`component: <Its component>\``)
    const file = u.entry.replace(/^src\//, '').replace(/\.tsx$/, '')
    const category = taxonomy[u.name].category
    return { name: u.name, label: sentence(u.name.replace(/^[a-z]+-/, '')), description: storyDescription(u) ?? '', category, categoryLabel: screenLevel[category], file, component }
  })
const screensTs = `// Generated by scripts/generate.mjs from taxonomy.json (inApp). Do not edit by hand.
// The screens Create offers to add to a frame, in the registry's order.

export const IN_APP_SCREENS = ${JSON.stringify(inApp, null, 2)} as const
`
const screenLoadersTs = `// Generated by scripts/generate.mjs from taxonomy.json (inApp). Do not edit by hand.
// Each screen Create offers, loaded when the preview shows it.

import { lazy, type ComponentType } from 'react'

export const SCREEN_LOADERS: Record<string, ComponentType> = {
${inApp.map((s) => `  '${s.name}': lazy(() => import('../../${s.file}').then((m) => ({ default: m.${s.component} as ComponentType }))),`).join('\n')}
}
`

/* Optional peers (package.json peerDependenciesMeta) and the entries that ship
 * the components needing them. Bundlers resolve every module a barrel
 * re-exports, used or not, so if the main entry re-exported Chart, `import {
 * Button } from '@youj/react'` would fail in an app without recharts.
 * A component whose runtime imports reach an optional peer, directly or through
 * the components it imports, ships from @youj/react/<entry> instead. */
const OPTIONAL_ENTRIES = {
  chart: ['recharts'],
  form: ['react-hook-form'],
  date: ['date-fns', 'react-day-picker'],
  carousel: ['embla-carousel-react'],
  command: ['cmdk'],
}
/* Components that a group's name would misfile get an entry of their own:
 * the data table kit reaches cmdk through its filter menus, but it isn't a
 * command component, so it ships from @youj/react/data-table, not /command. */
const OWN_ENTRIES = ['data-table', 'workspace-switcher']
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const optionalPeers = Object.keys(pkg.peerDependenciesMeta ?? {}).filter((name) => pkg.peerDependenciesMeta[name].optional)
const groupOf = new Map(Object.entries(OPTIONAL_ENTRIES).flatMap(([entry, peers]) => peers.map((peer) => [peer, entry])))
for (const peer of optionalPeers) if (!groupOf.has(peer)) problems.push(`package.json: optional peer ${peer} isn't in an entry of OPTIONAL_ENTRIES (scripts/generate.mjs)`)
for (const peer of groupOf.keys()) if (!optionalPeers.includes(peer)) problems.push(`scripts/generate.mjs: ${peer} is in OPTIONAL_ENTRIES but isn't an optional peer in package.json`)

const refsOf = new Map()
const resolveSource = (from, specifier) => {
  const base = posix.join(posix.dirname(from), specifier)
  return [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`].find((p) => /\.tsx?$/.test(p) && existsSync(join(root, p)) && !isDir(p))
}
/** The optional peers a module needs at runtime, through its relative imports. `import type` is erased, so it doesn't count. */
function runtimePeers(file, seen = new Set()) {
  const peers = new Set()
  if (seen.has(file)) return peers
  seen.add(file)
  if (!refsOf.has(file)) refsOf.set(file, moduleReferences(readFileSync(join(root, file), 'utf8'), file))
  for (const ref of refsOf.get(file)) {
    if (ref.typeOnly) continue
    if (!ref.specifier.startsWith('.')) {
      if (optionalPeers.includes(packageName(ref.specifier))) peers.add(packageName(ref.specifier))
      continue
    }
    const target = resolveSource(file, ref.specifier)
    if (target) for (const peer of runtimePeers(target, seen)) peers.add(peer)
  }
  return peers
}

const mainUnits = []
const entryUnits = new Map([...Object.keys(OPTIONAL_ENTRIES), ...OWN_ENTRIES].map((entry) => [entry, []]))
/** The optional peers an entry's components are used with: its group's, or for an own entry the groups of what it needs. */
const peersOf = (entry, list) =>
  OPTIONAL_ENTRIES[entry] ?? [...new Set(list.flatMap((u) => [...runtimePeers(u.entry)].flatMap((peer) => OPTIONAL_ENTRIES[groupOf.get(peer)])))]
for (const unit of units.filter((u) => !u.internal && u.kind !== 'block')) {
  const peers = [...runtimePeers(unit.entry)]
  const entries = OWN_ENTRIES.includes(unit.name) ? new Set([unit.name]) : new Set(peers.map((peer) => groupOf.get(peer)))
  if (!peers.length) mainUnits.push(unit)
  else if (entries.size > 1) problems.push(`${unit.entry} needs ${peers.join(', ')}, which OPTIONAL_ENTRIES puts in different entries (${[...entries].join(', ')})`)
  else {
    entryUnits.get([...entries][0]).push(unit)
    // A folder's own files leave with it; a file of its own that the folder re-exports whole (data-table/table) stays in the main entry if it can.
    if (!unit.folder) continue
    const index = readFileSync(join(root, unit.entry), 'utf8')
    for (const part of units.filter((u) => u.internal && posix.dirname(u.entry) === posix.dirname(unit.entry))) {
      const stem = posix.basename(part.entry).replace(/\.tsx?$/, '')
      if (index.includes(`export * from './${stem}'`) && !runtimePeers(part.entry).size) mainUnits.push(part)
    }
  }
}
for (const [entry, list] of entryUnits) if (!list.length) problems.push(`scripts/generate.mjs: nothing ships from the "${entry}" entry; drop it`)
// The check the entries exist for: the main entry resolves without any optional peer.
const mainPeers = new Set(mainUnits.flatMap((u) => [...runtimePeers(u.entry)]))
if (mainPeers.size) problems.push(`src/index.ts would reach the optional peers ${[...mainPeers].join(', ')}`)
for (const entry of entryUnits.keys()) {
  if (pkg.exports?.[`./${entry}`] !== `./src/${entry}.ts`) problems.push(`package.json: exports needs "./${entry}": "./src/${entry}.ts"`)
  if (pkg.publishConfig?.exports?.[`./${entry}`]?.default !== `./dist/${entry}.js`) problems.push(`package.json: publishConfig.exports needs "./${entry}" (./dist/${entry}.js and .d.ts)`)
}

/* The public API is an explicit allowlist, public-api.json: for each item, the
 * names its module exports that the entries re-export (public) and the ones
 * they don't (internal: class strings, helpers shared with a sibling component).
 * A module that exports a name the file doesn't list fails here, so nothing
 * becomes public by being written; `--write-api` records the new names (a
 * `*Class` constant as internal, everything else as public), and the diff of
 * public-api.json is the review. */
const API_FILE = join(root, 'public-api.json')
const writeApi = process.argv.includes('--write-api')
const allowlist = existsSync(API_FILE) ? JSON.parse(readFileSync(API_FILE, 'utf8')) : {}
const shipped = [...mainUnits, ...[...entryUnits.values()].flat()]
const tsConfig = ts.getParsedCommandLineOfConfigFile(join(root, 'tsconfig.json'), {}, { ...ts.sys, onUnRecoverableConfigFileDiagnostic: () => {} })
const program = ts.createProgram(shipped.map((u) => join(root, u.entry)), { ...tsConfig.options, noEmit: true, skipLibCheck: true })
const checker = program.getTypeChecker()
/** What `entry` exports, as `{ name: isValue }`, `export *` followed. */
/* A style recipe (buttonVariants) lives in a `<name>.variants.ts` beside its component, which is a client module. The component re-exports it, but a
 * server component can only call it when the barrel exports it from the recipe's own file, which carries no "use client". */
const RECIPE = /\.variants\.ts$/
const recipeFiles = new Map()
function exportsOf(entry) {
  const source = program.getSourceFile(join(root, entry))
  const symbol = source && checker.getSymbolAtLocation(source)
  const out = {}
  const recipes = {}
  for (const sym of symbol ? checker.getExportsOfModule(symbol) : []) {
    const target = sym.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(sym) : sym
    out[sym.name] = Boolean(target.flags & ts.SymbolFlags.Value)
    const file = target.declarations?.[0]?.getSourceFile().fileName
    if (file && RECIPE.test(file)) recipes[sym.name] = fromSrc(relative(root, file))
  }
  recipeFiles.set(entry, recipes)
  return out
}
const INTERNAL_BY_DEFAULT = /Class$/
const kinds = new Map()
const nextApi = {}
for (const unit of shipped) {
  const found = exportsOf(unit.entry)
  const listed = allowlist[unit.name] ?? { public: [], internal: [] }
  const known = new Set([...listed.public, ...listed.internal])
  const fresh = Object.keys(found).filter((n) => !known.has(n))
  const stale = [...known].filter((n) => !(n in found))
  if (writeApi) {
    const keep = (names) => names.filter((n) => n in found)
    nextApi[unit.name] = {
      public: [...keep(listed.public), ...fresh.filter((n) => !INTERNAL_BY_DEFAULT.test(n))].sort(),
      internal: [...keep(listed.internal), ...fresh.filter((n) => INTERNAL_BY_DEFAULT.test(n))].sort(),
    }
  } else {
    if (fresh.length) problems.push(`${unit.entry} exports ${fresh.join(', ')}, which public-api.json doesn't list: public or internal? (node scripts/generate.mjs --write-api records them, then review the diff)`)
    if (stale.length) problems.push(`public-api.json lists ${stale.join(', ')} for ${unit.name}, which ${unit.entry} no longer exports`)
  }
  kinds.set(unit.name, found)
}
const apiOf = writeApi ? nextApi : allowlist
for (const name of Object.keys(apiOf)) if (!shipped.some((u) => u.name === name)) {
  if (writeApi) delete nextApi[name]
  else problems.push(`public-api.json has an entry for ${name}, which ships from no entry`)
}
/** The `export { A, type B } from './x'` lines for an entry's items. A name two items both export (a folder's index and a part it re-exports whole) is listed once. */
const exportLines = (list) => {
  const seen = new Set()
  return list
    .map((u) => {
      const found = kinds.get(u.name)
      const names = (apiOf[u.name]?.public ?? []).filter((n) => !seen.has(n))
      for (const n of names) seen.add(n)
      const recipes = recipeFiles.get(u.entry) ?? {}
      const own = names.filter((n) => !recipes[n])
      const lines = own.length ? [`export { ${own.map((n) => (found[n] ? n : `type ${n}`)).join(', ')} } from './${fromSrc(u.entry)}'`] : []
      for (const file of new Set(names.filter((n) => recipes[n]).map((n) => recipes[n]))) lines.push(`export { ${names.filter((n) => recipes[n] === file).join(', ')} } from './${file}'`)
      return lines.length ? lines.join('\n') : null
    })
    .filter(Boolean)
    .join('\n')
}

const index = `// Generated by scripts/generate.mjs. Do not edit by hand.
// @youj/react: the public names of every component in src/components/ui (a
// folder through its index.ts) and every hook in src/hooks, listed in
// public-api.json.
// Components that need an optional peer ship from their own entry instead
// (${[...entryUnits.keys()].map((e) => `src/${e}.ts`).join(', ')}), so this one resolves without them.
${exportLines(mainUnits)}
`

const names = (list) => list.map((n) => `\`${n}\``).join(', ').replace(/, ([^,]*)$/, ' and $1')
const entryFiles = [...entryUnits].map(([entry, list]) => {
  const needed = new Set(list.flatMap((u) => [...runtimePeers(u.entry)]))
  const extra = peersOf(entry, list).filter((peer) => !needed.has(peer))
  return [
    join(root, `src/${entry}.ts`),
    `// Generated by scripts/generate.mjs. Do not edit by hand.
// @youj/react/${entry}: the components that need ${names([...needed])}${extra.length ? `, used with ${names(extra)}` : ''}.
// They're optional peers the app installs itself; the main entry leaves these
// components out, so it resolves without them.
${exportLines(list)}
`,
  ]
})

/* What each entry ships and the optional peers to install with it, for the CLI
 * (`youj add chart` installs recharts), the docs' install commands and
 * the MCP server. */
const entriesJson =
  JSON.stringify(
    {
      [pkg.name]: { file: 'src/index.ts', peerDependencies: {}, items: mainUnits.map((u) => u.name) },
      ...Object.fromEntries(
        [...entryUnits].map(([entry, list]) => [
          `${pkg.name}/${entry}`,
          { file: `src/${entry}.ts`, peerDependencies: Object.fromEntries(peersOf(entry, list).map((peer) => [peer, pkg.peerDependencies?.[peer]])), items: list.map((u) => u.name) },
        ]),
      ),
    },
    null,
    2,
  ) + '\n'

if (problems.length) {
  console.error(problems.map((p) => `  ✗ ${p}`).join('\n'))
  process.exit(1)
}

const targets = [
  ...(writeApi ? [[API_FILE, `{\n${Object.entries(nextApi).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(',\n')}\n}\n`]] : []),
  [join(root, 'src/index.ts'), index],
  [join(root, 'registry/ui.json'), registryJson],
  [join(root, 'entries.json'), entriesJson],
  [join(root, 'src/docs/create/screens.generated.ts'), screensTs],
  [join(root, 'src/docs/create/screen-loaders.generated.tsx'), screenLoadersTs],
  ...entryFiles,
]
const current = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : '')
if (check) {
  const stale = targets.filter(([p, next]) => current(p) !== next).map(([p]) => p)
  if (stale.length) {
    console.error(`stale (run pnpm -F @youj/react generate):\n  ${stale.join('\n  ')}`)
    process.exit(1)
  }
} else {
  mkdirSync(join(root, 'registry'), { recursive: true })
  for (const [p, next] of targets) writeFileSync(p, next)
}
const count = (kind) => units.filter((u) => u.kind === kind).length
console.log(`ui: ${count('ui')} components, ${count('hook')} hooks, ${count('block')} blocks`)
