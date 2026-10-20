/* Icon search: instant, forgiving, and aware of what icons mean.
 *
 * Every word of the query must match something about the icon (its name, a
 * part of its name, a keyword, its category, its choreography), and the best
 * match for each word scores it. Names beat keywords beat descriptions;
 * exact beats prefix beats substring; a typo (one edit in four letters, two
 * in seven) and letters in order still match, lower. Youj keywords double
 * as synonyms for icons that have none: "notification" finds lucide's
 * bell-ring because Youj's bell lists it. */

export interface Searchable {
  name: string
  keywords: readonly string[]
  category?: string
  description?: string
}

/** Words per icon, built once per set. */
interface Indexed<T> {
  item: T
  name: string
  parts: string[]
  keywords: string[]
  category: string
  description: string[]
}

export interface SearchIndex<T> {
  entries: Indexed<T>[]
  /** keyword → names of the icons that list it, for synonyms. */
  synonyms: Map<string, string[]>
}

const words = (text: string) => text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)

export function normalizeQuery(query: string): string {
  return query.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim()
}

/**
 * Builds the index. `describe` says what to search each item by, and
 * `vocabulary` is a set whose keywords serve as synonyms for every item (the
 * Youj set).
 */
export function indexIcons<T>(items: readonly T[], describe: (item: T) => Searchable, vocabulary: readonly Searchable[] = []): SearchIndex<T> {
  const synonyms = new Map<string, string[]>()
  for (const icon of vocabulary) {
    for (const keyword of icon.keywords) {
      for (const word of words(keyword)) {
        const list = synonyms.get(word) ?? []
        if (!list.includes(icon.name)) list.push(icon.name)
        synonyms.set(word, list)
      }
    }
  }
  return {
    synonyms,
    entries: items.map((item) => {
      const icon = describe(item)
      return {
        item,
        name: icon.name,
        parts: icon.name.split('-'),
        keywords: icon.keywords.flatMap(words),
        category: icon.category ?? '',
        description: words(icon.description ?? ''),
      }
    }),
  }
}

/** Optimal string alignment distance, bailing out once it passes `max`. */
export function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1
  let prev2: number[] = []
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    const row = [i]
    let best = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      let v = Math.min(prev[j]! + 1, row[j - 1]! + 1, prev[j - 1]! + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2]! + 1)
      row.push(v)
      if (v < best) best = v
    }
    if (best > max) return max + 1
    prev2 = prev
    prev = row
  }
  return prev[b.length]!
}

/** The letters of `word` appear in `text` in order, starting with its first letter: `chk` finds check. */
function subsequence(word: string, text: string) {
  if (word[0] !== text[0]) return false
  let at = 0
  for (const ch of text) if (ch === word[at]) at++
  return at === word.length
}

const tolerance = (word: string) => (word.length >= 7 ? 2 : word.length >= 4 ? 1 : 0)

/** Names of icons whose keywords are `word`, or (from four letters) start with it: `notif` reaches notification's bell. */
function synonymsOf(word: string, synonyms: Map<string, string[]>): Set<string> {
  const names = new Set(synonyms.get(word))
  if (word.length >= 4) for (const [key, list] of synonyms) if (key.startsWith(word)) list.forEach((n) => names.add(n))
  return names
}

/** How well one query word matches an icon; 0 is no match. */
function scoreWord<T>(e: Indexed<T>, word: string, alike: Set<string>): number {
  if (e.name === word) return 100
  let best = 0
  const take = (v: number) => {
    if (v > best) best = v
  }
  for (const part of e.parts) {
    if (part === word) take(80)
    else if (part.startsWith(word)) take(60)
  }
  if (best < 45 && e.name.includes(word)) take(45)
  for (const keyword of e.keywords) {
    if (keyword === word) take(52)
    else if (keyword.startsWith(word)) take(40)
    else if (word.length >= 3 && keyword.includes(word)) take(22)
  }
  if (best >= 52) return best
  if (e.category && e.category.startsWith(word)) take(30)
  // Synonyms: an icon named for something another icon's keywords call `word`.
  if (alike.size && best < 34 && (alike.has(e.name) || e.parts.some((part) => alike.has(part)) || [...alike].some((name) => e.name.startsWith(`${name}-`)))) take(34)
  if (best) return best
  if (word.length >= 3 && e.description.some((w) => w.startsWith(word))) take(14)
  const max = tolerance(word)
  if (max) {
    for (const candidate of [...e.parts, ...e.keywords]) {
      const d = editDistance(word, candidate, max)
      if (d <= max) take(d === 1 ? 20 : 12)
    }
  }
  if (!best && word.length >= 3 && subsequence(word, e.name.replace(/-/g, ''))) take(8)
  return best
}

/**
 * Items matching every word, best first; ties keep the set's own order. An
 * empty query returns everything in order.
 */
export function searchIndex<T>(index: SearchIndex<T>, query: string): T[] {
  const q = normalizeQuery(query)
  if (!q) return index.entries.map((e) => e.item)
  const terms = q.split(/[\s-]+/).filter(Boolean)
  const alike = terms.map((term) => synonymsOf(term, index.synonyms))
  const phrase = q.replace(/\s+/g, '-')
  const scored: { item: T; score: number; at: number }[] = []
  index.entries.forEach((e, at) => {
    let score = 0
    for (const [i, term] of terms.entries()) {
      const s = scoreWord(e, term, alike[i]!)
      if (!s) return
      score += s
    }
    if (e.name === phrase) score += 200
    else if (e.name.startsWith(phrase)) score += 60
    scored.push({ item: e.item, score, at })
  })
  return scored.sort((a, b) => b.score - a.score || a.at - b.at).map((s) => s.item)
}
