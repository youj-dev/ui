// @vitest-environment node
import { blockDocsUrls } from './block-docs'
import { block, blocks } from './showcase'
import { illustrations } from '@youj/illustrations'
import { createSearchAPI, type AdvancedIndex } from 'fumadocs-core/search/server'
import { rankResults, searchTerms } from '@/components/site/search-rank'
import { illustrationIndexes, showcaseIndexes, sitePageIndexes, withAliases } from './search-index'

describe('the blocks in the search index', () => {
  const indexes = showcaseIndexes()
  const byId = new Map(indexes.map((i) => [i.id, i]))
  const story = blockDocsUrls()

  it('holds every block at its docs story, each once, and no retired list', () => {
    for (const b of blocks().filter((x) => !x.partOf && x.level !== 'frame')) expect(byId.get(`blocks/${b.slug}`)?.url, b.slug).toBe(story[b.slug])
    expect(new Set(indexes.map((i) => i.id)).size).toBe(indexes.length)
    expect(indexes.filter((i) => /^\/(blocks|cards|sections|screens|frames)(\/|$)/.test(i.url) || /^\/components(\/|$)/.test(i.url)).map((i) => i.url)).toEqual([])
  })

  it('files each item under its level and its category', () => {
    const trail = (id: string) => byId.get(id)!.breadcrumbs
    expect(trail('blocks/app-percentile-trend')).toEqual(['Cards', 'Trends & comparisons'])
    expect(trail('blocks/marketing-hero-split')).toEqual(['Sections', 'Hero'])
    expect(trail('blocks/app-settings')).toEqual(['Screens', 'Settings & account'])
  })

  it('leaves the frame’s parts out: they are Create’s, which is a result of its own', () => {
    expect([...byId.keys()].filter((id) => id.startsWith('blocks/frame-'))).toEqual([])
    expect(byId.get('/create')?.url).toBe('/create')
  })

  it('makes an item findable by its description and what it is built with, under its category', () => {
    const flow = byId.get('blocks/app-auth-flow')!
    expect(flow.breadcrumbs).toEqual(['Screens', 'Onboarding & auth'])
    const text = flow.structuredData.contents.map((c) => c.content).join(' ')
    expect(text).toMatch(/Built with .*Button/)
  })

  it('finds sign-in as the auth flow, not as its separate pages', () => {
    expect(byId.has('blocks/auth-login')).toBe(false)
    expect(byId.has('blocks/auth-two-factor')).toBe(false)
    // Its pages are named in its text, so "login" finds it.
    const text = byId.get('blocks/app-auth-flow')!.structuredData.contents.map((c) => c.content).join(' ')
    expect(text).toMatch(/Pages: .*Login/)
  })
})

describe('the illustrations in the search index', () => {
  const indexes = illustrationIndexes()
  const byUrl = new Map(indexes.map((i) => [i.url, i]))

  it('holds the explorer, and each scene opening it on that scene, under its category', () => {
    expect(byUrl.has('/illustrations')).toBe(true)
    for (const scene of illustrations) expect(byUrl.has(`/illustrations?scene=${scene.id}`)).toBe(true)
    const coffee = byUrl.get('/illustrations?scene=coffee')!
    expect(coffee).toMatchObject({ title: 'Coffee', breadcrumbs: ['Illustrations', 'Food'] })
    // Found by what it shows and by its tags.
    const text = coffee.structuredData.contents.map((c) => c.content).join(' ')
    expect(text).toMatch(/cup of coffee/)
    expect(text).toMatch(/Tags: .*cafe/)
  })

  it('is in the showcase index the search route serves', () => {
    const urls = new Set(showcaseIndexes().map((i) => i.url))
    expect(urls.has('/illustrations')).toBe(true)
    expect(urls.has('/illustrations?scene=deploy')).toBe(true)
  })
})

describe('the site pages in the search index', () => {
  const byUrl = new Map(sitePageIndexes().map((i) => [i.url, i]))

  it('holds the FAQ, the changelog and About & support', () => {
    expect([...byUrl.keys()]).toEqual(['/faq', '/changelog', '/about', '/roadmap', '/security'])
  })

  it('makes each FAQ question and each release a heading, so a result lands on its anchor', () => {
    const faq = byUrl.get('/faq')!
    expect(faq.structuredData.headings).toContainEqual({ id: 'react-18', content: 'Does it support React 18?' })
    expect(faq.structuredData.contents.find((c) => c.heading === 'react-18')?.content).toMatch(/\^19/)
    expect(byUrl.get('/changelog')!.structuredData.headings.map((h) => h.id)).toContain('v0-1-0')
  })
})

test('the marketing landing composition is a block: one screen, no navigation of its own', () => {
  const landing = block('marketing-landing')
  expect(landing).toMatchObject({ title: 'Landing page', group: 'Marketing', storyFile: 'packages/ui/src/blocks/marketing/landing.stories.tsx' })
  expect(landing?.stack).toContain('marketing-hero-centered')
  expect(landing?.components.map((c) => c.name)).toContain('button')
})

describe('plain-word queries in the search', () => {
  const doc = (title: string, text: string, aliases?: string[]): AdvancedIndex => ({
    id: `/docs/${title}`,
    url: `/docs/${title.toLowerCase().replace(/ /g, '-')}`,
    title,
    description: text,
    structuredData: withAliases({ headings: [], contents: [{ heading: undefined, content: text }] }, aliases),
  })
  const ring = ['progress ring', 'circular progress']
  const docs = [
    doc('Multi-Language Input', 'Edit text in several languages, with a progress indicator while it saves.'),
    doc('Spinner', 'Show that work is running during a short wait.'),
    doc('Progress', 'Show how far a task has progressed.', ring),
    doc('Activity Rings', 'Show a few goals side by side as concentric rings.', ring),
    doc('Share Ring', 'Show how a total divides into parts.', ring),
    doc('Gauge', 'Show a score on a fine half-ring scale.', ring),
    doc('Dialog', 'Focus on a short task in a window.', ['modal']),
    doc('Installation', 'Set up Youj in your React app with the CLI or install it by hand.'),
  ]
  const urls = async (query: string) => {
    const api = createSearchAPI('advanced', { indexes: [...docs, ...sitePageIndexes()], sort: { enabled: false } })
    const terms = searchTerms(query)
    return rankResults(await api.search(terms, { limit: 160 }), terms)
      .filter((r) => r.type === 'page')
      .map((r) => String(r.url))
  }

  it('finds the ring components for “progress ring” and “circular progress”', async () => {
    for (const query of ['progress ring', 'circular progress']) {
      const top = (await urls(query)).slice(0, 4)
      for (const page of ['activity-rings', 'share-ring', 'gauge', 'progress']) expect(top, `${query}: ${page}`).toContain(`/docs/${page}`)
    }
  })

  it('finds Dialog for “modal”', async () => {
    expect((await urls('modal'))[0]).toBe('/docs/dialog')
  })

  it('puts Installation first for “install” and “how do i install”', async () => {
    expect((await urls('install'))[0]).toBe('/docs/installation')
    expect((await urls('how do i install'))[0]).toBe('/docs/installation')
  })
})
