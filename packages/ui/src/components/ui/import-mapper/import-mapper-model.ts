import { toCsv } from './import-mapper-csv'

/* The rules behind the import: matching columns to fields, checking a value
 * by its field's type, finding duplicates and planning what each row does.
 * Pure functions, so they're tested without a screen. */

export type ImportFieldType = 'text' | 'email' | 'number' | 'date'

/** A field an import can fill. */
export interface ImportField {
  id: string
  label: string
  /** How its values are checked. Default `text` (any text). */
  type?: ImportFieldType
  /** A row without it is an error until it's filled. Default false. */
  required?: boolean
  /** Other names a CSV column may carry ("e-mail", "mail"), tried when the label doesn't match. */
  synonyms?: string[]
}

/** What to do with a row whose key already exists. */
export type DuplicatePolicy = 'skip' | 'update' | 'create'

/** The problem with one value. */
export type IssueKind = 'required' | 'email' | 'number' | 'date'

/** One row of the import as the app receives it. */
export interface ImportRow {
  /** Its number in the file, counting the first data row as 1. */
  row: number
  /** The value for each mapped field, by field id. */
  values: Record<string, string>
  /** `update` when it matches an existing record and the policy says so, else `create`. */
  action: 'create' | 'update'
}

export interface ImportIssue {
  row: number
  fieldId: string
  value: string
  kind: IssueKind
}

/** The column a field got, and how sure the match is (null when it was chosen by hand). */
export interface ColumnMatch {
  fieldId: string | null
  confidence: number | null
}

const squash = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '')
const words = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const NUMBER = /^[-+]?(\d{1,3}(,\d{3})+|\d+)(\.\d+)?$/
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/
const SLASH_DATE = /^(\d{1,2})[/.](\d{1,2})[/.](\d{4})$/

function realDate(year: number, month: number, day: number) {
  const d = new Date(Date.UTC(year, month - 1, day))
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day
}

function isDate(value: string) {
  const iso = ISO_DATE.exec(value)
  if (iso) return realDate(+iso[1]!, +iso[2]!, +iso[3]!)
  const slash = SLASH_DATE.exec(value)
  if (slash) {
    const [a, b, year] = [+slash[1]!, +slash[2]!, +slash[3]!]
    // Day first or month first: either reading that is a real date will do.
    return realDate(year, a, b) || realDate(year, b, a)
  }
  return false
}

/** The problem with a value for a field, or null. An empty value is a problem only when the field is required. */
export function check(field: ImportField, raw: string): IssueKind | null {
  const value = raw.trim()
  if (value === '') return field.required ? 'required' : null
  if (field.type === 'email') return EMAIL.test(value) ? null : 'email'
  if (field.type === 'number') return NUMBER.test(value) ? null : 'number'
  if (field.type === 'date') return isDate(value) ? null : 'date'
  return null
}

/** How alike a header and a field's names are, 0 to 1: same letters 1, one inside the other by how much it covers (0.5 to 0.85), shared words by their share. */
function nameScore(header: string, names: string[]) {
  const h = squash(header)
  if (!h) return 0
  let best = 0
  for (const name of names) {
    const n = squash(name)
    if (!n) continue
    if (h === n) return 1
    // One inside the other: the more of the longer name it covers, the surer.
    if (Math.min(h.length, n.length) >= 3 && (h.includes(n) || n.includes(h)))
      best = Math.max(best, 0.5 + 0.35 * (Math.min(h.length, n.length) / Math.max(h.length, n.length)))
    const a = new Set(words(header))
    const b = new Set(words(name))
    const shared = [...a].filter((w) => b.has(w)).length
    if (shared) best = Math.max(best, (shared / new Set([...a, ...b]).size) * 0.7)
  }
  return best
}

/** Whether most of a column's filled values look like the field's type. */
function looksLike(field: ImportField, samples: string[]) {
  const filled = samples.map((s) => s.trim()).filter(Boolean)
  if (filled.length < 2 || !field.type || field.type === 'text') return false
  return filled.filter((v) => check({ ...field, required: false }, v) === null).length / filled.length >= 0.9
}

/**
 * Matches each column to the field it most likely is. A field goes to one
 * column only: the best pairs are taken first, and a pair below 0.5 isn't
 * made. `confidence` is the pair's score (a column whose values look like an
 * email field's, with no name to go on, scores 0.55).
 */
export function autoMatch(headers: string[], columns: string[][], fields: ImportField[]): ColumnMatch[] {
  const pairs: { column: number; field: number; score: number }[] = []
  headers.forEach((header, column) => {
    fields.forEach((field, index) => {
      let score = nameScore(header, [field.label, field.id, ...(field.synonyms ?? [])])
      if (score < 0.5 && (field.type === 'email' || field.type === 'date') && looksLike(field, columns[column] ?? [])) score = 0.55
      if (score >= 0.5) pairs.push({ column, field: index, score })
    })
  })
  pairs.sort((a, b) => b.score - a.score || a.column - b.column || a.field - b.field)
  const result: ColumnMatch[] = headers.map(() => ({ fieldId: null, confidence: null }))
  const taken = new Set<number>()
  for (const { column, field, score } of pairs) {
    if (result[column]!.fieldId || taken.has(field)) continue
    result[column] = { fieldId: fields[field]!.id, confidence: score }
    taken.add(field)
  }
  return result
}

/** A row's values by field id, from its cells, the mapping and the fixes made in the review. */
export function rowValues(cells: string[], mapping: (string | null)[], fixes: Record<string, string>, row: number): Record<string, string> {
  const values: Record<string, string> = {}
  mapping.forEach((fieldId, column) => {
    if (fieldId) values[fieldId] = fixes[`${row}:${fieldId}`] ?? cells[column] ?? ''
  })
  return values
}

/** The problems in a row's values, one per field at most. */
export function rowIssues(values: Record<string, string>, fields: ImportField[], row: number): ImportIssue[] {
  const issues: ImportIssue[] = []
  for (const field of fields) {
    if (!(field.id in values)) continue
    const kind = check(field, values[field.id]!)
    if (kind) issues.push({ row, fieldId: field.id, value: values[field.id]!, kind })
  }
  return issues
}

const keyOf = (value: string | undefined) => (value ?? '').trim().toLowerCase()

/** The rows (by index) that repeat a key: it's one of the `existing` keys, or an earlier row has it. Empty keys never repeat. */
export function findDuplicates(keys: string[], existing: readonly string[] = []): Set<number> {
  const seen = new Set(existing.map(keyOf))
  const out = new Set<number>()
  keys.forEach((key, index) => {
    const k = keyOf(key)
    if (!k) return
    if (seen.has(k)) out.add(index)
    else seen.add(k)
  })
  return out
}

export interface ImportPlan {
  rows: ImportRow[]
  created: number
  updated: number
  /** Left out: skipped by hand, still wrong, or a duplicate the policy skips. */
  skipped: number
}

/** What each row does. Rows given as `null` (skipped or still wrong) and duplicates under the `skip` policy are left out. */
export function plan(rows: ({ row: number; values: Record<string, string> } | null)[], duplicates: Set<number>, policy: DuplicatePolicy): ImportPlan {
  const out: ImportRow[] = []
  let skipped = 0
  rows.forEach((entry, index) => {
    if (!entry) return void skipped++
    const duplicate = duplicates.has(index)
    if (duplicate && policy === 'skip') return void skipped++
    out.push({ row: entry.row, values: entry.values, action: duplicate && policy === 'update' ? 'update' : 'create' })
  })
  return { rows: out, created: out.filter((r) => r.action === 'create').length, updated: out.filter((r) => r.action === 'update').length, skipped }
}

/** The error report as CSV: one line per problem, with the row, the field, the value and what's wrong. */
export function errorReport(
  issues: ImportIssue[],
  header: [string, string, string, string],
  field: (id: string) => string,
  message: (kind: IssueKind) => string,
): string {
  return '﻿' + toCsv([header, ...issues.map((i) => [String(i.row), field(i.fieldId), i.value, message(i.kind)])])
}
