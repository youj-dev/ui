'use client'

import { useId, useRef, useState, type ComponentProps, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { Counter } from '@youj/motion'
import { MoreHorizontalIcon, PlusIcon } from '@youj/icons'
import { Alert, AlertAction, AlertDescription } from '../../components/ui/alert'
import { Badge, BadgeDot } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { AsyncButton } from '../../components/ui/async-button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import { AllocationMeter } from '../../components/ui/allocation-meter'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../components/ui/empty'
import { Skeleton } from '../../components/ui/skeleton'
import { Eyebrow } from '../../components/ui/typography'
import { useAnnouncer } from '../../hooks/use-announcer'
import {
  DAYS_LEFT,
  DEFAULT_COPY,
  ENTRIES,
  ENVELOPES,
  MONEY,
  NEXT_ENTRIES,
  TODAY,
  demo,
  type EnvelopesCopy,
  type EnvelopesEntry,
  type EnvelopesEnvelope,
} from './envelopes/data'
import { Amount, Entries } from './envelopes/entries'
import { cn, numberFormat } from '../../lib/utils'

/* A budget of anything as envelopes (money, hours, credits): "Safe to spend
 * today" in big mono with its decimals muted (what's left across the envelopes, spread over the days to
 * payday), then the envelopes as a rack of cells that drain as money goes
 * (AllocationMeter): rollover hatched on top, an overspent envelope spilling
 * in the danger tone. Drag money from one envelope onto another, or pick it
 * up from the keyboard: both columns relight and the figure rolls. Under it
 * the latest entries, each tagged to its envelope. Cover overspending moves
 * the shortfall from the fullest envelope; Add expense logs the next demo
 * entry; wire `onAdd` to your API. Amounts are written by `format` (dollars,
 * hours, credits). Loading, an error with Retry and an empty rack take the
 * envelopes' place at their size. Reduced motion: cells light in place and
 * figures don't roll.
 * It is built for the compact layout density (ui.css), taken from the page; embedded,
 * it stops at its natural width, as it does on its own, unless `fill`. */

interface EnvelopesProps extends Omit<ComponentProps<'section'>, 'children'> {
  /** Wraps the block in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (704px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<EnvelopesCopy>
  /** How its dates, times and numbers read (BCP 47). Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** How the amounts are written (Intl.NumberFormat options): dollars, hours, credits. Default: US dollars. */
  format?: Intl.NumberFormatOptions
  /** The most one drag or key press moves between envelopes, in the format's units. Default 10. */
  step?: number
  /** Default: five demo envelopes, one overspent. New data replaces what the card holds, moves included. */
  envelopes?: EnvelopesEnvelope[]
  /** Newest first. Default: five demo entries. */
  entries?: EnvelopesEntry[]
  /** Days until the budget resets, today included. Default 3. */
  daysLeft?: number
  /** The day it is, as an ISO date. Default: the demo's Monday. */
  today?: string
  /** Add expense: resolve with the new entry to log it (`id` and `date` may be left out). Default: logs the next demo entry after a short demo wait. */
  onAdd?: () => Promise<NewEntry> | NewEntry
  /** Skeletons in place of the figures, the envelopes and the entries while your data loads. Default false. */
  loading?: boolean
  /** Shown in place of the envelopes when they fail to load, with Retry when `onRetry` is set. */
  error?: string
  /** Retries after an `error`. */
  onRetry?: () => void
  /** Replaces the message when there are no envelopes. Default: `copy.emptyTitle` and `copy.emptyDescription`. */
  empty?: ReactNode
}

type NewEntry = Omit<EnvelopesEntry, 'id' | 'date'> & Partial<Pick<EnvelopesEntry, 'id' | 'date'>>

const leftOf = (e: EnvelopesEnvelope) => e.budget + (e.rollover ?? 0) - e.spent
const dayBefore = (date: string) => new Date(Date.parse(`${date}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10)

function Envelopes({
  theme,
  embedded = true,
  fill = false,
  copy: copyProp,
  locale,
  format = MONEY,
  step = 10,
  envelopes: initial = ENVELOPES,
  entries: initialEntries = ENTRIES,
  daysLeft = DAYS_LEFT,
  today = TODAY,
  onAdd,
  loading = false,
  error,
  onRetry,
  empty,
  className,
  ...rest
}: EnvelopesProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp, locale: useLocale(locale ?? copyProp?.locale) }
  const titleId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const { announce, announcer } = useAnnouncer()
  const [envelopes, setEnvelopes] = useState(initial)
  const [entries, setEntries] = useState(initialEntries)
  // New data from the app replaces what the card holds (moves and added entries start over).
  const [given, setGiven] = useState({ initial, initialEntries })
  if (given.initial !== initial || given.initialEntries !== initialEntries) {
    setGiven({ initial, initialEntries })
    setEnvelopes(initial)
    setEntries(initialEntries)
  }
  const next = useRef(0)

  const wholeFormat: Intl.NumberFormatOptions = { ...format, minimumFractionDigits: 0, maximumFractionDigits: 0 }
  const whole = numberFormat(copy.locale, wholeFormat)
  const money = numberFormat(copy.locale, format)
  const ready = !loading && !error && envelopes.length > 0
  const total = envelopes.reduce((sum, e) => sum + e.budget + (e.rollover ?? 0), 0)
  const spent = envelopes.reduce((sum, e) => sum + e.spent, 0)
  const left = envelopes.reduce((sum, e) => sum + leftOf(e), 0)
  const safe = Math.max(0, left) / Math.max(1, daysLeft)
  const over = envelopes.filter((e) => leftOf(e) < 0)
  // Tight: something is overspent, or under a fifth of the month's money is left.
  const tight = over.length > 0 || left < total * 0.2

  const move = (from: string, to: string, amount: number) =>
    setEnvelopes((list) =>
      list.map((e) => (e.id === from ? { ...e, budget: e.budget - amount } : e.id === to ? { ...e, budget: e.budget + amount } : e)),
    )

  const cover = () => {
    const short = over[0]
    const donor = [...envelopes].filter((e) => e.id !== short?.id).sort((a, b) => leftOf(b) - leftOf(a))[0]
    if (!short || !donor) return
    const amount = Math.min(Math.ceil(-leftOf(short)), Math.floor(leftOf(donor)))
    move(donor.id, short.id, amount)
    announce(copy.covered(whole.format(amount), donor.name, short.name))
  }

  const addExpense = async () => {
    const item: NewEntry = onAdd ? await onAdd() : (await demo('Envelopes: onAdd', 600), NEXT_ENTRIES[next.current % NEXT_ENTRIES.length]!)
    next.current++
    setEntries((list) => [{ id: `new-${next.current}`, date: today, ...item }, ...list].slice(0, 6))
    setEnvelopes((list) => list.map((e) => (e.id === item.envelope ? { ...e, spent: e.spent + item.amount } : e)))
    announce(copy.added(item.title, money.format(item.amount)))
  }

  // Its natural width: on the card on its own page, on the section embedded (where a className can change it).
  const cap = !fill && 'max-w-176'

  // A figure of the data: a Skeleton while loading, a dash when it failed or is empty.
  const figure = (value: ReactNode) => (ready ? value : loading ? <Skeleton className="h-[1lh] w-20" /> : <span className="text-fg-subtle">—</span>)

  // The envelopes' room: the rack's own height, so the card keeps its size.
  const room = 'flex h-72 items-center justify-center'
  const rack = loading ? (
    <div className={cn(room, 'items-stretch gap-3')}>
      <span className="sr-only">{copy.loadingLabel}</span>
      {Array.from({ length: 5 }, (_, i) => (
        <Skeleton key={i} className="flex-1" />
      ))}
    </div>
  ) : error ? (
    <div className={room}>
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
  ) : envelopes.length === 0 ? (
    <div className={cn(room, 'grid')}>
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
    <AllocationMeter envelopes={envelopes} onMove={move} step={step} locale={copy.locale} format={wholeFormat} label={copy.envelopes} />
  )

  const card = (
    <Card className={cn('w-full text-fg', !embedded && cap)}>
      <CardHeader>
        <CardTitle>
          <Title id={titleId}>{copy.title}</Title>
        </CardTitle>
        <CardDescription className="tabular-nums">{copy.subtitle(daysLeft)}</CardDescription>
        <CardAction>
          <Button variant="ghost" size="icon-sm" aria-label={copy.more}>
            <MoreHorizontalIcon size={16} />
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div className="flex min-w-0 flex-col gap-2.5">
          <div className="flex min-h-5.5 flex-wrap items-center gap-2.5">
            <Eyebrow>{copy.safe}</Eyebrow>
            {ready ? (
              <Badge variant={tight ? 'warning' : 'success'}>
                <BadgeDot />
                {tight ? copy.tight : copy.onTrack}
              </Badge>
            ) : loading ? (
              <Skeleton className="h-5 w-14 rounded-full" />
            ) : null}
          </div>
          <div data-slot="envelopes-safe" className="min-h-8 font-mono text-3xl leading-none font-medium tracking-tight text-fg">
            {ready ? (
              <Counter
                value={safe}
                mode="roll"
                locale={copy.locale}
                format={format}
                className="[&_[data-part=currency]]:me-0.5 [&_[data-part=currency]]:text-[0.6em] [&_[data-part=currency]]:text-fg-muted [&_[data-part=unit]]:ms-0.5 [&_[data-part=unit]]:text-[0.6em] [&_[data-part=unit]]:text-fg-muted [&_[data-part=decimal]]:text-fg-muted [&_[data-part=fraction]]:text-fg-muted"
              />
            ) : loading ? (
              <Skeleton className="h-[1lh] w-40" />
            ) : (
              <span className="text-fg-subtle">—</span>
            )}
          </div>
          <p className="max-w-80 text-ui-sm text-fg-muted">{copy.safeHint(daysLeft)}</p>
        </div>
        {/* The tiles share their rows, so a label that wraps on a phone keeps both figures level. */}
        <dl className="grid grid-cols-2 gap-x-2 sm:w-76">
          {[
            { key: 'left', label: copy.left, value: figure(<Amount value={left} locale={copy.locale} format={format} />) },
            {
              key: 'spent',
              label: copy.spent,
              value: figure(
                <>
                  <Amount value={spent} locale={copy.locale} format={format} />
                  <span className="block truncate text-ui-sm text-fg-muted">{copy.spentOf(whole.format(total))}</span>
                </>,
              ),
            },
          ].map((stat) => (
            <div
              key={stat.key}
              className="row-span-2 grid min-w-0 grid-rows-subgrid gap-y-1.5 rounded-xl bg-[color-mix(in_oklab,var(--color-canvas)_calc(45%*var(--yj-dark)),color-mix(in_oklab,var(--color-fg)_3%,transparent))] px-3.5 py-2.5"
            >
              <Eyebrow render={<dt />} className="text-balance">
                {stat.label}
              </Eyebrow>
              <dd className="min-h-9 min-w-0 truncate font-mono text-ui-lg text-fg tabular-nums">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>

      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <Eyebrow>{copy.envelopes}</Eyebrow>
          <p aria-hidden className="hidden text-ui-sm text-fg-muted sm:block">
            {copy.dragHint(whole.format(step))}
          </p>
        </div>
        {rack}
      </CardContent>

      <CardContent className="flex flex-col gap-2">
        <Eyebrow>{copy.recent}</Eyebrow>
        {ready ? (
          <Entries items={entries} envelopes={envelopes} format={format} today={today} yesterday={dayBefore(today)} copy={copy} />
        ) : (
          <div className="-mx-2 flex h-77.5 flex-col">
            {Array.from({ length: loading ? 5 : 0 }, (_, i) => (
              <div key={i} className="flex flex-1 items-center gap-3 px-2">
                <Skeleton className="size-8 shrink-0 rounded-full" />
                <span className="flex flex-1 flex-col gap-1.5">
                  <Skeleton className="h-3.5 w-40" />
                  <Skeleton className="h-3 w-28" />
                </span>
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex-wrap justify-end">
        <span className="me-auto basis-full text-ui-sm text-fg-muted sm:basis-auto">{copy.payday}</span>
        <Button variant="secondary" disabled={!ready || !over.length} onClick={cover}>
          {copy.cover}
        </Button>
        <AsyncButton onAction={addExpense} disabled={!ready} pendingLabel={copy.adding}>
          <PlusIcon size={14} />
          {copy.add}
        </AsyncButton>
      </CardFooter>
      {announcer}
    </Card>
  )

  const view = embedded ? (
    <section aria-labelledby={titleId} {...rest} className={cn('w-full', cap, className)}>
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

export { Envelopes, type EnvelopesProps }
