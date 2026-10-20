import type * as PageTree from 'fumadocs-core/page-tree'
import type { SoundCue } from '@youj/core'
import { cueInfo, lab } from '@youj/sound/lab'
import { miniatures } from '@youj/miniatures'
import { catalog, levelCounts, sceneCount } from './catalog'
import { registryItems } from './registry'
import { source } from './source'
import type { Level } from './taxonomy'
import { groupFirstUrl, sectionEntries, sectionGroups } from './tree'
import { pageIndex, type PageIndex } from '@/lib/page-index'
import type { FeatureArtId } from '@/components/site/feature-art'

/* The site's navigation model, built at build time. The header has four
 * menus: Docs (the docs' sections, each opening its overview, with the Sound
 * builder and the Motion playground), Components (the component groups, in
 * columns of at most six), Blocks (Cards, Sections and Screens, with Create)
 * and Visuals (Icons, Illustrations, Miniatures and Loaders),
 * each with a feature (an animation, a line and a link; Create is Blocks').
 * Sections, groups and lists only, never single pages: the sidebar and ⌘K hold
 * those. Every page carries the menus in its payload, so an entry is a title,
 * a few words and a glyph's name.
 * The pillars are the family, the eight parts the homepage, search and footer name. */

export interface NavLink {
  title: string
  url: string
  description?: string
  status?: 'new' | 'experimental' | 'deprecated'
}

/** The glyph a menu entry wears; components/site/pillar-icons.tsx draws each. */
export type NavGlyph =
  | 'docs'
  | 'guides'
  | 'themes'
  | 'motion'
  | 'icons'
  | 'illustrations'
  | 'loaders'
  | 'miniatures'
  | 'sound'
  | 'ai'
  | 'cli'
  | 'figma'
  | 'components'
  | 'cards'
  | 'sections'
  | 'frames'
  | 'screens'
  | 'playground'

export interface NavEntry extends NavLink {
  glyph?: NavGlyph
  /** How much is there, on its card: "53 cards". */
  count?: string
  /** A live one of its kind, as a card's picture (the Visuals menu's cards). */
  art?: FeatureArtId
}

/** The whole kit, set up in an app: the package, its stylesheet and the provider. */
export const KIT_INSTALL = `npx @youj/cli init`

export type PillarId = 'ui' | 'motion' | 'loaders' | 'icons' | 'illustrations' | 'sound' | 'themes' | 'blocks'

export interface Pillar {
  id: PillarId
  /** "Youj UI" */
  name: string
  /** Short label: "UI" */
  label: string
  url: string
  blurb: string
  /** What it holds, in words: "Animated icons". */
  stat: string
  status?: NavLink['status']
}

/** A labelled column of a menu: the level or the part of the docs it heads, which it opens, and its links as `[title, slug]` (lib/nav-links.ts gives their URLs). */
export interface NavColumn extends NavLink {
  /** How many items it holds, shown beside its name. */
  count?: number
  links: [title: string, slug: string][]
}

/** One of the header's four menus. */
export interface NavMenu {
  id: 'docs' | 'components' | 'blocks' | 'visuals'
  label: string
  /** A flat menu's entries: each a glyph, a name and a few words. Empty on a menu of columns. */
  links: NavEntry[]
  /** A menu of columns: Components' groups. */
  columns?: NavColumn[]
  /** The panel's feature, on its start side. */
  feature: NavFeature
  /** On the desktop header, a plain link to this page instead of a menu (the mobile menu keeps the sections). */
  href?: string
}

/** A menu's feature: one of the Youj animations over a title, a line and a link. */
export interface NavFeature extends NavLink {
  /** The link's words: "Install Youj". */
  cta: string
  /** The animation it plays, by name ("tabstop"); the menu loads its code when it opens (components/site/feature-art.tsx). */
  art: FeatureArtId
}

/** A cue's name, how long it sounds and its waveform: peaks over the part you hear, 0 to 100. */
export interface MenuWave {
  label: string
  ms: number
  peaks: number[]
}

export interface SiteNav {
  menus: NavMenu[]
  pillars: Pillar[]
  /** Every page the site has (lib/page-index.ts). The 404 is prerendered once for all other URLs, so only these may mark a section. */
  pages: PageIndex
}

/** What the header is given, and so what every page's payload carries: the menus and the page index. */
export type HeaderNav = Pick<SiteNav, 'menus' | 'pages'>

type PageLike = { url: string; data: { title: string; description?: string; status?: NavLink['status'] } }

function toLink(page: PageLike): NavLink {
  return { title: page.data.title, url: page.url, description: page.data.description, status: page.data.status }
}

/** The docs page at a URL; links out of the docs (the icons explorer, the showcases) have none. */
function pageAt(url: string): PageLike | undefined {
  if (url !== '/docs' && !url.startsWith('/docs/')) return undefined
  return source.getPage(url.split('#')[0]!.replace(/^\/docs\/?/, '').split('/').filter(Boolean))
}

function links(urls: string[]): NavLink[] {
  return urls.flatMap((url) => {
    const page = pageAt(url)
    return page ? [toLink(page)] : []
  })
}

/** Get started pages about other work rather than about starting: in the sidebar, not in search's start list. */
const ASIDE = ['/docs/comparison']

/** Where to start reading: the Get started pages, Introduction first, the comparison aside. */
export function startLinks(tree: PageTree.Root = source.getPageTree()): NavLink[] {
  return links(['/docs', ...sectionEntries(tree, '/docs')].filter((url) => !ASIDE.includes(url)))
}

/** The explorers, named to stand on their own: ⌘K lists them after the family, whose parts open their docs. */
export const EXPLORERS: NavLink[] = [
  { title: 'Icons explorer', url: '/icons', description: 'Search, preview and copy every icon: static, animated, morphing and swapping.' },
  { title: 'Morph Lab', url: '/icons?view=lab', description: 'Scrub any IconSwap transition between any two icons, frame by frame.' },
  { title: 'Illustrations explorer', url: '/illustrations', description: 'Search, preview and install every isometric scene, in any theme, or download it as SVG or PNG.' },
  { title: 'Illustration builder', url: '/illustrations/build', description: 'Build a new scene from the kit’s parts, then take it home as code, SVG or PNG.', status: 'experimental' },
  { title: 'Loaders gallery', url: '/loaders', description: 'Every loader, live: set its size, pace and color, then copy it.' },
]

/** Cues whose shapes differ at a glance: one strike, two blips, a two-note chime, two hits. */
const WAVE_CUES: SoundCue[] = ['tap', 'toggleOn', 'success', 'error']

const WAVE_BARS = 24

/**
 * The default pack's waveforms for the homepage's Sound tile, from the
 * render's own measurements: the part you hear (down to 2% of the peak)
 * spread over the bars, each bar the loudest peak in its stretch.
 */
export function soundWaves(): MenuWave[] {
  return WAVE_CUES.flatMap((cue) => {
    const entry = lab.find((e) => e.cue === cue)
    const sound = entry?.variants.find((v) => v.id === entry.defaultId)
    if (!sound) return []
    const last = sound.wave.reduce((at, peak, i) => (peak >= 2 ? i : at), 0)
    const heard = sound.wave.slice(0, last + 2)
    const peaks = Array.from({ length: WAVE_BARS }, (_, i) => {
      const start = Math.floor((i * heard.length) / WAVE_BARS)
      return Math.max(...heard.slice(start, Math.max(start + 1, Math.floor(((i + 1) * heard.length) / WAVE_BARS))))
    })
    return [{ label: cueInfo[cue].label, ms: sound.ms, peaks }]
  })
}

/** The docs' sections, as the sidebar heads them (Components has its own menu, Get started is the feature card); every page is a step from one. */
const DOCS: NavEntry[] = [
  { title: 'Guides', url: '/docs/guides', description: 'Step-by-step recipes', glyph: 'guides' },
  { title: 'Visuals', url: '/docs/icons', description: 'Icons, scenes, loaders, models', glyph: 'illustrations' },
  { title: 'Motion', url: '/docs/motion', description: 'Timing, springs and primitives', glyph: 'motion' },
  { title: 'Sound', url: '/docs/sound', description: 'Interface sounds and packs', glyph: 'sound' },
]

/** Blocks' kinds, as the docs' Blocks groups run, in its one card; Create is the menu's other card. Each opens its docs group's first page (blocksLinks). */
const BLOCKS: (NavEntry & { level: Level })[] = [
  { title: 'Cards', url: '/docs/blocks/activity-and-conversations', description: 'Cards and panels for a page', glyph: 'cards', level: 'card' },
  { title: 'Sections', url: '/docs/blocks/cta', description: 'Heroes, pricing and bands', glyph: 'sections', level: 'section' },
  { title: 'Screens', url: '/docs/blocks/api-and-integrations', description: 'Whole screens to copy in', glyph: 'screens', level: 'screen' },
]

/** The visuals: the explorers and galleries. */
const VISUALS: NavEntry[] = [
  { title: 'Icons', url: '/icons', description: 'Search and copy every icon', glyph: 'icons', art: 'row-icon' },
  { title: 'Illustrations', url: '/illustrations', description: 'Browse and install scenes', glyph: 'illustrations', art: 'row-scene' },
  { title: 'Miniatures', url: '/miniatures', description: 'Small figures to drop in', glyph: 'miniatures', status: 'new', art: 'turntable' },
  { title: 'Loaders', url: '/loaders', description: 'Tune each one, then copy it', glyph: 'loaders', art: 'draft' },
]

/** Entries whose docs page exists: a page that moves drops out of the menu rather than linking to the 404. */
const existing = (entries: NavEntry[]) => entries.filter((entry) => !entry.url.startsWith('/docs') || pageAt(entry.url))

/** The docs groups of a section, each opening its first page (a group is a sidebar heading with no page of its own): Components' groups. */
function groupLinks(tree: PageTree.Root, section: string): NavColumn['links'] {
  return sectionGroups(tree, section).flatMap((group) => {
    const url = group.url ?? group.runs[0]?.urls[0]
    return url ? [[group.name, url.slice(section.length + 1)] as [string, string]] : []
  })
}

/** How much each Visuals card holds, counted from the kit so they never drift. */
function rowCounts(): Record<string, string> {
  const kit = catalog()
  const loaders = [...registryItems().values()].filter((item) => item.name.startsWith('loader-')).length
  return {
    '/icons': `${kit.icons} icons`,
    '/illustrations': `${sceneCount()} scenes`,
    '/miniatures': `${miniatures.length} objects`,
    '/loaders': `${loaders} loaders`,
  }
}

const withCounts = (entries: NavEntry[]) => {
  const counts = rowCounts()
  return entries.map((entry) => ({ ...entry, ...(counts[entry.url] && { count: counts[entry.url] }) }))
}

/** The Blocks card: each kind opens its docs group's first page, each with how many there are (taxonomy.json). */
function blocksLinks(tree: PageTree.Root): NavEntry[] {
  const counts = levelCounts()
  return BLOCKS.map(({ level, ...entry }) => ({
    ...entry,
    url: groupFirstUrl(tree, 'Blocks', entry.title) ?? entry.url,
    count: `${counts[level]} ${entry.title.toLowerCase()}`,
  }))
}

/** The header's four menus. */
function menus(tree: PageTree.Root): NavMenu[] {
  return [
    {
      id: 'docs',
      label: 'Docs',
      href: '/docs',
      links: existing(DOCS),
      // A terminal types one command and checks it off.
      feature: { title: 'Get started', url: '/docs', description: 'Install the kit and set it up.', cta: 'Start here', art: 'prompt' },
    },
    {
      id: 'components',
      label: 'Components',
      href: '/docs/components/button',
      links: [],
      columns: [{ title: 'Components', url: '/docs/components', links: groupLinks(tree, '/docs/components') }],
      // A focus ring tabs through a form: its fields, its checkbox and its button.
      feature: { title: 'Every state designed', url: '/docs/components', description: 'Accessible, animated, themeable.', cta: 'All components', art: 'tabstop' },
    },
    {
      id: 'blocks',
      label: 'Blocks',
      href: groupFirstUrl(tree, 'Blocks', 'Cards') ?? '/docs',
      links: blocksLinks(tree),
      // A gantry carries a part across the frame and sets it in place.
      feature: { title: 'Create your own', url: '/create', description: 'Pick a frame and theme, take it home.', cta: 'Create', art: 'gantry' },
    },
    {
      id: 'visuals',
      label: 'Visuals',
      links: withCounts(VISUALS),
      // The record player spins; the card opens the miniatures library.
      feature: { title: 'Miniatures', url: '/miniatures', description: 'Objects that play and open.', cta: 'Miniatures library', art: 'turntable', status: 'new' },
    },
  ]
}

/** Every page the site has: the docs, the explorers and Create. */
export function siteUrls(): string[] {
  return [
    '/',
    '/icons',
    '/illustrations',
    '/illustrations/build',
    '/loaders',
    '/miniatures',
    ...source.getPages().map((page) => page.url),
    '/create',
  ]
}

export function siteNav(): SiteNav {
  const tree = source.getPageTree()
  const theming = pageAt('/docs/theming')

  return {
    pages: pageIndex(siteUrls()),
    menus: menus(tree),
    pillars: [
      {
        id: 'ui',
        name: 'Youj UI',
        label: 'UI',
        url: pageAt('/docs/components')?.url ?? '/docs',
        blurb: 'Accessible components, every state designed.',
        stat: 'Components',
      },
      {
        id: 'motion',
        name: 'Youj Motion',
        label: 'Motion',
        url: pageAt('/docs/motion')?.url ?? '/docs',
        blurb: 'Tokens, primitives and effects on one clock.',
        stat: 'Animation tools',
      },
      {
        id: 'loaders',
        name: 'Youj Loaders',
        label: 'Loaders',
        url: pageAt('/docs/loaders')?.url ?? '/docs',
        blurb: 'Loading animations with depth, drawn from your theme.',
        stat: 'Loading animations',
      },
      {
        id: 'icons',
        name: 'Youj Icons',
        label: 'Icons',
        url: pageAt('/docs/icons')?.url ?? '/docs',
        blurb: 'Icons that move with intent.',
        stat: 'Animated icons',
      },
      {
        id: 'illustrations',
        name: 'Youj Illustrations',
        label: 'Illustrations',
        url: pageAt('/docs/illustrations')?.url ?? '/docs',
        blurb: 'Isometric scenes, drawn from your theme.',
        stat: 'Isometric scenes',
      },
      {
        id: 'sound',
        name: 'Youj Sound',
        label: 'Sound',
        url: pageAt('/docs/sound')?.url ?? '/docs',
        blurb: 'Designed sounds for every press, toggle and outcome.',
        stat: 'Interface sounds',
      },
      {
        id: 'themes',
        name: 'Youj Themes',
        label: 'Themes',
        url: theming?.url ?? '/docs',
        blurb: 'One set of tokens, every part re-themed.',
        stat: 'Theme presets',
      },
      {
        id: 'blocks',
        name: 'Youj Blocks',
        label: 'Blocks',
        // The Screens group's first page, every screen there live with its code and command; the sidebar leads to the other kinds.
        url: groupFirstUrl(tree, 'Blocks', 'Screens') ?? '/docs',
        blurb: 'Start from a whole page, not a blank file.',
        stat: 'Screens and sections',
      },
    ],
  }
}
