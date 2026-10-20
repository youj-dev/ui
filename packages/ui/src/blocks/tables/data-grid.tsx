'use client'

import { useCallback, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react'
import { AnimatePresence, m } from 'motion/react'
import type { RowData } from '@tanstack/react-table'
import { MotionFeatures, ThemeScope, useLabels, useLocale, useYouj, useYoujLayout } from '@youj/core'
import { ContentSwap, PresenceList } from '@youj/motion'
import { DataTableSelectionBar } from '../../components/ui/data-table'
import { TooltipProvider } from '../../components/ui/tooltip'
import { useNow } from '../../hooks/use-now'
import { cn } from '../../lib/utils'
import { useGridAnnouncements } from './data-grid/announce'
import { useForwardedContext, type GridItem } from './data-grid/body'
import { CardList } from './data-grid/cards'
import { GridEnvContext, GridNowContext, type GridEnv } from './data-grid/cells'
import { GridControls } from './data-grid/controls'
import { GridCopyContext, useGridCopy, type DataGridCopy } from './data-grid/copy'
import { useDemo, type Project } from './data-grid/demo'
import { GridHeading, useScrollEdges, useSteadyHeight } from './data-grid/frame'
import { DataGridHeaderRow } from './data-grid/head'
import { estimateLine, renderGridItem, type ItemEnv } from './data-grid/items'
import { ROW_CONTROLS, bodyDim, rowClickable, surfaceTokens, tableClass, useGridLayout } from './data-grid/layout'
import { HEAD_HEIGHT, ROW_HEIGHT, type DataGridColumnDef } from './data-grid/model'
import { useGridNavigation } from './data-grid/nav'
import { Pager, StatePanel } from './data-grid/parts'
import { rootProps, type DataGridProps, type DataGridSelection, type DataGridState, type DataGridView } from './data-grid/props'
import { useGridSelection } from './data-grid/selection'
import { GridSkeletonRows } from './data-grid/skeleton'
import { useGrid } from './data-grid/use-grid'
import { VirtualBody, type GridVirtualHandle } from './data-grid/virtual'

/* The complete records grid: a rich cell for every kind of value (an
 * identity with its logo, a status, tags that overflow into "+2", a meter, a
 * trend line, money and counts in tabular mono, relative dates, people as
 * avatars, a switch, a copyable id, a link), comfortable rows with actions
 * that appear where the pointer is, selection with a floating bar, filters as
 * chips, grouping with totals, detail panels, saved views as tabs, and cards
 * on a narrow screen. TanStack Table v9 is the model, a native `<table
 * role="grid">` the semantics, and every change of state moves through Youj
 * motion. Describe the columns with `createDataGridColumns` (`./data-grid/columns`);
 * left at its defaults it shows a product team's projects. Reduced motion:
 * every change applies at once. */

const EMPTY: never[] = []

function DataGrid<TData extends RowData = Project>(props: DataGridProps<TData>) {
  const { loading = false, error, virtualize = false, embedded = true, fill = false, theme, className } = props
  const k = useYouj()
  const locale = useLocale(props.locale)
  // Without rows or columns it shows its own demo: projects that archiving or marking changes.
  const demoMode = props.rows === undefined && props.columns === undefined
  const demo = useDemo(demoMode)
  const live = (demoMode ? { ...demo.props, ...props } : props) as DataGridProps<TData>
  const rowsIn = (props.rows ?? (demoMode ? demo.rows : EMPTY)) as ReadonlyArray<TData>
  const columnDefs = (props.columns ?? (demoMode ? demo.columns : EMPTY)) as ReadonlyArray<DataGridColumnDef<TData>>
  const copy: DataGridCopy = useGridCopy(useLabels(), demoMode ? { noun: demo.copy.noun, ...props.copy } : props.copy)
  const title = live.title
  const named = title !== undefined && title !== null
  const clock = useNow(60_000)
  const now = live.now === undefined ? clock : typeof live.now === 'number' ? live.now : live.now.getTime()

  const [root, setRoot] = useState<HTMLDivElement | null>(null)
  const model = useGrid(live, rowsIn, columnDefs, copy, root)
  const { table, tableNow, leafColumns, headers, selectionEnabled, hasDetail, items, navIndex, cards, paged, page, pageSize, density } = model
  const { layout, metas, fillerAt, vars, colgroup, span } = useGridLayout(table, leafColumns, model.columns, density)

  /* The UI scale (youj.css section 5) the rows are drawn at, read from the root once it's in the page. */
  const { scaling } = useYoujLayout()
  const scale = useMemo(() => (root && scaling !== null ? Number.parseFloat(getComputedStyle(root).getPropertyValue('--yj-scale')) || 1 : 1), [root, scaling])

  const selection = useGridSelection(model, rowsIn)
  const { isSelected, selectedCount, pageSelected, allPageSelected, clearSelection, selectAll, togglePage } = selection
  const { rowLabel, politeRef, assertiveRef, announce } = useGridAnnouncements({ model, selectedCount, loading, getRowLabel: live.getRowLabel, copy, locale })

  /* ── Keyboard ─────────────────────────────────────────────────────────── */
  const tableRef = useRef<HTMLTableElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const steady = useSteadyHeight(frameRef, props.height !== undefined, scale)
  const virtualRef = useRef<GridVirtualHandle | null>(null)
  const rowHeight = ROW_HEIGHT[density] * scale
  const headHeight = HEAD_HEIGHT[density] * scale
  // The row and group handlers, latest each render, reached through one stable `ctx`.
  const ctx = useForwardedContext(
    {
      toggleRow: selection.toggleRow,
      toggleExpanded: (rowId) => model.setExpanded((old) => ({ ...old, [rowId]: !old[rowId] })),
      toggleGroup: (key) => model.setCollapsedGroups((old) => ({ ...old, [key]: !old[key] })),
    },
    rowLabel,
  )
  // A virtualized grid's line for a keyboard row: they differ only by closed details.
  const lineOfNav = (target: number) => {
    let n = 0
    for (let i = 0; i < items.length; i++) {
      if (items[i]!.kind === 'detail' && !(items[i] as { open: boolean }).open) continue
      if (n === target) return i
      n++
    }
    return items.length - 1
  }
  const nav = useGridNavigation({
    gridRef: tableRef,
    rowCount: navIndex.count,
    colCount: leafColumns.length,
    pageJump: () => Math.max(1, Math.floor(((scrollRef.current?.clientHeight ?? 480) - headHeight) / rowHeight) - 1),
    scrollToRow: virtualize ? (index) => virtualRef.current?.scrollToIndex(lineOfNav(index), { align: 'auto' }) : undefined,
    handlers: {
      toggleRow: selectionEnabled
        ? (tr, shift) => {
            const id = tr.dataset.rowId
            const row = id ? tableNow.current.getRowModel().rowsById[id] : undefined
            if (row?.getCanSelect()) ctx.toggleRow(row.id, !model.rowSelection[row.id], shift)
          }
        : undefined,
      open: (tr) => {
        if (tr.dataset.dgKind === 'group') return false
        const id = tr.dataset.rowId
        const row = id ? tableNow.current.getCoreRowModel().rowsById[id] : undefined
        if (!row) return false
        if (live.onRowOpen) live.onRowOpen(row.original)
        else if (hasDetail) ctx.toggleExpanded(row.id)
        else return false
        return true
      },
      selectAll: selectionEnabled ? () => (selectAll(), true) : undefined,
      escape: () => {
        if (selectedCount === 0) return false
        clearSelection()
        return true
      },
      resize: (col, delta) => {
        const column = leafColumns[col]
        if (!column?.getCanResize() || layout[col]?.grow) return false
        const { minSize = 72, maxSize = 640 } = column.columnDef
        model.setColumnSizing((old) => ({ ...old, [column.id]: Math.round(Math.min(maxSize, Math.max(minSize, column.getSize() + delta))) }))
        return true
      },
    },
  })
  const scheduleEdges = useScrollEdges(scrollRef, cards)
  useLayoutEffect(() => {
    nav.sync()
    scheduleEdges.current()
  })
  const env = useMemo<GridEnv>(() => ({ locale, announce: (message) => announce(message), rowLabel }), [locale, announce, rowLabel])

  /* ── Loading, the state panels and what replaces what ─────────────────── */
  const skeleton = loading && rowsIn.length === 0 && !error
  const refetching = loading && !skeleton
  const status: 'error' | 'empty' | 'rows' = error ? 'error' : !loading && model.rows.length === 0 ? 'empty' : 'rows'
  const filtered = model.columnFilters.length > 0 || model.globalFilter !== ''
  const onRowClick = live.onRowClick
  const clickRow = onRowClick
    ? (event: MouseEvent<HTMLElement>) => {
        const target = event.target as HTMLElement
        if (target.closest(ROW_CONTROLS) || window.getSelection()?.toString()) return
        const id = target.closest<HTMLElement>('tr[data-dg-kind=row], [data-slot=data-grid-card]')?.dataset.rowId
        const row = id ? tableNow.current.getCoreRowModel().rowsById[id] : undefined
        if (row) onRowClick(row.original)
      }
    : undefined
  const clearFilters = () => {
    table.resetColumnFilters(true)
    table.setGlobalFilter('')
  }
  // Sorting, filtering, paging and grouping replace rows: those that leave go at once and the rest glide.
  const orderKey = `${JSON.stringify(model.sorting)}|${JSON.stringify(model.columnFilters)}|${model.globalFilter}|${page}|${pageSize}|${model.grouping}|${status}`
  const [seen, setSeen] = useState<{ key: string; data: unknown; kind: 'presence' | 'reorder' }>({ key: orderKey, data: rowsIn, kind: 'reorder' })
  let change = seen
  if (orderKey !== seen.key) change = { key: orderKey, data: rowsIn, kind: 'reorder' }
  else if (rowsIn !== seen.data) change = { key: orderKey, data: rowsIn, kind: 'presence' }
  if (change !== seen) setSeen(change)

  /* ── Render ───────────────────────────────────────────────────────────── */
  const hintId = useId()
  const titleId = useId()
  const itemEnv: ItemEnv<TData> = {
    navOf: navIndex.of,
    layout,
    fillerAt,
    span,
    leafColumns,
    isSelected,
    activeRowId: live.activeRowId,
    selectionEnabled,
    expanded: model.expanded,
    presence: !virtualize,
    detailBase: useId(),
    actionsOf: model.actionsOf,
    ctx,
    renderDetail: live.renderDetail,
    copy,
    locale,
  }
  const groupStartOf = useCallback((index: number) => {
    for (let i = Math.min(index, items.length - 1); i >= 0; i--) if (items[i]!.kind === 'group') return i
    return -1
  }, [items])
  const itemAt = useCallback((index: number) => items[index], [items])
  const estimate = useCallback((index: number) => estimateLine(items, index, rowHeight, scale), [items, rowHeight, scale])
  const body: ReactNode = virtualize ? (
    <VirtualBody<TData>
      count={status === 'rows' ? items.length : 0}
      itemAt={itemAt}
      estimate={estimate}
      scrollRef={scrollRef}
      headHeight={headHeight}
      span={span}
      activeRow={nav.active}
      groupStartOf={groupStartOf}
      handle={virtualRef}
      // Rows, headings and footers are exactly their estimate; only detail panels are measured.
      renderItem={(item: GridItem<TData>, index, measure) => renderGridItem(item, itemEnv, item.kind === 'detail' ? measure : undefined, index)}
      onRendered={nav.sync}
      onEndReached={live.onEndReached}
      loading={refetching}
      className={bodyDim}
    />
  ) : (
    <PresenceList as="tbody" key={paged ? `page-${page}` : 'rows'} data-reorder={change.kind === 'reorder' || undefined} data-loading={refetching || undefined} className={cn(bodyDim, '[&[data-reorder]>tr[inert]]:hidden')}>
      {status === 'rows' ? items.map((item) => renderGridItem(item, itemEnv)) : null}
    </PresenceList>
  )
  const headerRow = (interactive: boolean) => (
    <DataGridHeaderRow
      headers={headers}
      columns={layout}
      fillerAt={fillerAt}
      multiSorted={model.sorting.length > 1}
      interactive={interactive}
      selectAll={
        selectionEnabled
          ? { checked: allPageSelected, indeterminate: pageSelected > 0 && !allPageSelected, label: paged ? copy.selectAllOnPage : copy.selectAllRows, onChange: togglePage }
          : undefined
      }
    />
  )
  const labelledBy = props['aria-labelledby'] ?? (named ? titleId : undefined)
  const hints = [copy.gridHintArrows, selectionEnabled && copy.gridHintSelect, (live.onRowOpen || live.renderDetail) && copy.gridHintOpen, copy.gridHintSort].filter(Boolean)
  const panel =
    status === 'error' ? (
      <StatePanel tone="error" title={copy.loadFailed(copy.noun)} description={typeof error === 'string' ? error : error === true ? undefined : error} onRetry={live.onRetry} />
    ) : filtered ? (
      <StatePanel tone="filtered" title={copy.noMatches(copy.noun)} description={copy.noMatchesHint} onClear={clearFilters} />
    ) : (
      <StatePanel tone="empty" title={live.empty?.title ?? copy.noItems(copy.noun)} description={live.empty?.description ?? copy.emptyHint(copy.noun)} media={live.empty?.illustration} action={live.empty?.action} />
    )
  const grid = (
    <table
      ref={tableRef}
      role="grid"
      aria-label={props.label ?? (labelledBy ? undefined : copy.noun)}
      aria-labelledby={labelledBy}
      aria-describedby={hintId}
      aria-rowcount={status === 'rows' ? navIndex.count + 1 : 1}
      aria-colcount={leafColumns.length}
      aria-multiselectable={selectionEnabled || undefined}
      aria-busy={loading || undefined}
      data-slot="data-grid-table"
      onKeyDown={nav.onKeyDown}
      onFocus={nav.onFocus}
      onBlur={nav.onBlur}
      className={tableClass}
    >
      {colgroup}
      <thead>{headerRow(true)}</thead>
      {body}
      {virtualize && live.loadingMore && status === 'rows' && (
        <tbody aria-hidden>
          <GridSkeletonRows rows={3} columns={layout} metas={metas} fillerAt={fillerAt} startIndex={items.length} />
        </tbody>
      )}
    </table>
  )
  const skeletonTable = (
    <table aria-hidden inert className={tableClass}>
      {colgroup}
      <thead>{headerRow(false)}</thead>
      <tbody>
        <GridSkeletonRows rows={props.skeletonRows ?? Math.min(paged ? pageSize : 10, 8)} columns={layout} metas={metas} fillerAt={fillerAt} />
      </tbody>
    </table>
  )
  const cardsBody = (
    <div className={cn('relative', refetching && 'cursor-progress')}>
      {skeleton ? (
        <div aria-hidden className="flex flex-col gap-2 p-3">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-36 rounded-xl border border-line bg-(--dg-row-bg)" />
          ))}
        </div>
      ) : status === 'rows' ? (
        <CardList items={items} isSelected={isSelected} activeRowId={live.activeRowId} selectable={selectionEnabled} isExpanded={(id) => model.expanded[id] === true} renderDetail={live.renderDetail} actions={model.actionsOf} ctx={ctx} label={props.label ?? copy.noun} />
      ) : null}
    </div>
  )

  const content = (
    <div ref={setRoot} data-slot="data-grid" data-density={density} data-layout={cards ? 'cards' : 'table'} data-reduced-motion={k.reduced || undefined} style={vars as CSSProperties} className={cn('group/dg relative flex min-w-0 flex-col gap-3', surfaceTokens, onRowClick && rowClickable)}>
      {named && <GridHeading id={titleId} as={embedded ? `h${props.headingLevel ?? 2}` : 'h1'} title={title} description={live.description} />}
      <div
        ref={frameRef}
        data-slot="data-grid-frame"
        className={cn('relative overflow-clip rounded-xl border border-line bg-surface shadow-xs', steady !== undefined && 'flex flex-col')}
        style={{ height: steady }}
      >
        <GridControls props={live} model={model} onClearFilters={clearFilters} />
        <div ref={scrollRef} data-slot="data-grid-scroll" onClick={clickRow} tabIndex={skeleton ? 0 : undefined} className={cn('group/scroll relative overflow-auto yj-scrollbar overscroll-x-contain', cards && 'overflow-x-hidden', steady !== undefined && (status === 'rows' || skeleton ? 'min-h-0 flex-1' : 'flex-none'))} style={status === 'rows' || skeleton ? { height: props.height, maxHeight: props.maxHeight } : { maxHeight: props.maxHeight }}>
          {/* The refetch line under the header: it waits a beat, so a quick answer never flickers. */}
          <div aria-hidden className="pointer-events-none sticky top-(--dg-head-h) z-5 h-0">
            <div className={cn('absolute inset-x-0 top-0 h-0.5 overflow-hidden opacity-0 transition-opacity yj-duration-fast ease-standard', refetching && 'opacity-100 delay-(--yj-duration-fast)')}>
              <div className="h-full w-full origin-left animate-indeterminate bg-accent rtl:[animation-direction:reverse] reduced:animate-none reduced:opacity-50" />
            </div>
          </div>
          {cards ? cardsBody : <ContentSwap loading={skeleton} fallback={skeletonTable}>{grid}</ContentSwap>}
        </div>
        <AnimatePresence initial={false}>
          {status !== 'rows' && !skeleton && (
            <m.div
              key={`${status}-${filtered}`}
              data-slot={`data-grid-${status}`}
              // A message takes the rows' room: the held frame's, or the height the app gave them.
              className={cn((steady !== undefined || props.height !== undefined) && 'flex flex-1 flex-col justify-center')}
              style={props.height !== undefined ? { height: `calc(${typeof props.height === 'number' ? `${props.height}px` : props.height} - var(--dg-head-h))` } : undefined}
              initial={k.reduced ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0, transition: k.reduced ? { type: false } : k.tween('base', 'enter') }}
            >
              {panel}
            </m.div>
          )}
        </AnimatePresence>
        {selectionEnabled && (
          <DataTableSelectionBar
            count={selectedCount}
            total={model.rows.length}
            noun={copy.noun}
            canSelectAll={allPageSelected && selectedCount < model.rows.filter((row) => row.getCanSelect()).length}
            onSelectAll={selectAll}
            onClear={() => {
              const hadFocus = root?.querySelector('[data-slot=data-table-selection-bar]')?.contains(document.activeElement)
              clearSelection()
              if (hadFocus) nav.focusCell(nav.active.current)
            }}
          >
            {selectedCount > 0 && live.bulkActions?.(selection.snapshot())}
          </DataTableSelectionBar>
        )}
        {paged && status === 'rows' && !skeleton && <Pager page={page} pageCount={model.pageCount} pageSize={pageSize} total={model.displayRows.length} noun={copy.noun} onPageChange={model.setPageIndex} />}
      </div>
      <p id={hintId} className="sr-only">
        {hints.join(' ')}
      </p>
      <div ref={politeRef} role="status" aria-live="polite" aria-atomic className="sr-only" />
      <div ref={assertiveRef} role="alert" aria-live="assertive" aria-atomic className="sr-only" />
    </div>
  )

  const wrapped = (
    <MotionFeatures>
      <GridCopyContext.Provider value={copy}>
        <GridEnvContext.Provider value={env}>
          <GridNowContext.Provider value={now}>
            <TooltipProvider delay={400}>{content}</TooltipProvider>
          </GridNowContext.Provider>
        </GridEnvContext.Provider>
      </GridCopyContext.Provider>
    </MotionFeatures>
  )
  const width = cn('w-full', !fill && 'max-w-6xl')
  const Root = named ? 'section' : 'div'
  const view = embedded ? (
    <Root aria-labelledby={named ? titleId : undefined} {...rootProps(props)} className={cn(width, className)}>
      {wrapped}
    </Root>
  ) : (
    <main aria-labelledby={named ? titleId : undefined} {...rootProps(props)} className={cn('min-h-dvh w-full bg-canvas px-4 py-10 text-fg sm:px-8', className)}>
      <div className={cn('mx-auto', width)}>{wrapped}</div>
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { DataGrid, type DataGridProps, type DataGridState, type DataGridView, type DataGridSelection, type DataGridCopy, type Project }
export { createDataGridColumns, type DataGridColumnOptions, type DataGridStatusOptions } from './data-grid/columns'
export type { DataGridRowAction } from './data-grid/body'
// The cells behind the column types, for a column's `render` that keeps their look.
export { IdentityCell, StatusCell, TagsCell } from './data-grid/cells'
export { FigureCell, MeterCell, TrendCell } from './data-grid/figures'
export { BooleanCell, DateCell, IdCell, LinkCell, PeopleCell } from './data-grid/values'
export type { DataGridEmpty } from './data-grid/parts'
export type { DataGridColumnDef, DataGridColumnKind, DataGridColumnMeta, DataGridDensity, DataGridFacet, DataGridOption, DataGridOptionTone, DataGridPerson, DataGridTone } from './data-grid/model'
