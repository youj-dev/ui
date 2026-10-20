'use client'

import type { CSSProperties } from 'react'
import { ArrowUpRightIcon } from '@youj/icons'
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar'
import { Badge, BadgeDot } from '../../../components/ui/badge'
import { createDataTableColumnHelper, createRowActionsColumn, type DataTableColumnDef } from '../../../components/ui/data-table'
import type { BulkActionsTableAction, BulkActionsTableChannel, BulkActionsTableCopy, BulkActionsTableIcon, BulkActionsTableRow, BulkActionsTableStatus } from './data'
import { dateTimeFormat, numberFormat } from '../../../lib/utils'

const col = createDataTableColumnHelper<BulkActionsTableRow>()

const VARIANT = { success: 'success', warning: 'warning', danger: 'danger', neutral: 'secondary' } as const

/** The set's entry for an id; an id it doesn't know shows as itself. */
const find = (set: BulkActionsTableStatus[], id: string): BulkActionsTableStatus => set.find((s) => s.id === id) ?? { id, label: id, tone: 'neutral' }
const options = (set: { id: string; label: string; icon?: BulkActionsTableIcon }[]) => set.map((s) => ({ value: s.id, label: s.label, icon: s.icon }))

const initials = (name: string) => name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()
/** A steady hue per name, from the theme's chart colors. */
const hue = (name: string) => (Array.from(name).reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % 5) + 1

function CustomerCell({ row }: { row: BulkActionsTableRow }) {
  const { name, email, avatar } = row.party
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <Avatar aria-hidden size="sm" style={{ '--order-hue': `var(--color-chart-${hue(name)})` } as CSSProperties}>
        {avatar && <AvatarImage src={avatar} alt="" />}
        <AvatarFallback className="bg-[color-mix(in_oklab,var(--order-hue)_18%,var(--color-surface))] font-semibold text-[color-mix(in_oklab,var(--order-hue)_55%,var(--color-fg))]">
          {initials(name)}
        </AvatarFallback>
      </Avatar>
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="truncate font-medium">{name}</span>
        <span className="truncate text-ui-xs text-fg-muted">{email}</span>
      </span>
    </span>
  )
}

/** The columns: the ref opens the row, the rest read at a glance; status, stage, channel, date and amount filter from the toolbar. */
export function rowColumns({
  copy,
  locale,
  currency,
  statuses,
  stages,
  channels,
  actions,
  onOpen,
  onAction,
}: {
  copy: BulkActionsTableCopy
  locale: string
  currency: string
  statuses: BulkActionsTableStatus[]
  stages: BulkActionsTableStatus[]
  channels: BulkActionsTableChannel[]
  actions: BulkActionsTableAction[]
  onOpen: (row: BulkActionsTableRow) => void
  onAction: (action: string, rows: BulkActionsTableRow[]) => void
}): DataTableColumnDef<BulkActionsTableRow>[] {
  const money = numberFormat(locale, { style: 'currency', currency })
  const day = dateTimeFormat(locale, { month: 'short', day: 'numeric' })
  const time = dateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' })
  const h = copy.columns
  const labelOf = (set: { id: string; label: string }[]) => (value: unknown) => set.find((s) => s.id === value)?.label ?? String(value)
  return [
    ...col.columns([
      col.accessor('ref', {
        header: h.ref,
        size: 112,
        cell: (ctx) => (
          <button
            type="button"
            data-dt-focus=""
            tabIndex={-1}
            onClick={() => onOpen(ctx.row.original)}
            className="group/open inline-flex items-center gap-1 rounded-sm font-mono text-ui-sm font-medium text-fg tabular-nums hover:text-accent-text focus-ring"
          >
            {ctx.getValue()}
            <ArrowUpRightIcon aria-hidden size={12} className="opacity-0 transition-opacity yj-duration-fast ease-standard group-hover/open:opacity-100 rtl:-scale-x-100" />
          </button>
        ),
        meta: { label: h.ref, skeleton: 'short' },
      }),
      col.accessor((o) => new Date(o.at), {
        id: 'at',
        header: h.at,
        size: 128,
        sortFn: 'datetime',
        cell: (ctx) => (
          <span className="flex flex-col leading-tight tabular-nums">
            <span>{day.format(ctx.getValue())}</span>
            <span className="text-ui-xs text-fg-muted">{time.format(ctx.getValue())}</span>
          </span>
        ),
        meta: { label: h.at, filter: { type: 'date-range' }, exportValue: (_, row) => (row as BulkActionsTableRow).at },
      }),
      col.accessor((o) => o.party.name, {
        id: 'party',
        header: h.party,
        size: 240,
        minSize: 200,
        cell: (ctx) => <CustomerCell row={ctx.row.original} />,
        meta: { label: h.party, grow: true, skeleton: 'avatar' },
      }),
      col.accessor('channel', {
        header: h.channel,
        size: 148,
        cell: (ctx) => {
          const channel = channels.find((c) => c.id === ctx.getValue())
          const Icon = channel?.icon
          return (
            <span className="flex items-center gap-2 text-fg-muted">
              {Icon && <Icon aria-hidden size={14} />}
              <span className="truncate text-fg">{channel?.label ?? ctx.getValue()}</span>
            </span>
          )
        },
        meta: { filter: { type: 'select', options: options(channels) }, exportValue: labelOf(channels) },
      }),
      col.accessor('status', {
        header: h.status,
        size: 128,
        cell: (ctx) => {
          const status = find(statuses, ctx.getValue())
          return (
            <Badge variant={VARIANT[status.tone ?? 'neutral']}>
              <BadgeDot />
              {status.label}
            </Badge>
          )
        },
        meta: { skeleton: 'badge', filter: { type: 'select', options: options(statuses) }, exportValue: labelOf(statuses) },
      }),
      col.accessor('stage', {
        header: h.stage,
        size: 140,
        cell: (ctx) => {
          const stage = find(stages, ctx.getValue())
          const Icon = stage.icon
          return (
            // shape: dashed, like the demo marker: not started yet
            <Badge variant={stage.dashed ? 'outline' : VARIANT[stage.tone ?? 'neutral']} className={stage.dashed ? 'border-dashed' : undefined}>
              {Icon && <Icon aria-hidden size={12} />}
              {stage.label}
            </Badge>
          )
        },
        meta: { skeleton: 'badge', filter: { type: 'select', options: options(stages) }, exportValue: labelOf(stages) },
      }),
      col.accessor('count', { header: h.count, size: 88, meta: { numeric: true, cellClassName: 'text-fg-muted' } }),
      col.accessor('amount', {
        header: h.amount,
        size: 120,
        cell: (ctx) => <span className="font-medium">{money.format(ctx.getValue())}</span>,
        meta: { numeric: true, filter: { type: 'number-range', step: 10, format: (n) => money.format(n) } },
      }),
    ]),
    createRowActionsColumn<BulkActionsTableRow>({
      label: (o) => o.ref,
      actions: (o) => [
        { label: copy.open, icon: ArrowUpRightIcon, onSelect: () => onOpen(o) },
        ...actions
          .filter((a) => a.inRow)
          .map((a) => ({ label: a.label, icon: a.icon, disabled: a.disabled?.(o), separated: a.inRow === 'separated', onSelect: () => onAction(a.id, [o]) })),
      ],
    }),
  ]
}
