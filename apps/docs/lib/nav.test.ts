import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { VirtualFile } from 'fumadocs-core/source'
import { FEATURE_ART } from '@/components/site/feature-art'
import { activeSection } from '@/components/site/site-header'
import { EXPLORERS, siteNav, siteUrls, soundWaves } from './nav'
import { columnLinks } from './nav-links'
import { hasPage } from './page-index'
import { source } from './source'
import { sectionGroups, treeSections } from './tree'

/* The header's model, built from the real sidebar: the docs' meta.json files
 * and each page's frontmatter, through the same fumadocs loader the site uses.
 * Only the MDX compile is left out, which the pages' bodies need and the
 * navigation doesn't. */

vi.mock('./source', async () => {
  const { readFileSync, readdirSync } = await import('node:fs')
  const { join } = await import('node:path')
  const { loader } = await import('fumadocs-core/source')
  const content = join(process.cwd(), 'content/docs')
  const field = (front: string, key: string) => new RegExp(`^${key}:\\s*"?(.*?)"?\\s*$`, 'm').exec(front)?.[1]
  const files: VirtualFile[] = []
  for (const path of readdirSync(content, { recursive: true }) as string[]) {
    const text = () => readFileSync(join(content, path), 'utf8')
    if (path.endsWith('meta.json')) files.push({ type: 'meta', path, data: JSON.parse(text()) })
    if (!path.endsWith('.mdx')) continue
    const front = /^---\n([\s\S]*?)\n---/.exec(text())?.[1] ?? ''
    files.push({ type: 'page', path, data: { title: field(front, 'title'), description: field(front, 'description') } })
  }
  return { source: loader({ baseUrl: '/docs', source: { files } }) }
})

const nav = siteNav()
const menu = (id: string) => nav.menus.find((m) => m.id === id)!
const urls = (id: string) => menu(id).links.map((link) => link.url)
/** A link's page, without its fragment. */
const page = (url: string) => url.split(/[?#]/)[0]!

describe('the header', () => {
  it('has four menus: Docs, Components, Blocks and Visuals', () => {
    expect(nav.menus.map((m) => [m.id, m.label])).toEqual([
      ['docs', 'Docs'],
      ['components', 'Components'],
      ['blocks', 'Blocks'],
      ['visuals', 'Visuals'],
    ])
  })

  it('links only pages the site has', () => {
    for (const m of nav.menus) {
      for (const link of [...m.links, ...(m.columns ?? []), ...(m.columns ?? []).flatMap(columnLinks), m.feature]) {
        expect(hasPage(nav.pages, page(link.url)), link.url).toBe(true)
      }
    }
  })

  it('keeps every entry to a name and a few words, so every page’s payload stays light', () => {
    for (const m of nav.menus) {
      for (const link of m.links) expect(link.description?.length ?? 0, link.title).toBeLessThanOrEqual(32)
    }
    expect(JSON.stringify(nav.menus).length).toBeLessThan(5400)
  })
})

describe('the menus’ features', () => {
  it('give each menu its own animation, one the menu can load, never a video', () => {
    const arts = nav.menus.map((m) => m.feature.art)
    expect(arts).toEqual(['prompt', 'tabstop', 'gantry', 'turntable'])
    for (const art of arts) expect(FEATURE_ART).toContain(art)
    expect(JSON.stringify(nav.menus)).not.toMatch(/loop|promo|\.mp4|\.webm/)
  })

  it('are loaders the loaders package ships, each in the file its entry names', () => {
    const source = readFileSync(join(process.cwd(), 'components/site/feature-art.tsx'), 'utf8')
    const manifest = JSON.parse(readFileSync(join(process.cwd(), '../../packages/loaders/package.json'), 'utf8')) as { exports: Record<string, string> }
    // The Visuals cards' icon morph and scene aren't loaders (checked below).
    for (const art of FEATURE_ART.filter((a) => !['turntable', 'row-icon', 'row-scene'].includes(a))) {
      const [, component] = new RegExp(`${art}: \\(\\) => import\\('@youj/loaders/${art}'\\)\\.then\\(\\(m\\) => \\(\\{ default: m\\.(\\w+) \\}\\)\\)`).exec(source) ?? []
      expect(component, art).toBeTruthy()
      const file = readFileSync(join(process.cwd(), '../../packages/loaders', manifest.exports[`./${art}`]!), 'utf8')
      expect(file).toContain(`export function ${component}(`)
    }
  })

  it('draw the Visuals card with the turntable miniature, the miniatures package\'s own entry', () => {
    const source = readFileSync(join(process.cwd(), 'components/site/feature-art.tsx'), 'utf8')
    expect(source).toContain("import('@youj/miniatures/turntable')")
    expect(source).toContain('<m.MiniatureTurntable')
    // The Icons card morphs one icon into another; the Illustrations card is a real scene.
    expect(source).toContain('transition="morph"')
    expect(source).toContain('<m.IllustrationBackups')
  })

  it('start Docs at Get started, a command typed and checked off', () => {
    expect(menu('docs').feature).toMatchObject({ title: 'Get started', url: '/docs', art: 'prompt' })
  })
})

describe('the Docs menu', () => {
  it('lists the docs’ sections, never single pages, each with a line and a glyph', () => {
    expect(menu('docs').links.map((l) => l.title)).toEqual(['Guides', 'Visuals', 'Motion', 'Sound'])
    for (const link of menu('docs').links) {
      expect(link.description, link.title).toBeTruthy()
      expect(link.glyph, link.title).toBeTruthy()
    }
  })

  it('opens each sidebar section at its first page, Get started through the feature card', () => {
    const tree = source.getPageTree()
    const heads = treeSections(tree)
      .map((section) => section.label)
      .filter((label) => !['Components', 'Blocks'].includes(String(label)))
    expect(heads).toEqual(['Get started', 'Guides', 'Visuals', 'Motion', 'Sound'])
    expect(menu('docs').feature?.url).toBe('/docs')
    for (const url of ['/docs/guides', '/docs/icons', '/docs/motion', '/docs/sound']) {
      expect(urls('docs')).toContain(url)
    }
  })

})

describe('the Components menu', () => {
  const [components] = menu('components').columns!
  const links = columnLinks(components!)

  it('holds no more than six rows in a column, splitting a longer group across columns', () => {
    const cols = Math.ceil(components!.links.length / 6)
    expect(Math.ceil(components!.links.length / cols)).toBeLessThanOrEqual(6)
  })

  it('has one column, Components, opening its overview', () => {
    expect(menu('components').columns).toHaveLength(1)
    expect([components!.title, components!.url]).toEqual(['Components', '/docs/components'])
    expect(menu('components').links).toEqual([])
  })

  it('lists the component groups, each opening its first component, in sidebar order', () => {
    const tree = source.getPageTree()
    const groups = sectionGroups(tree, '/docs/components').map((g) => ({ title: g.name, url: g.url ?? g.runs[0]!.urls[0] }))
    expect(links).toEqual(groups)
    expect(links.slice(0, 3)).toEqual([
      { title: 'Actions', url: '/docs/components/button' },
      { title: 'Forms & inputs', url: '/docs/components/form' },
      { title: 'Overlays', url: '/docs/components/dialog' },
    ])
    for (const link of links) expect(link.url.startsWith('/docs/components/'), link.url).toBe(true)
  })

  it('links no group page, since a group has none, and features the whole list', () => {
    const all = links.map((l) => l.url)
    for (const url of ['/docs/components/actions', '/docs/components/forms', '/docs/components/overlays']) expect(all).not.toContain(url)
    expect(menu('components').feature).toMatchObject({ cta: 'All components', url: '/docs/components' })
  })
})

describe('the Blocks menu', () => {
  it('links the cards, sections and screens, each with a line, a glyph and its count (the frame is Create’s)', () => {
    expect(menu('blocks').links.map((l) => l.title)).toEqual(['Cards', 'Sections', 'Screens'])
    // Each kind opens its Blocks docs group's first page.
    const [cards, sections, screens] = menu('blocks').links
    expect(cards!.url).toBe('/docs/blocks/activity-and-conversations')
    expect(sections!.url).toBe('/docs/blocks/cta')
    expect(screens!.url).toBe('/docs/blocks/api-and-integrations')
    for (const link of menu('blocks').links) expect(hasPage(nav.pages, link.url), link.url).toBe(true)
    for (const link of menu('blocks').links) expect(link.count, link.title).toMatch(/^\d+ /)
    for (const link of menu('blocks').links) {
      expect(link.description, link.title).toBeTruthy()
      expect(link.glyph, link.title).toBeTruthy()
    }
  })

  it('features Create with the gantry', () => {
    expect(menu('blocks').feature).toMatchObject({ title: 'Create your own', cta: 'Create', url: '/create', art: 'gantry' })
  })
})

describe('the Visuals menu', () => {
  it('lists the icons, illustrations, miniatures and loaders, each with a line and a glyph, Miniatures new', () => {
    expect(menu('visuals').links.map((l) => [l.title, l.url])).toEqual([
      ['Icons', '/icons'],
      ['Illustrations', '/illustrations'],
      ['Miniatures', '/miniatures'],
      ['Loaders', '/loaders'],
    ])
    for (const link of menu('visuals').links) {
      expect(link.description, link.title).toBeTruthy()
      expect(link.glyph, link.title).toBeTruthy()
    }
    expect(menu('visuals').links[2]).toMatchObject({ status: 'new' })
    expect(menu('visuals').links[3]!.status).toBeUndefined()
  })

  it('features the miniatures library with the turntable, marked new', () => {
    expect(menu('visuals').feature).toMatchObject({ cta: 'Miniatures library', url: '/miniatures', art: 'turntable', status: 'new' })
  })
})

describe('the current section', () => {
  it('is Visuals on the explorers and galleries', () => {
    for (const url of ['/icons', '/illustrations', '/illustrations/build', '/loaders', '/miniatures']) {
      expect(activeSection(url, nav), url).toBe('visuals')
    }
  })

  it('is Components on the component pages', () => {
    for (const url of ['/docs/components', '/docs/components/button', '/docs/components/filter-chips', '/docs/components/table', '/docs/components/chat/message']) {
      expect(activeSection(url, nav), url).toBe('components')
    }
  })

  it('is Blocks on every Blocks docs page and Create', () => {
    for (const url of ['/docs/blocks/activity-and-conversations', '/docs/blocks/media', '/docs/blocks/cta', '/docs/blocks/dashboards', '/create']) {
      expect(activeSection(url, nav), url).toBe('blocks')
    }
  })

  it('is Docs on every other docs page', () => {
    for (const url of ['/docs', '/docs/guides', '/docs/theming', '/docs/choosing-a-level', '/docs/illustrations/draw-your-own']) {
      expect(activeSection(url, nav), url).toBe('docs')
    }
  })

  it('is none on the homepage or a URL the site does not have', () => {
    expect(activeSection('/', nav)).toBeUndefined()
    expect(activeSection('/docsy', nav)).toBeUndefined()
    expect(activeSection('/docs/motion/does-not-exist', nav)).toBeUndefined()
    expect(activeSection('/cards/not-a-card', nav)).toBeUndefined()
    // The retired lists are redirects now, not pages.
    for (const url of ['/cards', '/sections', '/screens', '/components', '/frames/frame-shell']) expect(activeSection(url, nav), url).toBeUndefined()
  })
})

describe('the homepage’s Sound tile', () => {
  it('draws the default pack’s own cues, from the render’s measurements, never numbers written down', () => {
    const waves = soundWaves()
    expect(waves.map((w) => w.label)).toEqual(['Tap', 'Toggle on', 'Success', 'Error'])
    for (const wave of waves) {
      expect(wave.peaks).toHaveLength(24)
      expect(Math.max(...wave.peaks)).toBe(100)
      for (const peak of wave.peaks) expect(peak).toBeGreaterThanOrEqual(0)
      expect(wave.ms).toBeGreaterThan(0)
    }
  })
})

describe('the explorers in ⌘K', () => {
  it('names each to stand on its own, at the menus’ URLs', () => {
    expect(EXPLORERS).toMatchObject([
      { title: 'Icons explorer', url: '/icons' },
      { title: 'Morph Lab', url: '/icons?view=lab' },
      { title: 'Illustrations explorer', url: '/illustrations' },
      { title: 'Illustration builder', url: '/illustrations/build', status: 'experimental' },
      { title: 'Loaders gallery', url: '/loaders' },
    ])
  })
})

describe('the family', () => {
  it('has eight parts: Loaders after Motion, Illustrations and Sound after Icons, and Blocks last', () => {
    expect(nav.pillars.map((p) => p.id)).toEqual(['ui', 'motion', 'loaders', 'icons', 'illustrations', 'sound', 'themes', 'blocks'])
    expect(nav.pillars.find((p) => p.id === 'illustrations')).toMatchObject({
      name: 'Youj Illustrations',
      label: 'Illustrations',
      url: '/docs/illustrations',
      stat: 'Isometric scenes',
    })
    expect(nav.pillars.find((p) => p.id === 'sound')).toMatchObject({ name: 'Youj Sound', label: 'Sound', url: '/docs/sound', stat: 'Interface sounds' })
  })

  it('marks no part experimental, Loaders included', () => {
    expect(nav.pillars.find((p) => p.id === 'loaders')).toMatchObject({ label: 'Loaders', stat: 'Loading animations' })
    expect(nav.pillars.filter((p) => p.status).map((p) => p.id)).toEqual([])
  })

  it('names Blocks for starting from a whole page, and opens the Screens docs', () => {
    expect(nav.pillars.find((p) => p.id === 'blocks')).toMatchObject({
      label: 'Blocks',
      url: '/docs/blocks/api-and-integrations',
      blurb: 'Start from a whole page, not a blank file.',
      stat: 'Screens and sections',
    })
  })

  it('opens each part’s docs (Blocks the Screens group’s first page), from the homepage, the footer and ⌘K alike', () => {
    expect(nav.pillars.map((p) => p.url)).toEqual([
      '/docs/components',
      '/docs/motion',
      '/docs/loaders',
      '/docs/icons',
      '/docs/illustrations',
      '/docs/sound',
      '/docs/theming',
      '/docs/blocks/api-and-integrations',
    ])
    for (const pillar of nav.pillars) expect(hasPage(nav.pages, pillar.url), pillar.url).toBe(true)
  })

  it('keeps counts out of the parts’ copy', () => {
    for (const pillar of nav.pillars) expect(`${pillar.blurb} ${pillar.stat}`).not.toMatch(/\d/)
  })
})

describe('the ladder in the site’s pages', () => {
  it('has no page of a retired gallery', () => {
    const urls = new Set(siteUrls())
    for (const url of ['/docs/components/button', '/docs/blocks/dashboards', '/docs/blocks/landing']) expect(urls.has(url), url).toBe(true)
    // The Frames pages are gone: the frame is built in Create.
    for (const url of ['/docs/blocks/app-frame', '/docs/blocks/sidebars', '/docs/blocks/pages']) expect(urls.has(url), url).toBe(false)
    // The lists, their categories and the items' own pages redirect to the docs.
    for (const url of ['/cards', '/sections', '/screens', '/frames', '/components', '/components/overlays', '/cards/monitoring-and-incidents', '/frames/frame-topbar-tabs', '/screens/marketing-landing', '/cards/app-percentile-trend']) {
      expect(urls.has(url), url).toBe(false)
    }
    for (const url of urls) expect(url, url).not.toMatch(/^\/(blocks|examples|cards|sections|screens|frames|components)(\/|$)/)
  })
})
