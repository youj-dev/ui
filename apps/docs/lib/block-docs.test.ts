// @vitest-environment node
import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { blockDocsUrls, itemHref } from './block-docs'
import { docsUrl, blocks } from './showcase'
import { taxonomy } from './taxonomy'

/* Every block (card, section and screen) is documented in a story of
 * content/docs/blocks, its only page; the frame's parts are Create's and have
 * none. The map is read from those pages, so these hold it to them. */

const pages = new Set((readdirSync(join(process.cwd(), 'content/docs'), { recursive: true }) as string[]).filter((f) => f.endsWith('.mdx')).map(docsUrl))
const story = blockDocsUrls()

describe('where the blocks are documented', () => {
  it('gives every block a docs story, its own parts (the auth pages) included', () => {
    expect(blocks().length).toBeGreaterThan(200)
    expect(blocks().filter((b) => b.level !== 'frame' && !story[b.slug]).map((b) => b.slug)).toEqual([])
  })

  it('points each at a docs page that exists: its first story on the page itself, the others on their id', () => {
    for (const [name, url] of Object.entries(story)) {
      expect(pages.has(url.split('#')[0]!), `${name}: ${url}`).toBe(true)
      expect(url.startsWith('/docs/blocks/'), url).toBe(true)
    }
    expect(story['media-dropzone']).toBe('/docs/blocks/media')
    expect(story['app-chapter-player']).toBe('/docs/blocks/specialized#chapter-player')
  })

  it('documents nothing but cards, sections and screens', () => {
    const level = (name: string) => taxonomy().items[name]?.level
    expect(Object.keys(story).filter((name) => !['card', 'section', 'screen'].includes(level(name)!))).toEqual([])
  })

  it('leaves the frame’s parts to Create: they install with its export, and have no page', () => {
    const frames = blocks().filter((b) => b.level === 'frame')
    expect(frames.length).toBeGreaterThanOrEqual(17)
    for (const b of frames) expect(story[b.slug], b.slug).toBeUndefined()
  })

  it('gives each item its page: a block its story', () => {
    expect(itemHref({ kind: 'blocks', slug: 'app-chapter-player' })).toBe('/docs/blocks/specialized#chapter-player')
    expect(itemHref({ kind: 'blocks', slug: 'marketing-landing' })).toBe(story['marketing-landing'])
  })
})
