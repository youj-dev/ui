'use client'

import { useId, useMemo, useState, type ComponentProps, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { MoreHorizontalIcon } from '@youj/icons'
import { Badge, BadgeRemove } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { AsyncButton } from '../../components/ui/async-button'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../components/ui/empty'
import { Skeleton } from '../../components/ui/skeleton'
import { Eyebrow } from '../../components/ui/typography'
import { HistoryStrip } from '../../components/ui/history-strip'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn, numberFormat } from '../../lib/utils'
import {
  CRITICAL,
  dayDate,
  daysBetween,
  DEFAULT_COPY,
  demo,
  demoServices,
  overall,
  SERVICES,
  stats,
  STATUSES,
  TARGET,
  type StatusCopy,
  type StatusLevel,
  type StatusService,
} from './status/data'
import { Headline } from './status/headline'
import { ServiceList } from './status/service-list'

/* Status, the card: a platform's services over the last 90 days, inside your
 * app. Its sibling, the public status page (app-public-status), reads the same
 * services from ./status/data and draws them with the same strips. The SLA
 * leads, as a big mono figure with its decimals muted, beside the status
 * today and over the error budget the target leaves. Under it, every day as
 * a cell colored by its uptime (success, sliding through warning toward
 * danger), with each day's detail on hover or focus; under that, each
 * service's own 90 days as a mini strip. Pressing a service puts it on the
 * day strip and the figure: the colors sweep across to its history and the
 * digits roll to its uptime; pressing it again goes back to all of them.
 * Swap `services` for your monitoring data and the demo fallback for your API.
 * Pass your own `services` and `today` (the day the last entry is), wire the
 * `on…` actions, and every string is in `copy`; `loading`, `error` and an
 * empty fleet each have their state. Reduced motion: cells, digits and colors
 * change in place.
 * It is built for the compact layout density (ui.css), taken from the page; embedded, it keeps its natural width unless `fill`. */

interface StatusCardProps extends Omit<ComponentProps<'section'>, 'children' | 'defaultValue'> {
  /** Wraps the card in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (640px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the card's strings, to rewrite or translate. */
  copy?: Partial<StatusCopy>
  /** The title's heading level. Default 1, or 2 when `embedded`. */
  headingLevel?: 1 | 2 | 3
  /** Formats percentages and "days ago". Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** Each service with a day per entry, oldest first, the last today. Default: six demo services. */
  services?: StatusService[]
  /** The day the services' last entry is, as a Date or "YYYY-MM-DD"; "days ago" counts from it, and the demo fleet ends on it. Default: the last day in `services` (the demo's Sep 28, 2026). */
  today?: Date | string
  /** The statuses a service can be in, best first: a day at or above the target is the first, one above the critical line the second, anything below the last. A service's own `status` (an id) overrides that. Default: operational, degraded, outage. */
  statuses?: StatusLevel[]
  /** The uptime below which a day is an outage, 0–1, always under `target`. Default 0.99. */
  critical?: number
  /** Formats the uptime shares (0–1) in the figure, the target, the legend and the rows. Default: percentages in the locale. */
  format?: { uptime?: (share: number) => string }
  /** The SLA a day must meet, 0–1. Default 0.999. */
  target?: number
  /** The id of the service on the day strip, or null for all of them; pair with `onValueChange`. */
  value?: string | null
  /** The service on the day strip at first. Default null, all of them. */
  defaultValue?: string | null
  /** Called with the service id pressed, or null when it's pressed again. */
  onValueChange?: (id: string | null) => void
  /** Shows skeletons in place of the figures, strip and services. Default false. */
  loading?: boolean
  /** Shown in place of the figures when loading failed; an Error shows its message. */
  error?: ReactNode | Error
  /** Offers a retry beside `error`. */
  onRetry?: () => void
  /** Replaces the empty state shown when there are no services. Default: `copy.empty`. */
  empty?: ReactNode
  /** Subscribes to updates; resolve when done, reject with an Error to show its message. Default: a short demo wait that warns once in development. */
  onSubscribe?: () => Promise<unknown> | unknown
  /** The menu's Copy status link. Default: nothing. */
  onCopyLink?: () => void
  /** The menu's Export CSV. Default: nothing. */
  onExport?: () => void
  /** The Incident history button. Default: nothing. */
  onHistory?: () => void
}

const VOICE = 'font-(family-name:--yj-label-font) tracking-(--yj-label-tracking) [text-transform:var(--yj-label-case)]'

function StatusCard({
  theme,
  embedded = true,
  fill = false,
  className,
  copy: copyProp,
  headingLevel,
  locale,
  services: servicesProp,
  today: todayProp,
  statuses = STATUSES,
  format,
  target = TARGET,
  critical: criticalProp = CRITICAL,
  value,
  defaultValue = null,
  onValueChange,
  loading = false,
  error,
  onRetry,
  empty,
  onSubscribe,
  onCopyLink,
  onExport,
  onHistory,
  ...rest
}: StatusCardProps) {
  // Always under the target, so the three bands stay distinct.
  const critical = Math.min(criticalProp, target - 0.005)
  const copy = { ...DEFAULT_COPY, ...copyProp, locale: useLocale(locale ?? copyProp?.locale) }
  const titleId = useId()
  const stripId = useId()
  const level = headingLevel ?? (embedded ? 2 : 1)
  const Title = level === 1 ? 'h1' : level === 2 ? 'h2' : 'h3'
  const [selected, setSelectedState] = useControllableState(value, defaultValue)
  const setSelected = (id: string | null) => {
    setSelectedState(id)
    onValueChange?.(id)
  }
  const [failure, setFailure] = useState<string | null>(null)
  // The demo fleet ends on `today` when one is given; your own services are used as they are.
  const services = useMemo(() => servicesProp ?? (todayProp === undefined ? SERVICES : demoServices(dayDate(todayProp))), [servicesProp, todayProp])

  // Averages to two places, rounded down so any downtime shows; thresholds as short as they go.
  const [percent, threshold] = useMemo(() => {
    const exact = numberFormat(copy.locale, { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 })
    const short = numberFormat(copy.locale, { style: 'percent', maximumFractionDigits: 2 })
    return [format?.uptime ?? ((share: number) => exact.format(Math.floor(share * 10000) / 10000)), format?.uptime ?? short.format]
  }, [copy.locale, format?.uptime])
  const ago = useMemo(() => new Intl.RelativeTimeFormat(copy.locale, { numeric: 'auto' }), [copy.locale])

  const service = services.find((s) => s.id === selected)
  const all = useMemo(() => overall(services), [services])
  const days = service?.days ?? all
  const { average, down } = stats(days)
  const budget = (1 - target) * days.length * 1440
  // Each service's status: its own, or today's uptime placed on the statuses (best first).
  const levelOf = (s: StatusService): StatusLevel => {
    const uptime = s.days.at(-1)?.uptime ?? null
    const rank = uptime === null || uptime >= target ? 0 : uptime >= critical ? 1 : 2
    return statuses.find((l) => l.id === s.status) ?? statuses[Math.min(rank, statuses.length - 1)] ?? STATUSES[0]!
  }
  const ranks = services.map((s) => Math.max(0, statuses.indexOf(levelOf(s))))
  const worst = Math.max(0, ...ranks)
  const affected = ranks.filter((r) => r > 0).length
  const status: StatusLevel = service ? levelOf(service) : (statuses[worst] ?? STATUSES[0]!)
  const statusText = service ? status.label : worst > 0 ? copy.partial : copy.operational

  // The newest day with an incident, across every service: counted from `today` when given, else from each service's last entry.
  const last = services
    .flatMap((s) => s.days.map((d, i) => ({ name: s.name, ago: todayProp === undefined ? s.days.length - 1 - i : daysBetween(d.date, todayProp), incidents: d.incidents ?? 0 })))
    .filter((d) => d.incidents > 0)
    .sort((a, b) => a.ago - b.ago)[0]
  const lastAgo = last?.ago
  const errorText = error instanceof Error ? error.message : error
  const state = loading ? 'loading' : error ? 'error' : services.length === 0 ? 'empty' : 'ready'

  const subscribe = async () => {
    setFailure(null)
    try {
      await (onSubscribe ? onSubscribe() : demo('StatusCard: onSubscribe', 900))
    } catch (reason) {
      setFailure(reason instanceof Error && reason.message ? reason.message : copy.failed)
      throw reason
    }
  }

  const legend = [
    { swatch: 'bg-success', text: `≥ ${threshold(target)}` },
    { swatch: 'bg-warning', text: `≥ ${threshold(critical)}` },
    { swatch: 'bg-danger', text: `< ${threshold(critical)}` },
    { swatch: 'bg-well', text: copy.noData },
  ]

  const card = (
    <Card className={cn('w-full text-fg', !embedded && !fill && 'max-w-160')}>
      <CardHeader className="border-b border-line">
        <CardTitle>
          <Title id={titleId}>{copy.title}</Title>
        </CardTitle>
        <CardDescription>{copy.subtitle(services.length)}</CardDescription>
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={copy.more} />}>
              <MoreHorizontalIcon size={15} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onCopyLink}>{copy.copyLink}</DropdownMenuItem>
              <DropdownMenuItem onClick={onExport}>{copy.exportCsv}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>

      {state === 'loading' && (
        <CardContent aria-busy className="flex flex-col gap-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-8 w-full" />
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      )}
      {state === 'error' && (
        <CardContent>
          <Alert variant="danger" role="alert">
            <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
              <span>{errorText}</span>
              {onRetry && (
                <Button variant="secondary" size="sm" onClick={onRetry}>
                  {copy.retry}
                </Button>
              )}
            </AlertDescription>
          </Alert>
        </CardContent>
      )}
      {state === 'empty' && (
        <CardContent>
          {empty ?? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>{copy.empty}</EmptyTitle>
                <EmptyDescription>{copy.emptyDescription}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      )}
      {state === 'ready' && (
      <>
      <CardContent>
        <Headline copy={copy} average={average} target={target} budget={budget} left={budget - down} status={status} statusText={statusText} percent={threshold} uptime={format?.uptime} />
      </CardContent>

      <CardContent className="flex flex-col gap-4 border-t border-line pt-(--card-spacing)">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="flex min-h-7 min-w-0 items-center gap-2">
            <Eyebrow className={VOICE}>{copy.daily}</Eyebrow>
            {/* The strip's subject, as a chip; a service's chip takes you back to all of them. It keeps its case in a theme that sets badges in capitals. */}
            <Badge variant="secondary" size="lg" className={cn('font-mono text-ui-sm tracking-normal normal-case', service && 'gap-1 pe-1.5 focus-ring-within')}>
              {service?.name ?? copy.allServices}
              {service && <BadgeRemove aria-label={copy.showAll} onClick={() => setSelected(null)} />}
            </Badge>
          </div>
          <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-ui-xs text-fg-muted tabular-nums">
            {legend.map((item) => (
              <li key={item.text} className="flex items-center gap-1.5">
                <span aria-hidden className={cn('size-2 rounded-[2px]', item.swatch)} />
                {item.text}
              </li>
            ))}
          </ul>
        </div>
        <HistoryStrip id={stripId} days={days} target={target} critical={critical} label={copy.stripLabel(service?.name ?? copy.allServices)} />
      </CardContent>

      <CardContent className="flex flex-col gap-3 border-t border-line pt-(--card-spacing)">
        <div className="flex items-baseline justify-between gap-4">
          <Eyebrow className={VOICE}>{copy.services}</Eyebrow>
          <span className={cn('font-mono text-ui-sm tabular-nums', affected ? 'text-warning-text' : 'text-fg-muted')}>{copy.servicesSummary(affected)}</span>
        </div>
        <ServiceList services={services} selected={selected} onSelect={setSelected} percent={percent} controls={stripId} levelOf={levelOf} target={target} critical={critical} />
      </CardContent>
      </>
      )}

      <CardFooter className="flex-wrap justify-between gap-3">
        <span className={cn('text-ui-sm text-fg-muted', VOICE)}>
          {state === 'ready' && last && lastAgo !== undefined ? (lastAgo === 0 ? copy.ongoing(last.name) : copy.lastIncident(ago.format(-lastAgo, 'day'), last.name)) : null}
        </span>
        <div className="ms-auto flex gap-2">
          <Button variant="secondary" onClick={onHistory}>
            {copy.history}
          </Button>
          <AsyncButton onAction={subscribe} pendingLabel={copy.subscribing} successLabel={copy.subscribed}>
            {copy.subscribe}
          </AsyncButton>
        </div>
        {failure && (
          <p role="alert" className="basis-full text-end text-ui-sm text-danger-text">
            {failure}
          </p>
        )}
      </CardFooter>
    </Card>
  )

  const view = embedded ? (
    <section aria-labelledby={titleId} {...rest} className={cn('w-full', !fill && 'max-w-160', className)}>
      {card}
    </section>
  ) : (
    <main aria-labelledby={titleId} {...rest} className={cn('grid min-h-dvh w-full grid-cols-[minmax(0,1fr)] place-items-center bg-canvas px-4 py-10 text-fg', className)}>
      {card}
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { StatusCard, type StatusCardProps, type StatusCopy, type StatusLevel, type StatusService }
