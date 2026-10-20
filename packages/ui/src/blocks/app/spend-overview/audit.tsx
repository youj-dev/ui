'use client'

import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
import { Skeleton } from '../../../components/ui/skeleton'
import { cn, initials } from '../../../lib/utils'
import type { SpendAuditEvent, SpendOverviewCopy } from './data'
import { ago } from './format'
import { Panel } from './panel'

interface AuditProps {
  copy: SpendOverviewCopy
  locale: string
  now: Date | string | number
  /** Newest first. */
  events: SpendAuditEvent[]
  onOpen?: () => void
  loading?: boolean
}

/** What changed lately, newest first, on a quiet line with a dot for each change. */
function Audit({ copy, locale, now, events, onOpen, loading }: AuditProps) {
  return (
    <Panel
      title={copy.audit}
      description={loading || events.length === 0 ? '\u00a0' : copy.auditCount(events.length)}
      onOpen={onOpen}
      openLabel={copy.open(copy.audit.toLowerCase())}
      className="flex-1"
    >
      {loading ? (
        <div className="flex flex-col gap-5">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <p className="text-ui text-fg-muted">{copy.emptyAudit}</p>
      ) : (
        <ol className="flex flex-col">
          {events.map((e, i) => (
            <li key={e.id} className="relative flex flex-col gap-1.5 pb-5 ps-6 last:pb-0">
              {/* The line runs from this dot to the next. */}
              {i < events.length - 1 && <span aria-hidden className="absolute start-0.75 top-3.5 -bottom-1 w-px bg-line" />}
              <span aria-hidden className={cn('absolute start-0 top-1.5 size-2 rounded-full', i === 0 ? 'bg-accent' : 'bg-fg-subtle')} />
              <div className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 truncate text-ui font-medium">{e.title}</span>
                <time dateTime={e.at} className="shrink-0 text-ui-sm text-fg-muted tabular-nums">
                  {ago(locale, now, e.at)}
                </time>
              </div>
              <span className="flex items-center gap-2 text-ui-sm text-fg-muted">
                <Avatar size="sm">
                  <AvatarFallback className="text-ui-xs">{initials(e.actor)}</AvatarFallback>
                </Avatar>
                {copy.by(e.actor)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  )
}

export { Audit }
