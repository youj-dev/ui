'use client'

import { useId, useMemo, type ComponentProps, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { AppPage } from '../../components/ui/app-page'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Empty, EmptyContent, EmptyHeader, EmptyTitle } from '../../components/ui/empty'
import { cn, dateTimeFormat } from '../../lib/utils'
import { Audit } from './spend-overview/audit'
import { BillingCard, LeaderboardCard, PersonalCard } from './spend-overview/cards'
import {
  AUDIT,
  AVERAGE_SPEND,
  BILLING,
  DAILY,
  DEFAULT_COPY,
  LIMIT,
  MEMBERS,
  NOW,
  PERIOD_DAYS,
  PERSONAL,
  PREVIOUS,
  REQUESTS,
  START,
  type SpendAuditEvent,
  type SpendBilling,
  type SpendMember,
  type SpendOverviewCopy,
  type SpendPersonal,
  type SpendRequest,
} from './spend-overview/data'
import { forecastSpend, type SpendForecast } from './spend-overview/forecast'
import { Headline } from './spend-overview/headline'
import { addDays } from './spend-overview/format'
import type { SpendSection } from './spend-overview/panel'
import { Requests } from './spend-overview/requests'

/* The spend overview: where a workspace's money is going and whether it
 * will last the month. The headline is the spend so far with its change on the
 * last period and one plain status: on track, or the day it will exceed the
 * limit. Under it the month's running total is carried to the period's end on
 * a straight line at the latest days' pace (`forecastSpend`) over its likely
 * range, with the limit as a dashed line and the day the total crosses it
 * marked. Beside it: the latest requests as a strip of bars (failures in the
 * danger ink) over a short list with status codes, and the audit trail. Three
 * cards close the page: your own usage with its limit, the top spenders and
 * billing with the credit left and the workspace limit.
 * Pass `daily` (what each elapsed day cost), `start`, `periodDays` and `limit`,
 * and the rest as `requests`, `audit`, `personal`, `members` and `billing`;
 * `onOpen` adds a button to each card that takes the app to its page. Times
 * are relative to `now`. Loading, error and empty keep the page's size.
 * It is built for the compact layout density (ui.css), taken from the page;
 * embedded (the default), it is a page of your app's frame, with the shared
 * page header (AppPage) and no canvas of its own. */

interface SpendOverviewProps extends Omit<ComponentProps<'main'>, 'children' | 'title'> {
  /** Wraps the page in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** A page in your app's frame: the shared page header (AppPage) and the frame's gutter, across the whole width, with no canvas or `main` of its own. Default true; `false` draws its own page (a centered canvas under a `main`). */
  embedded?: boolean
  /** Any of the page's strings, to rewrite or translate. */
  copy?: Partial<SpendOverviewCopy>
  /** Formats numbers, money and dates (BCP 47). Default: the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** The currency amounts are in. Default 'USD'. */
  currency?: string
  /** What was spent on each elapsed day of the period, oldest first. */
  daily?: number[]
  /** The period's first day, `YYYY-MM-DD`. */
  start?: string
  /** The days in the period. Default 31. */
  periodDays?: number
  /** The workspace's spend limit for the period. */
  limit?: number
  /** What the same stretch of the last period cost, for the change. */
  previous?: number
  /** How many of the latest days set the forecast's pace. Default 7. */
  paceDays?: number
  /** The latest requests, newest first: the strip draws the first 40 and the list shows the first 4. */
  requests?: SpendRequest[]
  /** The latest changes to the workspace, newest first. */
  audit?: SpendAuditEvent[]
  /** The signed-in member's own spend. */
  personal?: SpendPersonal
  /** The members spending the most, biggest first. */
  members?: SpendMember[]
  /** What the average member spends. */
  averageSpend?: number
  /** The credit left and when the period turns over. */
  billing?: SpendBilling
  /** The moment relative times count to (a date, a date-time string or a timestamp). Default: a fixed demo moment. */
  now?: Date | string | number
  /** Adds a button to each card that opens its section; called with which one. */
  onOpen?: (section: SpendSection) => void
  /** Shows skeletons in place of the figures, chart and lists. */
  loading?: boolean
  /** A message in place of the page's content when loading failed. */
  error?: ReactNode
  /** Called by the error's Try again. */
  onRetry?: () => void
}

function SpendOverview({
  theme,
  embedded = true,
  copy: copyProp,
  locale: localeProp,
  currency = 'USD',
  daily = DAILY,
  start = START,
  periodDays = PERIOD_DAYS,
  limit = LIMIT,
  previous = PREVIOUS,
  paceDays = 7,
  requests = REQUESTS,
  audit = AUDIT,
  personal = PERSONAL,
  members = MEMBERS,
  averageSpend = AVERAGE_SPEND,
  billing = BILLING,
  now = NOW,
  onOpen,
  loading = false,
  error,
  onRetry,
  className,
  ...rest
}: SpendOverviewProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const locale = useLocale(localeProp)
  const titleId = useId()
  const forecast: SpendForecast = useMemo(() => forecastSpend({ daily, days: periodDays, limit, window: paceDays }), [daily, periodDays, limit, paceDays])
  const spent = forecast.actual.at(-1) ?? 0
  const open = (section: SpendSection) => (onOpen ? () => onOpen(section) : undefined)
  const resets = dateTimeFormat(locale, { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(addDays(billing.resetsAt, 0))
  const shared = { copy, locale, currency, loading }

  const header = (
    <header className="flex flex-col gap-1">
      <h1 id={titleId} className="text-2xl font-semibold tracking-tight">
        {copy.title}
      </h1>
      <p className="text-ui text-fg-muted">{copy.subtitle}</p>
    </header>
  )

  const body = error ? (
    <Card className="min-h-160">
      <Empty className="h-full flex-1">
        <EmptyHeader>
          <EmptyTitle>{error}</EmptyTitle>
        </EmptyHeader>
        {onRetry && (
          <EmptyContent>
            <Button variant="secondary" onClick={onRetry}>
              {copy.retry}
            </Button>
          </EmptyContent>
        )}
      </Empty>
    </Card>
  ) : (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_--spacing(88)]">
      <div className="@container flex min-w-0 flex-col gap-6">
        <Headline {...shared} start={start} periodDays={periodDays} limit={limit} spent={spent} previous={previous} forecast={forecast} />
        <div className="grid gap-6 @2xl:grid-cols-3">
          <PersonalCard {...shared} personal={personal} onOpen={open('personal')} />
          <LeaderboardCard {...shared} members={members} average={averageSpend} onOpen={open('leaderboard')} />
          <BillingCard {...shared} billing={billing} spent={spent} limit={limit} resets={resets} onOpen={open('billing')} />
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-6">
        <Requests {...shared} now={now} requests={requests} strip={40} rows={4} empty={requests.length === 0} onOpen={open('requests')} />
        <Audit {...shared} now={now} events={audit} onOpen={open('audit')} />
      </div>
    </div>
  )

  const loadingNote = loading && <span className="sr-only">{copy.loading}</span>

  const view = embedded ? (
    <AppPage {...(rest as ComponentProps<'div'>)} title={copy.title} description={copy.subtitle} width="fill" className={cn('text-fg', className)}>
      {loadingNote}
      {body}
    </AppPage>
  ) : (
    <main aria-labelledby={titleId} {...rest} className={cn('min-h-dvh bg-canvas px-4 py-10 text-fg md:px-8', className)}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        {header}
        {loadingNote}
        {body}
      </div>
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { SpendOverview, type SpendOverviewProps, type SpendSection }
export type { SpendAuditEvent, SpendBilling, SpendForecast, SpendMember, SpendOverviewCopy, SpendPersonal, SpendRequest }
