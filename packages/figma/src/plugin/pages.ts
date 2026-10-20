import { message } from './steps'
import { keyOf, tag } from './store'

/* Pages. The kit wants nine; a Starter team file allows three (drafts have
 * no page limit). When Figma refuses a page, the kit folds into three pages
 * (Youj for the cover and foundations, Icons for icons and illustrations,
 * Components for components and blocks) and lays the sheets side by side instead. */

export type SheetKey = 'cover' | 'colour' | 'type' | 'layout' | 'motion' | 'icons' | 'illustrations' | 'components' | 'blocks'

export const SHEETS: SheetKey[] = ['cover', 'colour', 'type', 'layout', 'motion', 'icons', 'illustrations', 'components', 'blocks']

const FULL: Record<SheetKey, string> = {
  cover: 'Cover',
  colour: 'Colour',
  type: 'Type',
  layout: 'Spacing & radius',
  motion: 'Motion',
  icons: 'Icons',
  illustrations: 'Illustrations',
  components: 'Components',
  blocks: 'Blocks',
}

const COMPACT: Record<SheetKey, string> = {
  cover: 'Youj',
  colour: 'Youj',
  type: 'Youj',
  layout: 'Youj',
  motion: 'Youj',
  icons: 'Icons',
  illustrations: 'Icons',
  components: 'Components',
  blocks: 'Components',
}

const pageKey = (name: string) => `page:${name}`

export interface Pages {
  compact: boolean
  page(sheet: SheetKey): PageNode
  /** Where a sheet sits among the sheets sharing its page (0 for the first). */
  slot(sheet: SheetKey): number
  summary: string[]
}

const PAGE_LIMIT = /only comes with (\d+) pages?|page limit|limited to \d+ pages?/i

/** Figma's wording varies by version, so a refusal once the file has Starter's three pages counts as the cap too. */
export function isPageLimit(error: unknown, pages = 0): boolean {
  return PAGE_LIMIT.test(message(error)) || pages >= 3
}

/** Finds or makes the kit's pages. A new file's single empty page is taken over as the first. */
export async function ensurePages(): Promise<Pages> {
  const kitPages = () => figma.root.children.filter((p) => keyOf(p).startsWith('page:'))
  const wasCompact = kitPages().some((p) => keyOf(p) === pageKey('Youj'))
  let compact = wasCompact
  const created: PageNode[] = []

  const layout = () => (compact ? COMPACT : FULL)
  const names = () => [...new Set(SHEETS.map((s) => layout()[s]))]

  const claim = async (name: string): Promise<PageNode> => {
    const existing = kitPages().find((p) => keyOf(p) === pageKey(name))
    if (existing) return existing
    const pages = figma.root.children
    const lone = pages.length === 1 && !keyOf(pages[0]!) ? pages[0]! : undefined
    if (lone) {
      await lone.loadAsync()
      if (lone.children.length === 0) {
        lone.name = name
        return tag(lone, pageKey(name))
      }
    }
    const page = figma.createPage()
    created.push(page)
    page.name = name
    return tag(page, pageKey(name))
  }

  const map = new Map<string, PageNode>()
  const summary: string[] = []
  try {
    for (const name of names()) map.set(name, await claim(name))
  } catch (error) {
    if (compact || !isPageLimit(error, figma.root.children.length)) throw error
    // Fold into three pages: re-key what exists instead of adding more.
    compact = true
    const existing = [...map.values()]
    map.clear()
    names().forEach((name, i) => {
      const page = existing[i]
      if (page) {
        page.name = name
        map.set(name, tag(page, pageKey(name)))
      }
    })
    for (const page of existing.slice(names().length)) if (created.includes(page)) page.remove()
    // A file already near its limit gets fewer pages: what doesn't fit shares the last one that did.
    for (const name of names()) {
      if (map.has(name)) continue
      try {
        map.set(name, await claim(name))
      } catch (e) {
        if (!isPageLimit(e, figma.root.children.length)) throw e
        const claimed = [...map.values()]
        const last = claimed[claimed.length - 1] ?? figma.currentPage
        map.set(name, last)
        summary.push(`${name} shares the page ${last.name}: this file has no room for another page.`)
      }
    }
  }
  const used = [...new Set(map.values())]
  summary.unshift(
    compact
      ? `Pages: ${used.length} (${used.map((p) => p.name).join(', ')}). This file allows three pages; drafts allow more.`
      : `Pages: ${used.length} (${used.map((p) => p.name).join(', ')})`,
  )
  // Pages from the other layout (a file that moved between plans) are left for you to delete.
  const stale = kitPages().filter((p) => !used.includes(p))
  if (stale.length) summary.push(`Pages from an earlier layout, safe to delete: ${stale.map((p) => p.name).join(', ')}`)

  const page = (sheet: SheetKey) => map.get(layout()[sheet])!
  return {
    compact,
    page,
    // Sheets sharing a page sit side by side, in the kit's order.
    slot: (sheet) => SHEETS.filter((s) => page(s) === page(sheet)).indexOf(sheet),
    summary,
  }
}
