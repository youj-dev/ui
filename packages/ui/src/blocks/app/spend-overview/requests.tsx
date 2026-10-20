'use client'

import { Badge } from '../../../components/ui/badge'
import { Skeleton } from '../../../components/ui/skeleton'
import { cn } from '../../../lib/utils'
import type { SpendOverviewCopy, SpendRequest } from './data'
import { ago } from './format'
import { Panel } from './panel'

interface RequestsProps {
  copy: SpendOverviewCopy
  locale: string
  now: Date | string | number
  /** Newest first. */
  requests: SpendRequest[]
  /** How many bars the strip draws and how many rows the list shows. */
  strip: number
  rows: number
  onOpen?: () => void
  loading?: boolean
  empty?: boolean
}

const failedOf = (r: SpendRequest) => r.status >= 400

/** The latest requests as a strip of bars (taller costs more, failures in the danger ink) over a short list with status codes. */
function Requests({ copy, locale, now, requests, strip, rows, onOpen, loading, empty }: RequestsProps) {
  const latest = requests.slice(0, strip)
  const failed = latest.filter(failedOf).length
  const tallest = Math.max(1, ...latest.map((r) => r.cost))
  return (
    <Panel
      title={copy.requests}
      description={
        loading || latest.length === 0 ? (
          '\u00a0'
        ) : (
          <>
            {copy.requestsLatest(latest.length)}
            {failed > 0 && (
              <>
                {' · '}
                <span className="text-danger-text">{copy.failed(failed)}</span>
              </>
            )}
          </>
        )
      }
      contentClassName="min-h-47"
      onOpen={onOpen}
      openLabel={copy.open(copy.requests.toLowerCase())}
    >
      {loading ? (
        <Skeleton className="h-10 w-full" />
      ) : (
        <div role="img" aria-label={copy.requestStrip(latest.length, failed)} className="flex h-10 items-end gap-0.5">
          {[...latest].reverse().map((r) => (
            <span
              key={r.id}
              className={cn('min-w-0 flex-1 rounded-xs', failedOf(r) ? 'bg-danger' : 'bg-line')}
              style={{ height: `${Math.max(14, (r.cost / tallest) * 100)}%` }}
            />
          ))}
        </div>
      )}
      <ul className="flex flex-col divide-y divide-line">
        {loading
          ? [0, 1, 2, 3].map((i) => (
              <li key={i} className="flex min-h-9 items-center gap-3 py-2">
                <Skeleton className="h-4 w-full" />
              </li>
            ))
          : empty
            ? <li className="py-2 text-ui text-fg-muted">{copy.emptyRequests}</li>
            : requests.slice(0, rows).map((r) => (
              <li key={r.id} className="flex min-h-9 items-center gap-3 py-2 text-ui">
                <Badge variant={failedOf(r) ? 'danger' : 'secondary'} size="sm" className="tabular-nums">
                  <span className="sr-only">{failedOf(r) ? copy.failedRequest : ''} </span>
                  {r.status}
                </Badge>
                <span className="min-w-0 flex-1 truncate">
                  <span className="font-medium">{r.name}</span> <span className="text-fg-muted">· {r.caller}</span>
                </span>
                <time dateTime={r.at} className="shrink-0 text-ui-sm text-fg-muted tabular-nums">
                  {ago(locale, now, r.at)}
                </time>
              </li>
            ))}
      </ul>
    </Panel>
  )
}

export { Requests }
