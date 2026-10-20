'use client'

import { CheckCircleIcon, ChevronRightIcon } from '@youj/icons'
import { Badge } from '../../../components/ui/badge'
import { Skeleton } from '../../../components/ui/skeleton'
import { cn } from '../../../lib/utils'
import type { Integration, IntegrationHealth, IntegrationStatus, MarketingIntegrationsCopy } from './data'

/* An integration on the grid: its mark, name, one line, category and status.
 * The whole card is one button that opens the detail. A connected one shows
 * its health with a colored dot (and the words), so a failing connection is
 * noticed from the grid, not found later. */

export const HEALTH_DOT: Record<IntegrationHealth, string> = { healthy: 'bg-success', degraded: 'bg-warning', error: 'bg-danger' }

export function Mark({ integration, className }: { integration: Integration; className?: string }) {
  const { mark, logo } = integration
  return (
    <span aria-hidden className={cn('grid size-10 shrink-0 place-items-center rounded-lg border border-line bg-band text-fg', className)}>
      {logo ??
        (mark ? (
          <svg viewBox="0 0 24 24" className="size-1/2 fill-current">
            {mark}
          </svg>
        ) : (
          <span className="text-ui font-semibold">{integration.name.slice(0, 1)}</span>
        ))}
    </span>
  )
}

function StatusBadge({ status, copy }: { status: IntegrationStatus; copy: MarketingIntegrationsCopy }) {
  const variant = { connected: 'success', available: 'outline', beta: 'default', soon: 'secondary' } as const
  return (
    <Badge variant={variant[status]}>
      {status === 'connected' && <CheckCircleIcon size={12} />}
      {copy.status[status]}
    </Badge>
  )
}

interface IntegrationCardProps {
  integration: Integration
  status: IntegrationStatus
  health?: IntegrationHealth
  onOpen: () => void
  copy: MarketingIntegrationsCopy
}

export function IntegrationCard({ integration, status, health, onOpen, copy }: IntegrationCardProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={copy.details(integration.name)}
      className="group/card flex h-full w-full flex-col gap-4 rounded-2xl border border-line bg-surface p-4 text-start transition-[border-color,box-shadow] yj-duration-fast ease-standard hover:border-line-control hover:shadow-md focus-ring"
    >
      <span className="flex items-start justify-between gap-3">
        <Mark integration={integration} />
        <StatusBadge status={status} copy={copy} />
      </span>
      <span className="flex flex-1 flex-col gap-1">
        <span className="flex items-center gap-2 text-ui-lg font-semibold text-fg">
          {integration.name}
          {integration.popular && status !== 'connected' && (
            <Badge variant="secondary" className="font-normal">
              {copy.popular}
            </Badge>
          )}
        </span>
        <span className="text-pretty text-ui text-fg-muted">{integration.description}</span>
      </span>
      <span className="flex items-center justify-between gap-3 text-ui-sm text-fg-muted">
        <span>{integration.category}</span>
        {health ? (
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className={cn('size-1.5 rounded-full', HEALTH_DOT[health])} />
            {copy.health[health]}
          </span>
        ) : (
          <ChevronRightIcon size={16} aria-hidden className="transition-transform yj-duration-fast ease-standard group-hover/card:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover/card:-translate-x-0.5" />
        )}
      </span>
    </button>
  )
}

export function IntegrationCardSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-start justify-between">
        <Skeleton className="size-10 rounded-lg" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-5 w-1/2" />
      <Skeleton className="h-10 w-full" />
    </div>
  )
}
