'use client'

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import type { RowData } from '@tanstack/react-table'
import { MotionFeatures, ThemeScope, useDirection, useLabels, useLocale, useYouj, useYoujLayout } from '@youj/core'
import { DownloadIcon } from '@youj/icons'
import { ContentSwap, PresenceList } from '@youj/motion'
import { Button } from '../../components/ui/button'
import {
  DataTableConfirmHost,
  DataTableFocusContext,
  DataTablePagination,
  DataTableSelectionBar,
  dataTableToCsv,
  downloadCsv,
  type DataTableColumnDef,
  type DataTableRow,
} from '../../components/ui/data-table'
import { cn } from '../../lib/utils'
import { useAnnouncements } from './data-table/announce'
import { BodyRow, useForwardedContext, type BodyHandlers } from './data-table/body'
import { tableCopy, type DataTableCopy } from './data-table/copy'
import { DEMO_ROW_ID, useDemo, type Deployment } from './data-table/demo'
import { useEditing } from './data-table/editing'
import { FootRow } from './data-table/foot'
import { useTableKeyboard } from './data-table/keyboard'
import { RefetchLine, ResizeGuide, StatusPanel, TableHeading, scrollCue, useRowChange, useScrollEdges, useSkeletonSwap, useSteadyHeight } from './data-table/frame'
import { DataTableHeaderRow } from './data-table/head'
import { HEAD_HEIGHT, ROW_HEIGHT, bodyDim, surfaceTokens, tableClass, useColumnLayout } from './data-table/layout'
import { useTableModel } from './data-table/model'
import { rootProps, type DataTableActiveCell, type DataTableCellEdit, type DataTableInitialState, type DataTableProps, type DataTableSelection, type DataTableState } from './data-table/props'
import { useSelection } from './data-table/selection'
import { SkeletonRows } from './data-table/skeleton'
import { TableToolbar } from './data-table/toolbar'
import { VirtualRows, type VirtualHandle } from './data-table/virtual'

/* The complete dense table: your columns and rows on TanStack Table v9, a
 * native `<table role="grid">` for the semantics and Youj motion for every
 * change of state. Sorting reorders rows in place (they glide), selection
 * raises an action bar with a rolling count, loading resolves skeleton rows
 * into data, edits save optimistically and roll back with a shake, and the
 * grid is one Tab stop driven by the arrow keys. Search, a filter per declared
 * column (values with counts, ranges, dates) with chips, saved views, header
 * menus (sort, pin, move, hide), resizing, density, CSV export, server mode
 * and virtualization are props. It's built from the data table kit
 * (`@youj/react/data-table`); left at its defaults it shows 48 deployments of
 * a web app. Reduced motion: every change applies at once. */

const EMPTY: never[] = []

function DataTable<TData extends RowData = Deployment>(props: DataTableProps<TData>) {
  const { loading = false, error, onCellEdit, headerMenus = true, virtualize = false, embedded = true, fill = false, theme, className } = props
  const k = useYouj()
  const locale = useLocale(props.locale)
  // Without rows or columns it shows its own demo: deployments that a delete or a redeploy changes.
  const demoMode = props.rows === undefined && props.columns === undefined
  const demo = useDemo(demoMode)
  const live = (demoMode ? { getRowId: DEMO_ROW_ID, getRowLabel: DEMO_ROW_ID, ...demo.props, ...props } : props) as DataTableProps<TData>
  const rowsIn = (props.rows ?? (demoMode ? demo.rows : EMPTY)) as ReadonlyArray<TData>
  const columnDefs = (props.columns ?? (demoMode ? demo.columns : EMPTY)) as ReadonlyArray<DataTableColumnDef<TData>>
  const copy: DataTableCopy = tableCopy(useLabels(), demoMode ? { noun: demo.copy.noun, ...props.copy } : props.copy)
  const title = live.title
  const named = title !== undefined && title !== null

  const model = useTableModel(live, rowsIn, columnDefs)
  const { table, tableNow, manual, paginated, selectionEnabled, density, pagination } = model
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const rows = table.getRowModel().rows
  const rowAt = useCallback((index: number) => rows[index], [rows])
  const headerGroups = table.getHeaderGroups()
  const headers = headerGroups[headerGroups.length - 1]?.headers ?? EMPTY
  const leafColumns = headers.map((header) => header.column)
  const totalRows = manual ? (props.rowCount ?? rows.length) : table.getPrePaginatedRowModel().rows.length
  const editingEnabled = onCellEdit !== undefined
  const { layout, metas, fillerAt, vars, colgroup, hasPinnedStart, hasPinnedEnd } = useColumnLayout(table, leafColumns, model.columns, editingEnabled, density)

  /* The UI scale (youj.css section 5) the rows are drawn at. CSS sizes them; the
   * virtualizer places them in px, so it reads the same factor from the root
   * once it's in the page, and again when the scope's scaling changes. */
  const { scaling } = useYoujLayout()
  const [root, setRoot] = useState<HTMLDivElement | null>(null)
  const scale = useMemo(() => (root && scaling !== null ? Number.parseFloat(getComputedStyle(root).getPropertyValue('--yj-scale')) || 1 : 1), [root, scaling])

  const selection = useSelection(model, rows, totalRows)
  const { isSelected, selectedCount, pageSelected, allPageSelected, clearSelection, selectAll, togglePage } = selection
  const { rowLabel, selectLabel, politeRef, assertiveRef, announce } = useAnnouncements({ model, leafColumns, rowsIn, totalRows, selectedCount, loading, getRowLabel: live.getRowLabel, copy, locale })
  const { editing, setEditing, commit } = useEditing({ model, onCellEdit, rowLabel, announce, copy })

  // A page past the end after rows are removed steps back to the last page.
  const pageCount = table.getPageCount()
  useEffect(() => {
    if (paginated && pageCount > 0 && pagination.pageIndex > pageCount - 1) tableNow.current.setPageIndex(pageCount - 1)
  }, [paginated, pageCount, pagination.pageIndex, tableNow])

  /* ── The keyboard grid ───────────────────────────────────────────────── */
  const tableRef = useRef<HTMLTableElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const steady = useSteadyHeight(root, `${props.height ?? ''}|${props.maxHeight ?? ''}`, scale)
  const virtualizerRef = useRef<VirtualHandle | null>(null)
  const rowHeight = ROW_HEIGHT[density] * scale
  const headHeight = HEAD_HEIGHT[density] * scale
  const ctxRef = useRef<BodyHandlers | null>(null)
  const nav = useTableKeyboard({
    model,
    rows,
    leafColumns,
    layout,
    tableRef,
    scrollRef,
    virtualizerRef,
    rowHeight,
    headHeight,
    virtualize,
    headerMenus,
    ctxRef,
    isSelected,
    selectAll,
    selectedCount,
    clearSelection,
    startEdit: setEditing,
    openMenu: setMenuOpen,
    announce,
    copy,
    onActiveCellChange: props.onActiveCellChange,
  })
  const { focusCell, active: activeCellRef } = nav
  const restoreFocus = useCallback(() => focusCell(activeCellRef.current), [focusCell, activeCellRef])
  const { scrollable, schedule } = useScrollEdges(scrollRef)
  // Column sizes, pinning and rows change the scroll width: re-check the edges after every render.
  useLayoutEffect(() => {
    nav.sync()
    schedule.current()
  })

  useLayoutEffect(() => {
    ctxRef.current = {
      toggleRow: selection.toggleRow,
      startEdit: (rowId, columnId) => setEditing({ rowId, columnId }),
      commitEdit: commit,
      tabEdit: (rowId, columnId, value, backward) => {
        const reason = commit(rowId, columnId, value)
        if (reason) return reason
        nav.focusCell({ row: rows.findIndex((row) => row.id === rowId), col: leafColumns.findIndex((column) => column.id === columnId) + (backward ? -1 : 1) })
        return null
      },
      cancelEdit: () => setEditing(null),
    }
  })
  const ctx = useForwardedContext(ctxRef, rowLabel, selectLabel)

  /* ── Loading: the skeleton swaps for the rows, under a stand-in header while it resolves ── */
  const skeleton = loading && rowsIn.length === 0 && !error
  const swapping = useSkeletonSwap(skeleton)
  const refetching = loading && !skeleton

  /* ── Reorder vs presence: sorting, paging and state panels replace rows; edits, inserts and removals animate in place ── */
  const status: 'error' | 'empty' | 'rows' = error ? 'error' : !loading && rows.length === 0 ? 'empty' : 'rows'
  const orderKey = `${JSON.stringify(model.sorting)}|${JSON.stringify(model.columnFilters)}|${model.globalFilter}|${pagination.pageIndex}|${pagination.pageSize}|${status}`
  const changeKind = useRowChange(orderKey, model.displayData)

  /* ── Render ──────────────────────────────────────────────────────────── */
  const hintId = useId()
  const scope = useId()
  const titleId = useId()
  const dir = useDirection()
  const filename = (typeof live.exportable === 'object' && live.exportable.filename) || copy.noun
  const exportRows = (onlySelected: boolean) => {
    const inView = table.getPrePaginatedRowModel().rows
    downloadCsv(dataTableToCsv(table, onlySelected ? inView.filter(isSelected) : inView), filename)
  }
  const headerRow = (interactive: boolean) => (
    <DataTableHeaderRow
      headers={headers}
      columns={layout}
      fillerAt={fillerAt}
      multiSorted={model.sorting.length > 1}
      interactive={interactive}
      onMenuOpenChange={headerMenus ? setMenuOpen : undefined}
      openMenu={menuOpen}
      selectAll={
        selectionEnabled
          ? { checked: allPageSelected, indeterminate: pageSelected > 0 && !allPageSelected, label: paginated ? copy.selectAllOnPage : copy.selectAllRows, onChange: togglePage }
          : undefined
      }
    />
  )
  const pageOffset = paginated ? pagination.pageIndex * pagination.pageSize : 0
  const renderRow = (row: DataTableRow<TData>, index: number, presence: boolean) => (
    <BodyRow<TData>
      key={row.id}
      row={row}
      index={index}
      ariaRowIndex={pageOffset + index + 2}
      selected={isSelected(row)}
      selectable={row.getCanSelect()}
      columns={layout}
      fillerAt={fillerAt}
      presence={presence}
      editing={editing?.rowId === row.id ? editing.columnId : null}
      typed={editing?.rowId === row.id ? editing.typed : undefined}
      edits={model.edits[row.id]}
      ctx={ctx}
    />
  )
  const span = leafColumns.length + (fillerAt === null ? 0 : 1)
  const body = virtualize ? (
    <VirtualRows<TData>
      count={status === 'rows' ? rows.length : 0}
      rowAt={rowAt}
      scrollRef={scrollRef}
      rowHeight={rowHeight}
      headHeight={headHeight}
      span={span}
      activeRow={nav.active}
      handle={virtualizerRef}
      renderRow={(row, index) => renderRow(row, index, false)}
      onRendered={nav.sync}
      loading={refetching}
      className={bodyDim}
    />
  ) : (
    // Sorting, filtering and paging replace rows: the ones that leave go at once and the rest glide.
    <PresenceList as="tbody" data-reorder={changeKind === 'reorder' || undefined} data-loading={refetching || undefined} className={cn(bodyDim, '[&[data-reorder]>tr[inert]]:hidden')}>
      {status === 'rows' ? rows.map((row, index) => renderRow(row, index, true)) : null}
    </PresenceList>
  )
  const hints = [
    copy.gridHintArrows,
    selectionEnabled && copy.gridHintSelect,
    editingEnabled && copy.gridHintEdit,
    (props.enableSorting ?? true) && copy.gridHintSort,
    (props.enableColumnResizing ?? true) && copy.gridHintResize,
    headerMenus && copy.gridHintMenu,
  ].filter(Boolean)
  const hasFooter = paginated && status === 'rows' && !skeleton
  const hasFoot = status === 'rows' && headers.some((header) => header.column.columnDef.footer !== undefined)
  const labelledBy = props['aria-labelledby'] ?? (named ? titleId : undefined)
  const gridLabel = props.label ?? (labelledBy ? undefined : copy.noun)

  const content = (
    <div ref={setRoot} data-slot="data-table" data-density={density} data-reduced-motion={k.reduced || undefined} style={{ ...(vars as CSSProperties), height: steady }} className={cn('relative flex min-w-0 flex-col gap-3', surfaceTokens)}>
      {named && <TableHeading id={titleId} as={embedded ? `h${props.headingLevel ?? 2}` : 'h1'} title={title} description={live.description} actions={props.actions} />}
      <TableToolbar props={live} model={model} copy={copy} locale={locale} totalRows={totalRows} onExport={() => exportRows(false)} onFocusGrid={restoreFocus} />
      <div data-slot="data-table-frame" className={cn('relative overflow-clip rounded-xl border border-line bg-surface shadow-xs', steady !== undefined && 'flex min-h-0 flex-1 flex-col')}>
        {/* Held at its first height, the rows scroll in what the heading, the toolbar and its chips leave, and a message takes their place. */}
        <div className={cn('relative', steady !== undefined && (status === 'rows' || skeleton ? 'flex min-h-0 flex-1 flex-col' : 'flex-none'))}>
          <div
            ref={scrollRef}
            data-slot="data-table-scroll"
            tabIndex={scrollable ? 0 : undefined}
            role={scrollable ? 'group' : undefined}
            aria-label={scrollable ? gridLabel : undefined}
            aria-labelledby={scrollable ? labelledBy : undefined}
            className={cn(
              'group/dt peer/dt relative overflow-auto yj-scrollbar overscroll-x-contain',
              steady !== undefined && 'min-h-0 flex-1',
              // Inset, as the frame clips anything outside it.
              'focus-ring [--ui--focus-offset:calc(var(--ui--focus-width)*-1)]',
              !hasFooter && status === 'rows' && '-mb-px',
            )}
            style={status === 'rows' || skeleton ? { height: props.height, maxHeight: props.maxHeight } : undefined}
          >
            <RefetchLine active={refetching} />
            {swapping && (
              <table aria-hidden inert className={cn(tableClass, 'pointer-events-none absolute start-0 top-0 z-4')}>
                {colgroup}
                <thead>{headerRow(false)}</thead>
              </table>
            )}
            <ContentSwap
              loading={skeleton}
              fallback={
                <table aria-hidden inert className={tableClass}>
                  {colgroup}
                  <thead>{headerRow(false)}</thead>
                  <tbody>
                    <SkeletonRows rows={props.skeletonRows ?? Math.min(paginated ? pagination.pageSize : 12, 10)} columns={layout} metas={metas} fillerAt={fillerAt} />
                  </tbody>
                </table>
              }
            >
              <table
                ref={tableRef}
                role="grid"
                aria-label={gridLabel}
                aria-labelledby={labelledBy}
                aria-describedby={hintId}
                aria-rowcount={totalRows + (hasFoot ? 2 : 1)}
                aria-multiselectable={selectionEnabled || undefined}
                aria-busy={loading || undefined}
                data-slot="data-table-grid"
                data-dt-scope={scope}
                onKeyDown={nav.onKeyDown}
                onFocus={nav.onFocus}
                onBlur={nav.onBlur}
                className={tableClass}
              >
                {colgroup}
                <thead>{headerRow(true)}</thead>
                {body}
                {hasFoot && <FootRow headers={headers} columns={layout} fillerAt={fillerAt} ariaRowIndex={totalRows + 2} />}
              </table>
            </ContentSwap>
            <ResizeGuide id={table.state.columnResizing.isResizingColumn} leafColumns={leafColumns} dir={dir} scope={scope} />
          </div>
          {!hasPinnedStart && <div aria-hidden className={cn(scrollCue, 'start-0 bg-linear-to-r rtl:bg-linear-to-l peer-data-overflow-start/dt:opacity-100')} />}
          {!hasPinnedEnd && <div aria-hidden className={cn(scrollCue, 'end-0 bg-linear-to-l rtl:bg-linear-to-r peer-data-overflow-end/dt:opacity-100')} />}
        </div>

        {/* A message takes the rows' room. */}
        <div className={cn(steady !== undefined && status !== 'rows' && !skeleton && 'flex flex-1 flex-col justify-center')}>
          <StatusPanel
            status={skeleton ? 'rows' : status}
            filtered={model.columnFilters.length > 0 || model.globalFilter !== ''}
            error={error}
            empty={props.empty}
            onRetry={props.onRetry}
            onClearFilters={() => {
              table.resetColumnFilters(true)
              table.setGlobalFilter('')
            }}
            copy={copy}
          />
        </div>

        {selectionEnabled && (
          <DataTableSelectionBar
            count={selectedCount}
            total={totalRows}
            noun={copy.noun}
            canSelectAll={paginated && allPageSelected && selectedCount < totalRows}
            onSelectAll={selectAll}
            onClear={() => {
              const hadFocus = root?.querySelector('[data-slot=data-table-selection-bar]')?.contains(document.activeElement)
              clearSelection()
              if (hadFocus) nav.focusCell(nav.active.current)
            }}
          >
            {/* Built only while something is selected and the app asked for it. */}
            {selectedCount > 0 && live.bulkActions?.(selection.snapshot(() => exportRows(true)))}
            {live.exportable && (
              <Button variant="ghost" size="sm" onClick={() => exportRows(true)}>
                <DownloadIcon />
                {copy.export}
              </Button>
            )}
          </DataTableSelectionBar>
        )}

        {hasFooter && (
          <div className="border-t border-line">
            <DataTablePagination
              pageIndex={pagination.pageIndex}
              pageSize={pagination.pageSize}
              pageCount={pageCount}
              rowCount={totalRows}
              pageSizeOptions={props.pageSizeOptions ?? [10, 25, 50, 100]}
              noun={copy.noun}
              onPageChange={(index) => table.setPageIndex(index)}
              onPageSizeChange={(size) => table.setPageSize(size)}
            />
          </div>
        )}
      </div>

      <p id={hintId} className="sr-only">
        {hints.join(' ')}
      </p>
      <div ref={politeRef} role="status" aria-live="polite" aria-atomic className="sr-only" />
      <div ref={assertiveRef} role="alert" aria-live="assertive" aria-atomic className="sr-only" />
    </div>
  )

  // Menus and dialogs the table opens hand focus back to the grid when what opened them is gone.
  const grid = (
    <MotionFeatures>
      <DataTableFocusContext.Provider value={restoreFocus}>
        <DataTableConfirmHost>{content}</DataTableConfirmHost>
      </DataTableFocusContext.Provider>
    </MotionFeatures>
  )
  const width = cn('w-full', !fill && 'max-w-6xl')
  const Root = named ? 'section' : 'div'
  const view = embedded ? (
    <Root aria-labelledby={named ? titleId : undefined} {...rootProps(props)} className={cn(width, className)}>
      {grid}
    </Root>
  ) : (
    <main aria-labelledby={named ? titleId : undefined} {...rootProps(props)} className={cn('min-h-dvh w-full bg-canvas px-4 py-10 text-fg sm:px-8', className)}>
      <div className={cn('mx-auto', width)}>{grid}</div>
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { DataTable, type DataTableProps, type DataTableState, type DataTableInitialState, type DataTableActiveCell, type DataTableCellEdit, type DataTableSelection, type DataTableCopy, type Deployment }
