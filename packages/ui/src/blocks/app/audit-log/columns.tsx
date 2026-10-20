'use client'

import { KeyIcon, SparkleIcon } from '@youj/icons'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
import { Badge } from '../../../components/ui/badge'
import { createDataTableColumnHelper } from '../../../components/ui/data-table'
import { ACTORS, actorOf, formatTime, toneVariant, type AuditActor, type AuditCategory, type AuditEvent, type AuditLogCopy, type AuditResult } from './data'

const col = createDataTableColumnHelper<AuditEvent>()

function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  return ((words[0]?.[0] ?? '') + (words.length > 1 ? (words.at(-1)?.[0] ?? '') : '')).toUpperCase() || '?'
}

export function ActorBadge({ id, actors = ACTORS }: { id: string; actors?: Record<string, AuditActor> }) {
  const actor = actorOf(actors, id)
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <Avatar size="sm">
        <AvatarFallback>
          {actor.kind === 'api-key' ? <KeyIcon size={12} /> : actor.kind === 'system' ? <SparkleIcon size={12} /> : initials(actor.name)}
        </AvatarFallback>
      </Avatar>
      <span className="flex min-w-0 flex-col">
        <span className="truncate font-medium text-fg">{actor.name}</span>
        {actor.email && <span className="truncate text-ui-sm text-fg-muted">{actor.email}</span>}
      </span>
    </span>
  )
}

/** The log's columns. The event's summary is the button that opens its details. */
export function auditColumns(
  onOpen: (event: AuditEvent) => void,
  copy: AuditLogCopy,
  actors: Record<string, AuditActor> = ACTORS,
  locale: string,
  categories: AuditCategory[],
  results: AuditResult[],
) {
  const category = (key: string) => categories.find((c) => c.id === key)
  return col.columns([
    col.accessor('time', {
      header: copy.time,
      size: 132,
      cell: (ctx) => <time dateTime={ctx.getValue()} className="text-fg-muted tabular-nums">{formatTime(ctx.getValue(), locale)}</time>,
      meta: { filter: { type: 'date-range' as const, title: copy.date } },
    }),
    // By name, so search, the filter and exports all see the name, not the id.
    col.accessor((event) => actorOf(actors, event.actor).name, {
      id: 'actor',
      header: copy.actor,
      size: 200,
      cell: (ctx) => <ActorBadge id={ctx.row.original.actor} actors={actors} />,
      meta: { filter: { type: 'select' as const, options: Object.values(actors).map((a) => ({ value: a.name, label: a.name })) }, skeleton: 'avatar' },
    }),
    col.accessor('summary', {
      header: copy.event,
      size: 340,
      // The row's point: the table scrolls before it squeezes this below a readable width.
      minSize: 220,
      cell: (ctx) => (
        <span className="flex min-w-0 flex-col items-start">
          <button
            type="button"
            onClick={() => onOpen(ctx.row.original)}
            className="max-w-full truncate rounded-sm text-start font-medium text-fg underline-offset-4 hover:underline focus-ring"
          >
            {ctx.getValue()}
          </button>
          <span className="truncate font-mono text-ui-sm text-fg-muted">{ctx.row.original.action}</span>
        </span>
      ),
      meta: { grow: true },
    }),
    col.accessor('category', {
      header: copy.type,
      size: 136,
      cell: (ctx) => <Badge variant={toneVariant(category(ctx.getValue())?.tone)}>{category(ctx.getValue())?.label ?? ctx.getValue()}</Badge>,
      meta: { filter: { type: 'select' as const, options: categories.map((c) => ({ value: c.id, label: c.label })) }, skeleton: 'badge' },
    }),
    col.accessor('result', {
      header: copy.result,
      size: 124,
      cell: (ctx) => {
        const result = results.find((r) => r.id === ctx.getValue())
        return <Badge variant={toneVariant(result?.tone ?? 'neutral')}>{result?.label ?? ctx.getValue()}</Badge>
      },
      meta: { filter: { type: 'select' as const, options: results.map((r) => ({ value: r.id, label: r.label })) }, skeleton: 'badge' },
    }),
    col.accessor('location', {
      header: copy.location,
      size: 150,
      cell: (ctx) => (
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-fg">{ctx.getValue()}</span>
          <span className="truncate font-mono text-ui-sm text-fg-muted">{ctx.row.original.ip}</span>
        </span>
      ),
    }),
  ])
}
