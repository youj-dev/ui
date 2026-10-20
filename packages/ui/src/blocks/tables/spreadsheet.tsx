'use client'

import { useId, useMemo, useRef, useState, type ClipboardEvent, type ComponentProps, type KeyboardEvent, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { RedoIcon, UndoIcon } from '@youj/icons'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { Button } from '../../components/ui/button'
import { DataTableColumnFilter, type DataTableInstance } from '../../components/ui/data-table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip'
import { useAnnouncer } from '../../hooks/use-announcer'
import { cn, numberFormat } from '../../lib/utils'
import { DataTable, type DataTableActiveCell } from './data-table'
import { LETTERS, sheetColumns } from './spreadsheet/columns'
import { CATEGORIES, DEFAULT_COPY, isField, makeRows, parseField, type SpreadsheetTableCopy, type SpreadsheetTableEdit, type SpreadsheetTableRow } from './spreadsheet/data'
import { FormulaBar, type FormulaCell } from './spreadsheet/formula-bar'
import { useSheet, type Patch } from './spreadsheet/use-sheet'

/* Rows you edit like a spreadsheet (the demo: a stock sheet): every cell but the reference edits
 * in place (Enter, F2, typing or a double click), the name box and formula
 * bar show where you are and what's in the cell (Value shows its formula),
 * and a sticky totals row sums what's in view. Paste a block of cells from
 * Excel or Google Sheets and it lands from the active cell on, each value
 * checked against its column; ⌘Z and ⇧⌘Z (Ctrl+Z, Ctrl+Y) undo and redo,
 * a paste as one step. Every change shows at once and goes back if the app
 * refuses it. Built on the Data table block, with the SKU pinned and the
 * columns resizable. Reduced motion: values change in place. */

type Ref = Pick<DataTableActiveCell, 'rowId' | 'columnId'>

interface SpreadsheetTableProps extends Omit<ComponentProps<'section'>, 'children' | 'title'> {
  /** The rows, one each. A new array replaces the rows (undo keeps working for the rows still there). Default: 32 lines of outdoor gear. */
  rows?: SpreadsheetTableRow[]
  /** What Category can be. Default: Apparel, Footwear, Camp, Climb, Accessories. */
  categories?: readonly string[]
  /** The currency costs are in. Default 'USD'. */
  currency?: string
  /** Saves changed cells, an edit, a paste, an undo or a redo at a time. A rejection puts them back. Default: kept here only. */
  onEdit?: (edits: SpreadsheetTableEdit[]) => Promise<unknown> | unknown
  /** Header buttons beside Undo and Redo. */
  actions?: ReactNode
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
  /** Any of the sheet's strings, to rewrite or translate. */
  copy?: Partial<SpreadsheetTableCopy>
  /** Formats and reads numbers and money (BCP 47). Default: the app's locale (YoujProvider). */
  locale?: string
}

const reason = (error: unknown, fallback: string) => (error instanceof Error && error.message ? error.message : fallback)
const inField = (target: EventTarget) => (target as HTMLElement).closest('input, textarea, select, [contenteditable="true"]') !== null

function SpreadsheetTable({
  rows: rowsProp,
  categories = CATEGORIES,
  currency = 'USD',
  onEdit,
  actions,
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
}: SpreadsheetTableProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const locale = useLocale(localeProp)
  const titleId = useId()
  const Title = embedded ? (`h${headingLevel}` as const) : 'h1'
  const { announce, announcer } = useAnnouncer()
  const [failure, setFailure] = useState<string | null>(null)
  const source = useMemo(() => rowsProp ?? makeRows(), [rowsProp])
  const sheet = useSheet({ source, onEdit, onFailure: (thrown) => setFailure(reason(thrown, copy.failed)) })
  const { items } = sheet
  // The cell the keyboard is on; until one is picked, A1.
  const [picked, setPicked] = useState<Ref | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const tableRef = useRef<DataTableInstance<SpreadsheetTableRow> | null>(null)

  const copyKey = JSON.stringify(copyProp ?? null)
  // biome-ignore lint/correctness/useExhaustiveDependencies: copyKey is copyProp's JSON, so a copy written inline doesn't rebuild the columns on every render; copy is read from the same value
  const columns = useMemo(
    () => sheetColumns({ copy, locale, currency, categories }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- copyKey is copyProp's JSON, so a copy written inline doesn't rebuild the columns on every render; copy is read from the same value
    [copyKey, locale, currency, categories],
  )
  const formats = useMemo(
    () => ({
      count: numberFormat(locale),
      plain: numberFormat(locale, { useGrouping: false, maximumFractionDigits: 2 }),
      money: numberFormat(locale, { style: 'currency', currency, notation: 'compact', maximumFractionDigits: 1 }),
    }),
    [locale, currency],
  )
  const label = (columnId: string) => copy.columns[columnId as keyof SpreadsheetTableCopy['columns']] ?? columnId
  const text = (value: unknown) => (typeof value === 'number' ? formats.plain.format(value) : String(value ?? ''))

  /** Where a cell sits now (rows re-sort), and what the formula bar shows for it. */
  const locate = (table: DataTableInstance<SpreadsheetTableRow>, at: Ref | null) => {
    const rows = table.getRowModel().rows
    const columnIds = (table.getHeaderGroups().at(-1)?.headers ?? []).map((header) => header.column.id)
    const ref = at ?? (rows[0] ? { rowId: rows[0].id, columnId: 'ref' } : null)
    const rowIndex = ref ? rows.findIndex((row) => row.id === ref.rowId) : -1
    if (!ref || rowIndex === -1) return null
    const n = rowIndex + 1
    const item = rows[rowIndex]!.original
    const cell: FormulaCell =
      ref.columnId === 'value'
        ? { address: `${LETTERS.value}${n}`, text: `=${LETTERS.quantity}${n}*${LETTERS.unitValue}${n}`, editable: false }
        : ref.columnId in LETTERS
          ? { address: `${LETTERS[ref.columnId]}${n}`, text: text(item[ref.columnId as keyof SpreadsheetTableRow]), editable: isField(ref.columnId) }
          : { address: `${n}:${n}`, text: '', editable: false }
    return { ...ref, rows, columnIds, rowIndex, colIndex: columnIds.indexOf(ref.columnId), item, cell }
  }

  const describe = (patches: readonly Patch[]) => {
    if (patches.length !== 1) return copy.cells(formats.count.format(patches.length), patches.length)
    const [patch] = patches as [Patch]
    const rowRef = items.find((item) => item.id === patch.id)?.ref ?? ''
    return copy.changed(label(patch.field), rowRef, text(patch.after))
  }
  const change = (patches: Patch[]) =>
    sheet.commit(patches).then(
      () => patches.length > 0 && announce(describe(patches)),
      (thrown) => setFailure(reason(thrown, copy.failed)),
    )
  const walk = async (direction: 'undo' | 'redo') => {
    const step = await sheet[direction]()
    if (step) announce((direction === 'undo' ? copy.undid : copy.redid)(describe(step)))
  }
  const focusCell = (at: Ref | null) => {
    const table = tableRef.current
    const spot = table && locate(table, at)
    if (!spot || spot.colIndex === -1) return
    rootRef.current?.querySelector<HTMLElement>(`[role=grid] [data-dt-row="${spot.rowIndex}"][data-dt-col="${spot.colIndex}"]`)?.focus()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (inField(event.target) || !(event.metaKey || event.ctrlKey) || event.altKey) return
    const key = event.key.toLowerCase()
    if (key === 'z' || key === 'y') {
      event.preventDefault()
      void walk(key === 'y' || event.shiftKey ? 'redo' : 'undo')
    }
  }
  // Copy and paste reach the focused cell, so they work from the grid without a permission prompt.
  const inGrid = (target: EventTarget) => !inField(target) && (target as HTMLElement).closest('[role=grid]') !== null
  const onCopy = (event: ClipboardEvent<HTMLDivElement>) => {
    const spot = tableRef.current && inGrid(event.target) ? locate(tableRef.current, picked) : null
    if (!spot || spot.columnId === 'row') return
    event.preventDefault()
    event.clipboardData.setData('text/plain', spot.columnId === 'value' ? text(spot.item.quantity * spot.item.unitValue) : spot.cell.text)
    announce(copy.copied(spot.cell.address))
  }
  const onPaste = (event: ClipboardEvent<HTMLDivElement>) => {
    const spot = tableRef.current && inGrid(event.target) ? locate(tableRef.current, picked) : null
    const pasted = event.clipboardData.getData('text/plain')
    if (!spot || spot.colIndex === -1 || !pasted) return
    event.preventDefault()
    // Rows by line, cells by tab: what Excel, Numbers and Google Sheets put on the clipboard.
    const block = pasted.replace(/\r?\n$/, '').split(/\r?\n/).map((line) => line.split('\t'))
    const patches: Patch[] = []
    let skipped = 0
    block.forEach((line, r) =>
      line.forEach((raw, c) => {
        const row = spot.rows[spot.rowIndex + r]
        const field = spot.columnIds[spot.colIndex + c]
        const parsed = row && field && isField(field) ? parseField(field, raw, categories, locale, copy) : null
        if (row && field && isField(field) && parsed && 'value' in parsed) patches.push({ id: row.id, field, before: row.original[field], after: parsed.value })
        else skipped++
      }),
    )
    const cells = (n: number) => copy.cells(formats.count.format(n), n)
    void sheet.commit(patches).catch((thrown) => setFailure(reason(thrown, copy.failed)))
    announce([patches.length > 0 && copy.pasted(cells(patches.length)), skipped > 0 && copy.skipped(cells(skipped))].filter(Boolean).join('. '))
  }

  const units = items.reduce((sum, item) => sum + item.quantity, 0)
  const worth = items.reduce((sum, item) => sum + item.quantity * item.unitValue, 0)
  const historyButton = (direction: 'undo' | 'redo') => {
    const Icon = direction === 'undo' ? UndoIcon : RedoIcon
    const name = copy[direction]
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={name}
              aria-keyshortcuts={direction === 'undo' ? 'Meta+Z Control+Z' : 'Meta+Shift+Z Control+Y'}
              disabled={direction === 'undo' ? !sheet.canUndo : !sheet.canRedo}
              onClick={() => void walk(direction)}
            />
          }
        >
          <Icon className="rtl:-scale-x-100" />
        </TooltipTrigger>
        <TooltipContent>{name}</TooltipContent>
      </Tooltip>
    )
  }

  const card = (
    <TooltipProvider delay={400}>
      <div ref={rootRef} className="flex flex-col gap-4 text-fg" onKeyDown={onKeyDown} onCopy={onCopy} onPaste={onPaste}>
        <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            <Title id={titleId} className="text-ui-lg font-semibold tracking-tight text-balance text-fg">
              {copy.title}
            </Title>
            <p className="text-ui-sm text-fg-muted tabular-nums">
              {copy.description(formats.count.format(items.length), formats.count.format(units), formats.money.format(worth))}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            {historyButton('undo')}
            {historyButton('redo')}
            {actions}
          </div>
        </header>
        {failure && (
          <Alert variant="danger" onOpenChange={() => setFailure(null)} dismissLabel={copy.dismiss}>
            <AlertDescription>{failure}</AlertDescription>
          </Alert>
        )}
        <DataTable<SpreadsheetTableRow>
          fill
          // A sheet outlines its active cell however it got there, a click included.
          className="[&_[role=gridcell]:focus]:outline-2 [&_[role=gridcell]:focus]:-outline-offset-2 [&_[role=gridcell]:focus]:outline-focus [&_[role=gridcell]:focus]:outline-solid"
          aria-labelledby={titleId}
          rows={items}
          columns={columns}
          getRowId={(item) => item.id}
          getRowLabel={(item) => item.ref}
          copy={{ noun: copy.noun }}
          locale={locale}
          loading={loading}
          error={error}
          onRetry={onRetry}
          empty={empty}
          paginated={false}
          maxHeight="min(36rem, 70dvh)"
          defaultDensity="compact"
          showDensityToggle={false}
          showFilters={false}
          exportable={{ filename: copy.noun }}
          initialState={{ columnPinning: { start: ['row', 'ref'] } }}
          onActiveCellChange={(cell) => cell && setPicked({ rowId: cell.rowId, columnId: cell.columnId })}
          onCellEdit={({ rowId, columnId, value, previousValue }) =>
            isField(columnId) ? sheet.commit([{ id: rowId, field: columnId, before: previousValue as Patch['before'], after: value as Patch['after'] }]) : undefined
          }
          toolbar={(table) => {
            tableRef.current = table
            const spot = locate(table, picked)
            const category = table.getColumn('category')
            return (
              <>
                <FormulaBar
                  cell={spot?.cell ?? null}
                  copy={copy}
                  onLeave={() => focusCell(spot)}
                  onCommit={(typed) => {
                    if (!spot || !isField(spot.columnId)) return null
                    const parsed = parseField(spot.columnId, typed, categories, locale, copy)
                    if ('error' in parsed) return parsed.error
                    void change([{ id: spot.rowId, field: spot.columnId, before: spot.item[spot.columnId], after: parsed.value }])
                    return null
                  }}
                />
                {category && <DataTableColumnFilter column={category} />}
              </>
            )
          }}
        />
        {announcer}
      </div>
    </TooltipProvider>
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

export { SpreadsheetTable, type SpreadsheetTableProps }
export type { SpreadsheetTableCopy, SpreadsheetTableEdit, SpreadsheetTableField, SpreadsheetTableRow } from './spreadsheet/data'
