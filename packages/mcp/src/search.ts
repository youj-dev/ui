import { editDistance } from '../../../apps/docs/components/icons/search'
import { ALIASES, CONCEPTS } from './thesaurus'

/* Search by meaning, without a model: every entity is a few weighted fields
 * of words. A query word matches a word exactly, by prefix, with a typo, or
 * through the thesaurus (a concept it shares), each worth a little less;
 * rarer words count for more (idf), and entities that match every word of
 * the query beat ones that match some. */

export interface Entry<T> {
  item: T
  /** [text, weight] pairs: names ~4, descriptions ~2, body text ~1. */
  fields: [string, number][]
  /** A small prior, so a component edges out a docs page on a tie. */
  boost?: number
}

interface Indexed<T> {
  item: T
  boost: number
  /** stem → best field weight it appears in. */
  words: Map<string, number>
  /** "a b" for adjacent stems → best field weight, so a phrase beats scattered words. */
  pairs: Map<string, number>
}

const STOP = new Set(['a', 'an', 'the', 'and', 'or', 'of', 'for', 'to', 'in', 'on', 'with', 'my', 'me', 'i', 'is', 'it', 'that', 'this', 'as', 'at', 'by', 'from', 'be', 'into', 'use', 'using', 'want', 'need', 'some', 'up', 'onto', 'when', 'how', 'what', 'which', 'thing', 'something', 'youj', 'component', 'components', 'animated'])

/** Light stemming: plurals, then common endings, then a final e, so "deleting", "deletes" and "delete" meet. */
export function stem(word: string): string {
  let w = word
  if (w.length > 4 && w.endsWith('ies')) w = `${w.slice(0, -3)}y`
  else if (w.length > 3 && /(ch|sh|x|ss)es$/.test(w)) w = w.slice(0, -2)
  else if (w.length > 3 && w.endsWith('s') && !/(ss|us)$/.test(w)) w = w.slice(0, -1)
  if (w.length > 6 && w.endsWith('ation')) w = w.slice(0, -5)
  else if (w.length > 5 && w.endsWith('ing')) w = w.slice(0, -3)
  else if (w.length > 4 && w.endsWith('ed') && !w.endsWith('eed')) w = w.slice(0, -2)
  if (w.length > 3 && w.endsWith('e') && !w.endsWith('ee')) w = w.slice(0, -1)
  return w
}

export function words(text: string): string[] {
  let t = text.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase()
  for (const [from, to] of Object.entries(ALIASES)) t = t.replaceAll(from, to)
  return t.split(/[^a-z0-9]+/).filter((w) => w && !STOP.has(w)).map(stem)
}

const related = new Map<string, Set<string>>()
for (const group of CONCEPTS) {
  const stems = group.map(stem)
  for (const w of stems) {
    const set = related.get(w) ?? new Set<string>()
    for (const other of stems) if (other !== w) set.add(other)
    related.set(w, set)
  }
}

export class Searcher<T> {
  private entries: Indexed<T>[]
  private df = new Map<string, number>()

  constructor(entries: Entry<T>[]) {
    this.entries = entries.map((e) => {
      const map = new Map<string, number>()
      const pairs = new Map<string, number>()
      for (const [text, weight] of e.fields) {
        const list = words(text)
        list.forEach((w, i) => {
          map.set(w, Math.max(map.get(w) ?? 0, weight))
          if (i) pairs.set(`${list[i - 1]} ${w}`, Math.max(pairs.get(`${list[i - 1]} ${w}`) ?? 0, weight))
        })
      }
      return { item: e.item, boost: e.boost ?? 1, words: map, pairs }
    })
    for (const e of this.entries) for (const w of e.words.keys()) this.df.set(w, (this.df.get(w) ?? 0) + 1)
  }

  private idf(word: string) {
    return Math.log(1 + this.entries.length / (this.df.get(word) ?? 1))
  }

  /** How well one query word matches an entry: the best of exact, prefix, typo and concept matches. */
  private matchWord(e: Indexed<T>, q: string): number {
    let best = 0
    const exact = e.words.get(q)
    if (exact) best = exact * this.idf(q)
    else {
      for (const [w, weight] of e.words) {
        let s = 0
        if (q.length >= 3 && w.startsWith(q)) s = 0.75
        else if (w.length >= 4 && q.startsWith(w) && q.length - w.length <= 3) s = 0.6
        else if (q.length >= 5 && Math.abs(q.length - w.length) <= 2 && editDistance(q, w, q.length >= 8 ? 2 : 1) <= (q.length >= 8 ? 2 : 1)) s = 0.5
        if (s) best = Math.max(best, s * weight * this.idf(w))
      }
    }
    // Always tried, so a passing mention of "loading" in the Spinner's text doesn't hide that its name is the concept's.
    for (const alt of related.get(q) ?? []) {
      const weight = e.words.get(alt)
      // A sibling in the entry's name ("loading" → Spinner) is nearly as good as the word; one in its text is a hint.
      if (weight) best = Math.max(best, weight >= 4 ? 0.6 * 4 * this.idf(alt) : 0.45 * Math.min(weight, 2) * this.idf(alt))
    }
    return best
  }

  search(query: string, limit = 10, filter?: (item: T) => boolean, boost?: (item: T) => number): { item: T; score: number }[] {
    const sequence = words(query)
    const terms = [...new Set(sequence)]
    if (!terms.length) return []
    const out: { item: T; score: number }[] = []
    for (const e of this.entries) {
      if (filter && !filter(e.item)) continue
      let score = 0
      let matched = 0
      for (const q of terms) {
        const s = this.matchWord(e, q)
        if (s) {
          score += s
          matched++
        }
      }
      if (!matched) continue
      for (let i = 1; i < sequence.length; i++) {
        const weight = e.pairs.get(`${sequence[i - 1]} ${sequence[i]}`)
        if (weight) score += weight * (this.idf(sequence[i - 1]!) + this.idf(sequence[i]!)) * 0.5
      }
      // Matching every word matters more than matching one word well.
      score *= e.boost * (0.4 + 0.6 * (matched / terms.length) ** 2) * (boost?.(e.item) ?? 1)
      out.push({ item: e.item, score })
    }
    return out.sort((a, b) => b.score - a.score).slice(0, limit)
  }
}
