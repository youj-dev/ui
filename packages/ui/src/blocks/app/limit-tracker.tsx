'use client'

import { useEffect, useId, useState, type HTMLAttributes, type ReactNode } from 'react'
import { ThemeScope, useLocale, useYouj, type ThemeInput } from '@youj/core'
import { ChevronDownIcon, MoreHorizontalIcon } from '@youj/icons'
import { Alert, AlertAction, AlertDescription } from '../../components/ui/alert'
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { LimitMeter } from '../../components/ui/limit-meter'
import { Button } from '../../components/ui/button'
import { AsyncButton } from '../../components/ui/async-button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../components/ui/empty'
import { Skeleton } from '../../components/ui/skeleton'
import { Switch } from '../../components/ui/switch'
import { Eyebrow } from '../../components/ui/typography'
import { cn, numberFormat } from '../../lib/utils'
import {
  COUNT,
  DEFAULT_COPY,
  demo,
  ELAPSED,
  ENTRIES,
  INCREASE,
  LIMIT,
  LIMITS,
  RULES,
  type LimitTrackerCopy,
  type LimitTrackerEntry,
  type LimitTrackerRule,
  type LimitTrackerText,
} from './limit-tracker/data'

/* A limit and what has used of it, read from the top down: what it covers and
 * when it renews; what is still available on a ruler from zero to the limit, with the
 * line of a rule on it and the pace as a compact list beside the headline (the
 * runway until the line, the entries so far, the average); the categories as
 * tiles, each with its share; and the rules as switches. A rule with a `line`
 * drives the ruler: off, its line and its runway go and the pace counts to the
 * limit instead. Change limit rescales the ruler and the request button adds
 * `increase`, both sweeping from where the use is. Wire `onRequestIncrease`
 * to your API. Loading holds skeletons at the card's size; an error with
 * Retry or no entries takes the ruler's place. A custom `format` writes every
 * amount. Reduced motion: every value is drawn in place.
 * It is built for the compact layout density (ui.css), taken from the page, sharing Card's sides, bands and corner; embedded, it keeps its natural width unless `fill`, at the cards' elevation. */

interface LimitTrackerProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** Wraps the block in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** A panel inside another page: an `h2` instead of the page's `h1` (its sections an `h3` instead of an `h2`), and no page around it. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (576px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<LimitTrackerCopy>
  /** Formats numbers and dates (BCP 47). Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** What has been used so far, by category. Default: four demo categories. */
  entries?: LimitTrackerEntry[]
  /** The limit for the period. Default 2,000. */
  limit?: number
  /** The rules at the foot, as switches; one with a `line` draws it on the ruler. Default: a card's freeze, receipts and approver rules. */
  rules?: LimitTrackerRule[]
  /** The limits the menu offers, with the current one. Default 1,500 to 5,000. */
  limits?: number[]
  /** What a request adds to the limit. Default 250. */
  increase?: number
  /** How many entries there have been, for the pace list. Default 23. */
  count?: number
  /** How much of the period has gone, in the unit the average is read in. Default 19 (days). */
  elapsed?: number
  /** Writes every amount; the ruler, tiles, rules and menu all use it. Default: `copy.currency` in the locale's number format. */
  format?: (value: number) => string
  /** Skeletons in place of the ruler, the tiles and the rules while your data loads. Default false. */
  loading?: boolean
  /** Shown in place of the ruler when it fails to load, with Retry when `onRetry` is set. */
  error?: string
  /** Retries after an `error`. */
  onRetry?: () => void
  /** Replaces the message when there are no entries. Default: `copy.emptyTitle` and `copy.emptyDescription`. */
  empty?: ReactNode
  /** Requests a higher limit (the current one plus `increase`); the ruler rescales once it resolves. Default: a short demo wait. */
  onRequestIncrease?: (limit: number) => Promise<unknown> | unknown
}

const VOICE = 'font-(family-name:--yj-label-font) tracking-(--yj-label-tracking) [text-transform:var(--yj-label-case)]'
const WELL = 'bg-[color-mix(in_oklab,var(--color-canvas)_calc(45%*var(--yj-dark)),color-mix(in_oklab,var(--color-fg)_3%,transparent))]'
const BARS = ['bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4', 'bg-chart-5']
/** The tiles held by the skeleton while loading, and hidden behind a message. */
const PLACEHOLDER_TILES = [1, 2, 3, 4].map((n) => ({ id: String(n), name: '', amount: 0 }))

function LimitTracker({
  theme,
  embedded = true,
  fill = false,
  copy: copyProp,
  locale,
  entries = ENTRIES,
  limit: initialLimit = LIMIT,
  rules: ruleList = RULES,
  limits = LIMITS,
  increase = INCREASE,
  count = COUNT,
  elapsed = ELAPSED,
  format: formatProp,
  loading = false,
  error,
  onRetry,
  empty,
  onRequestIncrease,
  className,
  ...rest
}: LimitTrackerProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp, locale: useLocale(locale ?? copyProp?.locale) }
  const k = useYouj()
  const titleId = useId()
  const Title = embedded ? 'h2' : 'h1'
  // One level under the title, so the outline never skips a level.
  const SectionTitle = embedded ? 'h3' : 'h2'
  const status = loading ? 'loading' : error ? 'error' : entries.length === 0 ? 'empty' : 'ready'
  const ready = status === 'ready'
  const [limit, setLimit] = useState(initialLimit)
  const [rules, setRules] = useState(() => Object.fromEntries(ruleList.map((r) => [r.id, !!r.on])))
  // Data that arrives after loading, an error or an empty period starts the card afresh.
  const [wasReady, setWasReady] = useState(ready)
  if (ready !== wasReady) {
    setWasReady(ready)
    if (ready) {
      setLimit(initialLimit)
      setRules(Object.fromEntries(ruleList.map((r) => [r.id, !!r.on])))
    }
  }
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  const currency = numberFormat(copy.locale, { style: 'currency', currency: copy.currency })
  const whole = formatProp ?? numberFormat(copy.locale, { style: 'currency', currency: copy.currency, maximumFractionDigits: 0 }).format
  const money = formatProp ?? currency.format
  const percent = numberFormat(copy.locale, { style: 'percent', maximumFractionDigits: 0 })
  const spent = entries.reduce((sum, s) => sum + s.amount, 0)
  const perUnit = spent / Math.max(elapsed, 1)
  // A rule's line only stands on the ruler while the rule is on and under the limit; the pace counts to the nearest.
  const lines = ruleList.flatMap((r) => (rules[r.id] && r.line && r.line.at < limit ? [r.line] : [])).sort((a, b) => a.at - b.at)
  const line = lines[0]
  const runway = Math.max(0, Math.floor(((line ? line.at : limit) - spent) / (perUnit || 1)))
  const top = Math.max(...entries.map((s) => s.amount), 1)
  const toggle = (id: string) => (on: boolean) => setRules((r) => ({ ...r, [id]: on }))
  const text = (value: LimitTrackerText) => (typeof value === 'function' ? value(whole) : value)

  const pace = [
    { value: copy.runway(runway), label: line ? copy.untilLine : copy.untilLimit, tone: line && 'text-warning-text' },
    { value: String(count), label: copy.countLabel },
    { value: money(perUnit), label: copy.perUnit },
  ]

  const card = (
    <Card
      role="group"
      aria-labelledby={titleId}
      {...(embedded ? rest : null)}
      className={cn(
        'w-full gap-0 overflow-hidden py-0 text-fg',
        // Embedded, it sits at the elevation of the cards beside it.
        embedded ? 'shadow-sm' : 'shadow-lg',
        !fill && 'max-w-144',
        embedded && className,
      )}
    >
      <CardHeader className="py-(--card-spacing)">
        <CardTitle className="flex items-baseline gap-2.5">
          <Title id={titleId}>{copy.title}</Title>
          <span className="text-ui font-normal text-fg-muted tabular-nums">{copy.aside}</span>
        </CardTitle>
        <CardDescription className="truncate">{copy.subtitle}</CardDescription>
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={copy.more} />}>
              <MoreHorizontalIcon size={15} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>{copy.viewHistory}</DropdownMenuItem>
              <DropdownMenuItem>{copy.viewDetails}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>

      {/* From sm up the pace shares the meter's cell, pinned beside its headline; the headline keeps a gutter clear for it. */}
      <section className="relative flex flex-col gap-4 border-t border-line px-(--ui--panel-x) py-(--ui--panel-y) sm:grid">
        {ready ? (
          <>
            <LimitMeter
              spent={spent}
              limit={limit}
              locale={copy.locale}
              format={{ style: 'currency', currency: copy.currency }}
              formatValue={formatProp}
              label={copy.meter}
              markers={lines.map((l) => ({ value: l.at, label: l.label, tone: 'warning' as const }))}
              className="sm:[grid-area:1/1] sm:[&_[data-slot=limit-meter-header]]:pe-64"
            />
            <dl
              className={cn(
                'flex flex-col gap-1.5 rounded-lg px-3.5 py-3 text-ui sm:[grid-area:1/1] sm:w-60 sm:self-start sm:justify-self-end',
                WELL,
              )}
            >
              {pace.map((item, i) => (
                <div key={i} className="flex min-w-0 items-baseline justify-between gap-3">
                  <dt className="truncate text-fg-muted">{item.label}</dt>
                  <dd dir="auto" className={cn('shrink-0 font-mono font-medium tabular-nums', item.tone || 'text-fg')}>
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </>
        ) : (
          <>
            {/* The ruler's own size, drawn invisibly, so the skeleton or the message sits in the room it takes. */}
            <div aria-hidden className="invisible">
              <LimitMeter
                spent={0}
                limit={1}
                format={{ style: 'currency', currency: copy.currency }}
                label={copy.meter}
                markers={[{ value: 0.9, label: copy.untilLine, tone: 'warning' }]}
              />
            </div>
            {loading && <span className="sr-only">{copy.loadingLabel}</span>}
            {loading ? (
              <div aria-hidden className="absolute inset-x-(--ui--panel-x) inset-y-(--ui--panel-y) flex flex-col gap-3">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-3 w-56" />
                <Skeleton className="mt-auto h-6 w-full" />
              </div>
            ) : (
              <div className="absolute inset-0 grid place-items-center px-(--ui--panel-x)">
                {error ? (
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
                ) : (
                  (empty ?? (
                    <Empty className="rounded-lg border border-dashed border-line">
                      <EmptyHeader>
                        <EmptyTitle>{copy.emptyTitle}</EmptyTitle>
                        <EmptyDescription>{copy.emptyDescription}</EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </section>

      <section aria-labelledby={`${titleId}-categories`} className="flex flex-col gap-3 border-t border-line px-(--ui--panel-x) py-(--ui--panel-y)">
        <Eyebrow render={<SectionTitle id={`${titleId}-categories`} />} className={cn('text-ui-sm text-fg-muted', VOICE)}>
          {copy.categories}
        </Eyebrow>
        <ul aria-hidden={ready ? undefined : true} className={cn('grid grid-cols-2 gap-2', !ready && status !== 'loading' && 'invisible')}>
          {(ready ? entries : PLACEHOLDER_TILES).map((s, i) => (
            <li key={s.id} className={cn('flex min-w-0 flex-col gap-2.5 rounded-lg px-3.5 pt-3 pb-3.5', WELL)}>
              <div className="flex items-baseline justify-between gap-2 font-mono text-ui">
                {ready ? (
                  <>
                    <span className="truncate text-fg-muted">{s.name}</span>
                    <span className="text-fg-muted tabular-nums">{percent.format(spent ? s.amount / spent : 0)}</span>
                  </>
                ) : (
                  <>
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-8" />
                  </>
                )}
              </div>
              {ready ? <span className="font-mono text-ui-lg text-fg tabular-nums">{money(s.amount)}</span> : <Skeleton className="h-6 w-20" />}
              <div aria-hidden className="h-1 overflow-hidden rounded-full bg-band">
                <div
                  className={cn(
                    'h-full origin-left rounded-full transition-transform yj-duration-deliberate ease-enter rtl:origin-right',
                    BARS[i % BARS.length],
                  )}
                  style={{
                    transform: `scaleX(${ready && (shown || k.reduced) ? s.amount / top : 0})`,
                    transitionDelay: k.reduced ? undefined : `${i * k.stagger('loose')}s`,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby={`${titleId}-rules`} className="flex flex-col gap-1 border-t border-line px-(--ui--panel-x) pt-(--ui--panel-y) pb-3">
        <Eyebrow render={<SectionTitle id={`${titleId}-rules`} />} className={cn('text-ui-sm text-fg-muted', VOICE)}>
          {copy.rules}
        </Eyebrow>
        {ready ? (
          <ul className="flex flex-col divide-y divide-line">
            {ruleList.map((rule) => (
              <li key={rule.id}>
                <label className="flex cursor-pointer items-center justify-between gap-4 py-3">
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-ui-lg text-fg">{text(rule.title)}</span>
                    <span className="text-ui text-fg-muted">{text(rule.hint)}</span>
                  </span>
                  <Switch checked={!!rules[rule.id]} onCheckedChange={toggle(rule.id)} />
                </label>
              </li>
            ))}
          </ul>
        ) : (
          <ul aria-hidden className={cn('flex flex-col divide-y divide-line', status !== 'loading' && 'invisible')}>
            {PLACEHOLDER_TILES.slice(0, 3).map((tile) => (
              <li key={tile.id} className="flex items-center justify-between gap-4 py-3">
                <span className="flex min-w-0 flex-col gap-1.5">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-56" />
                </span>
                <Skeleton className="h-5 w-9 rounded-full" />
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-(--ui--panel-x) py-(--ui--panel-foot-y)">
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="secondary" disabled={!ready} />}>
            {copy.change}
            <ChevronDownIcon size={14} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuRadioGroup value={String(limit)} onValueChange={(value) => setLimit(Number(value))}>
              <DropdownMenuLabel>{copy.limitLabel}</DropdownMenuLabel>
              {[...new Set([...limits, limit])]
                .sort((a, b) => a - b)
                .map((option) => (
                  <DropdownMenuRadioItem key={option} value={String(option)}>
                    {whole(option)}
                  </DropdownMenuRadioItem>
                ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <AsyncButton
          disabled={!ready}
          pendingLabel={copy.requesting}
          onAction={async () => {
            await (onRequestIncrease ? onRequestIncrease(limit + increase) : demo('LimitTracker: onRequestIncrease', 800))
            setLimit((l) => l + increase)
          }}
        >
          {copy.increase}
        </AsyncButton>
      </footer>
    </Card>
  )

  const view = embedded ? (
    card
  ) : (
    <main {...rest} className={cn('grid min-h-dvh w-full place-items-center bg-canvas px-4 py-10 text-fg', className)}>
      {card}
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { LimitTracker, type LimitTrackerProps }
export type { LimitTrackerCopy, LimitTrackerEntry, LimitTrackerRule }
