'use client'

import { useId, useMemo, useRef, useState, type ElementType, type HTMLAttributes, type ReactNode } from 'react'
import { ThemeScope, useLocale, useYouj, type ThemeInput } from '@youj/core'
import { BriefcaseIcon, PlusIcon } from '@youj/icons'
import { AppPage } from '../../components/ui/app-page'
import { Badge } from '../../components/ui/badge'
import { AsyncButton } from '../../components/ui/async-button'
import { DataGrid } from '../tables/data-grid'
import { Sheet } from '../../components/ui/sheet'
import { toast, Toaster } from '../../components/ui/toast'
import { useControllableState } from '../../hooks/use-controllable-state'
import { safeLink } from '../../lib/safe-href'
import { cn, dateTimeFormat } from '../../lib/utils'
import { dealColumns } from './record-drawer/columns'
import {
  DEALS,
  DEFAULT_COPY,
  NOW,
  demo,
  type RecordDrawerCopy,
  type RecordDrawerDeal,
  type RecordDrawerEntry,
  type RecordDrawerMeeting,
  type RecordDrawerPerson,
  type RecordDrawerSection,
  type RecordDrawerStage,
} from './record-drawer/data'
import { DealDrawer, type RecordDrawerProperty } from './record-drawer/drawer'

/* Halyard's pipeline: every open deal in a list, and the one you're reading
 * in a floating drawer over it. Press a row (or Enter on it) and the drawer
 * slides in from the end edge, inset from the page, over a dimmed and
 * blurred list; the row stays lit. ↓ and ↑ in its header (J and K anywhere)
 * step through the rows in the order the list shows them, sorted and
 * filtered as it is, and the list scrolls to keep the row in view. The
 * drawer holds the deal's properties (owner, stage, odds, dates, money, each
 * with an edit button on hover) and its Meetings, Progress, Notes and
 * Activity, each with a link to the rest. On a phone the rows are cards and
 * the drawer is a bottom sheet. Pass your own `deals`, own the open deal with
 * `value`/`onValueChange`, and handle each action with its `on…` callback (a
 * rejection's message shows as a toast); every string is in `copy`.
 * Reduced motion: the drawer and the scrim appear in place. */

interface RecordDrawerProps extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'title' | 'defaultValue'> {
  /** A theme to force on the block. Default: none, so it inherits the app's (YoujProvider or a ThemeScope around it). */
  theme?: ThemeInput
  /** A page in your app's frame: the shared page header (AppPage) and the frame's gutter, across the whole width, with no top bar of its own. Default true; `false` draws its own page (the top bar and a centered canvas). */
  embedded?: boolean
  /** The title's heading level. Default 1. */
  headingLevel?: 1 | 2 | 3
  /** The product in the standalone top bar. Default: Halyard, with its initial as the logo. */
  brand?: { name: string; logo?: ReactNode }
  /** The deals, one row each, in the list's starting order. Default: the demo's 48. */
  deals?: RecordDrawerDeal[]
  /** The open deal's id (controlled), or null for none. Pair with `onValueChange`. */
  value?: string | null
  /** The deal open at first, uncontrolled. Default: none. */
  defaultValue?: string | null
  /** Called with the deal that opens (a row, or a step), or null when the drawer closes. */
  onValueChange?: (id: string | null, deal: RecordDrawerDeal | null) => void
  /** Loading, before the deals arrive: skeleton rows. Default false. */
  loading?: boolean
  /** Replaces the rows with an error panel; a string is its message. Default: none. */
  error?: ReactNode
  /** The error panel's Retry. Default: none. */
  onRetry?: () => void
  /** Replaces the list when there are no deals. Default: the list's empty state from `copy.empty…`. */
  empty?: ReactNode
  /** Any of the page's strings, to rewrite or translate. Default: the demo's English. */
  copy?: Partial<RecordDrawerCopy>
  /** Formats money and dates. Default: the app's locale (YoujProvider's `locale`). */
  locale?: string
  /** The currency deal values are in. Default 'USD'. */
  currency?: string
  /** The moment ages and Today / Yesterday count from. Default: the demo's fixed Oct 5, 2026, so server and browser agree. */
  now?: Date | number
  /** A deal's own page: the drawer's Open becomes a link to it. Default: no links. */
  getHref?: (deal: RecordDrawerDeal) => string
  /** Renders internal links, e.g. Next.js `Link`. Default 'a'. */
  linkComponent?: ElementType
  /** The drawer's Edit. Default: a demo toast. */
  onEdit?: (deal: RecordDrawerDeal) => Promise<unknown> | unknown
  /** The drawer's Open. Default: a demo toast. */
  onOpen?: (deal: RecordDrawerDeal) => Promise<unknown> | unknown
  /** A property's edit button. Default: a demo toast. */
  onEditProperty?: (deal: RecordDrawerDeal, property: RecordDrawerProperty) => Promise<unknown> | unknown
  /** A section's header link (See all, View notes…). Default: a demo toast. */
  onViewAll?: (deal: RecordDrawerDeal, section: RecordDrawerSection) => Promise<unknown> | unknown
  /** The header's New deal. Default: does nothing. */
  onCreate?: () => Promise<unknown> | unknown
  /** Header actions, replacing New deal. */
  actions?: ReactNode
  /** Between the header and the list: a summary, stage filters. Default: none. */
  children?: ReactNode
  /** Classes on key parts. */
  classNames?: Partial<Record<'header' | 'grid' | 'drawer', string>>
}

const DAY = 86_400_000
const ROWS = 'tr[data-dg-kind=row], [data-slot=data-grid-card]'

function RecordDrawer({
  theme,
  embedded = true,
  headingLevel = 1,
  brand = { name: 'Halyard' },
  deals = DEALS,
  value,
  defaultValue = null,
  onValueChange,
  loading = false,
  error,
  onRetry,
  empty,
  copy: copyProp,
  locale: localeProp,
  currency = 'USD',
  now: nowProp = NOW,
  getHref,
  linkComponent = 'a',
  onEdit,
  onOpen,
  onEditProperty,
  onViewAll,
  onCreate,
  actions: actionsSlot,
  children,
  classNames,
  className,
  ...rest
}: RecordDrawerProps) {
  const copy = useMemo(() => ({ ...DEFAULT_COPY, ...copyProp }), [copyProp])
  const locale = useLocale(localeProp)
  const k = useYouj()
  const now = typeof nowProp === 'number' ? nowProp : nowProp.getTime()
  const titleId = useId()
  const Title = `h${headingLevel}` as 'h1'
  const listRef = useRef<HTMLDivElement>(null)

  const [openId, setOpenId] = useControllableState(value, defaultValue)
  const byId = useMemo(() => new Map(deals.map((deal) => [deal.id, deal])), [deals])
  const open = openId !== null && byId.has(openId) ? byId.get(openId)! : null
  // The drawer keeps showing its deal while it slides away.
  const [shown, setShown] = useState(open)
  if (open && open !== shown) setShown(open)

  // The rows in the order the list shows them (sorted, filtered), read when a row opens.
  const [order, setOrder] = useState<string[]>([])
  const readOrder = () => [...(listRef.current?.querySelectorAll<HTMLElement>(ROWS) ?? [])].map((el) => el.dataset.rowId!).filter(Boolean)
  const steps = shown && order.includes(shown.id) ? order : deals.map((deal) => deal.id)
  const index = shown ? steps.indexOf(shown.id) : -1

  const select = (id: string | null) => {
    setOpenId(id)
    onValueChange?.(id, id === null ? null : (byId.get(id) ?? null))
  }
  const openRow = (deal: RecordDrawerDeal) => {
    setOrder(readOrder())
    select(deal.id)
  }
  const step = (to: number) => {
    const id = steps[to]
    if (!id) return
    select(id)
    const row = listRef.current?.querySelector<HTMLElement>(`[data-row-id="${CSS.escape(id)}"]`)
    row?.scrollIntoView({ block: 'nearest', behavior: k.reduced ? 'auto' : 'smooth' })
  }

  /** Awaits the app's callback (a rejection shows its message), or shows the demo's toast. */
  const perform = async (action: string, callback: (() => unknown) | undefined, message: string) => {
    if (!callback) {
      await demo(`RecordDrawer: ${action}`, 250)
      toast(message)
      return
    }
    try {
      await callback()
    } catch (reason) {
      toast.error(reason instanceof Error && reason.message ? reason.message : copy.failed)
    }
  }

  const formats = useMemo(
    () => ({
      date: dateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }),
      dateTime: dateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }),
    }),
    [locale],
  )
  const when = (iso: string, withTime = false) => {
    const days = Math.floor(now / DAY) - Math.floor(Date.parse(iso) / DAY)
    if (days === 0) return copy.today
    if (days === 1) return copy.yesterday
    return (withTime ? formats.dateTime : formats.date).format(Date.parse(iso))
  }

  const columns = useMemo(() => dealColumns(copy, currency), [copy, currency])

  const headerActions = actionsSlot ?? (
    <AsyncButton onAction={onCreate && (() => perform('onCreate', onCreate, ''))}>
      <PlusIcon size={16} /> {copy.newDeal}
    </AsyncButton>
  )
  const body = (
    <>
      {children}
      {empty !== undefined && !loading && !error && deals.length === 0 ? (
        empty
      ) : (
        <div ref={listRef} className={classNames?.grid}>
          <DataGrid<RecordDrawerDeal>
            fill
            aria-labelledby={titleId}
            copy={{ noun: copy.noun }}
            rows={deals}
            columns={columns}
            getRowId={(deal) => deal.id}
            getRowLabel={(deal) => deal.company.name}
            now={now}
            loading={loading}
            error={error}
            onRetry={onRetry}
            onRowClick={openRow}
            onRowOpen={openRow}
            activeRowId={open?.id ?? null}
            pageSize={false}
            empty={{
              title: copy.emptyTitle,
              description: copy.emptyDescription,
              illustration: (
                <span className="grid size-12 place-items-center rounded-2xl border border-line bg-band text-fg-muted">
                  <BriefcaseIcon />
                </span>
              ),
            }}
          />
        </div>
      )}
      <Sheet open={open !== null} onOpenChange={(next) => !next && select(null)}>
        {shown && (
          <DealDrawer
            deal={shown}
            index={index}
            total={steps.length}
            onIndexChange={step}
            copy={copy}
            locale={locale}
            currency={currency}
            now={now}
            when={when}
            href={safeLink(getHref?.(shown)) ?? undefined}
            linkComponent={linkComponent}
            onEdit={() => perform('onEdit', onEdit && (() => onEdit(shown)), copy.editing(shown.name))}
            onOpen={() => perform('onOpen', onOpen && (() => onOpen(shown)), copy.opening(shown.name))}
            onEditProperty={(property) =>
              perform('onEditProperty', onEditProperty && (() => onEditProperty(shown, property)), copy.editingProperty(copy.properties[property], shown.name))
            }
            onViewAll={(section) => perform('onViewAll', onViewAll && (() => onViewAll(shown, section)), copy.viewing(copy.sections[section], shown.name))}
            className={classNames?.drawer}
          />
        )}
      </Sheet>
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
          <div className={cn('flex flex-wrap items-end justify-between gap-4', classNames?.header)}>
            <div className="flex min-w-0 flex-col gap-1">
              <Title id={titleId} className="text-2xl font-semibold tracking-tight text-fg">
                {copy.title}
              </Title>
              <p className="text-ui text-fg-muted">{copy.description}</p>
            </div>
            <div className="flex gap-2">{headerActions}</div>
          </div>
          {body}
        </main>
        <Toaster />
      </div>
    </ThemeScope>
  )
}

export {
  RecordDrawer,
  type RecordDrawerProps,
  type RecordDrawerCopy,
  type RecordDrawerDeal,
  type RecordDrawerEntry,
  type RecordDrawerMeeting,
  type RecordDrawerPerson,
  type RecordDrawerProperty,
  type RecordDrawerSection,
  type RecordDrawerStage,
}
