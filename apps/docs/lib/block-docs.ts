import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { docsUrl, type ShowcaseEntry } from './showcase.ts'

/* Where each block (card, section, screen and frame) is documented: its
 * `<BlockStory>` on a page of content/docs/blocks its only page. Read from the pages themselves, so the map can't drift
 * from them: `block` is the registry name (a block's slug), `id` the story's hash; a
 * page's first story has none, since it's where the page opens. */

const BLOCKS = join(/*turbopackIgnore: true*/ process.cwd(), 'content/docs/blocks')

let cache: Record<string, string> | undefined

/** Block registry name → its docs story URL: `/docs/blocks/cards/audio#track-arranger`. */
export function blockDocsUrls(): Record<string, string> {
  if (cache) return cache
  const out: Record<string, string> = {}
  const files = (readdirSync(BLOCKS, { recursive: true }) as string[]).filter((f) => f.endsWith('.mdx')).sort()
  for (const file of files) {
    const page = docsUrl(`blocks/${file}`)
    let first = true
    for (const [, attrs = ''] of readFileSync(join(BLOCKS, file), 'utf8').matchAll(/<BlockStory\b([^>]*)>/g)) {
      const id = /\bid="([^"]+)"/.exec(attrs)?.[1]
      const name = /\bblock="([^"]+)"/.exec(attrs)?.[1]
      if (!id || !name) throw new Error(`${file}: a <BlockStory> needs id and block`)
      // A block shown in several stories (one per state) opens at the first.
      out[name] ??= first ? page : `${page}#${id}`
      first = false
    }
  }
  cache = out
  return out
}

/** An item's page: a block's docs story. (A component's is its docs page: lib/basics.) */
export const itemHref = (entry: Pick<ShowcaseEntry, 'kind' | 'slug'>): string | undefined =>
  blockDocsUrls()[entry.slug]
