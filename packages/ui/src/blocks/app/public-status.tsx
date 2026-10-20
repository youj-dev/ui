'use client'

import { useId, useMemo, type ComponentProps, type ElementType, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { Reveal } from '@youj/motion'
import { Alert, AlertAction, AlertDescription } from '../../components/ui/alert'
import { Badge, BadgeDot } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Skeleton } from '../../components/ui/skeleton'
import { Timeline } from '../../components/ui/timeline'
import { TooltipProvider } from '../../components/ui/tooltip'
import { useControllableState } from '../../hooks/use-controllable-state'
import { useNow } from '../../hooks/use-now'
import { cn } from '../../lib/utils'
import { fleet, SERVICES, SERVICES_INCIDENT, type StatusService } from './status/data'
import {
  DEFAULT_COPY,
  DEMO_NOW,
  demoIncident,
  demoResponseTimes,
  GROUPS,
  MINUTE,
  updateTypes,
  type PublicStatusCopy,
  type PublicStatusGroup,
  type PublicStatusIncident,
  type PublicStatusRange,
  type PublicStatusUpdate,
} from './public-status/data'
import { PastIncidents } from './public-status/past-incidents'
import { PulseDot } from './public-status/pulse-dot'
import { ResponseTimes } from './public-status/response-times'
import { ServiceRow } from './public-status/service-row'
import { SubscribePopover } from './public-status/subscribe-popover'

/* Status, the public page: Orbit's status for its customers. Its sibling,
 * the card inside the app (app-status), shares its services, status rules
 * and day strips (./status/data), so the two never disagree. A banner says
 * how things are, with a slow halo on its dot; during an incident it turns
 * amber and the incident card above the fold carries a Timeline of updates
 * (investigating, identified, monitoring). Every service shows 90 days as a
 * day strip (hover or focus a day for its uptime and what happened; narrow
 * screens keep the last 60 or 30), its uptime counting up beside it. API
 * response times redraw when the range changes (a segmented control whose
 * key glides). Past incidents fold by day, read from the same days.
 * Subscribe opens a Popover with email, RSS and webhook tabs. Reduced
 * motion: the halo stops, numbers and sections are in place. Pass your own
 * `brand`, `services`, `groups`, `incident` and `responseTimes`, and the
 * server's `now`; every string is in `copy`.
 * It is built for the compact layout density (ui.css), taken from the page. */

interface PublicStatusProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** A theme to force on the block. Default: none, so it inherits the app's (YoujProvider or a ThemeScope around it). */
  theme?: ThemeInput
  /** The open incident the page leads with, or `true` for the demo one (storage failing uploads today). Default false. */
  incident?: boolean | PublicStatusIncident
  /** Each service with a day per entry, oldest first, the last today. Default: the card's six demo services. */
  services?: StatusService[]
  /** The page's sections, each naming its services by id; services no group names go under `copy.otherGroup`. Default: Platform and Data. */
  groups?: PublicStatusGroup[]
  /** API response times per range, in ms, oldest first. Default: the demo's generated series. */
  responseTimes?: Partial<Record<PublicStatusRange, number[]>>
  /** The response-time range shown (controlled). */
  range?: PublicStatusRange
  /** The range shown first. Default `24h`. */
  defaultRange?: PublicStatusRange
  /** Called with the range the visitor picks. */
  onRangeChange?: (range: PublicStatusRange) => void
  /** The time the page is rendered at, in ms, which the server and client agree on; the incident's age counts from it. Default: the browser's clock once mounted (a fixed demo time before, so hydration matches). */
  now?: number
  /** Shows skeletons in place of the services and response times while your data loads. Default false. */
  loading?: boolean
  /** Shown in place of the services when they fail to load, with a retry button when `onRetry` is set. Default: none. */
  error?: ReactNode
  /** Retries loading after an `error`. Default: none. */
  onRetry?: () => void
  /** Replaces the empty-services message. Default: `copy.emptyServices`. */
  empty?: ReactNode
  /** Any of the page's strings, to rewrite or translate. Default: the demo's English strings. */
  copy?: Partial<PublicStatusCopy>
  /** Formats dates and numbers. Default: the app's locale (YoujProvider's `locale`), else en-US. */
  locale?: string
  /** The product the page is for: its name, and a mark before it. Default: Orbit and its ring. */
  brand?: { name: string; logo?: ReactNode }
  /** The RSS feed's address, in the Subscribe popover. Default: Orbit's demo feed. */
  feedUrl?: string
  /** Subscribes an email address; resolve when done, throw to show the error. Default: a short demo wait. */
  onSubscribe?: (email: string) => Promise<unknown> | unknown
  /** Saves a webhook endpoint; resolve when done. Default: a short demo wait. */
  onSaveWebhook?: (url: string) => Promise<unknown> | unknown
  /** Where the footer's incident-history link goes. Default `#`. */
  historyHref?: string
  /** Renders the page's internal links, e.g. Next.js `Link`. Default `a`. */
  linkComponent?: ElementType
}

function PublicStatus({
  theme,
  incident: incidentProp = false,
  services = incidentProp ? SERVICES_INCIDENT : SERVICES,
  groups: groupsProp = GROUPS,
  responseTimes,
  range: rangeProp,
  defaultRange = '24h',
  onRangeChange,
  now: nowProp,
  loading = false,
  error,
  onRetry,
  empty,
  copy: copyProp,
  locale: localeProp,
  brand = { name: 'Orbit' },
  feedUrl = 'https://status.orbit.dev/feed.rss',
  onSubscribe,
  onSaveWebhook,
  historyHref = '#',
  linkComponent: Link = 'a',
  className,
  ...rest
}: PublicStatusProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const locale = useLocale(localeProp)
  const servicesId = useId()
  const [range, setRange] = useControllableState(rangeProp, defaultRange)
  const pickRange = (next: PublicStatusRange) => {
    setRange(next)
    onRangeChange?.(next)
  }
  // The browser's clock once mounted; until then a fixed time, so the server's render and the hydration render agree.
  const mounted = useNow(0)
  const demo = incidentProp === true
  const clock = nowProp ?? mounted ?? (demo ? DEMO_NOW : null)
  const incident = useMemo(() => (incidentProp === true ? demoIncident(clock ?? DEMO_NOW) : incidentProp || null), [incidentProp, clock])
  const types = useMemo(() => updateTypes(copy.updateTypes), [copy.updateTypes])
  const latest = incident?.updates[0]?.type

  const { worst } = fleet(services)
  const down = worst !== 'operational'
  const groups = groupsProp.map((g) => ({ name: g.name, services: services.filter((s) => g.services.includes(s.id)) })).filter((g) => g.services.length)
  const grouped = new Set(groups.flatMap((g) => g.services))
  const other = services.filter((s) => !grouped.has(s))
  if (other.length) groups.push({ name: copy.otherGroup, services: other })
  const series = responseTimes ? (responseTimes[range] ?? []) : demoResponseTimes(range, !!incidentProp)

  return (
    <ThemeScope theme={theme}>
      <div {...rest} className={cn('min-h-dvh bg-canvas text-fg', className)}>
        <header data-yj-tone="header" className="border-b border-line bg-chrome">
          <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-4 md:px-6">
            {brand.logo ?? (
              <span aria-hidden className="relative grid size-6 place-items-center rounded-full border-2 border-fg">
                <span className="size-1.5 rounded-full bg-fg" />
              </span>
            )}
            <span className="font-semibold tracking-tight">{brand.name}</span>
            <span className="text-fg-muted">{copy.product}</span>
            <div className="ms-auto">
              <SubscribePopover copy={copy} feedUrl={feedUrl} onSubscribe={onSubscribe} onSaveWebhook={onSaveWebhook} />
            </div>
          </div>
        </header>
        <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8 md:px-6 md:py-12">
          <h1 className="sr-only">{copy.heading}</h1>
          <Reveal
            inView={false}
            role="status"
            className={cn('flex items-center gap-3 rounded-[min(var(--radius-xl),var(--ui--panel-radius-max))] border px-5 py-4', down ? 'border-warning-line bg-warning-subtle' : 'border-success-line bg-success-subtle')}
          >
            <PulseDot tone={down ? 'warning' : 'success'} />
            <div className="flex min-w-0 flex-1 flex-col">
              <p className="text-ui-lg font-semibold tracking-tight">{down ? copy.partial : copy.operational}</p>
              <p className="text-ui-sm text-fg-muted">{down ? (incident?.summary ?? copy.degradedDetail) : copy.operationalDetail}</p>
            </div>
            <span className="text-ui-xs text-fg-muted max-sm:hidden">{copy.updated}</span>
          </Reveal>

          {incident && (
            <Reveal inView={false} delay={1}>
              <Card className={latest === 'resolved' ? 'border-success-line' : 'border-warning-line'}>
                <CardHeader>
                  <CardTitle>
                    <h2>{incident.title}</h2>
                  </CardTitle>
                  <CardDescription>
                    {copy.affects} <span className="font-mono">{incident.service}</span>
                    {clock !== null && <> · {copy.started(Math.max(0, Math.round((clock - incident.startedAt) / MINUTE)))}</>}
                  </CardDescription>
                  {latest && (
                    <CardAction>
                      <Badge variant={latest === 'resolved' ? 'success' : 'warning'}>
                        <BadgeDot />
                        {types[latest]?.label ?? latest}
                      </Badge>
                    </CardAction>
                  )}
                </CardHeader>
                <CardContent>
                  <Timeline events={incident.updates} types={types} locale={locale} aria-label={copy.incidentUpdates} />
                </CardContent>
              </Card>
            </Reveal>
          )}

          <TooltipProvider delay={0}>
            <section aria-labelledby={servicesId} aria-busy={loading || undefined} className="flex flex-col gap-4">
              <div className="flex items-end justify-between gap-4">
                <h2 id={servicesId} className="text-ui-lg font-semibold tracking-tight">
                  {copy.services}
                </h2>
                <div aria-hidden className="flex items-center gap-3 text-ui-xs text-fg-muted">
                  {[
                    ['bg-success', copy.legend.up],
                    ['bg-warning', copy.legend.degraded],
                    ['bg-danger', copy.legend.outage],
                  ].map(([tone, label]) => (
                    <span key={label} className="flex items-center gap-1.5">
                      <span className={cn('size-2 rounded-[2px]', tone)} />
                      {label}
                    </span>
                  ))}
                </div>
              </div>
              {loading ? (
                <Card size="sm">
                  <CardContent className="flex flex-col gap-4">
                    <span className="sr-only">{copy.loading}</span>
                    {[0, 1, 2].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </CardContent>
                </Card>
              ) : error ? (
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
              ) : groups.length === 0 ? (
                (empty ?? <p className="rounded-[min(var(--radius-xl),var(--ui--panel-radius-max))] border border-line bg-surface px-4 py-6 text-center text-ui text-fg-muted">{copy.emptyServices}</p>)
              ) : (
                groups.map((g) => (
                  <Card key={g.name} size="sm">
                    <CardHeader>
                      <CardTitle>
                        <h3>{g.name}</h3>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="flex flex-col divide-y divide-line">
                        {g.services.map((s) => (
                          <ServiceRow key={s.id} service={s} copy={copy} />
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))
              )}
            </section>
          </TooltipProvider>

          <ResponseTimes data={series} range={range} onRangeChange={pickRange} warn={!!incident && latest !== 'resolved' && range === '24h'} loading={loading} copy={copy} />

          {!loading && !error && <PastIncidents services={services} copy={copy} locale={locale} />}
        </main>
        <footer className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-6 text-ui-sm text-fg-muted md:px-6">
          <span>{copy.footer}</span>
          <Link href={historyHref} className="focus-ring rounded-sm hover:text-fg">
            {copy.history}
          </Link>
        </footer>
      </div>
    </ThemeScope>
  )
}

export { PublicStatus, type StatusService as PublicStatusService, type PublicStatusCopy, type PublicStatusGroup, type PublicStatusIncident, type PublicStatusProps, type PublicStatusRange, type PublicStatusUpdate }
