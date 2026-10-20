import { defaultLabels, type YoujLabels } from '@youj/core'

/* The table's strings. Each is one of the dictionary's (YoujLabels), so a
 * locale pack on YoujProvider translates it; `copy` rewrites any of them for
 * this table alone. `noun` names the rows in counts and announcements. */
const KEYS = [
  'search',
  'quoted',
  'filterFrom',
  'filterUntil',
  'loadingNamed',
  'row',
  'rowNumber',
  'export',
  'clearFilters',
  'pageOf',
  'noItems',
  'selectAllRows',
  'selectAllOnPage',
  'sortedBy',
  'sortedColumn',
  'sortCleared',
  'selectionCleared',
  'selectedRows',
  'matchCount',
  'totalCount',
  'columnWidth',
  'cellOf',
  'cellSaved',
  'cellSaveFailed',
  'gridHintArrows',
  'gridHintSelect',
  'gridHintEdit',
  'gridHintSort',
  'gridHintResize',
  'gridHintMenu',
  'loadFailed',
  'tryAgain',
  'noMatches',
  'noMatchesHint',
  'emptyHint',
  'saving',
  'saved',
  'selectRow',
] as const satisfies ReadonlyArray<keyof YoujLabels>

type TableLabels = Pick<YoujLabels, (typeof KEYS)[number]>

function pick(labels: YoujLabels): TableLabels {
  return Object.fromEntries(KEYS.map((key) => [key, labels[key]])) as TableLabels
}

export const DEFAULT_COPY = {
  /** What a row is, plural: "orders". */
  noun: defaultLabels.rowsNoun,
  ...pick(defaultLabels),
}

export type DataTableCopy = typeof DEFAULT_COPY

/** The provider's strings (a locale pack translates them), then `copy` over them. */
export function tableCopy(labels: YoujLabels, copy?: Partial<DataTableCopy>): DataTableCopy {
  return { ...DEFAULT_COPY, noun: labels.rowsNoun, ...pick(labels), ...copy }
}
