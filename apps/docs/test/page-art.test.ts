// @vitest-environment node
import { readFileSync, readdirSync } from 'node:fs'
import { join, posix } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isPageArt, PAGE_ARTS } from '@/lib/page-art'

/* Get started and Guides open with a picture before any words: a <PageArt>
 * band under the title, or a picture of the page's own where it has one
 * (OWN_PICTURE). Parity with the section overviews, which open with their
 * topic loops. */

const content = fileURLToPath(new URL('../content/docs', import.meta.url))
const read = (file: string) => readFileSync(join(content, file), 'utf8')

/** The Get started pages, as the sidebar lists them: the root meta.json's pages between its first two separators, with each group folder's (`(theming)/meta.json` names `../theming`) in its place. */
function getStarted(): string[] {
  const pages = (JSON.parse(read('meta.json')) as { pages: string[] }).pages
  const start = pages.indexOf('---Get started---')
  const end = pages.findIndex((page, i) => i > start && page.startsWith('---'))
  return pages
    .slice(start + 1, end)
    .flatMap((page) => (page.startsWith('(') ? (JSON.parse(read(`${page}/meta.json`)) as { pages: string[] }).pages.map((name) => posix.join(page, name)) : [page]))
    .map((page) => `${page}.mdx`)
}

const guides = readdirSync(join(content, 'guides'))
  .filter((file) => file.endsWith('.mdx'))
  .map((file) => `guides/${file}`)
// Using with shadcn is a Guides row, a page at the root.
const pages = [...getStarted(), 'shadcn-registry.mdx', ...guides]

/** Pages that open with a picture of their own (the block they start with), and why a band would only bunch up with it. */
const OWN_PICTURE: Record<string, { opens: string; why: string }> = {
  'theming.mdx': { opens: '<TopicLoop topic="themes" />', why: 'the themes film already leads the page' },
  'looks.mdx': { opens: '<LookComparison />', why: 'Bezel and Classic side by side is the page in one picture' },
  'backdrops.mdx': { opens: '<BackdropGallery />', why: 'the six backdrops, live, are the page in one picture' },
  'index.mdx': { opens: '<ComponentPreview name="intro/upload-dialog" />', why: 'a live demo, an upload dialog finishing, opens the docs; its band sits lower, as a break between the package cards and the sections' },
}

/** The page's blocks after its frontmatter, trimmed, blank-line separated. */
const blocks = (text: string) =>
  text
    .replace(/^---\n[\s\S]*?\n---\n/, '')
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)

describe('page art', () => {
  it('finds the Get started and Guides pages', () => {
    expect(pages).toContain('index.mdx')
    expect(pages).toContain('installation.mdx')
    expect(pages).toContain('guides/i18n.mdx')
    expect(pages.length).toBeGreaterThanOrEqual(12)
  })

  it('opens every Get started and Guides page with a picture', () => {
    const bare = pages.filter((file) => {
      const first = blocks(read(file))[0] ?? ''
      const own = OWN_PICTURE[file]
      return own ? first !== own.opens : !/^<PageArt art="[^"]+" \/>$/.test(first)
    })
    expect(bare).toEqual([])
  })

  it('names only compositions that exist, and draws each of them somewhere', () => {
    const named = pages.flatMap((file) => [...read(file).matchAll(/<PageArt\s+art="([^"]+)"/g)].map((m) => m[1]!))
    expect(named.filter((art) => !isPageArt(art))).toEqual([])
    expect(PAGE_ARTS.filter((art) => !named.includes(art))).toEqual([])
  })

  it('follows each band with a few words of text, before the next picture or preview', () => {
    // As with a topic loop: a band straight into a graphic or a preview reads as one bunched picture.
    const bunched = pages.flatMap((file) => {
      if (OWN_PICTURE[file]) return []
      const list = blocks(read(file))
      const at = list.findIndex((block) => block.startsWith('<PageArt'))
      if (at === -1) return []
      const next = list[at + 1] ?? ''
      return /^(<|\{|#|\||-|>|```)/.test(next) || !/[a-z]{3}/i.test(next) ? [`${file}: ${next.split('\n')[0]}`] : []
    })
    expect(bunched).toEqual([])
  })
})
