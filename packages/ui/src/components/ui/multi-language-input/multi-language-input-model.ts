import type { multiLanguageInputProviderLabels } from '@youj/core/labels'
import type { YoujLabels } from '@youj/core/lib/youj/labels-types'

/* The translation model, free of React: a value is `Record<locale, string>`,
 * and each translation's review state records the source text it was written
 * or last reviewed against (its `basis`), and whether a person has checked it.
 *
 *   missing   no text
 *   outdated  text, but the source has changed since its basis
 *   review    text filled by a copy or a machine suggestion, not yet checked
 *   complete  text, current and checked
 *   source    the source locale, with text
 *
 * A locale's status across several fields is the worst of theirs. */

type TranslationStatus = 'source' | 'complete' | 'review' | 'outdated' | 'missing'

/** What the component remembers about a translation, beside its text. */
interface TranslationReview {
  /** The source text this translation was written or last reviewed against. When the source differs, it's outdated. */
  basis?: string
  /** Filled by a copy or a machine suggestion and not checked by a person yet. */
  unreviewed?: boolean
}

type TranslationValue = Record<string, string>
type TranslationReviews = Record<string, TranslationReview>

const SEVERITY: Record<TranslationStatus, number> = { source: 0, complete: 0, review: 1, outdated: 2, missing: 3 }

const filled = (text: string | undefined) => !!text?.trim()

/**
 * A translation's status. `basis` stands in for a review without one: the
 * source text the component first saw, so text that was there from the start
 * counts as current until the source changes.
 */
function translationStatus(
  value: TranslationValue,
  locale: string,
  sourceLocale: string,
  review?: TranslationReview,
  basis?: string,
): TranslationStatus {
  if (!filled(value[locale])) return 'missing'
  if (locale === sourceLocale) return 'source'
  const against = review?.basis ?? basis
  if (against !== undefined && against.trim() !== (value[sourceLocale] ?? '').trim()) return 'outdated'
  if (review?.unreviewed) return 'review'
  return 'complete'
}

const needsWork = (status: TranslationStatus) => SEVERITY[status] > 0
const worst = (a: TranslationStatus, b: TranslationStatus) => (SEVERITY[b] > SEVERITY[a] ? b : a)

/** The locales among `locales` with no text: for a schema's refine, or a publish check. */
function missingTranslations(value: TranslationValue | undefined, locales: readonly string[]): string[] {
  return locales.filter((locale) => !filled(value?.[locale]))
}

interface LocaleSummary {
  code: string
  /** The worst status across the fields. */
  status: TranslationStatus
  /** Fields in each status. */
  counts: Record<TranslationStatus, number>
  /** Fields with an error (over the limit, failed validation) in this locale. */
  errors: number
  fields: number
}

interface FieldStatus {
  statuses: Record<string, TranslationStatus>
  errors: Record<string, boolean>
}

const emptyCounts = (): Record<TranslationStatus, number> => ({ source: 0, complete: 0, review: 0, outdated: 0, missing: 0 })

function summarize(fields: readonly FieldStatus[], locales: readonly string[], sourceLocale: string): Record<string, LocaleSummary> {
  const out: Record<string, LocaleSummary> = {}
  for (const code of locales) {
    const counts = emptyCounts()
    let status: TranslationStatus = code === sourceLocale ? 'source' : 'complete'
    let errors = 0
    for (const field of fields) {
      const s = field.statuses[code] ?? 'missing'
      counts[s]++
      status = worst(status, s)
      if (field.errors[code]) errors++
    }
    out[code] = { code, status, counts, errors, fields: fields.length }
  }
  return out
}

/* A word-level diff of two versions of the source, so an outdated
 * translation can show what changed. Longest common subsequence over words,
 * spaces and punctuation (Chinese and Japanese, written without spaces, go
 * character by character); past a few hundred words it gives up and marks
 * the whole text as changed. */
const TOKEN = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]|[\p{L}\p{N}\p{M}]+|\s+|./gu
interface DiffPart {
  text: string
  kind: 'same' | 'added' | 'removed'
}

function diffWords(before: string, after: string): DiffPart[] {
  const a = before.match(TOKEN) ?? []
  const b = after.match(TOKEN) ?? []
  if (a.length * b.length > 250_000) return [{ text: after, kind: 'added' }]
  const table = Array.from({ length: a.length + 1 }, () => new Uint16Array(b.length + 1))
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      table[i]![j] = a[i] === b[j] ? table[i + 1]![j + 1]! + 1 : Math.max(table[i + 1]![j]!, table[i]![j + 1]!)
    }
  }
  const parts: DiffPart[] = []
  const push = (text: string, kind: DiffPart['kind']) => {
    const last = parts.at(-1)
    if (last?.kind === kind) last.text += text
    else parts.push({ text, kind })
  }
  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      push(a[i]!, 'same')
      i++
      j++
    } else if (table[i + 1]![j]! >= table[i]![j + 1]!) push(a[i++]!, 'removed')
    else push(b[j++]!, 'added')
  }
  while (i < a.length) push(a[i++]!, 'removed')
  while (j < b.length) push(b[j++]!, 'added')
  // A change interrupted only by a space reads as one change: "Relaxed through the body".
  const merged: DiffPart[] = []
  for (const part of parts) {
    const [prev, gap] = [merged.at(-2), merged.at(-1)]
    if (part.kind !== 'same' && gap?.kind === 'same' && !gap.text.trim() && prev?.kind === part.kind) {
      merged.pop()
      prev.text += gap.text + part.text
    } else merged.push(part)
  }
  return merged
}

/** A status's name, from the built-in copy. */
function statusName(labels: Pick<YoujLabels, keyof typeof multiLanguageInputProviderLabels>, status: TranslationStatus): string {
  return {
    source: labels.translationSource,
    complete: labels.translationComplete,
    review: labels.translationReview,
    outdated: labels.translationOutdated,
    missing: labels.translationMissing,
  }[status]
}

/** What's left in a locale across fields: "2 missing, 1 outdated". A single field names its state. */
function describeSummary(labels: Pick<YoujLabels, keyof typeof multiLanguageInputProviderLabels>, summary: LocaleSummary | undefined): string {
  if (!summary || summary.fields === 0) return labels.translationMissing
  if (!needsWork(summary.status) || summary.fields === 1) return statusName(labels, summary.status)
  return (['missing', 'outdated', 'review'] as const)
    .filter((s) => summary.counts[s] > 0)
    .map((s) => labels.translationCount(summary.counts[s], s))
    .join(', ')
}

export { describeSummary, diffWords, missingTranslations, needsWork, statusName, summarize, translationStatus, worst }
export type {
  DiffPart,
  FieldStatus,
  LocaleSummary,
  TranslationReview,
  TranslationReviews,
  TranslationStatus,
  TranslationValue,
}
