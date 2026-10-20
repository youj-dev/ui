'use client'

import { useId, useMemo, useState, type HTMLAttributes, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { Counter } from '@youj/motion'
import { MoreHorizontalIcon } from '@youj/icons'
import { Alert, AlertAction, AlertDescription } from '../../components/ui/alert'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { AsyncButton } from '../../components/ui/async-button'
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../components/ui/empty'
import { ShareBar } from '../../components/ui/share-bar'
import { Skeleton } from '../../components/ui/skeleton'
import { Treemap } from '../../components/ui/treemap'
import { Eyebrow } from '../../components/ui/typography'
import { useAnnouncer } from '../../hooks/use-announcer'
import { cn, dateTimeFormat, numberFormat } from '../../lib/utils'
import {
  BUDGET,
  CATEGORIES,
  DEFAULT_COPY,
  demo,
  PACE,
  PERIOD,
  STEPS,
  type PaceBudgetCategory,
  type PaceBudgetCopy,
  type PaceBudgetPeriod,
  type PaceBudgetStep,
} from './pace-budget/data'
import { StepsPlan } from './pace-budget/steps-plan'

/* A period's budget, read map first: the head says how much of it is used
 * (a thin meter), the treemap shows which categories it went to, and
 * the figures under it say what's used, what's left and the day it runs
 * out at the current pace. The plan is a list of switches, each
 * with what it frees; switching one on outlines the category it trims and
 * counts the total in the plan's head, beside the action that applies it.
 * Applying shrinks those categories (the map re-lays itself), the figures
 * count to their new values and the steps that ran leave the list. Swap the
 * demo fallback for your API with `onApply`. Loading holds skeletons in the
 * figures, map and plan; an error with Retry or no categories takes the
 * map's place, all at the card's size. A custom `format` writes every amount
 * as text. Reduced motion: numbers, cells and rows change in place.
 * It is built for the compact layout density (ui.css), taken from the page; embedded, it keeps its natural width unless `fill`. */

interface PaceBudgetProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** Wraps the card in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (672px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the card's strings, to rewrite or translate; `currency` sets how amounts read when there is no `format`. */
  copy?: Partial<PaceBudgetCopy>
  /** Formats numbers and dates (BCP 47). Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** What the period's budget has gone to, by category. */
  categories?: PaceBudgetCategory[]
  /** The steps of the plan. */
  steps?: PaceBudgetStep[]
  /** The period's budget. Default 4,200. */
  budget?: number
  /** What is used a day at the current pace, for the day the budget runs out. Default 68. */
  pace?: number
  /** The period: its year, month (0–11), today's date in it and the date it ends on. Default: September, day 18 of 30. */
  period?: PaceBudgetPeriod
  /** Writes every amount; with it the figures are text rather than rolling Counters. Default: whole amounts in `copy.currency` (US dollars). */
  format?: (value: number) => string
  /** Skeletons in place of the figures, map and plan while your data loads. Default false. */
  loading?: boolean
  /** Shown in place of the map when it fails to load, with Retry when `onRetry` is set; the figures show a dash. */
  error?: string
  /** Retries after an `error`. */
  onRetry?: () => void
  /** Replaces the message when there are no categories. Default: `copy.emptyTitle` and `copy.emptyDescription`. */
  empty?: ReactNode
  /** Puts the chosen steps into effect; resolve when they're done. Default: a short demo wait. */
  onApply?: (steps: PaceBudgetStep[]) => Promise<unknown> | unknown
}

/** The map's size, shared by the map and what stands in for it. */
const MAP_SIZE = 'aspect-[4/3] sm:aspect-[12/5]'
const TONES = ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5'] as const

function PaceBudget({
  theme,
  embedded = true,
  fill = false,
  copy: copyProp,
  locale,
  categories = CATEGORIES,
  steps: initialSteps = STEPS,
  budget = BUDGET,
  pace = PACE,
  period = PERIOD,
  format: formatProp,
  loading = false,
  error,
  onRetry,
  empty,
  onApply,
  className,
  ...rest
}: PaceBudgetProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp, locale: useLocale(locale ?? copyProp?.locale) }
  const titleId = useId()
  const planId = useId()
  const Title = embedded ? 'h2' : 'h1'
  // One level under the title, so the outline never skips a level.
  const PlanTitle = embedded ? 'h3' : 'h2'
  const { announce, announcer } = useAnnouncer()
  const status = loading ? 'loading' : error ? 'error' : categories.length === 0 ? 'empty' : 'ready'
  const ready = status === 'ready'
  const [amounts, setAmounts] = useState(categories)
  const [steps, setSteps] = useState(initialSteps)
  const [on, setOn] = useState(() => new Set(initialSteps.filter((s) => s.planned).map((s) => s.id)))
  // Data that arrives after loading, an error or an empty period starts the card afresh.
  const [wasReady, setWasReady] = useState(ready)
  if (ready !== wasReady) {
    setWasReady(ready)
    if (ready) {
      setAmounts(categories)
      setSteps(initialSteps)
      setOn(new Set(initialSteps.filter((s) => s.planned).map((s) => s.id)))
    }
  }
  // What the last plan saved, for the success label once nothing is chosen; and whether one is running.
  const [saved, setSaved] = useState(0)
  const [busy, setBusy] = useState(false)

  const currency = useMemo(() => ({ style: 'currency', currency: copy.currency, maximumFractionDigits: 0 }) as const, [copy.currency])
  const money = useMemo(() => formatProp ?? numberFormat(copy.locale, currency).format, [formatProp, copy.locale, currency])
  const percent = useMemo(() => numberFormat(copy.locale, { style: 'percent', maximumFractionDigits: 0 }).format, [copy.locale])
  const date = useMemo(() => dateTimeFormat(copy.locale, { month: 'short', day: 'numeric' }).format, [copy.locale])
  const used = amounts.reduce((sum, c) => sum + c.used, 0)
  const left = Math.max(0, budget - used)
  const share = budget > 0 ? used / budget : 0
  const chosen = steps.filter((s) => on.has(s.id))
  const frees = chosen.reduce((sum, s) => sum + s.frees, 0)
  // The day the money left runs out at this pace, if that's before the month ends.
  const day = period.today + Math.floor(left / pace)
  const short = day < period.days

  const toggle = (id: string) =>
    setOn((set) => {
      const next = new Set(set)
      if (!next.delete(id)) next.add(id)
      return next
    })

  const apply = async () => {
    await (onApply ? onApply(chosen) : demo('PaceBudget: onApply', 1100))
    const from = (id: string) => chosen.filter((s) => s.category === id).reduce((sum, s) => sum + s.frees, 0)
    setAmounts((list) => list.map((c) => ({ ...c, used: Math.max(0, c.used - from(c.id)) })))
    setSteps((list) => list.filter((s) => !on.has(s.id)))
    setOn(new Set())
    setSaved(frees)
    announce(copy.applied(money(frees)))
  }

  // An amount rolls in a Counter; your own `format` can't, so it is text.
  const amount = (value: number) => (formatProp ? formatProp(value) : <Counter value={value} from={value} locale={copy.locale} format={currency} />)
  const dash = <span className="text-fg-subtle">—</span>
  const figures = [
    { label: copy.used, value: ready ? amount(used) : null, width: 'w-24' },
    { label: copy.left, value: ready ? amount(left) : null, width: 'w-24' },
    {
      label: copy.runsOut,
      value: ready ? (short ? date(new Date(period.year, period.month, day)) : copy.lasts) : null,
      note: ready ? copy.pace(money(pace)) : null,
      tone: ready && short && 'text-warning-text',
      width: 'w-20',
    },
  ]

  const card = (
    <Card className={cn('w-full gap-0 overflow-hidden py-0 text-fg', !embedded && !fill && 'max-w-2xl')}>
      <CardHeader className="py-(--card-spacing)">
        <CardTitle>
          <Title id={titleId} className="truncate">
            {copy.title}
          </Title>
        </CardTitle>
        <CardDescription className="truncate">{copy.subtitle}</CardDescription>
        <CardAction className="flex items-center gap-4">
          <div className="flex w-24 shrink-0 flex-col items-end gap-2 sm:w-40">
            {ready ? (
              <Counter
                value={share}
                from={share}
                locale={copy.locale}
                format={{ style: 'percent', maximumFractionDigits: 0 }}
                className={cn('font-mono text-ui-lg font-medium tabular-nums', share >= 0.85 ? 'text-warning-text' : 'text-fg')}
              />
            ) : status === 'loading' ? (
              <Skeleton className="h-5 w-10" />
            ) : (
              <span className="font-mono text-ui-lg font-medium text-fg-subtle">—</span>
            )}
            {ready ? (
              <ShareBar
                value={used}
                max={budget}
                tone={share >= 0.85 ? 'warning' : 'accent'}
                label={copy.meter}
                valueText={copy.meterValue(money(used), money(budget), percent(share))}
              />
            ) : (
              <Skeleton className="h-2 w-full" />
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="secondary" size="icon-sm" aria-label={copy.more} className="shrink-0" />}>
              <MoreHorizontalIcon size={16} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>{copy.editBudget}</DropdownMenuItem>
              <DropdownMenuItem>{copy.exportCsv}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>

      <div className="px-(--ui--panel-x)">
        {ready ? (
          <Treemap
            items={amounts.map((c, i) => ({ id: c.id, name: c.name, value: c.used, tone: c.tone ?? TONES[i % TONES.length] }))}
            highlight={[...new Set(chosen.map((s) => s.category))]}
            formatValue={money}
            label={copy.mapLabel}
            // Categories are words, not identifiers: their names read in the text face; amounts stay mono.
            className={cn(MAP_SIZE, '[&_[data-slot=treemap-cell-name]]:font-sans [&_[data-slot=treemap-cell-name]]:font-medium')}
          />
        ) : status === 'loading' ? (
          <>
            <span className="sr-only">{copy.loadingLabel}</span>
            <div aria-hidden className={cn(MAP_SIZE, 'grid grid-cols-[3fr_2fr] grid-rows-2 gap-1')}>
              <Skeleton className="row-span-2 h-full rounded-lg" />
              <Skeleton className="h-full rounded-lg" />
              <Skeleton className="h-full rounded-lg" />
            </div>
          </>
        ) : (
          <div className={cn(MAP_SIZE, 'grid place-items-center')}>
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
      </div>

      <dl className="grid grid-cols-3 gap-4 px-(--ui--panel-x) py-(--ui--panel-y)">
        {figures.map((figure) => (
          <div key={figure.label} className="flex min-w-0 flex-col gap-1.5">
            <Eyebrow
              render={<dt />}
              className="text-ui-sm text-fg-muted [font-family:var(--yj-label-font)] [text-transform:var(--yj-label-case)] [letter-spacing:var(--yj-label-tracking)]"
            >
              {figure.label}
            </Eyebrow>
            <dd className={cn('flex min-w-0 flex-col gap-0.5', figure.tone || 'text-fg')}>
              {/* An amount keeps its own direction (bdi), so it reads the same on an RTL page and still aligns to the start. */}
              <span className="truncate text-xl font-semibold tracking-tight tabular-nums">
                {status === 'loading' ? <Skeleton className={cn('my-1 h-5', figure.width)} /> : ready ? <bdi>{figure.value}</bdi> : dash}
              </span>
              {/* The note keeps its line while there is none, so the figures hold their height. */}
              <span className="h-[1lh] truncate text-ui-sm text-fg-muted">{figure.note}</span>
            </dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby={planId} className="flex flex-col border-t border-line px-(--ui--panel-x) pt-4 pb-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <PlanTitle id={planId} className="me-auto text-ui-lg font-semibold tracking-tight">
            {copy.plan}
          </PlanTitle>
          {ready && frees ? (
            <Badge dir="auto" size="lg" className="font-mono text-ui tracking-normal normal-case tabular-nums">
              {/* One run of text, so the badge's gap doesn't split the sign from the figure. */}
              <span>
                −{formatProp ? formatProp(frees) : <Counter value={frees} locale={copy.locale} format={currency} inView={false} duration="slow" />}
              </span>
            </Badge>
          ) : (
            ready && <span className="text-ui text-fg-muted">{copy.noneSelected}</span>
          )}
          <AsyncButton
            size="sm"
            onAction={apply}
            onActionStateChange={(state) => setBusy(state !== 'idle')}
            disabled={!ready || (!frees && !busy)}
            pendingLabel={copy.applying}
            successLabel={copy.applied(money(frees || saved))}
          >
            {copy.apply}
          </AsyncButton>
        </div>
        <StepsPlan
          steps={steps}
          on={on}
          copy={copy}
          format={money}
          onToggle={toggle}
          placeholder={ready ? undefined : loading ? 'loading' : 'blank'}
        />
      </section>
      {announcer}
    </Card>
  )

  const view = embedded ? (
    <section aria-labelledby={titleId} {...rest} className={cn('w-full', !fill && 'max-w-2xl', className)}>
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

export { PaceBudget, type PaceBudgetProps }
export type { PaceBudgetCategory, PaceBudgetCopy, PaceBudgetPeriod, PaceBudgetStep }
