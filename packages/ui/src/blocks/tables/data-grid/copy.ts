import { createContext, useContext, useState } from 'react'
import { defaultLabels, type YoujLabels } from '@youj/core'

/* The grid's strings. Each is one of the dictionary's (YoujLabels), so a
 * locale pack on YoujProvider translates it; `copy` rewrites any of them for
 * this grid alone. `noun` names the rows in counts and announcements. */
const KEYS = [
  'justNow',
  'escKey',
  'search',
  'searchPlaceholder',
  'clearSearch',
  'filterBy',
  'filterNoOptions',
  'clearFilter',
  'clearFilters',
  'clearAll',
  'activeFilters',
  'removeFilter',
  'columns',
  'toggleColumns',
  'resetColumns',
  'rowDensity',
  'compactRows',
  'comfortableRows',
  'spaciousRows',
  'rowActions',
  'actions',
  'selectRow',
  'selectAllRows',
  'selectAllOnPage',
  'selectionActions',
  'selected',
  'selectAllCount',
  'clearSelection',
  'row',
  'rowNumber',
  'sortedBy',
  'sortedColumn',
  'sortCleared',
  'sortAscending',
  'sortDescending',
  'sortBy',
  'selectionCleared',
  'selectedRows',
  'matchCount',
  'totalCount',
  'itemCount',
  'loadFailed',
  'tryAgain',
  'noMatches',
  'noMatchesHint',
  'noItems',
  'emptyHint',
  'pagination',
  'previousPage',
  'nextPage',
  'rangeOf',
  'pageOf',
  'gridHintArrows',
  'gridHintSelect',
  'gridHintSort',
  'gridHintOpen',
  'views',
  'copied',
  'copyFailed',
  'copyValue',
  'cellOf',
  'trendUp',
  'trendDown',
  'trendFlat',
  'groupBy',
  'noGrouping',
  'groupedBy',
  'groupingCleared',
  'groupTotal',
  'showDetails',
  'hideDetails',
  'addFilter',
  'booleanYes',
  'booleanNo',
  'valueOfMax',
] as const satisfies ReadonlyArray<keyof YoujLabels>

type GridLabels = Pick<YoujLabels, (typeof KEYS)[number]>

function pick(labels: YoujLabels): GridLabels {
  return Object.fromEntries(KEYS.map((key) => [key, labels[key]])) as GridLabels
}

export const DEFAULT_COPY = {
  /** What a row is, plural: "customers". */
  noun: defaultLabels.rowsNoun,
  ...pick(defaultLabels),
}

export type DataGridCopy = typeof DEFAULT_COPY

/**
 * The provider's strings (a locale pack translates them), then `copy` over
 * them, held while nothing in them changes: a `copy` written inline is a new
 * object each render, and every cell reads it.
 */
export function useGridCopy(labels: YoujLabels, copy?: Partial<DataGridCopy>): DataGridCopy {
  const build = () => ({ labels, copy, value: { ...DEFAULT_COPY, noun: labels.rowsNoun, ...pick(labels), ...copy } })
  const [held, setHeld] = useState(build)
  if (held.labels === labels && shallowEqual(held.copy, copy)) return held.value
  const next = build()
  setHeld(next)
  return next.value
}

function shallowEqual(a: object | undefined, b: object | undefined) {
  if (a === b) return true
  if (!a || !b) return false
  const keys = Object.keys(a)
  return keys.length === Object.keys(b).length && keys.every((key) => Object.is((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]))
}

export const GridCopyContext = createContext<DataGridCopy>(DEFAULT_COPY)
/** The grid's strings, for its parts. */
export const useCopy = () => useContext(GridCopyContext)
