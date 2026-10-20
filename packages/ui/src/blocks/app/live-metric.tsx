'use client'

import { useEffect, useId, useMemo, useRef, useState, type ComponentProps, type ReactNode } from 'react'
import { m } from 'motion/react'
import { MotionFeatures, ThemeScope, useLocale, useYouj, type ThemeInput } from '@youj/core'
import { CirclePauseIcon, CirclePlayIcon } from '@youj/icons'
import { Alert, AlertAction, AlertDescription } from '../../components/ui/alert'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Skeleton } from '../../components/ui/skeleton'
import { StatDelta, StatValue } from '../../components/ui/stat-card'
import { useLiveRegion } from '../../hooks/use-announcer'
import { useControllableState } from '../../hooks/use-controllable-state'
import { useVisible } from '../../hooks/use-visible'
import { cn, numberFormat } from '../../lib/utils'
import { DEFAULT_COPY, type LiveMetricCopy, type LiveMetricPage, type LiveMetricSnapshot } from './live-metric/data'
import { Pages } from './live-metric/pages'
import { Strip } from './live-metric/strip'
import { useLive } from './live-metric/use-live'

/* What is happening right now. The people on the site lead, rolling digit
 * by digit as they come and go, with the change on a few minutes ago; under
 * them the last five minutes as a bar per ten seconds, the bucket filling
 * now lit at the end, and when a new bucket opens the strip slides along by
 * one; then the pages they're on, re-ranking as the traffic shifts (rows
 * glide to their places). A live dot breathes while it runs. Pause stops
 * the updates (WCAG 2.2.2) and holds what's shown; the figure is spoken
 * every half minute while it runs, never on every tick. Without `snapshot`
 * it runs seeded demo traffic under a dashed "Demo data" badge, only while
 * the tab shows and the card is on screen; pass your feed's `snapshot` and
 * re-render with each new one. Every string is in `copy`. Built for the
 * compact layout density, taken from the page; embedded, it keeps its
 * natural width unless `fill`. Reduced motion: figures and bars change in
 * place and the dot is still. */

interface LiveMetricProps extends Omit<ComponentProps<'section'>, 'children' | 'title'> {
  /** Wraps the card in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (448px at 100% scale). Default false. */
  fill?: boolean
  /** The title's level. Default: 2 when embedded, else 1. */
  headingLevel?: 1 | 2 | 3
  /** Any of the card's strings, to rewrite or translate. */
  copy?: Partial<LiveMetricCopy>
  /** Formats every figure (BCP 47). Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** Your feed's latest reading; re-render with each new one. Default: seeded demo traffic, marked as such. */
  snapshot?: LiveMetricSnapshot
  /** How long one bar is, in seconds. Default 10. */
  bucketSeconds?: number
  /** How many pages the list shows. Default 5. */
  top?: number
  /** Updates stopped, controlled: pair it with `onPausedChange`. Default: uncontrolled. */
  paused?: boolean
  /** Start paused, uncontrolled. Default false. */
  defaultPaused?: boolean
  /** Called when Pause or Resume is pressed. */
  onPausedChange?: (paused: boolean) => void
  /** Shows a dashed "Demo data" badge while the card runs on simulated traffic (no `snapshot`). Default true. */
  demoMarker?: boolean
  /** Skeletons while your feed connects. Default false. */
  loading?: boolean
  /** Shown in place of the figures when the feed fails, with Retry when `onRetry` is set. Default: none. */
  error?: ReactNode
  /** Reconnects after an `error`. Default: none. */
  onRetry?: () => void
}

/** The strip's span: 30 buckets. */
const BUCKETS = 30
/** How often the figure is spoken while it runs, in ms at 1× speed. */
const SPEAK = 30_000

function LiveMetric({
  theme,
  embedded = true,
  fill = false,
  headingLevel,
  copy: copyProp,
  locale,
  snapshot: snapshotProp,
  bucketSeconds = 10,
  top = 5,
  paused: pausedProp,
  defaultPaused = false,
  onPausedChange,
  demoMarker = true,
  loading = false,
  error,
  onRetry,
  className,
  ...rest
}: LiveMetricProps) {
  const copyLocale = useLocale(locale ?? copyProp?.locale)
  const copy = useMemo(() => ({ ...DEFAULT_COPY, ...copyProp, locale: copyLocale }), [copyProp, copyLocale])
  const k = useYouj()
  const titleId = useId()
  const Title = `h${headingLevel ?? (embedded ? 2 : 1)}` as 'h1' | 'h2' | 'h3'
  const ref = useRef<HTMLDivElement>(null)
  const visible = useVisible(ref)
  const [paused, setPaused] = useControllableState(pausedProp, defaultPaused)
  const simulated = snapshotProp === undefined
  const running = !paused && visible && !loading && !error
  const demo = useLive(simulated, running, k.timeScale, BUCKETS, bucketSeconds)
  const latest = snapshotProp ?? demo
  // Paused, your feed is held where it was; the demo simply stops.
  const [held, setHeld] = useState<LiveMetricSnapshot | undefined>(undefined)
  const shown = paused && held ? held : latest

  const number = useMemo(() => numberFormat(copy.locale), [copy.locale])
  // The strip's span: its buckets times their length.
  const spanMinutes = Math.max(1, Math.round(((shown?.series.length || BUCKETS) * bucketSeconds) / 60))
  const minutes = numberFormat(copy.locale, { style: 'unit', unit: 'minute', unitDisplay: 'short' }).format(spanMinutes)
  const span = numberFormat(copy.locale, { style: 'unit', unit: 'minute', unitDisplay: 'long' }).format(spanMinutes)
  const step = numberFormat(copy.locale, { style: 'unit', unit: 'second', unitDisplay: 'long' }).format(bucketSeconds)

  // The figure is spoken on a schedule while it runs, from the latest reading.
  const { politeRef, announce } = useLiveRegion()
  const spoken = useRef(shown?.current)
  useEffect(() => {
    spoken.current = shown?.current
  })
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => spoken.current !== undefined && announce(copy.announcement(number.format(spoken.current))), SPEAK * k.timeScale)
    return () => clearInterval(id)
  }, [running, k.timeScale, announce, copy, number])

  const toggle = () => {
    const next = !paused
    setPaused(next)
    setHeld(next ? latest : undefined)
    onPausedChange?.(next)
    announce(next ? copy.paused : copy.resumed)
  }

  const change = shown?.previous ? shown.current / shown.previous - 1 : undefined
  const pages: LiveMetricPage[] = (shown?.pages ?? []).slice(0, top)

  const body = loading || !shown ? (
    <div className="flex flex-col gap-4">
      <span className="sr-only">{copy.loading}</span>
      <Skeleton className="h-11 w-40" />
      <Skeleton className="h-20 rounded-md" />
      <Skeleton className="h-28 rounded-md" />
    </div>
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
  ) : (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <StatValue value={shown.current} from={shown.current} format={{ maximumFractionDigits: 0 }} locale={copy.locale} size="lg" />
          <span className="text-ui-sm text-fg-muted">{shown.current ? copy.people : copy.empty}</span>
        </div>
        {change !== undefined && (
          <StatDelta value={change} locale={copy.locale}>
            {copy.versus(minutes)}
          </StatDelta>
        )}
      </div>
      <Strip series={shown.series} bucket={shown.bucket} label={copy.strip(step, span)} ends={[copy.ago(minutes), copy.now]} />
      {pages.length > 0 && <Pages pages={pages} copy={copy} number={number.format} />}
    </div>
  )

  const card = (
    <Card ref={ref} className={cn('w-full gap-5 text-fg', !embedded && !fill && 'max-w-112')}>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <MotionFeatures>
            <span aria-hidden data-slot="live-dot" data-yj-running={running || undefined} className="relative grid size-2.5 place-items-center">
              {running && !k.reduced && (
                <m.span
                  className="absolute inset-0 rounded-full bg-success"
                  initial={{ scale: 1, opacity: 0.55 }}
                  animate={{ scale: 2.6, opacity: 0 }}
                  transition={{ duration: k.duration('deliberate') * 2.2, ease: k.ease('exit'), repeat: Infinity, repeatDelay: k.duration('slow') }}
                />
              )}
              <span className={cn('relative size-2 rounded-full transition-colors yj-duration-fast ease-standard', running ? 'bg-success' : 'bg-fg-subtle')} />
            </span>
          </MotionFeatures>
          <Title id={titleId}>{copy.title}</Title>
          {simulated && demoMarker && (
            <Badge variant="outline" data-slot="demo-marker" className="border-dashed border-line-strong">
              {copy.demoData}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>{copy.description}</CardDescription>
        <CardAction>
          <Button variant="outline" size="sm" onClick={toggle} disabled={loading || !!error}>
            {paused ? <CirclePlayIcon size={15} /> : <CirclePauseIcon size={15} />}
            {paused ? copy.resume : copy.pause}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent aria-busy={loading || undefined}>{body}</CardContent>
      <div ref={politeRef} role="status" aria-live="polite" className="sr-only" />
    </Card>
  )

  const view = embedded ? (
    <section aria-labelledby={titleId} {...rest} className={cn('w-full', !fill && 'max-w-112', className)}>
      {card}
    </section>
  ) : (
    <main aria-labelledby={titleId} {...rest} className={cn('grid min-h-dvh w-full grid-cols-[minmax(0,1fr)] place-items-center bg-canvas px-4 py-10 text-fg', className)}>
      {card}
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { LiveMetric, type LiveMetricProps, type LiveMetricCopy, type LiveMetricSnapshot, type LiveMetricPage }
