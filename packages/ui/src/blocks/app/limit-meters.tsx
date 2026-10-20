'use client'

import { type ComponentProps, type ReactNode, useId, useMemo, useState } from 'react'
import { ThemeScope, useLocale, useYouj, type ThemeInput } from '@youj/core'
import { MoreHorizontalIcon } from '@youj/icons'
import { Alert, AlertAction, AlertDescription } from '../../components/ui/alert'
import { Badge, BadgeDot } from '../../components/ui/badge'
import { RefillMeter } from '../../components/ui/refill-meter'
import { Button } from '../../components/ui/button'
import { AsyncButton } from '../../components/ui/async-button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Sparkline } from '../../components/ui/sparkline'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../components/ui/empty'
import { Skeleton } from '../../components/ui/skeleton'
import { Eyebrow } from '../../components/ui/typography'
import { useAnnouncer } from '../../hooks/use-announcer'
import { cn, numberFormat } from '../../lib/utils'
import { DEFAULT_COPY, KINDS, LIMITERS, demo, type LimitMetersKind, type LimitMetersLimiter, type LimitMetersCopy } from './limit-meters/data'
import { useTraffic } from './limit-meters/use-traffic'

/* A rate limiter, live: pick an API key or an endpoint and its token bucket
 * fills the card. Requests spend tokens and the bucket earns them back at
 * the limit's pace, so the cells drain in bursts and refill on their own;
 * the marker is the burst allowance (the most a client may send at once),
 * and under it the bucket turns amber. Above it, the traffic in requests a
 * minute and the state as a soft pill; below it, the refusals (HTTP 429) of
 * the last hour with their trend, the limit, the bucket and the share let
 * through. Send a burst spends more than the bucket holds, so you can watch
 * it drain and refuse; Raise limit (Button onAction) widens the limit, the
 * bucket and the burst. Without `limiters` it runs seeded demo traffic
 * (`use-traffic.ts`) under a "Demo data" badge, with Send a burst and Refill
 * to play with it; pass your gateway's limiters and it shows their figures. It is built for the compact layout density
 * (ui.css), taken from the page; embedded, it keeps its natural width unless `fill`.
 * Reduced motion: the bucket still
 * refills, a token at a time, and cells change in place. */

interface LimitMetersProps extends Omit<ComponentProps<'section'>, 'children' | 'title'> {
  /** Wraps the block in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (544px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the card's strings, to rewrite or translate. */
  copy?: Partial<LimitMetersCopy>
  /** What there is to choose from, with its figures now; re-render with fresh ones to keep it live. Default: demo limiters, driven by simulated traffic. */
  limiters?: LimitMetersLimiter[]
  /** The groups the limiters are listed under in the picker, in order; a limiter's `kind` is one's `id`. Default: API keys and Endpoints. */
  kinds?: LimitMetersKind[]
  /** Writes the rate figures (the throughput, the limit and the policy line) as text. Default: the locale's number format. Units come from `copy`. */
  format?: { rate?: (value: number) => string }
  /** The limiter shown first. Default: the first. */
  defaultLimiter?: string
  /** Raises a limiter's limit; resolve when it's applied. Default: a short demo wait. */
  onRaiseLimit?: (limiter: LimitMetersLimiter) => Promise<unknown> | unknown
  /** Skeletons in place of the figures while your data loads. Default false. */
  loading?: boolean
  /** Shown in place of the figures when they fail to load, with Retry when `onRetry` is set. Default: none. */
  error?: ReactNode
  /** Retries after an `error`. Default: none. */
  onRetry?: () => void
  /** Replaces the message when `limiters` is empty. Default: `copy.emptyTitle` and `copy.emptyDescription`. */
  empty?: ReactNode
  /** Shows a dashed "Demo data" badge while the card runs on simulated traffic (no `limiters` passed). Default true. */
  demoMarker?: boolean
  /** Formats its numbers and dates (BCP 47). Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
}

const VOICE = 'font-(family-name:--yj-label-font) tracking-(--yj-label-tracking) [text-transform:var(--yj-label-case)]'
const TONE = { ok: 'success', low: 'warning', empty: 'danger' } as const

function LimitMeters({
  theme,
  embedded = true,
  fill = false,
  copy: copyProp,
  limiters: limitersProp,
  kinds = KINDS,
  format,
  defaultLimiter,
  onRaiseLimit,
  loading = false,
  error,
  onRetry,
  empty,
  demoMarker = true,
  locale,
  className,
  ...rest
}: LimitMetersProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp, locale: useLocale(locale ?? copyProp?.locale) }
  const k = useYouj()
  // Without your limiters it runs on demo traffic, marked as such; with them, it shows your figures.
  const blank = loading || Boolean(error) || limitersProp?.length === 0
  const simulated = limitersProp === undefined && !loading && !error
  const limiters = limitersProp ?? LIMITERS
  const titleId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const { announce, announcer } = useAnnouncer()
  const [selected, setSelected] = useState(defaultLimiter ?? limiters[0]?.id ?? '')
  // How far each limiter's limit has been raised.
  const [raised, setRaised] = useState<Record<string, number>>({})
  const limiter = limiters.find((l) => l.id === selected) ?? limiters[0] ?? LIMITERS[0]!
  const factor = simulated ? (raised[limiter.id] ?? 1) : 1
  const limit = Math.round(limiter.limit * factor)
  const capacity = Math.round(limiter.capacity * factor)
  const burst = Math.round(limiter.burst * factor)
  const traffic = useTraffic(limiter, limit, capacity, k.timeScale, simulated)

  const number = useMemo(() => numberFormat(copy.locale), [copy.locale])
  const percent = useMemo(() => numberFormat(copy.locale, { style: 'percent', maximumFractionDigits: 2 }), [copy.locale])
  const level = traffic.bucket.value
  const state = level < 1 ? 'empty' : level < burst ? 'low' : 'ok'
  const refused = traffic.refusals.reduce((a, b) => a + b, 0)
  const rate = format?.rate ?? ((value: number) => number.format(Math.round(value)))
  // Rounded down, so a single refusal never reads as 100%; the decimals and the sign muted.
  const accepted = percent.formatToParts(Math.floor(traffic.accepted * 10000) / 10000)
  const cut = accepted.findIndex((p) => p.type === 'decimal' || p.type === 'percentSign')
  const stats = [
    { label: copy.limit, value: rate(limit), muted: ` ${copy.perMinuteUnit}` },
    { label: copy.capacity, value: number.format(capacity), muted: ` ${copy.tokensUnit}` },
    {
      label: copy.accepted,
      value: accepted
        .slice(0, cut < 0 ? undefined : cut)
        .map((p) => p.value)
        .join(''),
      muted:
        cut < 0
          ? ''
          : accepted
              .slice(cut)
              .map((p) => p.value)
              .join(''),
    },
  ]

  // The body's room is the figures' own, so the card keeps its size.
  const placeholder = loading ? (
    <div aria-busy className="flex flex-col gap-6 py-(--card-spacing) px-(--card-spacing)">
      <span className="sr-only">{copy.loading}</span>
      <Skeleton className="h-control w-full" />
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-40" />
      </div>
      <Skeleton className="h-16 w-full" />
      <div className="flex items-end gap-5 border-t border-line pt-5">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 flex-1" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-8" />
        ))}
      </div>
    </div>
  ) : error ? (
    <div className="grid place-items-center p-(--card-spacing)">
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
  ) : (
    <div className="grid p-(--card-spacing)">
      {empty ?? (
        <Empty className="rounded-lg border border-dashed border-line">
          <EmptyHeader>
            <EmptyTitle>{copy.emptyTitle}</EmptyTitle>
            <EmptyDescription>{copy.emptyDescription}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  )

  const card = (
    <Card className={cn('w-full gap-0 overflow-hidden py-0 text-fg', !embedded && !fill && 'max-w-136')}>
      <CardHeader className="border-b border-line py-(--card-spacing)">
        <CardTitle className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Title id={titleId}>{copy.title}</Title>
          {simulated && demoMarker && (
            <Badge variant="outline" data-slot="demo-marker" className="border-dashed border-line-strong">
              {copy.demoData}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>{copy.scope}</CardDescription>
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={copy.more} />}>
              <MoreHorizontalIcon size={16} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>{copy.viewLogs}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigator.clipboard?.writeText(limiter.id)}>{copy.copyId}</DropdownMenuItem>
              {simulated && (
                <DropdownMenuItem
                  onClick={() => {
                    traffic.refill()
                    announce(copy.refilled)
                  }}
                >
                  {copy.refill}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>

      {blank ? (
        <div className="grid min-h-110">{placeholder}</div>
      ) : (
        <>
          <CardContent className="flex flex-col gap-6 py-(--card-spacing)">
            <Select
              items={limiters.map((l) => ({ value: l.id, label: l.name }))}
              value={limiter.id}
              onValueChange={(value) => value && setSelected(value as string)}
            >
              <SelectTrigger aria-label={copy.limiter} className="w-full">
                <SelectValue>
                  {(value: string) => {
                    const l = limiters.find((o) => o.id === value)
                    return l ? (
                      <span className="flex min-w-0 items-baseline gap-2.5">
                        <span className="truncate font-mono text-fg">{l.name}</span>
                        <span className="truncate font-mono text-ui-sm text-fg-muted">{l.hint}</span>
                      </span>
                    ) : null
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {kinds.map((group) => (
                  <SelectGroup key={group.id}>
                    <SelectLabel>{group.label}</SelectLabel>
                    {limiters
                      .filter((l) => l.kind === group.id)
                      .map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          <span className="flex min-w-0 flex-1 items-baseline justify-between gap-4">
                            <span className="truncate font-mono">{l.name}</span>
                            <span className="shrink-0 font-mono text-ui-sm text-fg-muted">{l.hint}</span>
                          </span>
                        </SelectItem>
                      ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <Eyebrow className={VOICE}>{copy.throughput}</Eyebrow>
                <Badge variant={TONE[state]} className="font-sans tracking-normal normal-case">
                  <BadgeDot />
                  {copy.status[state]}
                </Badge>
              </div>
              <p className="flex items-baseline gap-2 font-mono tabular-nums">
                <span className="text-4xl leading-none font-medium tracking-[-0.03em] text-fg">{rate(traffic.volume)}</span>
                <span className="text-ui-lg text-fg-muted">{copy.perMinute}</span>
              </p>
            </div>

            <RefillMeter
              label={copy.tokens}
              value={traffic.bucket.value}
              updatedAt={traffic.bucket.at}
              capacity={capacity}
              refillRate={limiter.refill ?? limit / 60}
              burst={burst}
              locale={copy.locale}
            />
          </CardContent>

          <CardContent className="flex flex-col gap-5 border-t border-line py-(--card-spacing)">
            <div className="flex items-end gap-5">
              <div className="flex shrink-0 flex-col gap-2">
                <Eyebrow className={VOICE}>
                  {/* The status code keeps its case in a theme that sets labels in capitals. */}
                  {copy.throttledCode && (
                    <>
                      <span className="normal-case">{copy.throttledCode}</span> ·{' '}
                    </>
                  )}
                  {copy.throttledWindow}
                </Eyebrow>
                <span
                  className={cn('font-mono text-2xl leading-none font-medium tracking-tight tabular-nums', refused ? 'text-danger-text' : 'text-fg')}
                >
                  {number.format(refused)}
                </span>
              </div>
              <Sparkline
                data={traffic.refusals}
                domain={[0, Math.max(4, ...traffic.refusals)]}
                color="var(--color-danger)"
                label={copy.throttledChart(number.format(refused))}
                className="h-10 min-w-0 flex-1"
              />
            </div>
            <dl className="grid grid-cols-3 gap-3">
              {stats.map((stat) => (
                <div key={stat.label} className="flex min-w-0 flex-col gap-1.5">
                  <Eyebrow render={<dt />} className={VOICE}>
                    {stat.label}
                  </Eyebrow>
                  <dd className="truncate font-mono text-ui-lg text-fg tabular-nums">
                    {/* Isolated, so a unit keeps its side of the figure on an RTL page. */}
                    <bdi>
                      {stat.value}
                      <span className="text-fg-muted">{stat.muted}</span>
                    </bdi>
                  </dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </>
      )}

      <CardFooter className="flex-wrap justify-between gap-3">
        <span className={cn('text-ui-sm text-fg-muted tabular-nums', VOICE)}>
          {loading ? (
            <Skeleton className="h-4 w-48" />
          ) : blank ? (
            <span className="text-fg-subtle">—</span>
          ) : (
            copy.policy(rate(limit), number.format(burst))
          )}
        </span>
        <div className="ms-auto flex gap-2">
          {simulated && (
            <Button variant="secondary" onClick={() => traffic.send(Math.round(capacity * 1.25))}>
              {copy.sendBurst}
            </Button>
          )}
          <AsyncButton
            disabled={blank}
            pendingLabel={copy.raising}
            onAction={async () => {
              await (onRaiseLimit ? onRaiseLimit(limiter) : demo('LimitMeters: onRaiseLimit', 900))
              // Your limiters come back with the new limit; the demo raises its own.
              if (!simulated) return
              const next = factor * 1.5
              setRaised((r) => ({ ...r, [limiter.id]: next }))
              announce(copy.raised(rate(Math.round(limiter.limit * next))))
            }}
          >
            {copy.raise}
          </AsyncButton>
        </div>
      </CardFooter>
      {announcer}
    </Card>
  )

  const view = embedded ? (
    <section aria-labelledby={titleId} {...rest} className={cn('w-full', !fill && 'max-w-136', className)}>
      {card}
    </section>
  ) : (
    <main
      aria-labelledby={titleId}
      {...rest}
      className={cn('grid min-h-dvh w-full grid-cols-[minmax(0,1fr)] place-items-center bg-canvas px-4 py-10 text-fg', className)}
    >
      {card}
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { LimitMeters, type LimitMetersProps }
