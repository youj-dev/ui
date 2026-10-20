import { createSearchAPI, type AdvancedIndex } from 'fumadocs-core/search/server'
import { showcaseIndexes, sitePageIndexes, withAliases } from '@/lib/search-index'
import { sectionTrail } from '@/lib/sections'
import { source } from '@/lib/source'

type Page = ReturnType<typeof source.getPages>[number]

function docsIndex(page: Page): AdvancedIndex {
  return {
    id: page.url,
    url: page.url,
    title: page.data.title ?? page.slugs.at(-1) ?? page.url,
    description: page.data.description,
    // Where the page is filed, as its eyebrow says it: "Components / Forms & inputs".
    breadcrumbs: sectionTrail(page.slugs),
    structuredData: withAliases(trimmed(page.data.structuredData), page.data.aliases),
  }
}

/** The index is downloaded whole on the first search. Headings stay complete; each paragraph keeps its opening, which is where a page says what it is. */
const EXCERPT = 240
function trimmed(data: Page['data']['structuredData']): Page['data']['structuredData'] {
  return { headings: data.headings, contents: data.contents.map((c) => ({ ...c, content: c.content.length > EXCERPT ? c.content.slice(0, EXCERPT) : c.content })) }
}

// Exported once at build time as a static file; the dialog searches it in the browser.
export const revalidate = false
export const { staticGET: GET } = createSearchAPI('advanced', {
  indexes: () => [...source.getPages().map(docsIndex), ...showcaseIndexes(), ...sitePageIndexes()],
  // Results are ranked by score and grouped by page, never sorted by a field: the sort indexes were a quarter of the download.
  sort: { enabled: false },
})
