'use client'

import { Counter } from '@youj/motion'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Skeleton } from '../../../components/ui/skeleton'
import { Sparkline } from '../../../components/ui/sparkline'
import { ToggleGroup, ToggleGroupItem } from '../../../components/ui/toggle-group'
import { RANGES, type Range, type PublicStatusCopy } from './data'

interface ResponseTimesProps {
  data: number[]
  range: Range
  onRangeChange: (range: Range) => void
  /** Draws the line in warning while the incident shows on it. */
  warn: boolean
  loading: boolean
  copy: PublicStatusCopy
}

function ResponseTimes({ data, range, onRangeChange, warn, loading, copy }: ResponseTimesProps) {
  const label = copy.ranges[range]
  const sorted = [...data].sort((a, b) => a - b)
  const p50 = sorted[Math.floor(sorted.length / 2)] ?? 0
  const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? 0
  return (
    <Card aria-busy={loading || undefined}>
      <CardHeader>
        <CardTitle>{copy.responseTitle}</CardTitle>
        <CardDescription>{copy.responseDescription(label)}</CardDescription>
        <CardAction>
          <ToggleGroup variant="segmented" size="sm" value={[range]} onValueChange={(v) => v[0] && onRangeChange(v[0] as Range)} aria-label={copy.range}>
            {(Object.keys(RANGES) as Range[]).map((r) => (
              <ToggleGroupItem key={r} value={r} className="tabular-nums">
                {r}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {loading ? (
          <Skeleton className="h-36 w-full" />
        ) : data.length === 0 ? (
          <p className="py-6 text-center text-ui text-fg-muted">{copy.noResponseTimes}</p>
        ) : (
          <>
            <dl className="flex gap-8">
              {[
                ['p50', p50],
                ['p95', p95],
              ].map(([k, v]) => (
                <div key={k} className="flex flex-col">
                  <dt className="text-ui-xs text-fg-muted uppercase">{k}</dt>
                  <dd className="text-xl font-semibold tracking-tight tabular-nums">
                    <Counter value={v as number} duration="slow" /> <span className="text-ui-sm font-normal text-fg-muted">{copy.ms}</span>
                  </dd>
                </div>
              ))}
            </dl>
            <Sparkline data={data} label={copy.responseLabel(label, p50)} color={warn ? 'var(--color-warning)' : undefined} className="h-24 w-full" />
          </>
        )}
      </CardContent>
    </Card>
  )
}

export { ResponseTimes }
