'use client'

import { Counter } from '@youj/motion'
import { AlertTriangleIcon, CheckCircleIcon, CircleXIcon } from '@youj/icons'
import { HistoryStrip } from '../../../components/ui/history-strip'
import { cn } from '../../../lib/utils'
import { CRITICAL, stats, statusOf, TARGET, type StatusService, type ServiceStatus } from '../status/data'
import type { PublicStatusCopy } from './data'

const STATUS: Record<ServiceStatus, { icon: typeof CheckCircleIcon; ink: string }> = {
  operational: { icon: CheckCircleIcon, ink: 'text-success-text' },
  degraded: { icon: AlertTriangleIcon, ink: 'text-warning-text' },
  outage: { icon: CircleXIcon, ink: 'text-danger-text' },
}

/** A service on the public page: its status today and uptime over the window, over the same day strip the card uses, each day's detail on hover or focus. */
function ServiceRow({ service, copy }: { service: StatusService; copy: PublicStatusCopy }) {
  const status = statusOf(service.days.at(-1))
  const { icon: Icon, ink } = STATUS[status]
  const { average } = stats(service.days)
  return (
    <li className="flex flex-col gap-2.5 py-4 first:pt-0 last:pb-0">
      <div className="flex items-center gap-3">
        <span className="min-w-0 flex-1 truncate font-mono font-medium">{service.name}</span>
        <span className="text-ui-sm text-fg-muted tabular-nums max-sm:hidden">
          <Counter value={Math.floor(average * 10000) / 10000} format={{ style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 }} /> {copy.uptime}
        </span>
        <span className={cn('flex items-center gap-1.5 text-ui-sm', ink)}>
          <Icon size={14} />
          {copy.status[status]}
        </span>
      </div>
      <HistoryStrip days={service.days} target={TARGET} critical={CRITICAL} label={copy.stripLabel(service.name)} />
    </li>
  )
}

export { ServiceRow }
