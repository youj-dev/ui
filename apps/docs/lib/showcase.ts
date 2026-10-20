import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { basename, join } from 'node:path'
import { taxonomyOf, type Level } from './taxonomy.ts'

/* Blocks, read from @youj/react's sources at build time.
 *
 * The stories are the demos: a block is the `registry:block` item in
 * packages/ui/registry/ui.json, shown through its `<file>.stories.tsx`. So a
 * block merged into the package shows up here with no docs edit.
 * Nothing but ./taxonomy.ts is imported here (plain text, no @/ aliases), so
 * the generator script can use it too. */

const ROOT = join(/*turbopackIgnore: true*/ process.cwd(), '../..')
const UI = join(ROOT, 'packages/ui')
const CONTENT = join(/*turbopackIgnore: true*/ process.cwd(), 'content/docs')

export interface Story {
  /** The named export: `Split`. */
  id: string
  /** Its label: the story's `name`, else the export in words ("Wrong password"). */
  name: string
}

export interface ShowcaseLink {
  name: string
  title: string
  url: string
}

/**
 * A block's own look, from its story's `parameters.showcase`: a stock
 * preset (`preset: 'basalt'`), or a custom theme's name and accent color
 * (`theme: 'Ember', accent: 'oklch(…)'`). `address` is the product's URL,
 * shown in the frame's address bar.
 */
export interface ShowcaseMeta {
  preset?: string
  theme?: string
  accent?: string
  address?: string
}

export interface ShowcaseEntry {
  kind: 'blocks'
  /** `auth-login`, `analytics-dashboard`. */
  slug: string
  title: string
  /** One or two sentences, for cards. */
  summary: string
  /** The story's full description, for the page. */
  description: string
  /** Path from the repository root: `packages/ui/src/blocks/auth/login.stories.tsx`. */
  storyFile: string
  /** The module the generated loader imports: `@youj/react/blocks/auth/login.stories`. */
  module: string
  stories: Story[]
  /** Docs pages for what it's built from, in the order it uses them. */
  components: ShowcaseLink[]
  /** The registry item that installs it, when there is one: `auth-login`. */
  registry?: string
  /** Its own theme and product address, when its story declares them. */
  showcase?: ShowcaseMeta
  /** It takes a `theme` prop over its own ThemeScope, so the showcase can re-theme it; anything else follows the page's preset. */
  themed: boolean
  /** Its story declares an illustration slot (`showcase: { illustration: true }`): the frame offers a picker that passes the scene as `illustration`. */
  illustration?: boolean
  /**
   * Hidden from the gallery: it's one part of this item (`showcase: { partOf: 'app-auth-flow' }`),
   * which the gallery shows instead. It keeps its page and its registry item, and the two pages link each other.
   */
  partOf?: string
  /** The page it's shown on in light (lightPage): a website's white page, or an app's gray one under white cards. */
  page: ShowcasePage
  /** Its source files, from the repository root, the entry first: what the Code tab shows. */
  files: string[]
  /** Its rung on the ladder (taxonomy.json): `card`, `screen`, `template`… */
  level: Level
  /** Its category within the level: `status-and-health`. */
  category: string
}

/**
 * What a block is, which decides how it's framed (`framing`): a whole screen, a
 * full-bleed section of one, a card (a card or panel that sits inside a
 * page), an overlay (a drawer, popover or banner over a page) or a fragment
 * (a piece of a larger thing: a sidebar, a top bar, a set of empty states).
 * Each block's story declares it: `showcase: { kind: 'card' }`.
 */
export type BlockKind = 'screen' | 'section' | 'card' | 'overlay' | 'fragment'
export const BLOCK_KINDS: readonly BlockKind[] = ['screen', 'section', 'card', 'overlay', 'fragment']
const isBlockKind = (value: string | undefined): value is BlockKind => BLOCK_KINDS.includes(value as BlockKind)

/** How the gallery names each kind: one, many, and what it is in a few words. */
export const KIND_LABELS: Record<BlockKind, { one: string; many: string; note: string }> = {
  screen: { one: 'Screen', many: 'Screens', note: 'Whole screens' },
  section: { one: 'Section', many: 'Sections', note: 'Bands to stack into a page' },
  card: { one: 'Card', many: 'Cards', note: 'Cards and panels that sit inside a page' },
  overlay: { one: 'Overlay', many: 'Overlays', note: 'Over a page: drawers, popovers, banners' },
  fragment: { one: 'Fragment', many: 'Fragments', note: 'Pieces of a larger whole' },
}

/**
 * How a block is shown, everywhere it is (its page's frame, its tile, its
 * /view page and its capture): a page in the 1280×800 browser frame; a
 * section full-bleed, as tall as it is; a card at its own width on a plain
 * stage, as tall as it is. An overlay is shown open over a page, so it's
 * framed as one, and a fragment on the card's small stage. The frame's
 * parts are the exception: their stories show them in the whole app frame.
 */
export type Framing = 'screen' | 'section' | 'card'
export function framing(entry: Pick<ShowcaseEntry, 'kind'> & { blockKind?: BlockKind; group?: string }): Framing {
  if (entry.kind !== 'blocks' || entry.group === 'Frame') return 'screen'
  switch (entry.blockKind) {
    case 'section':
      return 'section'
    case 'card':
    case 'fragment':
      return 'card'
    default:
      return 'screen'
  }
}

/**
 * Light mode's page for an item, the theme's `neutral.page`: the white page a
 * website sits on for the groups that build one (marketing, content and auth),
 * an app's soft gray page under white cards for the rest (app, frame,
 * commerce and lifestyle). A story overrides it with
 * `showcase: { page: 'gray' }` or `'white'`. Dark has one page.
 */
export type ShowcasePage = 'gray' | 'white'
const WHITE_PAGE_GROUPS = ['Marketing', 'Content', 'Auth']
const lightPage = (group: string | undefined, declared: ShowcasePage | undefined): ShowcasePage =>
  declared ?? (group && WHITE_PAGE_GROUPS.includes(group) ? 'white' : 'gray')

export interface Block extends ShowcaseEntry {
  kind: 'blocks'
  /** What it is, from its story's `showcase: { kind }`: what decides its frame (`framing`). */
  blockKind: BlockKind
  /** `Auth`, `App`, `Marketing`… */
  group: string
  /** The block's own source, from the repository root. */
  file: string
  /** Blocks it builds on (`auth-shell`), which install with it. */
  blocks: string[]
  /** A composition's blocks, in page order: it has no item of its own, and installs as these. */
  stack?: string[]
}

/** Gallery order; groups not listed here follow, alphabetically. */
export const BLOCK_GROUPS = ['Auth', 'App', 'Frame', 'Marketing', 'Commerce', 'Lifestyle']

/** Blocks a group leads with, in this order; the rest follow in registry order. The frame opens on its layout and the sidebars. */
const GROUP_LEADS: Record<string, string[]> = {
  Frame: [
    'frame-shell',
    'frame-sidebar-classic',
    'frame-sidebar-workspace',
    'frame-sidebar-rail-panel',
    'frame-sidebar-icon-rail',
    'frame-sidebar-glass',
  ],
}

/** Registry items whose page is named differently, or that live on another item's page. */
const PAGE_ALIASES: Record<string, string> = {
  empty: 'empty-state',
  // Async Button is the Async actions section of Button's page.
  'async-button': 'button',
  label: 'field',
  // The drawing kit is one guide in the Illustrations section.
  'iso-scene': 'draw-your-own',
  'iso-shapes': 'draw-your-own',
  'iso-stack': 'draw-your-own',
  'illustration-kit': 'draw-your-own',
}

const words = (id: string) => id.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase())
const sentenceCase = (s: string) => s.charAt(0) + s.slice(1).replace(/\s([A-Z])(?=[a-z])/g, (_, c: string) => ` ${c.toLowerCase()}`)
// Same acronym list as packages/ui/scripts/generate.mjs, for names that don't come from the registry.
const ACRONYMS: Record<string, string> = { ai: 'AI', api: 'API', cms: 'CMS', cta: 'CTA', faq: 'FAQ', otp: 'OTP', kpi: 'KPI', sso: 'SSO', seo: 'SEO', csv: 'CSV', url: 'URL', ui: 'UI', id: 'ID', pdf: 'PDF', crm: 'CRM', sms: 'SMS', json: 'JSON', qr: 'QR', cpu: 'CPU', rss: 'RSS', svg: 'SVG', mcp: 'MCP', cli: 'CLI', saas: 'SaaS' }
const titleCase = (slug: string) => slug.split('-').map((w) => ACRONYMS[w] ?? w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

/** The first one or two sentences, up to ~180 characters. */
export function summarize(text: string): string {
  const sentences = text.match(/[^.!?]+[.!?]+(?=\s|$)/g) ?? [text]
  let out = sentences[0]!.trim()
  if (out.length < 90 && sentences[1] && out.length + sentences[1].length < 180) out += ` ${sentences[1].trim()}`
  return out
}

function unquote(literal: string): string {
  return literal.slice(1, -1).replace(/\\(['"`\\])/g, '$1')
}

/** The component takes `theme?: ThemeInput`, the house signature for a re-themable block. */
export function takesTheme(source: string): boolean {
  return /\btheme\?:\s*ThemeInput\b/.test(source)
}

/** `parameters.showcase`, when its values are plain string literals: `showcase: { preset: 'graphite', address: 'folio.email' }`. */
function parseShowcase(source: string): ShowcaseMeta | undefined {
  const body = /\bshowcase:\s*\{([^{}]*)\}/.exec(source)?.[1]
  if (!body) return undefined
  const meta: ShowcaseMeta = {}
  for (const [, key, literal] of body.matchAll(/\b(preset|theme|accent|address):\s*('(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*")/g)) {
    meta[key as keyof ShowcaseMeta] = unquote(literal!)
  }
  return meta.preset || meta.theme ? meta : undefined
}

/** `showcase: { illustration: true }`: the block has an illustration slot the frame can swap. */
const takesIllustration = (source: string) => /\bshowcase:\s*\{[^{}]*\billustration:\s*true\b/.test(source)

/** `showcase: { partOf: 'app-auth-flow' }`: the item this one is a part of. */
const partOf = (source: string) => /\bshowcase:\s*\{[^{}]*\bpartOf:\s*['"]([\w-]+)['"]/.exec(source)?.[1]

/** `showcase: { kind: 'card' }`: what the block is (BlockKind). */
const declaredKind = (source: string) => {
  const kind = /\bshowcase:\s*\{[^{}]*\bkind:\s*['"](\w+)['"]/.exec(source)?.[1]
  return isBlockKind(kind) ? kind : undefined
}

/** `showcase: { page: 'white' }`: the page it's shown on in light, over its group's (lightPage). */
const declaredPage = (source: string) => /\bshowcase:\s*\{[^{}]*\bpage:\s*['"](gray|white)['"]/.exec(source)?.[1] as ShowcasePage | undefined

/** The meta's title and docs description, and every story export, read from a story file's text. */
export function parseStories(source: string): {
  title?: string
  description?: string
  stories: Story[]
  showcase?: ShowcaseMeta
  illustration: boolean
  partOf?: string
  page?: ShowcasePage
  kind?: BlockKind
} {
  const title = /\btitle:\s*(['"`])(.*?)\1/.exec(source)?.[2]
  const literal = /description:\s*\{\s*component:\s*('(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`)/.exec(source)?.[1]
  const stories: Story[] = []
  for (const match of source.matchAll(/^export const ([A-Z]\w*)\b[^=]*=\s*\{/gm)) {
    const id = match[1]!
    // `name:` as the story object's first-level key: search only up to the next top-level export.
    const rest = source.slice(match.index! + match[0].length)
    const body = rest.slice(0, rest.search(/^export /m) === -1 ? undefined : rest.search(/^export /m))
    const name = /^\s{2}name:\s*(['"`])(.*?)\1/m.exec(body)?.[2]
    stories.push({ id, name: name ?? sentenceCase(words(id)) })
  }
  return {
    title,
    description: literal ? unquote(literal) : undefined,
    stories,
    showcase: parseShowcase(source),
    illustration: takesIllustration(source),
    partOf: partOf(source),
    page: declaredPage(source),
    kind: declaredKind(source),
  }
}

let pageIndex: Map<string, string> | undefined

/** A content file's URL: a `(group)` folder files pages in the sidebar and stays out of the URL. */
export function docsUrl(file: string): string {
  const slugs = file.replace(/\.mdx$/, '').split(/[\\/]/).filter((s) => !/^\(.+\)$/.test(s) && s !== '')
  if (slugs.at(-1) === 'index') slugs.pop()
  return ['/docs', ...slugs].join('/')
}

/** Docs page URL by file name: `button` → `/docs/components/button`, a folder's index by the folder. */
export function docsPages(): Map<string, string> {
  if (pageIndex) return pageIndex
  const index = new Map<string, string>()
  const files = (readdirSync(CONTENT, { recursive: true }) as string[]).filter((f) => f.endsWith('.mdx')).sort()
  for (const file of files) {
    const url = docsUrl(file)
    const key = basename(file) === 'index.mdx' ? basename(join(file, '..')) : basename(file, '.mdx')
    // Shallower pages win a name clash: /docs/components/empty-state over a chat part of the same name.
    const prior = index.get(key)
    if (!prior || prior.split('/').length > url.split('/').length) index.set(key, url)
  }
  pageIndex = index
  return index
}

/** The docs page for a registry item, if it has one. */
export function pageFor(item: string): string | undefined {
  return docsPages().get(PAGE_ALIASES[item] ?? item)
}

interface RegistryEntry {
  name: string
  type?: string
  title?: string
  description?: string
  registryDependencies?: string[]
  files?: { path: string }[]
}

function uiRegistry(): RegistryEntry[] {
  return JSON.parse(readFileSync(join(UI, 'registry/ui.json'), 'utf8')) as RegistryEntry[]
}

function allRegistry(): Map<string, RegistryEntry> {
  const items = new Map<string, RegistryEntry>()
  for (const pkg of readdirSync(join(ROOT, 'packages'))) {
    const dir = join(ROOT, 'packages', pkg, 'registry')
    if (!existsSync(dir)) continue
    for (const f of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
      for (const item of JSON.parse(readFileSync(join(dir, f), 'utf8')) as RegistryEntry[]) items.set(item.name, item)
    }
  }
  return items
}

function link(name: string, registry: Map<string, RegistryEntry>): ShowcaseLink[] {
  const url = pageFor(name)
  if (!url || name.startsWith('icon-')) return []
  const page = PAGE_ALIASES[name] ?? name
  return [{ name, title: registry.get(page)?.title ?? titleCase(page), url }]
}

function unique(links: ShowcaseLink[]): ShowcaseLink[] {
  const seen = new Set<string>()
  return links.filter((l) => !seen.has(l.url) && seen.add(l.url))
}

/** An item's level and category from taxonomy.json, by registry item name; the build fails on one with none. */
function ladder(name: string): Pick<ShowcaseEntry, 'level' | 'category'> {
  const entry = taxonomyOf(name)
  if (!entry) throw new Error(`${name} has no level or category: add it to taxonomy.json`)
  return { level: entry.level, category: entry.category }
}

let blockCache: Block[] | undefined

/**
 * Block compositions, by story file under packages/ui: one screen stacked
 * from several blocks. A screen with no navigation of its own is a block,
 * however many it stacks, so these list with the blocks of their group.
 */
const SCREEN_BLOCKS = ['src/blocks/marketing/landing.stories.tsx']

/** Every `registry:block` item and block composition, in gallery order. */
export function blocks(): Block[] {
  if (blockCache) return blockCache
  const registry = allRegistry()
  const list = uiRegistry()
    .filter((item) => item.type === 'registry:block' && item.files?.[0] && !taxonomyOf(item.name)?.hidden)
    .map((item): Block => {
      const file = `packages/ui/${item.files![0]!.path}`
      const storyFile = file.replace(/\.tsx$/, '.stories.tsx')
      const parsed = existsSync(join(ROOT, storyFile)) ? parseStories(readFileSync(join(ROOT, storyFile), 'utf8')) : { stories: [], showcase: undefined, illustration: false, partOf: undefined, page: undefined, kind: undefined }
      const group = titleCase(item.files![0]!.path.split('/').at(-2)!)
      const deps = item.registryDependencies ?? []
      const description = parsed.description ?? item.description ?? ''
      return {
        kind: 'blocks',
        // A story that doesn't say is a screen, as every block was framed before kinds (lib/showcase.test.ts holds each to declaring one).
        blockKind: parsed.kind ?? 'screen',
        slug: item.name,
        group,
        title: (item.title ?? titleCase(item.name)).replace(new RegExp(`^${group}\\s+`), ''),
        summary: summarize(item.description ?? description),
        description,
        file,
        files: item.files!.map((f) => `packages/ui/${f.path}`),
        storyFile,
        module: `@youj/react/${storyFile.replace(/^packages\/ui\/src\//, '').replace(/\.tsx$/, '')}`,
        stories: parsed.stories,
        registry: item.name,
        showcase: parsed.showcase,
        illustration: parsed.illustration,
        partOf: parsed.partOf,
        page: lightPage(group, parsed.page),
        // A block may declare its props in a part (`data-grid/props.ts`).
        themed: item.files!.some((f) => takesTheme(readFileSync(join(ROOT, 'packages/ui', f.path), 'utf8'))),
        blocks: deps.filter((d) => registry.get(d)?.type === 'registry:block'),
        components: unique(deps.filter((d) => registry.get(d)?.type !== 'registry:block').flatMap((d) => link(d, registry))),
        ...ladder(item.name),
      }
    })
  for (const file of SCREEN_BLOCKS) {
    const storyFile = `packages/ui/${file}`
    const source = readFileSync(join(ROOT, storyFile), 'utf8')
    const parsed = parseStories(source)
    const folder = file.split('/').at(-2)!
    const stack = [...source.matchAll(/from '\.\/([\w-]+)'/g)].map((m) => `${folder}-${m[1]}`).filter((name) => registry.get(name)?.type === 'registry:block')
    const description = parsed.description ?? ''
    const slug = `${folder}-${basename(file, '.stories.tsx')}`
    list.push({
      kind: 'blocks',
      blockKind: parsed.kind ?? 'screen',
      slug,
      group: titleCase(folder),
      title: parsed.title?.split('/').at(-1) ?? titleCase(basename(file, '.stories.tsx')),
      summary: summarize(description),
      description,
      file: storyFile,
      files: [storyFile],
      storyFile,
      module: `@youj/react/${storyFile.replace(/^packages\/ui\/src\//, '').replace(/\.tsx$/, '')}`,
      stories: parsed.stories,
      themed: false,
      page: lightPage(titleCase(folder), parsed.page),
      blocks: stack,
      stack,
      components: unique(stack.flatMap((name) => (registry.get(name)?.registryDependencies ?? []).filter((d) => registry.get(d)?.type !== 'registry:block').flatMap((d) => link(d, registry)))),
      ...ladder(slug),
    })
  }
  const rank = (g: string) => (BLOCK_GROUPS.includes(g) ? BLOCK_GROUPS.indexOf(g) : BLOCK_GROUPS.length)
  const lead = (b: Block) => {
    const i = GROUP_LEADS[b.group]?.indexOf(b.slug) ?? -1
    return i < 0 ? Infinity : i
  }
  blockCache = list.sort((a, b) => rank(a.group) - rank(b.group) || a.group.localeCompare(b.group) || lead(a) - lead(b) || 0)
  return blockCache
}

/** The app frame: the Layout the frame's parts (sidebars, top bars, accounts, search…) compose into, whose page also explains the frame's routing. */
export const FRAME_BLOCK = 'frame-shell'

/** The blocks that are parts of this one, in list order: the auth flow's separate pages. */
export function partsOf(slug: string): Block[] {
  return blocks().filter((b) => b.partOf === slug)
}

export function block(slug: string): Block | undefined {
  return blocks().find((b) => b.slug === slug)
}

/** An item's `install` where its `youj add` isn't the rule: a stack's blocks, or '' for an item with none. */
export function installOf(entry: ShowcaseEntry): { install?: string } {
  const stack = (entry as { stack?: string[] }).stack
  if (stack) return { install: stack.join(' ') }
  return entry.registry === entry.slug ? {} : { install: '' }
}
