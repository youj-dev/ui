import { filterBuilderLabels } from '@youj/core/labels'

/* The filter's data and the pure functions over it. A FilterGroup is plain
 * JSON (ids are optional; the component adds them), so it can be saved, sent
 * to a server or kept in the URL. `matchFilter` runs it against a row in the
 * browser; `describeFilter` writes it as a sentence. Nothing here imports
 * React. */

type FilterFieldType = 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean'

interface FilterOption {
  value: string
  label: string
}

interface FilterField {
  id: string
  label: string
  type: FilterFieldType
  /** The choices of a `select` or `multiselect` field. A string is its own value and label. */
  options?: Array<string | FilterOption>
}

type FilterOperator =
  | 'is'
  | 'isNot'
  | 'contains'
  | 'startsWith'
  | 'gt'
  | 'lt'
  | 'between'
  | 'before'
  | 'after'
  | 'inLast'
  | 'isAnyOf'
  | 'hasAny'
  | 'hasAll'
  | 'isEmpty'
  | 'isNotEmpty'
  | 'isTrue'
  | 'isFalse'

/** A text, a number, a date as `YYYY-MM-DD`, a list of option values, or a `[from, to]` pair. */
type FilterValue = string | number | boolean | null | Array<string | number | null>

interface FilterRule {
  id?: string
  type: 'rule'
  field: string
  operator: FilterOperator
  value?: FilterValue
}

interface FilterGroup {
  id?: string
  type: 'group'
  combinator: 'and' | 'or'
  children: Array<FilterRule | FilterGroup>
}

const OPERATORS: Record<FilterFieldType, FilterOperator[]> = {
  text: ['is', 'isNot', 'contains', 'startsWith', 'isEmpty', 'isNotEmpty'],
  number: ['is', 'isNot', 'gt', 'lt', 'between', 'isEmpty', 'isNotEmpty'],
  date: ['is', 'before', 'after', 'between', 'inLast', 'isEmpty', 'isNotEmpty'],
  select: ['is', 'isNot', 'isAnyOf', 'isEmpty', 'isNotEmpty'],
  multiselect: ['hasAny', 'hasAll', 'isEmpty', 'isNotEmpty'],
  boolean: ['isTrue', 'isFalse'],
}

const NO_VALUE = new Set<FilterOperator>(['isEmpty', 'isNotEmpty', 'isTrue', 'isFalse'])

/** The operators a field of this type offers, in menu order. */
const operatorsFor = (type: FilterFieldType): FilterOperator[] => OPERATORS[type]

/** Whether the operator is written without a value ("is empty"). */
const takesNoValue = (operator: FilterOperator) => NO_VALUE.has(operator)

const EMPTY_FILTER: FilterGroup = { type: 'group', combinator: 'and', children: [] }

const optionValue = (option: string | FilterOption) => (typeof option === 'string' ? option : option.value)
const optionLabel = (option: string | FilterOption) => (typeof option === 'string' ? option : option.label)

const blank = (value: unknown) => value === undefined || value === null || value === ''

/** A rule that can run: its operator has the value it needs. `matchFilter` skips rules that aren't complete, and the builder flags them. */
function isRuleComplete(rule: FilterRule): boolean {
  if (takesNoValue(rule.operator)) return true
  const { value } = rule
  if (rule.operator === 'between') return Array.isArray(value) && !blank(value[0]) && !blank(value[1])
  if (rule.operator === 'isAnyOf' || rule.operator === 'hasAny' || rule.operator === 'hasAll') return Array.isArray(value) && value.length > 0
  if (rule.operator === 'inLast') return !blank(value) && !Array.isArray(value) && Number(value) >= 0
  return !blank(value) && !Array.isArray(value)
}

/** Every rule in the group, nested ones included. */
function rulesOf(group: FilterGroup): FilterRule[] {
  return group.children.flatMap((child) => (child.type === 'rule' ? [child] : rulesOf(child)))
}

/* ── matching ─────────────────────────────────────────────────────────── */

const DAY = 86_400_000

/** A date as `YYYY-MM-DD`: an ISO string keeps its own day; a Date or timestamp takes its local one. */
function dayOf(value: unknown): string | null {
  if (typeof value === 'string') {
    const iso = /^\d{4}-\d{2}-\d{2}/.exec(value)?.[0]
    if (iso) return iso
  }
  if (typeof value !== 'string' && typeof value !== 'number' && !(value instanceof Date)) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const dayNumber = (day: string) => Date.parse(`${day}T00:00:00Z`) / DAY

const same = (a: unknown, b: unknown) => (typeof a === 'string' || typeof b === 'string' ? String(a).toLowerCase() === String(b).toLowerCase() : a === b)
const isEmptyValue = (value: unknown) => blank(value) || (Array.isArray(value) && value.length === 0)
const present = (value: unknown) => value !== null && value !== undefined && value !== ''

interface MatchOptions {
  /** Reads a field from a row. Default `row[field]`. */
  get?: (row: never, field: string) => unknown
  /** What "now" is for `inLast`. Default the current time. */
  now?: Date
}

function matchRule(row: unknown, rule: FilterRule, options: MatchOptions): boolean {
  const actual = options.get ? options.get(row as never, rule.field) : (row as Record<string, unknown> | null)?.[rule.field]
  const { operator, value } = rule
  switch (operator) {
    case 'isEmpty':
      return isEmptyValue(actual)
    case 'isNotEmpty':
      return !isEmptyValue(actual)
    case 'isTrue':
      return actual === true
    case 'isFalse':
      return actual !== true
    case 'hasAny':
    case 'hasAll': {
      const have = Array.isArray(actual) ? actual : []
      const want = Array.isArray(value) ? value : []
      return operator === 'hasAny' ? want.some((v) => have.some((h) => same(h, v))) : want.every((v) => have.some((h) => same(h, v)))
    }
    case 'isAnyOf':
      return Array.isArray(value) && value.some((v) => same(actual, v))
    case 'is':
    case 'isNot': {
      const dateLike = actual instanceof Date || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value))
      let equal: boolean
      if (dateLike) equal = dayOf(actual) === dayOf(value)
      else if (typeof actual === 'number') equal = actual === Number(value)
      else equal = same(actual, value)
      return operator === 'is' ? equal : !equal
    }
    case 'contains':
      return typeof value === 'string' && String(actual ?? '').toLowerCase().includes(value.toLowerCase())
    case 'startsWith':
      return typeof value === 'string' && String(actual ?? '').toLowerCase().startsWith(value.toLowerCase())
    case 'gt':
      return present(actual) && Number(actual) > Number(value)
    case 'lt':
      return present(actual) && Number(actual) < Number(value)
    case 'before':
    case 'after': {
      const a = dayOf(actual)
      const b = dayOf(value)
      if (a === null || b === null) return false
      return operator === 'before' ? a < b : a > b
    }
    case 'between': {
      const [from, to] = Array.isArray(value) ? value : []
      if (typeof actual === 'number') return actual >= Number(from) && actual <= Number(to)
      const a = dayOf(actual)
      const lo = dayOf(from)
      const hi = dayOf(to)
      return a !== null && lo !== null && hi !== null && a >= lo && a <= hi
    }
    case 'inLast': {
      const a = dayOf(actual)
      const today = dayOf(options.now ?? new Date())
      if (a === null || today === null) return false
      const age = dayNumber(today) - dayNumber(a)
      return age >= 0 && age <= Number(value)
    }
  }
}

/**
 * Whether a row passes the filter. A group combines its children with AND or
 * OR; an empty group, and a rule that isn't complete yet, don't narrow
 * anything. Text compares without case, a date is compared by day, and a
 * number compares as a number when the row holds one.
 */
function matchFilter(row: unknown, group: FilterGroup, options: MatchOptions = {}): boolean {
  const parts = group.children.flatMap((child) => {
    if (child.type === 'group') return rulesOf(child).some(isRuleComplete) ? [matchFilter(row, child, options)] : []
    return isRuleComplete(child) ? [matchRule(row, child, options)] : []
  })
  if (parts.length === 0) return true
  return group.combinator === 'or' ? parts.some(Boolean) : parts.every(Boolean)
}

/* ── describing ───────────────────────────────────────────────────────── */

type FilterBuilderLabels = typeof filterBuilderLabels

const SYMBOLS: Partial<Record<FilterOperator, string>> = { gt: '>', lt: '<' }

/** The operator as the menu words it. */
function operatorLabel(operator: FilterOperator, labels: FilterBuilderLabels): string {
  const names: Record<FilterOperator, string> = {
    is: labels.filterOpIs,
    isNot: labels.filterOpIsNot,
    contains: labels.filterOpContains,
    startsWith: labels.filterOpStartsWith,
    gt: labels.filterOpGt,
    lt: labels.filterOpLt,
    between: labels.filterOpBetween,
    before: labels.filterOpBefore,
    after: labels.filterOpAfter,
    inLast: labels.filterOpInLast,
    isAnyOf: labels.filterOpIsAnyOf,
    hasAny: labels.filterOpHasAny,
    hasAll: labels.filterOpHasAll,
    isEmpty: labels.filterOpIsEmpty,
    isNotEmpty: labels.filterOpIsNotEmpty,
    isTrue: labels.filterOpIsTrue,
    isFalse: labels.filterOpIsFalse,
  }
  return names[operator]
}

function describeRule(rule: FilterRule, fields: FilterField[], labels: FilterBuilderLabels): string | null {
  const field = fields.find((f) => f.id === rule.field)
  if (!field || !isRuleComplete(rule)) return null
  const shown = (v: unknown) => {
    const option = field.options?.find((o) => optionValue(o) === v)
    return option ? optionLabel(option) : String(v)
  }
  const op = SYMBOLS[rule.operator] ?? operatorLabel(rule.operator, labels)
  if (takesNoValue(rule.operator)) return `${field.label} ${op}`
  const { value } = rule
  if (rule.operator === 'between' && Array.isArray(value)) return `${field.label} ${op} ${value[0]} ${labels.filterAnd.toLocaleLowerCase()} ${value[1]}`
  if (Array.isArray(value)) return `${field.label} ${op} ${value.map(shown).join(', ')}`
  if (rule.operator === 'inLast') return `${field.label} ${op} ${value} ${labels.filterDays}`
  return `${field.label} ${op} ${shown(value)}`
}

/** One top-level part, in brackets when it is a group of several. */
function describePart(child: FilterRule | FilterGroup, fields: FilterField[], labels: FilterBuilderLabels): string | null {
  if (child.type === 'rule') return describeRule(child, fields, labels)
  const text = describeFilter(child, fields, labels)
  if (!text) return null
  return describeParts(child, fields, labels).length > 1 ? `(${text})` : text
}

function describeParts(group: FilterGroup, fields: FilterField[], labels: FilterBuilderLabels = filterBuilderLabels): string[] {
  return group.children.flatMap((child) => describePart(child, fields, labels) ?? [])
}

/**
 * The filter as a sentence: "Status is Open and (Owner is Ada or Priority >
 * 2)". A nested group of several parts goes in brackets. Rules that aren't
 * complete, or name a field that isn't in `fields`, are left out. `labels` is
 * the language of the words (the component passes the provider's); the
 * default is English. An empty filter is the empty string.
 */
function describeFilter(group: FilterGroup, fields: FilterField[], labels: FilterBuilderLabels = filterBuilderLabels): string {
  const word = (group.combinator === 'or' ? labels.filterOr : labels.filterAnd).toLocaleLowerCase()
  return describeParts(group, fields, labels).join(` ${word} `)
}

export {
  EMPTY_FILTER,
  describeFilter,
  describeParts,
  isRuleComplete,
  matchFilter,
  operatorLabel,
  operatorsFor,
  optionLabel,
  optionValue,
  rulesOf,
  takesNoValue,
  type FilterBuilderLabels,
  type FilterField,
  type FilterFieldType,
  type FilterGroup,
  type FilterOperator,
  type FilterOption,
  type FilterRule,
  type FilterValue,
  type MatchOptions,
}
