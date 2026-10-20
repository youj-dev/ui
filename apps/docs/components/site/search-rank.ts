import type { SortedResult } from 'fumadocs-core/search'
import { blockGroupOf } from '@/lib/block-groups'

/* The palette's ranking, apart from its component: what the index is asked (searchTerms, splits) and how its results are ordered and grouped. */

/** The docs spell the American way. */
const AMERICAN: Record<string, string> = { colour: 'color', colours: 'colors', grey: 'gray', behaviour: 'behavior', centre: 'center', licence: 'license', customise: 'customize', favourite: 'favorite' }

const FILLER = new Set(['how', 'do', 'does', 'i', 'a', 'an', 'the', 'to', 'my', 'can', 'what', 'is', 'are', 'should'])

/**
 * The query the index is asked: lowercase, a question's filler words dropped, British spellings American, and a
 * long word's plural "s" off. The index matches prefixes, so "color" still
 * finds "colors", and now "Color" too.
 */
export function searchTerms(q: string): string {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean)
  // A question's filler ("how do i install") would mark single letters all over the results.
  const content = words.filter((word) => !FILLER.has(word))
  return (content.length > 0 ? content : words)
    .map((word) => {
      const w = AMERICAN[word] ?? word
      return w.length > 4 && /[^s]s$/.test(w) ? w.slice(0, -1) : w
    })
    .join(' ')
}

/** A single long word as two, at every point that leaves both halves three letters or more: "datepiker" → …, "date piker", … */
export function splits(word: string): string[] {
  if (/\s/.test(word) || word.length < 7) return []
  return Array.from({ length: word.length - 5 }, (_, i) => `${word.slice(0, i + 3)} ${word.slice(i + 3)}`)
}

export type Result = SortedResult

/** A word's stem, roughly: "themes", "theming" and "theme" are all "them"; "easings" and "easing" are "eas". */
function stem(word: string): string {
  if (word.length <= 4) return word
  return word.replace(/s$/, '').replace(/(ing|e)$/, '')
}

const stems = (text: string) =>
  text
    .replace(/<\/?mark>/g, '')
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .map(stem)

/**
 * How well a text names the query, word by word (each query word a prefix of
 * one of its words, stems compared): 0 the same words, 1 it starts with them,
 * 2 it holds them in a row, 3 it holds them all, 4 some of them, 5 none.
 */
function nameRank(text: string, query: string[]): number {
  const t = stems(text)
  if (query.length === 0) return 5
  const at = (i: number) => query.every((q, j) => t[i + j]?.startsWith(q))
  if (t.length === query.length && at(0)) return 0
  if (at(0)) return 1
  if (t.some((_, i) => at(i))) return 2
  const hits = query.filter((q) => t.some((word) => word.startsWith(q))).length
  return hits === query.length ? 3 : hits > 0 ? 4 : 5
}

/** Whether two words are at most one edit apart: "piker" and "picker". */
function oneEdit(a: string, b: string): boolean {
  if (a === b) return true
  if (Math.abs(a.length - b.length) > 1) return false
  let i = 0
  while (a[i] === b[i]) i++
  if (a.length === b.length) return a.slice(i + 1) === b.slice(i + 1)
  return a.length > b.length ? a.slice(i + 1) === b.slice(i) : a.slice(i) === b.slice(i + 1)
}

/**
 * How well the best result title holds every word of the query: 0 each as a
 * prefix, one more per word that's a typo off ("piker" in "Date Picker"),
 * Infinity when no title holds them all.
 */
export function titleFit(results: readonly Result[], terms: string): number {
  const query = stems(terms)
  const cost = (q: string, title: string[]) => (title.some((t) => t.startsWith(q)) ? 0 : title.some((t) => oneEdit(q, t) || oneEdit(q, t.slice(0, q.length))) ? 1 : Infinity)
  return Math.min(Infinity, ...results.filter((r) => r.type === 'page').map((r) => query.reduce((sum, q) => sum + cost(q, stems(String(r.content))), 0)))
}

/** The words the index marked in a page's hits, stemmed. */
const marked = (items: readonly Result[]) => items.flatMap((item) => [...String(item.content).matchAll(/<mark>([\s\S]*?)<\/mark>/g)].flatMap((m) => stems(m[1]!)))

/** The groups results list under, by level and then the rest: the same order as the ladder. */
export const RESULT_GROUPS = ['Components', 'Cards', 'Sections', 'Screens', 'Specialized', 'Create', 'Visuals', 'Docs'] as const
export type ResultGroup = (typeof RESULT_GROUPS)[number]

/** Where a result's page lives, from its URL: a Blocks docs page under its group (Cards, Sections, Screens, Specialized), Create (the app frame builder) on its own, the icons, illustrations, loaders and miniatures under Visuals, the other pages under Docs. */
export function resultGroup(url: string): ResultGroup {
  const path = url.split(/[?#]/)[0]!
  const within = (base: string) => path === base || path.startsWith(`${base}/`)
  if (within('/docs/components') || within('/components')) return 'Components'
  const block = blockGroupOf(path)
  if (block && (RESULT_GROUPS as readonly string[]).includes(block)) return block as ResultGroup
  if (within('/create')) return 'Create'
  if (within('/icons') || within('/illustrations') || within('/loaders') || within('/miniatures')) return 'Visuals'
  return 'Docs'
}

interface RankedPage {
  score: number
  items: Result[]
}

/**
 * The index ranks by content, so "button" finds every page that mentions a
 * button first. Groups each page with its headings and excerpts, then orders
 * the pages by how well their title names the query (a heading that names it
 * counts next, so "easing" finds the Easings section ahead of pages that
 * only mention it); the index's order breaks ties. At most two excerpts a page.
 */
function rankPages(results: readonly Result[], q: string): RankedPage[] {
  const query = stems(q)
  const groups: { title: number; heading: number; items: Result[] }[] = []
  const byPage = new Map<string, (typeof groups)[number]>()
  let last: { key: string; group: (typeof groups)[number] } | undefined
  for (const item of results) {
    const key = String(item.url).split('#')[0]!
    // Each page comes with its own hits after it, and two can share a path (a block's first story opens the Blocks page it's on):
    // a page whose path already has one starts a group of its own, and a hit joins the page it follows.
    let group = item.type !== 'page' && last?.key === key ? last.group : byPage.get(key)
    if (!group || (item.type === 'page' && group.items[0]?.type === 'page')) {
      group = { title: 5, heading: 5, items: [] }
      if (!byPage.has(key)) byPage.set(key, group)
      groups.push(group)
    }
    last = { key, group }
    if (item.type === 'page') {
      group.title = nameRank(String(item.content), query)
      group.items.unshift(item)
    } else {
      if (item.type === 'heading') group.heading = Math.min(group.heading, nameRank(String(item.content), query))
      group.items.push(item)
    }
  }
  // Titles that hold every word lead; then a heading that does (the closer, the sooner; one that is or starts with the query
  // counts the same, and the page with more hits goes first, so "colors" finds Theming's "Colors per mode" ahead of a
  // component's "Colors" prop); then a page whose hits hold every word between them ("login form": the auth flow names its
  // Login page and its form); then a title with some of them; then the rest.
  const covers = (g: (typeof groups)[number]) => query.length > 1 && query.every((q) => marked(g.items).some((word) => word.startsWith(q)))
  const score = (g: (typeof groups)[number]) =>
    g.title <= 3 ? g.title : g.heading <= 3 ? 4 + Math.max(0, g.heading - 1) / 10 : covers(g) ? 4.5 : g.title === 4 ? 5 : 6
  const byHeading = (s: number) => s >= 4 && s < 4.5
  return groups
    .map((g, i) => ({ g, i, score: score(g) }))
    .sort((a, b) => a.score - b.score || (byHeading(a.score) ? b.g.items.length - a.g.items.length : 0) || a.i - b.i)
    .map(({ g, score }) => {
      // Under its page, a heading that names the query comes before the excerpts.
      const named = (item: Result) => (item.type === 'heading' && nameRank(String(item.content), query) <= 3 ? 0 : 1)
      const [head, ...rest] = g.items
      return { score, items: head?.type === 'page' ? [head, ...rest.sort((a, b) => named(a) - named(b)).slice(0, 2)] : g.items.slice(0, 2) }
    })
}

/** Every page in rank order, each with its headings and excerpts. */
export function rankResults(results: readonly Result[], q: string): Result[] {
  return rankPages(results, q).flatMap((page) => page.items)
}

/**
 * The same pages, listed by level: Primitives, Patterns, Cards, Sections,
 * Pages, then the docs, a result under the level its page
 * is on. A page stays in rank order within its group, and the group holding
 * the best match leads (the ladder's order breaks ties), so a query that
 * names a docs page isn't buried under components that only mention it.
 */
export function groupResults(results: readonly Result[], q: string): { group: ResultGroup; items: Result[] }[] {
  const buckets = new Map<ResultGroup, { score: number; items: Result[] }>()
  for (const page of rankPages(results, q)) {
    const group = resultGroup(String(page.items[0]?.url ?? ''))
    const bucket = buckets.get(group)
    if (bucket) bucket.items.push(...page.items)
    else buckets.set(group, { score: page.score, items: [...page.items] })
  }
  return [...buckets]
    .sort(([a, x], [b, y]) => x.score - y.score || RESULT_GROUPS.indexOf(a) - RESULT_GROUPS.indexOf(b))
    .map(([group, { items }]) => ({ group, items }))
}
