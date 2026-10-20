/* Story and test data: deterministic orders (a seeded generator, so every
 * screenshot shows the same rows) and the cells that render them. Not part of
 * the component's API. */

import { CheckCircleIcon, CircleDashedIcon, CircleXIcon, LoaderRingIcon, RotateCcwIcon, type YoujIconComponent } from '@youj/icons'
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar'
import { Badge } from '../../components/ui/badge'
import { createRowActionsColumn, type DataTableRowAction } from '../../components/ui/data-table'
import { createDataTableColumnHelper, type DataTableColumnDef, type DataTableFilterOption } from '../../components/ui/data-table'
import { dateTimeFormat, numberFormat } from '../../lib/utils'

export type OrderStatus = 'paid' | 'pending' | 'processing' | 'refunded' | 'failed'
export type Channel = 'Web' | 'iOS' | 'Android' | 'In store'

export interface Order {
  id: string
  number: string
  customer: string
  email: string
  hue: number
  status: OrderStatus
  channel: Channel
  items: number
  total: number
  createdAt: string
  region: string
}

/** "Now" for the fixtures: the current minute. Relative labels are measured
 * from it, so they read the same on any day, and the date filter's presets
 * ("Last 7 days") always find orders. */
export const NOW = new Date(Math.floor(Date.now() / 60_000) * 60_000)

function random(seed: number) {
  let t = seed >>> 0
  return () => {
    t = (t + 0x6d2b79f5) >>> 0
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

const FIRST = ['Ada', 'Grace', 'Alan', 'Katherine', 'Linus', 'Margaret', 'Dennis', 'Barbara', 'Ken', 'Frances', 'Edsger', 'Radia', 'Tim', 'Hedy', 'John', 'Sophie', 'Guido', 'Anita', 'Bjarne', 'Shafi', 'Yukihiro', 'Joan', 'Leslie', 'Mary', 'Donald', 'Evelyn', 'Niklaus', 'Adele', 'Brendan', 'Ruth']
const LAST = ['Lovelace', 'Hopper', 'Turing', 'Johnson', 'Torvalds', 'Hamilton', 'Ritchie', 'Liskov', 'Thompson', 'Allen', 'Dijkstra', 'Perlman', 'Berners-Lee', 'Lamarr', 'McCarthy', 'Wilson', 'van Rossum', 'Borg', 'Stroustrup', 'Goldwasser', 'Matsumoto', 'Clarke', 'Lamport', 'Keller', 'Knuth', 'Boyd', 'Wirth', 'Goldberg', 'Eich', 'Teitelbaum']
const STATUSES: OrderStatus[] = ['paid', 'paid', 'paid', 'paid', 'pending', 'processing', 'processing', 'refunded', 'failed']
const CHANNELS: Channel[] = ['Web', 'Web', 'Web', 'iOS', 'iOS', 'Android', 'In store']
export const CHANNEL_NAMES: Channel[] = ['Web', 'iOS', 'Android', 'In store']
const REGIONS = ['US East', 'US West', 'EU Central', 'UK', 'APAC', 'LATAM']

export function makeOrders(count: number, seed = 7): Order[] {
  const next = random(seed)
  const pick = <T,>(list: readonly T[]) => list[Math.floor(next() * list.length)]!
  const orders: Order[] = []
  const top = Math.max(2400, count + 400)
  let at = NOW.getTime() - 4 * 60_000
  for (let i = 0; i < count; i++) {
    const first = pick(FIRST)
    const last = pick(LAST)
    const items = 1 + Math.floor(next() ** 2 * 7)
    at -= Math.floor(next() ** 1.6 * 11 * 3_600_000) + 60_000
    orders.push({
      id: `ord_${top - i}`,
      number: `ORD-${top - i}`,
      customer: `${first} ${last}`,
      email: `${first}.${last}`.toLowerCase().replace(/[^a-z.]/g, '') + '@example.com',
      hue: Math.floor(next() * 360),
      status: pick(STATUSES),
      channel: pick(CHANNELS),
      items,
      total: Math.round((items * (18 + next() * 140) + next() * 30) * 100) / 100,
      createdAt: new Date(at).toISOString(),
      region: pick(REGIONS),
    })
  }
  return orders
}

/* ── Formatting ──────────────────────────────────────────────────────────── */

export const usd = numberFormat('en-US', { style: 'currency', currency: 'USD' })
const usdWhole = numberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const full = dateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' })
const short = dateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
const dated = dateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

export function relative(iso: string | Date) {
  const date = typeof iso === 'string' ? new Date(iso) : iso
  const minutes = Math.round((NOW.getTime() - date.getTime()) / 60_000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return date.getUTCFullYear() === NOW.getUTCFullYear() ? short.format(date) : dated.format(date)
}

/* Portraits are drawn in place (no network): two-tone gradient SVGs. */
function portrait(hue: number) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='hsl(${hue} 68% 64%)'/><stop offset='1' stop-color='hsl(${(hue + 40) % 360} 62% 44%)'/></linearGradient></defs><rect width='64' height='64' fill='url(#g)'/><circle cx='32' cy='26' r='11' fill='white' fill-opacity='.86'/><path d='M12 60c3-12 12-18 20-18s17 6 20 18z' fill='white' fill-opacity='.86'/></svg>` // youj-allow: generated story portraits
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

/* ── Cells ───────────────────────────────────────────────────────────────── */

export const STATUS: Record<OrderStatus, { label: string; variant: 'success' | 'warning' | 'default' | 'secondary' | 'danger' }> = {
  paid: { label: 'Paid', variant: 'success' },
  pending: { label: 'Pending', variant: 'warning' },
  processing: { label: 'Processing', variant: 'default' },
  refunded: { label: 'Refunded', variant: 'secondary' },
  failed: { label: 'Failed', variant: 'danger' },
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  const s = STATUS[status]
  return (
    <Badge variant={s.variant}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {s.label}
    </Badge>
  )
}

export function CustomerCell({ order, withEmail = false }: { order: Order; withEmail?: boolean }) {
  const initials = order.customer
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <Avatar size="sm" aria-hidden>
        <AvatarImage src={portrait(order.hue)} alt="" />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <span className="flex min-w-0 flex-col">
        <span className="truncate font-medium">{order.customer}</span>
        {withEmail && <span className="truncate text-ui-sm text-fg-muted">{order.email}</span>}
      </span>
    </span>
  )
}

export function RelativeTime({ iso }: { iso: string }) {
  return (
    <time dateTime={iso} title={full.format(new Date(iso))} className="text-fg-muted">
      {relative(iso)}
    </time>
  )
}

/* ── Columns ─────────────────────────────────────────────────────────────── */

const col = createDataTableColumnHelper<Order>()

/* Pending would morph into done on hover and the loader would spin in every row, so both hold still. */
const still = (Icon: YoujIconComponent) => (props: { className?: string }) => <Icon trigger="none" {...props} />

const STATUS_ICONS: Record<OrderStatus, DataTableFilterOption['icon']> = {
  paid: CheckCircleIcon,
  pending: still(CircleDashedIcon),
  processing: still(LoaderRingIcon),
  refunded: RotateCcwIcon,
  failed: CircleXIcon,
}

export function orderColumns(
  options: { editable?: boolean; filters?: boolean; actions?: (order: Order) => DataTableRowAction[] } = {},
): DataTableColumnDef<Order>[] {
  const filter = <T,>(value: T) => (options.filters ? value : undefined)
  const columns = col.columns([
    col.accessor('number', {
      header: 'Order',
      size: 112,
      meta: { label: 'Order', cellClassName: 'font-mono text-ui-sm', skeleton: 'short' },
    }),
    col.accessor('customer', {
      header: 'Customer',
      size: 220,
      minSize: 168,
      cell: (ctx) => <CustomerCell order={ctx.row.original} />,
      meta: { grow: true, skeleton: 'avatar', editor: options.editable ? { type: 'text', maxLength: 60 } : undefined, validate: (v) => (String(v).trim() ? null : 'A name is required') },
    }),
    col.accessor('status', {
      header: 'Status',
      size: 132,
      cell: (ctx) => <StatusBadge status={ctx.getValue()} />,
      meta: {
        skeleton: 'badge',
        exportValue: (value) => STATUS[value as OrderStatus]?.label ?? value,
        editor: options.editable ? { type: 'select', options: Object.entries(STATUS).map(([value, s]) => ({ value, label: s.label })) } : undefined,
        filter: filter({
          type: 'select' as const,
          options: (Object.keys(STATUS) as OrderStatus[]).map((value) => ({ value, label: STATUS[value].label, icon: STATUS_ICONS[value] })),
        }),
      },
    }),
    col.accessor('channel', {
      header: 'Channel',
      size: 104,
      meta: {
        skeleton: 'short',
        cellClassName: 'text-fg-muted',
        filter: filter({ type: 'select' as const, options: CHANNEL_NAMES.map((value) => ({ value, label: value })) }),
      },
    }),
    col.accessor('items', { header: 'Items', size: 84, meta: { numeric: true } }),
    col.accessor('total', {
      header: 'Total',
      size: 120,
      cell: (ctx) => usd.format(ctx.getValue()),
      meta: {
        numeric: true,
        editor: options.editable ? { type: 'number', min: 0, max: 100_000, step: 0.01 } : undefined,
        cellClassName: 'font-medium',
        filter: filter({ type: 'number-range' as const, min: 0, max: 1200, step: 10, format: (n: number) => usdWhole.format(n) }),
      },
    }),
    col.accessor((row) => new Date(row.createdAt), {
      id: 'createdAt',
      header: 'Created',
      size: 116,
      sortFn: 'datetime',
      cell: (ctx) => <RelativeTime iso={ctx.row.original.createdAt} />,
      meta: {
        label: 'Created',
        skeleton: 'short',
        exportValue: (_, row) => (row as Order).createdAt,
        filter: filter({ type: 'date-range' as const }),
      },
    }),
  ])
  return options.actions
    ? [...columns, createRowActionsColumn<Order>({ label: (order) => order.number, actions: options.actions })]
    : columns
}
