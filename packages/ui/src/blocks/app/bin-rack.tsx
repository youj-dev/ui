'use client'

import { useId, useState, type ComponentProps, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { Alert, AlertAction, AlertDescription } from '../../components/ui/alert'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../components/ui/empty'
import { Skeleton } from '../../components/ui/skeleton'
import { Switch } from '../../components/ui/switch'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn, numberFormat, toneColor } from '../../lib/utils'
import { BINS, DEFAULT_COPY, LOW_BELOW, PARTS, type BinRackBin, type BinRackCopy, type BinRackPart, type BinRackState, type BinRackTone } from './bin-rack/data'
import { binState, refillCount } from './bin-rack/model'
import { Rack } from './bin-rack/rack'

/* A rack of bins as an isometric drawing: each bin a cell holding a
 * block as tall as its stock, in its part's color; a low bin turns the warning
 * color and an empty one is a dashed danger outline. Above it, how many bins
 * need a refill and when the next refill runs. Point at a bin, tap it, or tab
 * to it in the list (every bin is there in words, with its state and when it
 * runs out) and its tag shows how many are left and how long they last. At
 * the foot, auto-call is a switch: on, a bin that drops under the
 * threshold calls the refill. Loading, an error with Retry and a rack with
 * no bins take the drawing's place at its size. The drawing is decorative; the bin list is its text.
 * Reduced motion: the bins stand still.
 * It is built for the compact layout density (ui.css), taken from the page;
 * embedded too, it stops at its natural width unless `fill`. */

interface BinRackProps extends Omit<ComponentProps<'section'>, 'children' | 'title'> {
  /** Wraps the card in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (384px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the card's strings, to rewrite or translate. */
  copy?: Partial<BinRackCopy>
  /** Formats its numbers (BCP 47). Default: the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** The parts the bins hold, with their colors. */
  parts?: BinRackPart[]
  /** The bins in rack order, filled across two rows. */
  bins?: BinRackBin[]
  /** A bin at or under this share of its capacity is low, 0–1. Default 0.25. */
  lowBelow?: number
  /** Time until the next refill, in minutes unless `format.time` says otherwise. Default 6; `null` hides it. */
  nextRefill?: number | null
  /** Whether a low bin calls the tugger by itself (controlled). */
  autoCall?: boolean
  /** Whether it starts on (uncontrolled). Default true. */
  defaultAutoCall?: boolean
  /** Called with the new setting when the switch flips. */
  onAutoCallChange?: (on: boolean) => void
  /** The bin tagged at first (its `id`). Default: the first one that is low or empty. */
  defaultSelected?: string
  /** Called with the bin when one is picked, by pointer or the list. */
  onBinSelect?: (bin: BinRackBin) => void
  /** How its figures read. `count` formats quantities and the refill count, `time` formats a time left (default: the locale's number and "min"). */
  format?: { count?: (value: number) => string; time?: (value: number) => string }
  /** Skeletons in place of the rack and its figures while your data loads. Default false. */
  loading?: boolean
  /** Shown in place of the rack when it fails to load, with Retry when `onRetry` is set. */
  error?: string
  /** Retries after an `error`. */
  onRetry?: () => void
  /** Replaces the message when there are no bins. Default: `copy.emptyTitle` and `copy.emptyDescription`. */
  empty?: ReactNode
}

function BinRack({
  theme,
  embedded = true,
  fill = false,
  copy: copyProp,
  locale: localeProp,
  parts = PARTS,
  bins = BINS,
  lowBelow = LOW_BELOW,
  nextRefill = 6,
  autoCall: autoCallProp,
  defaultAutoCall = true,
  onAutoCallChange,
  defaultSelected,
  onBinSelect,
  format,
  loading = false,
  error,
  onRetry,
  empty,
  className,
  ...rest
}: BinRackProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const locale = useLocale(localeProp)
  const titleId = useId()
  const hintId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const count = numberFormat(locale)
  const percent = numberFormat(locale, { style: 'percent', maximumFractionDigits: 0 })
  const formatCount = format?.count ?? count.format
  const formatTime = format?.time ?? ((n: number) => copy.minutes(count.format(n)))
  const states = bins.map((b) => binState(b.quantity, b.capacity, lowBelow))
  const refill = refillCount(states)
  const [autoCall, setAutoCall] = useControllableState(autoCallProp, defaultAutoCall)
  const [selected, setSelected] = useState(defaultSelected ?? bins[states.findIndex((s) => s !== 'ok')]?.id ?? bins[0]?.id ?? '')
  const pick = (bin: BinRackBin) => {
    setSelected(bin.id)
    onBinSelect?.(bin)
  }
  const noFigures = loading || !!error || bins.length === 0
  const figure = (value: ReactNode, skeleton: string) => (loading ? <Skeleton className={skeleton} /> : noFigures ? <span className="text-fg-subtle">—</span> : value)
  // The rack's room: the same shape it draws in, so the card keeps its size.
  const frame = 'aspect-[314.67/265.2] w-full'
  const emptyIn = (bin: BinRackBin, state: string) => (state === 'empty' ? copy.isEmpty : bin.timeLeft === undefined ? '' : copy.emptyIn(formatTime(bin.timeLeft)))

  const card = (
    <Card data-slot="bin-rack" className={cn('w-full gap-0 overflow-hidden py-0 text-fg', !embedded && !fill && 'max-w-sm')}>
      <header className="flex items-start justify-between gap-3 px-(--ui--panel-x) pt-(--ui--panel-head-y) pb-(--ui--panel-y)">
        <div className="flex min-w-0 flex-col gap-1">
          <Title id={titleId} className="text-(length:--ui--panel-title) leading-(--ui--panel-title-leading) font-semibold tracking-tight">
            {copy.title}
          </Title>
          <div className="text-ui text-fg-muted tabular-nums">{figure(copy.subtitle(copy.rack, bins.length), 'h-4 w-32')}</div>
        </div>
        {/* A sentence, not a label: it keeps its case in a theme that sets badges in capitals. */}
        {loading ? (
          <Skeleton className="h-6 w-20 rounded-chip" />
        ) : (
          !noFigures && (
            <Badge variant={refill ? 'warning' : 'success'} size="lg" className="font-sans text-ui tracking-normal normal-case">
              {refill ? copy.lowBadge(refill) : copy.allStocked}
            </Badge>
          )
        )}
      </header>

      <div className="flex flex-col gap-3 border-t border-line px-(--ui--panel-x) py-(--ui--panel-y)">
        <div className="flex items-baseline justify-between gap-3">
          <span className="flex items-baseline gap-1.5">
            <span className="text-2xl leading-none font-semibold tabular-nums">{figure(formatCount(refill), 'h-6 w-8')}</span>
            <span className="text-ui text-fg-muted">{copy.toRefill(refill)}</span>
          </span>
          {nextRefill !== null && <span className="text-ui text-fg-muted tabular-nums">{figure(copy.nextRefill(formatTime(nextRefill)), 'h-4 w-16')}</span>}
        </div>

        {loading ? (
          <div className={cn(frame, 'grid grid-cols-4 grid-rows-2 gap-3 p-3')}>
            <span className="sr-only">{copy.loadingLabel}</span>
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="size-full rounded-surface" />
            ))}
          </div>
        ) : error ? (
          <div className={cn(frame, 'grid place-items-center')}>
            <Alert variant="danger">
              <AlertDescription>{error}</AlertDescription>
              {onRetry && (
                <AlertAction>
                  <Button size="sm" variant="outline" onClick={onRetry}>
                    {copy.retry}
                  </Button>
                </AlertAction>
              )}
            </Alert>
          </div>
        ) : bins.length === 0 ? (
          <div className={cn(frame, 'grid')}>
            {empty ?? (
              <Empty className="rounded-lg border border-dashed border-line">
                <EmptyHeader>
                  <EmptyTitle>{copy.emptyTitle}</EmptyTitle>
                  <EmptyDescription>{copy.emptyDescription}</EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </div>
        ) : (
          <div role="group" aria-label={copy.drawingLabel}>
            <Rack
              bins={bins}
              parts={parts}
              states={states}
              selected={selected}
              tag={(bin) => {
                const state = states[bins.indexOf(bin)] ?? 'ok'
                return [copy.tag(bin.label, formatCount(bin.quantity)), emptyIn(bin, state)]
              }}
              onSelect={(id) => {
                const bin = bins.find((b) => b.id === id)
                if (bin && id !== selected) pick(bin)
              }}
            />
            {/* The drawing's text: every bin, reachable by keyboard; focusing one tags it on the rack. */}
            <ul aria-label={copy.binList} className="sr-only">
              {bins.map((bin, i) => {
                const state = states[i] ?? 'ok'
                return (
                  <li key={bin.id}>
                    <button type="button" aria-pressed={bin.id === selected} onFocus={() => pick(bin)} onClick={() => pick(bin)}>
                      {copy.bin(bin.label, formatCount(bin.quantity), copy.state[state], emptyIn(bin, state))}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-ui-sm text-fg-muted">
          {parts.map((part) => (
            <li key={part.id} className="flex items-center gap-1.5">
              <span aria-hidden className="size-2 rounded-xs" style={{ background: toneColor(part.tone) }} />
              {part.label}
            </li>
          ))}
          <li className="flex items-center gap-1.5">
            <span aria-hidden className="size-2 rounded-xs bg-warning" />
            {copy.keyLow}
          </li>
          <li className="flex items-center gap-1.5">
            <svg aria-hidden width={8} height={8} viewBox="0 0 8 8">
              <rect x={0.5} y={0.5} width={7} height={7} fill="none" stroke="var(--color-danger)" strokeWidth={1} strokeDasharray="2 1.5" />
            </svg>
            {copy.keyEmpty}
          </li>
        </ul>
      </div>

      <footer className="flex items-center justify-between gap-4 border-t border-line px-(--ui--panel-x) py-(--ui--panel-foot-y)">
        <div className="flex min-w-0 flex-col">
          <label htmlFor={`${hintId}-switch`} className="text-ui font-medium">
            {copy.autoCall}
          </label>
          <p id={hintId} className="text-ui-sm text-fg-muted tabular-nums">
            {copy.autoCallHint(percent.format(lowBelow))}
          </p>
        </div>
        <Switch
          id={`${hintId}-switch`}
          aria-describedby={hintId}
          checked={autoCall}
          onCheckedChange={(on) => {
            setAutoCall(on)
            onAutoCallChange?.(on)
          }}
        />
      </footer>
    </Card>
  )

  const view = embedded ? (
    <section aria-labelledby={titleId} {...rest} className={cn('w-full', !fill && 'max-w-sm', className)}>
      {card}
    </section>
  ) : (
    <main aria-labelledby={titleId} {...rest} className={cn('grid min-h-dvh w-full grid-cols-[minmax(0,1fr)] place-items-center bg-canvas px-4 py-10 text-fg', className)}>
      {card}
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { BinRack, type BinRackProps }
export type { BinRackBin, BinRackCopy, BinRackPart, BinRackState, BinRackTone }
