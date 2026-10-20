'use client'

import { useId, useLayoutEffect, useMemo, useRef, useState, type ComponentProps, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { PlusIcon } from '@youj/icons'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { AsyncButton } from '../../components/ui/async-button'
import { useAnnouncer } from '../../hooks/use-announcer'
import { cn, numberFormat } from '../../lib/utils'
import { DataTable, type DataTableSelection } from './data-table'
import { rowColumns } from './bulk-actions/columns'
import { CommandBar } from './bulk-actions/command-bar'
import {
  ACTIONS,
  CHANNELS,
  DEFAULT_COPY,
  DEMO_NOW,
  STAGES,
  STATUSES,
  demo,
  makeRows,
  type BulkActionsTableAction,
  type BulkActionsTableChannel,
  type BulkActionsTableCopy,
  type BulkActionsTableRow,
  type BulkActionsTableStatus,
} from './bulk-actions/data'

/* Rows worked in bulk (the demo: a store's orders): a reference, date, party,
 * channel and two status columns at a glance, filters for each (and the date
 * and the amount as ranges), search, CSV export and pages. Select rows (Shift
 * for a range, every page from the bar) and the bar becomes a command bar:
 * your primary actions as buttons with their keys, an action that asks first
 * behind a confirmation that names the count, and every action in a menu
 * (⌘K), each with a key that runs it while rows are selected. The statuses,
 * stages, channels and actions are your data. Each action shows at once and
 * goes back, with its reason above the table, if the app refuses it.
 * Built on the Data table block. Pass your `rows`, handle each `on…` or
 * `onAction`; every string is in `copy`. Reduced motion: rows and the bar
 * change in place. */

type Many = (rows: BulkActionsTableRow[]) => Promise<unknown> | unknown

interface BulkActionsTableProps extends Omit<ComponentProps<'section'>, 'children' | 'title'> {
  /** The rows, one each. A new array replaces the rows. Default: 64 demo orders. */
  rows?: BulkActionsTableRow[]
  /** The currency amounts are in. Default 'USD'. */
  currency?: string
  /** The first status column's values, in the filter's order. Default: paid, pending, refunded, failed. */
  statuses?: BulkActionsTableStatus[]
  /** The second status column's values. Default: unfulfilled, partial, fulfilled, returned. */
  stages?: BulkActionsTableStatus[]
  /** Where rows came from. Default: online store, iOS app, Android app, in store. */
  channels?: BulkActionsTableChannel[]
  /** What the selection can do, with its keys. Default: fulfill, print labels, mark as paid, refund, archive, export. */
  actions?: BulkActionsTableAction[]
  /** Runs any action that has no `on…` of its own, with the selected rows. Default: a demo wait. */
  onAction?: (id: string, rows: BulkActionsTableRow[]) => Promise<unknown> | unknown
  /** The `fulfill` action. Default: fulfilled here only. */
  onFulfill?: Many
  /** Print shipping labels for the selection. Default: a demo wait. */
  onPrint?: Many
  /** Mark the selection as paid. Default: marked here only. */
  onMarkPaid?: Many
  /** Refund the selection, after its confirmation. Default: refunded here only. */
  onRefund?: Many
  /** Archive the selection: the rows leave at once and come back if it rejects. Default: archived here only. */
  onArchive?: Many
  /** Export the selection. Default: a CSV of the selected rows, downloaded. */
  onExport?: Many
  /** A row's reference, or Open in its menu. Default: none. */
  onRowOpen?: (row: BulkActionsTableRow) => void
  /** The header's create button. Default: a demo wait. */
  onCreate?: () => Promise<unknown> | unknown
  /** Header buttons in place of the create button. */
  header?: ReactNode
  loading?: boolean
  error?: ReactNode
  onRetry?: () => void
  /** Shown when there are no rows. */
  empty?: ReactNode
  /** The title's level when embedded. Default 2. */
  headingLevel?: 2 | 3 | 4
  theme?: ThemeInput
  /** Inside another page: the card alone, a `section` named by its title. Default true; `false` draws a page around it. */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at 72rem. Default false. */
  fill?: boolean
  /** Any of the table's strings, to rewrite or translate. */
  copy?: Partial<BulkActionsTableCopy>
  /** Formats dates, counts and money (BCP 47). Default: the app's locale (YoujProvider). */
  locale?: string
}

const reason = (error: unknown, fallback: string) => (error instanceof Error && error.message ? error.message : fallback)

const HANDLER = { fulfill: 'onFulfill', print: 'onPrint', paid: 'onMarkPaid', refund: 'onRefund', archive: 'onArchive', export: 'onExport' } as const

function BulkActionsTable({
  rows: rowsProp,
  currency = 'USD',
  statuses = STATUSES,
  stages = STAGES,
  channels = CHANNELS,
  actions = ACTIONS,
  onAction,
  onFulfill,
  onPrint,
  onMarkPaid,
  onRefund,
  onArchive,
  onExport,
  onRowOpen,
  onCreate,
  header,
  loading,
  error,
  onRetry,
  empty,
  headingLevel = 2,
  theme,
  embedded = true,
  fill = false,
  copy: copyProp,
  locale: localeProp,
  className,
  ...rest
}: BulkActionsTableProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const locale = useLocale(localeProp)
  const titleId = useId()
  const Title = embedded ? (`h${headingLevel}` as const) : 'h1'
  const { announce, announcer } = useAnnouncer()
  const source = useMemo(() => rowsProp ?? makeRows(), [rowsProp])
  const [rows, setRows] = useState(source)
  const [shown, setShown] = useState(source)
  if (source !== shown) {
    setShown(source)
    setRows(source)
  }
  const [selected, setSelected] = useState<Record<string, true>>({})
  const [failure, setFailure] = useState<string | null>(null)

  const callbacks: Record<string, Many | undefined> = { fulfill: onFulfill, print: onPrint, paid: onMarkPaid, refund: onRefund, archive: onArchive, export: onExport }
  const run = async (id: string, picked: BulkActionsTableRow[], selection?: DataTableSelection<BulkActionsTableRow>) => {
    const action = actions.find((a) => a.id === id)
    if (!action || picked.length === 0) return
    const ids = new Set(picked.map((o) => o.id))
    const apply = action.apply
    let before: BulkActionsTableRow[] = []
    if (apply) setRows((list) => ((before = list), list.flatMap((o) => (ids.has(o.id) ? (apply(o) ?? []) : [o]))))
    setFailure(null)
    try {
      const callback = callbacks[id] ?? (onAction && ((list: BulkActionsTableRow[]) => onAction(id, list)))
      if (callback) await callback(picked)
      else if (action.csv && selection) selection.exportCsv()
      else await demo(`BulkActionsTable: ${HANDLER[id as keyof typeof HANDLER] ?? 'onAction'}`, id === 'print' ? 700 : 450)
      announce(copy.actionDone(action.done ?? action.label, copy.countOf(picked.length.toLocaleString(locale), picked.length)))
      if (apply) setSelected({})
    } catch (thrown) {
      if (apply) setRows(before)
      setFailure(reason(thrown, copy.failed))
    }
  }
  const latest = useRef({ run, onRowOpen })
  useLayoutEffect(() => {
    latest.current = { run, onRowOpen }
  })
  const [call] = useState(() => ({
    open: (o: BulkActionsTableRow) => latest.current.onRowOpen?.(o),
    run: (a: string, picked: BulkActionsTableRow[]) => void latest.current.run(a, picked),
  }))
  const copyKey = JSON.stringify(copyProp ?? null)
  // biome-ignore lint/correctness/useExhaustiveDependencies: copyKey is copyProp's JSON, so a copy written inline doesn't rebuild the columns on every render; copy is read from the same value
  const columns = useMemo(
    () => rowColumns({ copy, locale, currency, statuses, stages, channels, actions, onOpen: call.open, onAction: call.run }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- copyKey is copyProp's JSON, so a copy written inline doesn't rebuild the columns on every render; copy is read from the same value
    [copyKey, locale, currency, statuses, stages, channels, actions],
  )
  const month = useMemo(() => {
    const start = new Date(DEMO_NOW)
    const counted = new Set(statuses.filter((st) => st.counted).map((st) => st.id))
    const total = rows.filter((o) => counted.has(o.status) && new Date(o.at).getUTCMonth() === start.getUTCMonth()).reduce((sum, o) => sum + o.amount, 0)
    return numberFormat(locale, { style: 'currency', currency, notation: 'compact', maximumFractionDigits: 1 }).format(total)
  }, [rows, statuses, locale, currency])

  const card = (
    <div className="flex flex-col gap-4 text-fg">
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <Title id={titleId} className="text-ui-lg font-semibold tracking-tight text-balance text-fg">
            {copy.title}
          </Title>
          <p className="text-ui-sm text-fg-muted tabular-nums">{copy.description(rows.length.toLocaleString(locale), month)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {header ?? (
            <AsyncButton size="sm" onAction={() => (onCreate ? onCreate() : demo('BulkActionsTable: onCreate', 500))}>
              <PlusIcon />
              {copy.create}
            </AsyncButton>
          )}
        </div>
      </header>
      {failure && (
        <Alert variant="danger" onOpenChange={() => setFailure(null)} dismissLabel={copy.dismiss}>
          <AlertDescription>{failure}</AlertDescription>
        </Alert>
      )}
      <DataTable<BulkActionsTableRow>
        fill
        aria-labelledby={titleId}
        rows={rows}
        columns={columns}
        getRowId={(o) => o.id}
        getRowLabel={(o) => o.ref}
        copy={{ noun: copy.noun }}
        locale={locale}
        loading={loading}
        error={error}
        onRetry={onRetry}
        empty={empty}
        enableRowSelection
        state={{ rowSelection: selected }}
        onRowSelectionChange={setSelected}
        search={{ placeholder: copy.search }}
        exportable={{ filename: copy.noun }}
        initialState={{ sorting: [{ id: 'at', desc: true }], pagination: { pageSize: 10 }, columnPinning: { end: ['actions'] }, columnVisibility: { count: false } }}
        bulkActions={(selection) => <CommandBar count={selection.count} noun={copy.noun} copy={copy} actions={actions} onAction={(id) => run(id, selection.rows, selection)} />}
      />
      {announcer}
    </div>
  )

  const view = embedded ? (
    <section aria-labelledby={titleId} {...rest} className={cn('w-full', !fill && 'max-w-6xl', className)}>
      {card}
    </section>
  ) : (
    <main aria-labelledby={titleId} {...rest} className={cn('min-h-dvh w-full bg-canvas px-4 py-10 text-fg sm:px-8', className)}>
      <div className={cn('mx-auto w-full', !fill && 'max-w-6xl')}>{card}</div>
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { BulkActionsTable, type BulkActionsTableProps }
export type { BulkActionsTableAction, BulkActionsTableChannel, BulkActionsTableCopy, BulkActionsTableIcon, BulkActionsTableRow, BulkActionsTableStatus } from './bulk-actions/data'
