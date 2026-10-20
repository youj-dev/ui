'use client'

import type { CSSProperties, ReactNode } from 'react'
import { PresenceItem, PresenceList } from '@youj/motion'
import { XIcon } from '@youj/icons'
import { Button } from '../../../components/ui/button'
import { AsyncButton } from '../../../components/ui/async-button'
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from '../../../components/ui/card'
import type { SeatMapRow, SeatMapTier } from '../../../components/ui/seat-map'
import { ShareBar } from '../../../components/ui/share-bar'
import { Eyebrow } from '../../../components/ui/typography'
import { cn, numberFormat } from '../../../lib/utils'
import { Skeleton } from '../../../components/ui/skeleton'
import type { SeatPlanCopy } from './data'

interface SelectionProps {
  picked: string[]
  rows: SeatMapRow[]
  tiers: SeatMapTier[]
  /** Seconds left on the hold. */
  left: number
  /** Seconds a pick is held in all; null for no hold: no timer, no lapse. */
  hold: number | null
  /** How many seats can be picked. */
  max: number
  /** Added per seat on top of its price; 0 for none. */
  fee: number
  format: (price: number) => string
  /** The total in parts, to set the cents and the currency small; omitted with your own `format`. */
  formatParts?: (value: number) => Intl.NumberFormatPart[]
  loading: boolean
  error: boolean
  onRemove: (id: string) => void
  onClear: () => void
  onHold: () => void
  onConfirm: () => unknown
  copy: SeatPlanCopy
  heading: 'h2' | 'h3'
}

const TONES = ['var(--color-chart-1)', 'var(--color-chart-2)', 'var(--color-chart-3)', 'var(--color-chart-4)', 'var(--color-chart-5)']

/** The picked seats with their prices, the fees and total in mono, and the hold counting down. Seats with no price show none, and with no price anywhere the sums go. */
function Selection({ picked, rows, tiers, left, hold, max, fee, format, formatParts, loading, error, onRemove, onClear, onHold, onConfirm, copy, heading: Heading }: SelectionProps) {
  const two = numberFormat(copy.locale, { minimumIntegerDigits: 2 })
  const seats = rows.flatMap((row) => row.seats.map((seat) => ({ row, seat })))
  const lines = picked.flatMap((id) => {
    const hit = seats.find((s) => s.seat.id === id)
    const i = tiers.findIndex((t) => t.id === hit?.seat.tier)
    return hit && i >= 0 ? [{ ...hit, name: hit.seat.label ?? `${hit.row.label}${hit.seat.number}`, tier: tiers[i]!, tone: tiers[i]!.tone ? `var(--color-${tiers[i]!.tone})` : TONES[i % TONES.length]! }] : []
  })
  // A price of 0 is as good as none: no "$0" noise.
  const priced = tiers.some((t) => t.price)
  const subtotal = lines.reduce((sum, l) => sum + (l.tier.price ?? 0), 0)
  const fees = priced ? lines.length * fee : 0
  const expired = hold !== null && left <= 0
  const low = left <= 120
  const figure = (value: ReactNode, width = 'w-14') => (loading ? <Skeleton className={cn('ms-auto h-4', width)} /> : error ? <span className="text-fg-subtle">—</span> : value)

  return (
    <Card size="sm" className="w-full lg:absolute lg:inset-0">
      <CardHeader>
        <CardTitle>
          <Heading>{copy.selection}</Heading>
        </CardTitle>
        <CardAction>
          <span className="tabular-nums">{loading ? <Skeleton className="inline-block h-4 w-10 align-middle" /> : error ? <span className="text-fg-subtle">—</span> : copy.count(lines.length, max)}</span>
        </CardAction>
      </CardHeader>

      <CardContent className="yj-scrollbar flex max-h-64 min-h-0 flex-col gap-3 overflow-y-auto lg:max-h-none lg:flex-1">
        {loading ? (
          <div className="flex flex-col" aria-hidden>
            {[0, 1].map((i) => (
              <div key={i} className="flex items-center gap-3 border-t border-line py-2 first:border-t-0">
                <Skeleton className="h-7 w-10 rounded-md" />
                <span className="flex flex-1 flex-col gap-1.5">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3 w-20" />
                </span>
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        ) : error ? null : lines.length === 0 ? (
          <p className="py-2 text-ui text-fg-muted">{expired ? copy.expired : copy.pickPrompt}</p>
        ) : (
          <PresenceList as="ul" className="flex flex-col">
            {lines.map((l) => (
              <PresenceItem key={l.seat.id} className="flex items-center gap-3 border-t border-line py-2 first:border-t-0">
                <span
                  className="grid h-7 min-w-10 place-items-center rounded-md bg-[color-mix(in_oklab,var(--tier)_22%,transparent)] px-1.5 font-mono text-ui-sm font-medium text-fg tabular-nums shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--tier)_45%,transparent)]"
                  style={{ '--tier': l.tone } as CSSProperties}
                >
                  {l.name}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-ui text-fg">{copy.seat(l.row.label, l.seat.number)}</span>
                  <span className="truncate text-ui-sm text-fg-muted">{l.tier.name}</span>
                </span>
                {l.tier.price ? <span className="font-mono text-ui text-fg tabular-nums">{format(l.tier.price)}</span> : null}
                <Button variant="ghost" size="icon-xs" aria-label={copy.remove(l.name)} onClick={() => onRemove(l.seat.id)}>
                  <XIcon size={12} />
                </Button>
              </PresenceItem>
            ))}
          </PresenceList>
        )}
      </CardContent>

      {priced && (
        <CardContent className="flex shrink-0 flex-col gap-2.5">
          <dl className="flex flex-col gap-1.5 font-mono text-ui-sm tabular-nums">
            <div className="flex justify-between gap-3">
              <dt className="text-fg-muted">{copy.subtotal}</dt>
              <dd className="text-fg">{figure(format(subtotal))}</dd>
            </div>
            {fee > 0 && (
              <div className="flex justify-between gap-3">
                <dt className="text-fg-muted">{copy.fees}</dt>
                <dd className="text-fg">{figure(format(fees))}</dd>
              </div>
            )}
          </dl>
          <div className="flex items-baseline justify-between gap-3 border-t border-line pt-3">
            <Eyebrow>{copy.total}</Eyebrow>
            <span className="font-mono text-3xl leading-none font-medium tracking-tight text-fg tabular-nums">
              {figure(
                formatParts
                  ? formatParts(subtotal + fees).map((p, i) => (
                      <span key={i} className={cn((p.type === 'decimal' || p.type === 'fraction' || p.type === 'currency') && 'text-[0.6em] text-fg-muted')}>
                        {p.value}
                      </span>
                    ))
                  : format(subtotal + fees),
                'w-24',
              )}
            </span>
          </div>
        </CardContent>
      )}

      {hold !== null && lines.length > 0 && (
        <CardContent className="flex shrink-0 flex-col gap-2.5">
          <div className="flex items-baseline justify-between gap-3">
            <Eyebrow>{copy.held}</Eyebrow>
            <span role="timer" aria-live="off" className={cn('font-mono text-ui-lg tabular-nums', low ? 'text-warning-text' : 'text-fg')}>
              {Math.floor(left / 60)}:{two.format(Math.floor(left % 60))}
            </span>
          </div>
          <ShareBar value={left} max={hold ?? 0} segments={20} tone={low ? 'warning' : 'neutral'} />
          <p className="text-ui-sm text-fg-muted">{copy.holdHint}</p>
        </CardContent>
      )}

      <CardFooter className="shrink-0 flex-wrap justify-end">
        {expired && lines.length === 0 ? (
          <Button variant="secondary" onClick={onHold} className="flex-1">
            {copy.holdAgain}
          </Button>
        ) : (
          <>
            <Button variant="secondary" onClick={onClear} disabled={lines.length === 0}>
              {copy.clear}
            </Button>
            <AsyncButton onAction={onConfirm} disabled={lines.length === 0 || loading || !!error} className="flex-1">
              {copy.confirm}
            </AsyncButton>
          </>
        )}
      </CardFooter>
    </Card>
  )
}

export { Selection }
