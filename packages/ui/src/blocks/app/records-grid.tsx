'use client'

import { useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ThemeScope, useLocale } from '@youj/core'
import { Reveal } from '@youj/motion'
import { Illustration } from '@youj/illustrations'
import { DownloadIcon, PackageIcon, PlusIcon, PrinterIcon, TruckIcon } from '@youj/icons'
import { AppPage } from '../../components/ui/app-page'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { AsyncButton } from '../../components/ui/async-button'
import { DataGrid, type DataGridSelection } from '../tables/data-grid'
import { toast, Toaster } from '../../components/ui/toast'
import { useIsMobile } from '../../hooks/use-mobile'
import { cn } from '../../lib/utils'
import { HIDDEN, NEXT_STEP, orderActions, orderColumns } from './records-grid/columns'
import { DEFAULT_COPY, type OrdersCopy } from './records-grid/copy'
import { makeOrders, money, NOW, orderViews, TAGS, type Fulfilment, type Order } from './records-grid/data'
import { OrderSheet } from './records-grid/detail'
import type { OrderLine, OrderRow, RecordsGridProps } from './records-grid/props'
import { OrderStats } from './records-grid/stats'

/* Fernhill's orders desk: every order from the shop, the app, wholesale and
 * the counter, in one grid the fulfillment team works through. Thousands of
 * rows scroll virtualized on a desk (only the rows in view are drawn, so
 * sorting and selecting stay instant); on a phone the rows are cards,
 * paged, because a thumb pages better than it flings. Views are tabs (to
 * ship, payment issues, returns), filters are chips over payment,
 * fulfillment, channel, tags and destination. Click a row (or Enter on it)
 * and the order slides in from the side: its items, totals, where it is on
 * its way and the next step. Select a few (Shift for a range) and the bar
 * springs up to pack, ship, print labels or export them, each with Undo.
 * Pass your own `orders` and handle each action with its `on…` callback (a
 * rejection's message shows as a toast and the change rolls back); every
 * string is in `copy`. It is built for the compact layout density (ui.css),
 * taken from the page. Reduced motion: rows, the sheet and the bar change in place. */

const rowSelection = (ids: string[]): Record<string, true> => Object.fromEntries(ids.map((id) => [id, true] as const))

function RecordsGrid({
  theme,
  embedded = true,
  headingLevel = 1,
  brand = { name: 'Fernhill' },
  orders: ordersProp,
  count = 2400,
  loading = false,
  error,
  onRetry,
  empty,
  illustration = 'shopping-bag',
  copy: copyProp,
  locale: localeProp,
  currency = 'USD',
  formatDate,
  tags = TAGS,
  views: viewsProp,
  view,
  defaultView,
  onViewChange,
  selected,
  defaultSelected,
  onSelectedChange,
  openOrder,
  defaultOpenOrder = null,
  onOpenOrderChange,
  now: nowProp = NOW,
  onRowClick,
  onOpen,
  onFulfilmentChange,
  onRefund,
  onPrintLabel,
  onEmail,
  onExport,
  onCreate,
  onShare,
  actions: actionsSlot,
  classNames,
  className,
  ...rest
}: RecordsGridProps) {
  const copy = useMemo(() => ({ ...DEFAULT_COPY, ...copyProp }), [copyProp])
  const locale = useLocale(localeProp)
  const now = +nowProp
  const titleId = useId()
  const Title = `h${headingLevel}` as 'h1'
  const mobile = useIsMobile()
  const source = useMemo(() => ordersProp ?? makeOrders(count), [ordersProp, count])
  const [orders, setOrders] = useState(source)
  // New rows from the app replace the list (and any local edits).
  const [shownSource, setShownSource] = useState(source)
  if (source !== shownSource) {
    setShownSource(source)
    setOrders(source)
  }
  const [innerOpen, setInnerOpen] = useState(defaultOpenOrder)
  const openId = openOrder !== undefined ? openOrder : innerOpen
  // The order the sheet shows: kept while it slides away, so it leaves with its content.
  const [shownId, setShownId] = useState(openId)
  if (openId !== null && openId !== shownId) setShownId(openId)
  const shown = useMemo(() => orders.find((o) => o.id === shownId), [orders, shownId])
  const cash = (n: number) => money(n, false, locale, currency)

  const setOpen = (id: string | null) => {
    if (openOrder === undefined) setInnerOpen(id)
    onOpenOrderChange?.(id)
  }
  /** Awaits the app's callback; a rejection shows its message, then rethrows for the caller to roll back. */
  const run = async (task: () => unknown) => {
    try {
      await task()
    } catch (reason) {
      toast.error(reason instanceof Error && reason.message ? reason.message : copy.failed)
      throw reason
    }
  }
  // The app's callback when there is one, else the demo's toast.
  const perform = (callback: (() => unknown) | false | undefined, demo: () => void) => (callback ? run(callback).catch(() => {}) : demo())

  const open = (o: Order) => {
    setShownId(o.id)
    setOpen(o.id)
    onOpen?.(o)
  }
  /** Moves orders on a step at once, with Undo; the app hears both, and a rejection moves them back. */
  const move = (ids: string[], to: Fulfilment, message: string) => {
    const set = new Set(ids)
    let before: Order[] = []
    setOrders((list) => {
      before = list
      return list.map((o) => (set.has(o.id) ? { ...o, fulfilment: to } : o))
    })
    const restore = () => setOrders(before)
    const moved = () => before.filter((o) => set.has(o.id))
    if (onFulfilmentChange) run(() => onFulfilmentChange(moved(), to)).catch(restore)
    toast.success(message, {
      action: {
        label: copy.undo,
        onClick: () => {
          restore()
          if (!onFulfilmentChange) return
          // Each order goes back to its own step.
          const steps = new Set(moved().map((o) => o.fulfilment))
          for (const step of steps) run(() => onFulfilmentChange(moved().filter((o) => o.fulfilment === step), step)).catch(() => {})
        },
      },
    })
  }
  const advance = (o: Order) => {
    const step = NEXT_STEP[o.fulfilment]
    if (step) move([o.id], step.to, copy.markedOne(o.id, copy.marked[step.to]))
  }
  const refund = (o: Order) => {
    let before: Order[] = []
    setOrders((list) => {
      before = list
      return list.map((x) => (x.id === o.id ? { ...x, payment: 'refunded' } : x))
    })
    const restore = () => setOrders(before)
    if (onRefund) run(() => onRefund(o)).catch(restore)
    toast.success(copy.refunded(cash(o.total), o.customer), onRefund ? undefined : { action: { label: copy.undo, onClick: restore } })
  }
  const label = (rows: Order[]) =>
    perform(onPrintLabel && (() => onPrintLabel(rows)), () =>
      rows.length === 1
        ? toast(copy.printing(rows[0]!.id), { description: `${rows[0]!.carrier} · ${rows[0]!.city}, ${rows[0]!.country}` })
        : toast(copy.printingMany(rows.length), { description: copy.printingTo }),
    )
  const email = (o: Order) => perform(onEmail && (() => onEmail(o)), () => toast(copy.drafting(o.customer), { description: o.email }))
  const exportRows = (rows: Order[]) => perform(onExport && (() => onExport(rows)), () => toast.success(copy.exported(rows.length), { description: copy.exportFile }))

  // Columns and actions are built once per copy, so the grid keeps its state; they call the latest handlers.
  const latest = useRef({ open, label, advance, refund })
  useLayoutEffect(() => {
    latest.current = { open, label, advance, refund }
  })
  const [call] = useState(() => ({
    open: (o: Order) => latest.current.open(o),
    label: (o: Order) => latest.current.label([o]),
    advance: (o: Order) => latest.current.advance(o),
    refund: (o: Order) => latest.current.refund(o),
  }))
  const columns = useMemo(() => orderColumns(copy, tags, currency), [copy, tags, currency])
  const rowActions = useMemo(() => orderActions(call, copy), [call, copy])
  const views = useMemo(() => viewsProp ?? orderViews(orders, copy.views), [viewsProp, orders, copy.views])
  // The grid applies a view's filters when its tab is pressed; the one it starts on (or one the app switches to) is applied here.
  const startView = views.find((v) => v.id === (view ?? defaultView))?.state
  const select = (state: Record<string, true>) => {
    const ids = Object.keys(state).filter((id) => state[id])
    onSelectedChange?.(ids, orders.filter((o) => state[o.id]))
  }

  const any = orders.length > 0
  const scroll = !mobile && any

  const bulkMove = (selection: DataGridSelection<Order>, to: 'packed' | 'shipped') => {
    const verb = copy.marked[to]
    const ids = selection.rows.filter((o) => o.payment === 'paid' && o.fulfilment !== to && o.fulfilment !== 'delivered' && o.fulfilment !== 'returned').map((o) => o.id)
    if (ids.length === 0) return toast(copy.nothingToMark(verb), { description: copy.nothingToMarkHint })
    move(ids, to, ids.length === 1 ? copy.markedOne(ids[0]!, verb) : copy.markedMany(ids.length, verb))
    selection.clear()
  }
  const bulk = (selection: DataGridSelection<Order>) => (
    <>
      <Button variant="ghost" size="sm" onClick={() => bulkMove(selection, 'packed')}>
        <PackageIcon size={16} /> {copy.bulk.packed}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => bulkMove(selection, 'shipped')}>
        <TruckIcon size={16} /> {copy.bulk.shipped}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => label(selection.rows)}>
        <PrinterIcon size={16} /> {copy.bulk.labels}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => exportRows(selection.rows)}>
        <DownloadIcon size={16} /> {copy.bulk.export}
      </Button>
    </>
  )

  const headerActions = actionsSlot ?? (
    <>
      <AsyncButton variant="outline" onAction={onExport && (() => run(() => onExport(orders)))}>
        <DownloadIcon size={16} /> {copy.export}
      </AsyncButton>
      <AsyncButton onAction={onCreate && (() => run(onCreate))}>
        <PlusIcon size={16} /> {copy.create}
      </AsyncButton>
    </>
  )
  const body = (
    <>
      <OrderStats orders={orders} loading={loading} copy={copy} now={now} currency={currency} className={classNames?.stats} />

      {empty !== undefined && !loading && !error && !any ? (
        empty
      ) : (
        <div className={classNames?.grid}>
          <DataGrid<Order>
            fill
            key={view}
            aria-labelledby={titleId}
            copy={{ noun: copy.noun }}
            rows={orders}
            columns={columns}
            getRowId={(o) => o.id}
            getRowLabel={(o) => `${o.id}, ${o.customer}`}
            now={now}
            loading={loading}
            error={error}
            onRetry={onRetry}
            views={views}
            activeView={view}
            defaultActiveView={defaultView}
            onActiveViewChange={onViewChange}
            state={selected ? { rowSelection: rowSelection(selected) } : undefined}
            onRowSelectionChange={onSelectedChange ? select : undefined}
            selectable
            rowActions={rowActions}
            onRowOpen={open}
            onRowClick={onRowClick ?? open}
            bulkActions={bulk}
            search={{ placeholder: copy.search }}
            layout={mobile ? 'cards' : 'table'}
            // Virtualized rows need a fixed height; an empty or loading grid sizes to its panel instead.
            virtualize={scroll}
            height={scroll ? 'min(calc(var(--spacing) * 176), 72dvh)' : undefined}
            pageSize={mobile ? 12 : false}
            initialState={{ columnVisibility: HIDDEN, ...startView, ...(defaultSelected && { rowSelection: rowSelection(defaultSelected) }) }}
            empty={{
              title: copy.emptyTitle,
              description: copy.emptyDescription,
              illustration: typeof illustration === 'string' ? <Illustration scene={illustration} fallback="shopping-bag" unit={16} assemble={false} /> : illustration,
              action: (
                <AsyncButton size="sm" onAction={onShare && (() => run(onShare))}>
                  {copy.emptyAction}
                </AsyncButton>
              ),
            }}
          />
        </div>
      )}

      <OrderSheet
        open={openId !== null}
        order={shown}
        onClose={() => setOpen(null)}
        onLabel={(o) => label([o])}
        onAdvance={advance}
        onRefund={(o) => {
          refund(o)
          setOpen(null)
        }}
        onEmail={email}
        copy={copy}
        locale={locale}
        currency={currency}
        {...(formatDate && { formatDate })}
      />
    </>
  )

  if (embedded) {
    const page = (
      <AppPage
        {...rest}
        // The grid is named by the page's title.
        title={<span id={titleId}>{copy.title}</span>}
        description={copy.description}
        actions={headerActions}
        headingLevel={headingLevel}
        width="fill"
        className={cn('text-fg', className)}
        classNames={{ header: classNames?.header }}
      >
        {body}
        <Toaster />
      </AppPage>
    )
    return theme ? <ThemeScope theme={theme}>{page}</ThemeScope> : page
  }
  return (
    <ThemeScope theme={theme}>
      <div {...rest} className={cn('min-h-dvh bg-canvas text-fg', className)}>
        <header className="border-b border-line bg-surface">
          <div className="mx-auto flex h-14 max-w-352 items-center gap-3 px-4 md:px-8">
            {brand.logo ?? (
              <span aria-hidden className="grid size-7 place-items-center rounded-md bg-accent text-ui-sm font-semibold text-on-accent">
                {brand.name.slice(0, 1)}
              </span>
            )}
            <span className="font-semibold tracking-tight">{brand.name}</span>
            <span aria-hidden className="text-fg-muted">/</span>
            <span className="truncate text-fg-muted">{copy.section}</span>
            <Badge variant="outline" className="ms-auto">
              {copy.station}
            </Badge>
          </div>
        </header>
        <main className="mx-auto flex max-w-352 flex-col gap-5 px-4 py-8 md:px-8">
          <Reveal inView={false} variant="rise" className={cn('flex flex-wrap items-end justify-between gap-4', classNames?.header)}>
            <div className="flex min-w-0 flex-col gap-1">
              <Title id={titleId} className="text-2xl font-semibold tracking-tight text-fg">
                {copy.title}
              </Title>
              <p className="text-ui text-fg-muted">{copy.description}</p>
            </div>
            <div className="flex gap-2">{headerActions}</div>
          </Reveal>
          {body}
        </main>
        <Toaster />
      </div>
    </ThemeScope>
  )
}

export { RecordsGrid, type RecordsGridProps, type OrdersCopy, type OrderRow, type Order, type OrderLine, type Fulfilment as OrderFulfilment }
