'use client'

import { useId, useLayoutEffect, useMemo, useRef, useState, type ElementType, type HTMLAttributes, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { Reveal } from '@youj/motion'
import { ArchiveIcon, DownloadIcon, PlusIcon, TagIcon, UploadIcon, UserPlusIcon, UsersIcon } from '@youj/icons'
import { AppPage } from '../../components/ui/app-page'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { AsyncButton } from '../../components/ui/async-button'
import { DataGrid, type DataGridSelection, type DataGridStatusOptions, type DataGridView } from '../tables/data-grid'
import { toast, Toaster } from '../../components/ui/toast'
import { cn } from '../../lib/utils'
import { customerActions, customerColumns, HIDDEN } from './customers/columns'
import { DEFAULT_COPY, NOW, SUMMARY, TAGS, customerViews, makeCustomers, type Customer, type CustomersCopy, type CustomersSummary } from './customers/data'
import { CustomerDetail } from './customers/detail'
import { CustomerStats } from './customers/stats'

/* Tessera's customers: every account the business bills, in one grid built
 * to be read. Health is a badge, revenue sits in tabular mono with its
 * units muted, seats fill a meter, usage draws its own trend, and the owners
 * are faces. Views are tabs (at risk, enterprise, renewing soon), filters are
 * chips, rows group by any status and open a panel with the contact and the
 * last twelve weeks. Select a few (Shift for a range) and the bar springs up
 * to assign, tag, export or archive them, with Undo. On a phone the rows are
 * cards. Pass your own `customers`, handle each action with its `on…`
 * callback (a rejection's message shows as a toast); every string is in
 * `copy`. It is built for the compact layout density (ui.css), taken from the page.
 * Reduced motion: rows, panels and the bar change in place. */

/** A customer account, one row of the grid. */
type CustomerRow = Customer
type Rows = (rows: CustomerRow[]) => Promise<unknown> | unknown
type Row = (row: CustomerRow) => Promise<unknown> | unknown

const rowSelection = (ids: string[]): Record<string, true> => Object.fromEntries(ids.map((id) => [id, true] as const))

interface CustomersProps extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'title'> {
  /** A theme to force on the block. Default: none, so it inherits the app's (YoujProvider or a ThemeScope around it). */
  theme?: ThemeInput
  /** A page in your app's frame: the shared page header (AppPage) and the frame's gutter, across the whole width, with no top bar of its own. Default true; `false` draws its own page (the top bar and a centered canvas). */
  embedded?: boolean
  /** The title's heading level. Default 1. */
  headingLevel?: 1 | 2 | 3
  /** The product in the standalone top bar. Default: Tessera, with its initial as the logo. */
  brand?: { name: string; logo?: ReactNode }
  /** The accounts, one row each. Passing a new array replaces the rows. Default: `count` seeded demo accounts. */
  customers?: CustomerRow[]
  /** How many demo accounts to show without `customers`. Default 64. */
  count?: number
  /** Loading, before the accounts arrive: skeleton stats and rows. Default false. */
  loading?: boolean
  /** Replaces the rows with an error panel; a string is its message. Default: none. */
  error?: ReactNode
  /** The error panel's Retry. Default: none. */
  onRetry?: () => void
  /** Replaces the grid when there are no accounts. Default: the grid's empty state from `copy.empty…`, with an import. */
  empty?: ReactNode
  /** Any of the page's strings, to rewrite or translate. Default: the demo's English. */
  copy?: Partial<CustomersCopy>
  /** Formats numbers, money and dates. Default: the app's locale (YoujProvider's `locale`), else en-US. */
  locale?: string
  /** The currency MRR is in. Default 'USD'. */
  currency?: string
  /** The quarter's target and last month's figures, for the stats. Default: the demo's. */
  summary?: Partial<CustomersSummary>
  /** The tags rows can carry, by key, with their labels. Default: the demo's seven. */
  tags?: Record<string, { label: string }>
  /** The health values rows can carry, by key, with their labels and tones, in sort order. Default: healthy, trial, at risk and churning (labels from `copy.health`). The stat cards still count those four. */
  healths?: DataGridStatusOptions
  /** The renewal values rows can carry, by key, with their labels and tones, in sort order. Default: overdue, this month, next quarter and later (labels from `copy.renewal`). The stat cards still count overdue and this month. */
  renewals?: DataGridStatusOptions
  /** The saved views, as tabs. Default: All, At risk, Enterprise and Renewing soon, counted from the rows. */
  views?: DataGridView[]
  /** The open view's id (controlled). Default: uncontrolled. */
  view?: string
  /** The view open at first, uncontrolled. Default: the first. */
  defaultView?: string
  /** Called when another view opens. */
  onViewChange?: (view: string) => void
  /** The selected rows' ids (controlled). Default: uncontrolled. */
  selected?: string[]
  /** The rows selected at first, uncontrolled. Default: none. */
  defaultSelected?: string[]
  /** Called when the selection changes, with the ids and the rows. */
  onSelectedChange?: (ids: string[], rows: CustomerRow[]) => void
  /** The moment relative dates count from. Default: the demo's fixed Sep 29, 2026, so server and browser agree. */
  now?: Date | number
  /** A click on a row, anywhere but its own controls. Default: none (the row's chevron opens its panel). */
  onRowClick?: (row: CustomerRow) => void
  /** An account's page: the panel's View account becomes a link to it. Default: no links. */
  getHref?: (row: CustomerRow) => string
  /** Renders internal links, e.g. Next.js `Link`. Default 'a'. */
  linkComponent?: ElementType
  /** Open account (row menu) and View account (panel). Default: a demo toast. */
  onOpen?: Row
  /** Email contact. Default: a demo toast. */
  onEmail?: Row
  /** Assign owner, from a row or the selection. Default: a demo toast. */
  onAssign?: Rows
  /** Add tag, from a row or the selection. Default: a demo toast. */
  onTag?: Rows
  /** Export the selection. Default: a demo toast. */
  onExport?: Rows
  /** Archive: the rows leave at once and come back if it rejects. Default: archived here only. */
  onArchive?: Rows
  /** Undo after an archive: the rows come back. Default: restored here only. */
  onRestore?: Rows
  /** A row's auto-renew switch: it flips at once and flips back if this rejects. Default: a demo toast. */
  onAutoRenewChange?: (row: CustomerRow, value: boolean) => Promise<unknown> | unknown
  /** The header's (and the empty state's) Import button. Default: does nothing. */
  onImport?: () => Promise<unknown> | unknown
  /** The header's New customer button. Default: does nothing. */
  onCreate?: () => Promise<unknown> | unknown
  /** Header actions, replacing Import and New customer. Default: those two. */
  actions?: ReactNode
  /** Classes on key parts. */
  classNames?: Partial<Record<'header' | 'stats' | 'grid', string>>
}

function Customers({
  theme,
  embedded = true,
  headingLevel = 1,
  brand = { name: 'Tessera' },
  customers: customersProp,
  count = 64,
  loading = false,
  error,
  onRetry,
  empty,
  copy: copyProp,
  locale: localeProp,
  currency = 'USD',
  summary: summaryProp,
  tags = TAGS,
  healths,
  renewals,
  views: viewsProp,
  view,
  defaultView,
  onViewChange,
  selected,
  defaultSelected,
  onSelectedChange,
  now = NOW,
  onRowClick,
  getHref,
  linkComponent,
  onOpen,
  onEmail,
  onAssign,
  onTag,
  onExport,
  onArchive,
  onRestore,
  onAutoRenewChange,
  onImport,
  onCreate,
  actions: actionsSlot,
  classNames,
  className,
  ...rest
}: CustomersProps) {
  const copy = useMemo(() => ({ ...DEFAULT_COPY, ...copyProp }), [copyProp])
  const locale = useLocale(localeProp)
  const summary = { ...SUMMARY, ...summaryProp }
  const titleId = useId()
  const Title = `h${headingLevel}` as 'h1'
  const source = useMemo(() => customersProp ?? makeCustomers(count), [customersProp, count])
  const [customers, setCustomers] = useState(source)
  // New rows from the app replace the list (and any local edits).
  const [shownSource, setShownSource] = useState(source)
  if (source !== shownSource) {
    setShownSource(source)
    setCustomers(source)
  }

  const subject = (rows: Customer[]) => (rows.length === 1 ? rows[0]!.name : copy.many(rows.length))
  /** Awaits the app's callback; a rejection shows its message, then rethrows for the caller to undo. */
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

  const archive = (gone: Customer[]) => {
    const ids = new Set(gone.map((c) => c.id))
    let before: Customer[] = []
    setCustomers((list) => {
      before = list
      return list.filter((c) => !ids.has(c.id))
    })
    const restore = () => setCustomers(before)
    if (onArchive) run(() => onArchive(gone)).catch(restore)
    toast(copy.archived(subject(gone)), {
      action: { label: copy.undo, onClick: () => (restore(), onRestore && run(() => onRestore(gone)).catch(() => {})) },
    })
  }
  const setAutoRenew = (customer: Customer, value: boolean) => {
    const flip = (to: boolean) => setCustomers((list) => list.map((c) => (c.id === customer.id ? { ...c, autoRenew: to } : c)))
    flip(value)
    if (onAutoRenewChange) run(() => onAutoRenewChange(customer, value)).catch(() => flip(!value))
    else toast.success(value ? copy.autoRenewOn(customer.name) : copy.autoRenewOff(customer.name))
  }
  const email = (c: Customer) => perform(onEmail && (() => onEmail(c)), () => toast(copy.drafting(c.contact.name), { description: c.contact.email }))
  const open = (c: Customer) => perform(onOpen && (() => onOpen(c)), () => toast(copy.opening(c.name)))
  const assign = (rows: Customer[]) => perform(onAssign && (() => onAssign(rows)), () => toast(copy.chooseOwner(subject(rows))))
  const tag = (rows: Customer[]) => perform(onTag && (() => onTag(rows)), () => toast(copy.tagging(subject(rows))))
  const exportRows = (rows: Customer[]) => perform(onExport && (() => onExport(rows)), () => toast.success(copy.exported(copy.many(rows.length)), { description: copy.exportFile }))

  // Columns and actions are built once per copy, so the grid keeps its state; they call the latest handlers.
  const latest = useRef({ archive, setAutoRenew, email, open, assign, tag })
  useLayoutEffect(() => {
    latest.current = { archive, setAutoRenew, email, open, assign, tag }
  })
  const [call] = useState(() => ({
    setAutoRenew: (c: Customer, v: boolean) => latest.current.setAutoRenew(c, v),
    email: (c: Customer) => latest.current.email(c),
    open: (c: Customer) => latest.current.open(c),
    assign: (c: Customer) => latest.current.assign([c]),
    tag: (c: Customer) => latest.current.tag([c]),
    archive: (c: Customer) => latest.current.archive([c]),
  }))
  const columns = useMemo(() => customerColumns(call.setAutoRenew, copy, tags, currency, healths, renewals), [call, copy, tags, currency, healths, renewals])
  const rowActions = useMemo(() => customerActions(call, copy.actions), [call, copy.actions])
  const views = useMemo(() => viewsProp ?? customerViews(customers, copy.views), [viewsProp, customers, copy.views])
  // The grid applies a view's filters when its tab is pressed; the one it starts on (or one the app switches to) is applied here.
  const startView = views.find((v) => v.id === (view ?? defaultView))?.state
  const select = (state: Record<string, true>) => {
    const ids = Object.keys(state).filter((id) => state[id])
    onSelectedChange?.(ids, customers.filter((c) => state[c.id]))
  }

  const bulk = (selection: DataGridSelection<Customer>) => (
    <>
      <Button variant="ghost" size="sm" onClick={() => assign(selection.rows)}>
        <UserPlusIcon size={16} /> {copy.bulk.assign}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => tag(selection.rows)}>
        <TagIcon size={16} /> {copy.bulk.tag}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => exportRows(selection.rows)}>
        <DownloadIcon size={16} /> {copy.bulk.export}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="text-danger-text hover:bg-danger-subtle hover:text-danger-text"
        onClick={() => {
          archive(selection.rows)
          selection.clear()
        }}
      >
        <ArchiveIcon size={16} /> {copy.bulk.archive}
      </Button>
    </>
  )

  const headerActions = actionsSlot ?? (
    <>
      <AsyncButton variant="outline" onAction={onImport && (() => run(onImport))}>
        <UploadIcon size={16} /> {copy.import}
      </AsyncButton>
      <AsyncButton onAction={onCreate && (() => run(onCreate))}>
        <PlusIcon size={16} /> {copy.create}
      </AsyncButton>
    </>
  )
  const body = (
    <>
      <CustomerStats customers={customers} loading={loading} copy={copy} summary={summary} locale={locale} currency={currency} className={classNames?.stats} />

      {empty !== undefined && !loading && !error && customers.length === 0 ? (
        empty
      ) : (
        <div className={classNames?.grid}>
          <DataGrid<Customer>
            fill
            key={view}
            aria-labelledby={titleId}
            copy={{ noun: copy.noun }}
            rows={customers}
            columns={columns}
            getRowId={(c) => c.id}
            getRowLabel={(c) => c.name}
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
            onRowClick={onRowClick}
            renderDetail={(c) => <CustomerDetail customer={c} onEmail={email} onOpen={open} copy={copy} href={getHref?.(c)} linkComponent={linkComponent} />}
            bulkActions={bulk}
            pageSize={20}
            initialState={{ columnVisibility: HIDDEN, ...startView, ...(defaultSelected && { rowSelection: rowSelection(defaultSelected) }) }}
            empty={{
              title: copy.emptyTitle,
              description: copy.emptyDescription,
              illustration: (
                <span className="grid size-12 place-items-center rounded-2xl border border-line bg-band text-fg-muted">
                  <UsersIcon />
                </span>
              ),
              action: (
                <AsyncButton size="sm" onAction={onImport && (() => run(onImport))}>
                  <UploadIcon size={16} /> {copy.emptyAction}
                </AsyncButton>
              ),
            }}
          />
        </div>
      )}
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
              {copy.period}
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

export { Customers, type CustomersProps, type CustomersCopy, type CustomerRow, type Customer, type CustomersSummary }
