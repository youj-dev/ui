import { ITEMS, PEOPLE, POPULAR, TYPES, UPDATED, type Person, type ResultType, type SearchItem, type Updated } from './data'

type People = Record<string, Person>

/* The search itself, kept pure so it runs the same on a server: the state
 * as a URL query string and back, matching and ranking, facet counts that
 * leave the facet's own selection out (so picking "Documents" still shows
 * how many people match), highlighting, and a "did you mean" over the
 * index's own words. */

export type Sort = 'relevance' | 'recent' | 'title'

export const SORTS: Record<Sort, string> = { relevance: 'Best match', recent: 'Last updated', title: 'Title A–Z' }

export interface SearchState {
  q: string
  types: ResultType[]
  owners: string[]
  tags: string[]
  updated: Updated
  sort: Sort
  /** Pages of results shown (load more). */
  page: number
}

export const PAGE_SIZE = 8

export const EMPTY_STATE: SearchState = { q: '', types: [], owners: [], tags: [], updated: 'any', sort: 'relevance', page: 1 }

const list = (params: URLSearchParams, key: string) => (params.get(key) ?? '').split(',').filter(Boolean)

/** Reads a query string ("?q=onboarding&type=document"), dropping values it doesn't know. */
export function parseSearch(search: string, people: People = PEOPLE): SearchState {
  const params = new URLSearchParams(search)
  const updated = params.get('updated')
  const sort = params.get('sort')
  const page = Number(params.get('page'))
  return {
    q: (params.get('q') ?? '').trim(),
    types: list(params, 'type').filter((t): t is ResultType => TYPES.some((x) => x.value === t)),
    owners: list(params, 'owner').filter((o) => o in people),
    tags: list(params, 'tag'),
    updated: UPDATED.some((u) => u.value === updated) ? (updated as Updated) : 'any',
    sort: sort && sort in SORTS ? (sort as Sort) : 'relevance',
    page: Number.isInteger(page) && page > 1 ? page : 1,
  }
}

const enc = (value: string) => encodeURIComponent(value).replace(/%20/g, '+')

/** The state as a readable query string: defaults left out, lists comma-separated. */
export function toSearch(state: SearchState): string {
  const parts: [string, string][] = []
  if (state.q) parts.push(['q', enc(state.q)])
  if (state.types.length) parts.push(['type', state.types.map(enc).join(',')])
  if (state.owners.length) parts.push(['owner', state.owners.map(enc).join(',')])
  if (state.updated !== 'any') parts.push(['updated', state.updated])
  if (state.tags.length) parts.push(['tag', state.tags.map(enc).join(',')])
  if (state.sort !== 'relevance') parts.push(['sort', state.sort])
  if (state.page > 1) parts.push(['page', String(state.page)])
  return parts.length ? `?${parts.map(([k, v]) => `${k}=${v}`).join('&')}` : ''
}

export const terms = (q: string) => q.toLowerCase().split(/\s+/).filter(Boolean)

function fields(item: SearchItem, people: People = PEOPLE): string[] {
  const owner = people[item.owner] ?? { name: item.owner, role: '', team: '', location: '' }
  switch (item.type) {
    case 'document':
      return [...item.path, item.excerpt, owner.name]
    case 'person':
      return [owner.role, owner.team, owner.location, item.bio]
    case 'project':
      return [item.summary, owner.name, item.status === 'done' ? 'shipped' : '']
  }
}

/** 0 when some term is missing; otherwise higher for title and tag hits. */
export function score(item: SearchItem, words: string[], people: People = PEOPLE): number {
  const title = item.title.toLowerCase()
  const rest = fields(item, people).join(' ').toLowerCase()
  let total = 0
  for (const w of words) {
    const s = (title.includes(w) ? 4 : 0) + (item.tags.some((t) => t.includes(w)) ? 2 : 0) + (rest.includes(w) ? 1 : 0)
    if (!s) return 0
    total += s
  }
  return total
}

type Facet = 'types' | 'owners' | 'tags' | 'updated'

const within = (item: SearchItem, updated: Updated) => item.updated <= UPDATED.find((u) => u.value === updated)!.days

function passes(item: SearchItem, state: SearchState, skip?: Facet) {
  return (
    (skip === 'types' || !state.types.length || state.types.includes(item.type)) &&
    (skip === 'owners' || !state.owners.length || state.owners.includes(item.owner)) &&
    (skip === 'tags' || !state.tags.length || state.tags.some((t) => item.tags.includes(t))) &&
    (skip === 'updated' || within(item, state.updated))
  )
}

const matching = (items: SearchItem[], q: string, people: People = PEOPLE) => {
  const words = terms(q)
  return items.flatMap((item) => {
    const s = words.length ? score(item, words, people) : 1
    return s ? [{ item, score: s }] : []
  })
}

/** Every result for the state, ranked; the caller pages it. */
export function runSearch(state: SearchState, items: SearchItem[] = ITEMS, people: People = PEOPLE): SearchItem[] {
  if (!state.q) return []
  const hits = matching(items, state.q, people).filter(({ item }) => passes(item, state))
  const by: Record<Sort, (a: (typeof hits)[number], b: (typeof hits)[number]) => number> = {
    relevance: (a, b) => b.score - a.score || a.item.updated - b.item.updated,
    recent: (a, b) => a.item.updated - b.item.updated,
    title: (a, b) => a.item.title.localeCompare(b.item.title),
  }
  return hits.sort(by[state.sort]).map((h) => h.item)
}

export interface FacetCounts {
  types: Record<string, number>
  owners: Record<string, number>
  tags: Record<string, number>
  updated: Record<string, number>
}

/** Per option: how many results picking it would give, with the other facets applied. */
export function facetCounts(state: SearchState, items: SearchItem[] = ITEMS, people: People = PEOPLE): FacetCounts {
  const hits = state.q ? matching(items, state.q, people).map((h) => h.item) : []
  const counts: FacetCounts = { types: {}, owners: {}, tags: {}, updated: {} }
  const bump = (bucket: Record<string, number>, key: string) => (bucket[key] = (bucket[key] ?? 0) + 1)
  for (const item of hits) {
    if (passes(item, state, 'types')) bump(counts.types, item.type)
    if (passes(item, state, 'owners')) bump(counts.owners, item.owner)
    if (passes(item, state, 'tags')) for (const t of item.tags) bump(counts.tags, t)
    if (passes(item, state, 'updated')) for (const u of UPDATED) if (within(item, u.value)) bump(counts.updated, u.value)
  }
  return counts
}

/** How many results the query has with no filters at all. */
export const unfilteredCount = (q: string, items: SearchItem[] = ITEMS, people: People = PEOPLE) => (q ? matching(items, q, people).length : 0)

/** Splits text into plain and matching runs for <mark>. */
export function highlight(text: string, words: string[]): { text: string; match: boolean }[] {
  const escaped = [...words].sort((a, b) => b.length - a.length).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  if (!escaped.length) return [{ text, match: false }]
  const re = new RegExp(`(${escaped.join('|')})`, 'gi')
  return text
    .split(re)
    .filter(Boolean)
    .map((part) => ({ text: part, match: words.includes(part.toLowerCase()) }))
}

// The index's own words, once per index.
const vocabularies = new WeakMap<SearchItem[], string[]>()
function vocabulary(items: SearchItem[], people: People) {
  let words = vocabularies.get(items)
  if (!words) {
    words = [
      ...new Set(
        items
          .flatMap((item) => [item.title, ...item.tags, ...fields(item, people)])
          .join(' ')
          .toLowerCase()
          .match(/[a-z]{4,}/g),
      ),
    ]
    vocabularies.set(items, words)
  }
  return words
}

function distance(a: string, b: string) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0]!
    row[0] = i
    for (let j = 1; j <= b.length; j++) {
      const next = Math.min(row[j]! + 1, row[j - 1]! + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1))
      prev = row[j]!
      row[j] = next
    }
  }
  return row[b.length]!
}

/** A nearby spelling that has results ("onbaording" → "onboarding"), or null. */
export function didYouMean(q: string, items: SearchItem[] = ITEMS, people: People = PEOPLE): string | null {
  const VOCABULARY = vocabulary(items, people)
  const fixed = terms(q).map((w) => {
    if (VOCABULARY.includes(w) || w.length < 4) return w
    let best = w
    let bestD = Math.ceil(w.length / 3) + 1
    for (const v of VOCABULARY) {
      const d = distance(w, v)
      if (d < bestD) [best, bestD] = [v, d]
    }
    return best
  })
  const next = fixed.join(' ')
  return next !== q.toLowerCase() && unfilteredCount(next, items, people) ? next : null
}

/** Query completions for what's typed: popular searches and tags that contain it. */
export function completions(draft: string, recent: string[], items: SearchItem[] = ITEMS, popular: string[] = POPULAR): string[] {
  const d = draft.trim().toLowerCase()
  if (!d) return []
  const tags = [...new Set(items.flatMap((i) => i.tags))]
  return [...new Set([...recent, ...popular, ...tags])].filter((s) => s !== d && s.includes(d)).slice(0, 4)
}

const DAY = 86_400_000

type RelativeWords = { today: string; yesterday: string; daysAgo: (days: number) => string }

/** "today", "yesterday", "4 days ago", then a date. */
export function updatedLabel(days: number, today: Date, words: RelativeWords, locale: string) {
  if (days === 0) return words.today
  if (days === 1) return words.yesterday
  if (days < 7) return words.daysAgo(days)
  const date = new Date(today.getTime() - days * DAY)
  return date.toLocaleDateString(locale, { month: 'short', day: 'numeric', ...(days > 300 ? { year: 'numeric' } : {}), timeZone: 'UTC' })
}
