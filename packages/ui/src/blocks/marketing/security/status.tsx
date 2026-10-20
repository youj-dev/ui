'use client'

import { useMemo } from 'react'
import { CheckCircleIcon, ExternalLinkIcon, AlertTriangleIcon } from '@youj/icons'
import { HistoryStrip } from '../../../components/ui/history-strip'
import { cn, numberFormat } from '../../../lib/utils'
import type { MarketingSecurityCopy, SecurityStatus } from './data'

/* The live status: a headline in the state's tone, the uptime over the strip's
 * period, when it was last checked and a strip of daily uptime (focusable days,
 * each with its note). */

const MINUTE = 60_000
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['day', 1440 * MINUTE],
  ['hour', 60 * MINUTE],
  ['minute', MINUTE],
]

interface StatusProps {
  status: SecurityStatus
  now: number
  locale: string
  copy: MarketingSecurityCopy
  Link: React.ElementType
}

export function StatusCard({ status, now, locale, copy, Link }: StatusProps) {
  const formats = useMemo(
    () => ({ ago: new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }), percent: numberFormat(locale, { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 }) }),
    [locale],
  )
  const diff = status.checkedAt - now
  const [unit, size] = UNITS.find(([, ms]) => Math.abs(diff) >= ms) ?? UNITS[2]!
  const ago = Math.abs(diff) < MINUTE ? formats.ago.format(0, 'second') : formats.ago.format(Math.round(diff / size), unit)
  const good = status.state === 'operational'
  const Icon = good ? CheckCircleIcon : AlertTriangleIcon
  return (
    <div className="flex w-full flex-col gap-4 rounded-2xl border border-line bg-surface p-5 lg:w-96">
      <div className="flex items-start justify-between gap-3">
        <p className={cn('inline-flex items-center gap-2 text-ui-lg font-semibold', good ? 'text-success-text' : status.state === 'degraded' ? 'text-warning-text' : 'text-danger-text')}>
          <Icon size={18} aria-hidden />
          {copy.state[status.state]}
        </p>
        <span className="text-ui-sm text-fg-muted">{copy.checked(ago)}</span>
      </div>
      <p className="text-ui text-fg-muted">{copy.uptime(formats.percent.format(status.uptime), status.days?.length ?? 90)}</p>
      {status.days && <HistoryStrip days={status.days} size="sm" label={copy.statusStrip} />}
      <Link href={status.href} className="inline-flex items-center gap-1.5 self-start rounded-sm text-ui font-medium text-accent hover:underline focus-ring">
        {copy.statusPage}
        <ExternalLinkIcon size={14} aria-hidden />
      </Link>
    </div>
  )
}
