'use client'

import { Badge, BadgeDot } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { AsyncButton } from '../../../components/ui/async-button'
import { Sparkline } from '../../../components/ui/sparkline'
import { Eyebrow } from '../../../components/ui/typography'
import { cn } from '../../../lib/utils'
import { OVER_TARGET, routeKey, type QueueFlowNode, type QueueFlowRoute, type QueueFlowDesk, type QueueFlowHealth, type QueueFlowCopy } from './data'

/* The picked step in figures: what it is and how it's doing, tickets in and
 * routed or solved, its p95 reply time, its queue and agents, its recent
 * volume as a line, where its tickets come from and go, and the one action
 * that helps it now: more agents for a team whose queue is building, a
 * clear-out for the spam folder. */

/** A queue this full offers more agents. */
const STAFF_AT = 0.4

const BADGE: Record<QueueFlowHealth, 'success' | 'warning' | 'danger'> = {
  ok: 'success',
  over: 'warning',
  holding: 'warning',
  sink: 'danger',
}

export interface Formats {
  rate: (n: number) => string
  count: (n: number) => string
  time: (n: number) => string
  percent: (n: number) => string
}

interface InspectorProps {
  id: string
  node: QueueFlowNode
  nodes: QueueFlowNode[]
  routes: QueueFlowRoute[]
  state: QueueFlowDesk
  copy: QueueFlowCopy
  format: Formats
  /** The lens's label for the reply reading. */
  replyLabel: string
  onStaff: (node: QueueFlowNode, staff: number) => Promise<unknown>
  onPurge: () => Promise<unknown>
  /** Under the block's title: h3 when embedded (h2 title), h2 when standalone (h1 title). */
  embedded: boolean
}

export function Inspector({ id, node, nodes, routes, state, copy, format, replyLabel, onStaff, onPurge, embedded }: InspectorProps) {
  const Heading = embedded ? 'h3' : 'h2'
  const stats = state.nodes[node.id]
  const health = stats?.health ?? 'ok'
  const staff = state.staff[node.id]
  const fill = node.limit && stats ? stats.waiting / node.limit : undefined
  const folder = routes.some((r) => r.reject && r.to === node.id)
  const name = (ids: string[]) => ids.map((n) => nodes.find((x) => x.id === n)?.label ?? n).join(', ') || copy.nothing
  const from = name(routes.filter((r) => r.to === node.id).map((r) => r.from))
  const to = name(routes.filter((r) => r.from === node.id).map((r) => r.to))
  const inbound = routes.filter((r) => r.to === node.id).reduce((sum, r) => sum + (state.routes[routeKey(r)] ?? 0), 0)
  const routed = routes.filter((r) => r.from === node.id && !r.reject).reduce((sum, r) => sum + (state.routes[routeKey(r)] ?? 0), 0)

  const figures: { label: string; value: string; tone?: string }[] = folder
    ? [
        { label: copy.in, value: format.rate(inbound) },
        {
          label: copy.held,
          value: format.count(state.held),
          tone: state.held > 0 ? 'text-danger-text' : undefined,
        },
      ]
    : [
        ...(node.layer === 0 ? [] : [{ label: copy.in, value: format.rate(stats?.in ?? 0) }]),
        {
          label: node.layer === 0 ? copy.new : node.layer === 1 ? copy.routed : copy.solved,
          value: format.rate(node.layer === 1 ? routed : (stats?.out ?? 0)),
        },
        { label: replyLabel, value: format.time(stats?.reply ?? 0) },
        ...(fill !== undefined
          ? [
              {
                label: copy.waitingLabel,
                value: `${format.count(stats?.waiting ?? 0)} · ${format.percent(fill)}`,
                tone: fill >= OVER_TARGET ? 'text-warning-text' : undefined,
              },
            ]
          : []),
        ...(staff !== undefined ? [{ label: copy.staffLabel, value: String(staff) }] : []),
        ...(node.rejects
          ? [
              {
                label: copy.rejected,
                value: format.rate(stats?.rejected ?? 0),
                tone: 'text-danger-text',
              },
            ]
          : []),
      ]

  return (
    <div id={id} data-slot="queue-flow-inspector" className="grid gap-x-8 gap-y-5 md:grid-cols-[minmax(0,1fr)_minmax(0,--spacing(68))]">
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
          <Heading className="text-ui-lg font-medium text-fg">{node.label}</Heading>
          <Eyebrow>{copy.kinds[node.kind]}</Eyebrow>
          {/* A sentence, not a label: it keeps its case in a theme that sets badges in capitals. */}
          <Badge variant={BADGE[health]} className="gap-1.5">
            <BadgeDot />
            {copy.health[health]}
          </Badge>
          <p className="basis-full text-ui text-fg-muted">{node.about}</p>
        </div>
        <dl className="grid grid-cols-[repeat(auto-fit,minmax(--spacing(26),1fr))] gap-x-4 gap-y-3">
          {figures.map((f) => (
            <div key={f.label} className="flex min-w-0 flex-col gap-1 border-s border-line ps-3">
              <dt className="text-ui-xs text-fg-muted">{f.label}</dt>
              <dd className={cn('truncate font-mono text-ui-lg leading-none text-fg tabular-nums', f.tone)}>
                <bdi>{f.value}</bdi>
              </dd>
            </div>
          ))}
        </dl>
        <p className="flex flex-wrap gap-x-4 gap-y-1 text-ui-sm text-fg-muted">
          {node.layer !== 0 && (
            <span>
              <span className="text-fg">{copy.reads}</span> {from}
            </span>
          )}
          {node.layer !== 2 && (
            <span>
              <span className="text-fg">{copy.writes}</span> {to}
            </span>
          )}
        </p>
      </div>
      <div className="flex min-w-0 flex-col justify-between gap-4">
        <Sparkline
          data={stats?.history ?? []}
          color={health === 'ok' ? undefined : health === 'sink' ? 'var(--color-danger)' : 'var(--color-warning)'}
          label={copy.history(node.label)}
          className="h-14 w-full"
        />
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" size="sm">
            {copy.open}
          </Button>
          {folder && state.held > 0 && (
            <AsyncButton size="sm" onAction={onPurge} pendingLabel={copy.purging}>
              {copy.purge(format.count(state.held))}
            </AsyncButton>
          )}
          {staff !== undefined && fill !== undefined && fill >= STAFF_AT && (
            <AsyncButton size="sm" onAction={() => onStaff(node, staff * 2)} pendingLabel={copy.staffing}>
              {copy.staff(staff)}
            </AsyncButton>
          )}
        </div>
      </div>
    </div>
  )
}
