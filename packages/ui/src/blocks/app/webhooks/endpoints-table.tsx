'use client'

import { PresenceItem, PresenceList } from '@youj/motion'
import { MoreHorizontalIcon, PencilIcon, PowerIcon, SendIcon, TrashIcon } from '@youj/icons'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { Table, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../../../components/ui/dropdown-menu'
import { cn } from '../../../lib/utils'
import { ago, ok, type Delivery, type Endpoint, type WebhooksCopy } from './data'

export function StatusCode({ status, copy }: { status: number | null; copy: WebhooksCopy }) {
  return (
    <Badge variant={ok(status) ? 'success' : 'danger'} className="font-mono tabular-nums">
      {status ?? copy.timeout}
    </Badge>
  )
}

const healthOf = (endpoint: Endpoint, last?: Delivery) => (!endpoint.enabled ? 'disabled' : last && !ok(last.status) ? 'failing' : 'enabled')

function Health({ endpoint, last, copy }: { endpoint: Endpoint; last?: Delivery; copy: WebhooksCopy }) {
  const state = healthOf(endpoint, last)
  const tone = { enabled: 'bg-success', failing: 'bg-danger', disabled: 'bg-fg-subtle' }[state]
  return (
    <Badge variant={state === 'enabled' ? 'success' : state === 'failing' ? 'danger' : 'secondary'}>
      <span aria-hidden className={cn('size-1.5 rounded-full', tone)} />
      {copy[state]}
    </Badge>
  )
}

export function EndpointsTable({
  endpoints,
  deliveries,
  selected,
  now,
  copy,
  onSelect,
  onEdit,
  onTest,
  onToggle,
  onDelete,
}: {
  endpoints: Endpoint[]
  deliveries: Delivery[]
  selected?: string
  /** What delivery ages are measured from. */
  now: number
  copy: WebhooksCopy
  onSelect: (endpoint: Endpoint) => void
  onEdit: (endpoint: Endpoint) => void
  onTest: (endpoint: Endpoint) => void
  onToggle: (endpoint: Endpoint) => void
  onDelete: (endpoint: Endpoint) => void
}) {
  const cell = 'border-b border-line py-2.5 [tr:last-child>&]:border-b-0'
  return (
    <Table className="table-fixed border-separate border-spacing-0" aria-label={copy.endpointsLabel}>
      <TableHeader>
        <TableRow>
          <TableHead className="ps-4">{copy.endpoint}</TableHead>
          <TableHead className="w-52 max-md:hidden">{copy.events}</TableHead>
          <TableHead className="w-28 max-sm:hidden">{copy.status}</TableHead>
          <TableHead className="w-36 max-lg:hidden">{copy.lastDelivery}</TableHead>
          <TableHead className="w-12 pe-4">
            <span className="sr-only">{copy.actions}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <PresenceList as="tbody">
        {endpoints.map((endpoint) => {
          const last = deliveries.find((d) => d.endpointId === endpoint.id)
          const on = endpoint.id === selected
          return (
            <PresenceItem as="tr" key={endpoint.id} className={cn('transition-colors yj-duration-fast ease-standard', on ? 'bg-accent-subtle' : 'bg-surface hover:bg-hover')}>
              <TableCell className={cn(cell, 'relative ps-4')}>
                {/* The selected row's rail, on the inline-start edge. */}
                <span aria-hidden className={cn('absolute inset-y-1.5 start-0 w-0.5 rounded-full bg-accent transition-opacity yj-duration-fast ease-standard', on ? 'opacity-100' : 'opacity-0')} />
                <button type="button" aria-pressed={on} onClick={() => onSelect(endpoint)} className="flex w-full min-w-0 flex-col items-start rounded-sm text-start focus-ring">
                  <span dir="ltr" className="w-full truncate font-mono text-ui-sm text-fg rtl:text-end">
                    {endpoint.url}
                  </span>
                  <span className="w-full truncate text-ui-xs text-fg-muted">
                    {/* The status column folds away on phones, so the state leads the subtitle there. */}
                    <span className={cn('sm:hidden', healthOf(endpoint, last) === 'failing' && 'text-danger-text')}>{copy[healthOf(endpoint, last)]} · </span>
                    {endpoint.description || copy.eventCount(endpoint.events.length)}
                  </span>
                </button>
              </TableCell>
              <TableCell className={cn(cell, 'max-md:hidden')}>
                <div className="flex min-w-0 items-center gap-1 overflow-hidden">
                  <Badge dir="ltr" variant="outline" className="block min-w-0 shrink truncate font-mono">
                    {endpoint.events[0]}
                  </Badge>
                  {/* On the selected row the chip sits on the accent tint, where the muted label falls under 4.5:1 in dark. */}
                  {endpoint.events.length > 1 && (
                    <Badge variant="secondary" className={cn('shrink-0 tabular-nums', on && 'text-fg')}>
                      +{endpoint.events.length - 1}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className={cn(cell, 'max-sm:hidden')}>
                <Health endpoint={endpoint} last={last} copy={copy} />
              </TableCell>
              <TableCell className={cn(cell, 'max-lg:hidden')}>
                {last ? (
                  <span className="flex items-center gap-2 text-ui-sm text-fg-muted tabular-nums">
                    <StatusCode status={last.status} copy={copy} />
                    {ago(last.at, copy.locale, now)}
                  </span>
                ) : (
                  <span className="text-ui-sm text-fg-muted">{copy.never}</span>
                )}
              </TableCell>
              <TableCell className={cn(cell, 'pe-4 text-end')}>
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={copy.actionsFor(endpoint.url)} />}>
                    <MoreHorizontalIcon size={16} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(endpoint)}>
                      <PencilIcon size={14} /> {copy.edit}
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled={!endpoint.enabled} onClick={() => onTest(endpoint)}>
                      <SendIcon size={14} className="rtl:-scale-x-100" /> {copy.sendTest}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onToggle(endpoint)}>
                      <PowerIcon size={14} /> {endpoint.enabled ? copy.disable : copy.enable}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="danger" onClick={() => onDelete(endpoint)}>
                      <TrashIcon size={14} /> {copy.remove}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </PresenceItem>
          )
        })}
      </PresenceList>
    </Table>
  )
}
