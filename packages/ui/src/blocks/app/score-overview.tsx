'use client'

import { useEffect, useId, useMemo, useRef, useState, type ComponentProps } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { DownloadIcon, RefreshIcon } from '@youj/icons'
import { AsyncButton } from '../../components/ui/async-button'
import { Badge } from '../../components/ui/badge'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import { ScoreRing, type ScoreGrade } from '../../components/ui/score-ring'
import { Skeleton } from '../../components/ui/skeleton'
import { Sparkline } from '../../components/ui/sparkline'
import { StatDelta, StatValue } from '../../components/ui/stat-card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Eyebrow } from '../../components/ui/typography'
import { useAnnouncer } from '../../hooks/use-announcer'
import { useControllableState } from '../../hooks/use-controllable-state'
import { useNow } from '../../hooks/use-now'
import { cn, numberFormat, relativeTimeFormat, toneColor } from '../../lib/utils'
import {
  ASSETS,
  DEFAULT_COPY,
  DEMO_NOW,
  FINDINGS,
  GRADES,
  SCORE_HISTORY,
  SEVERITIES,
  STATS,
  TREND,
  demo,
  type ScoreOverviewAsset,
  type ScoreOverviewFinding,
  type ScoreOverviewCopy,
  type ScoreOverviewSeverity,
  type ScoreOverviewTone,
  type ScoreOverviewStats,
  type ScoreOverviewTab,
  type ScoreOverviewTrendPoint,
} from './score-overview/data'
import { AssetList, FindingList } from './score-overview/lists'
import { Figures } from './score-overview/figures'
import { PanelStates, ScoreFallback } from './score-overview/states'
import { Trend } from './score-overview/trend'

/* Where anything audited stands, in one card (a security posture, a food
 * safety inspection, an accessibility audit): a ScoreRing of ticks lit up to
 * the score with its letter grade, the score out of 100 and how it moved
 * over the period, then four figures (open findings with how many are of the
 * worst severity, resolved, assets watched, the median time to fix). Under
 * them, tabs: the open findings by severity over 30 days as a stacked chart,
 * the findings themselves worst first, and the assets they sit on. Scan now
 * awaits `onScan`: while it runs a sweep circles the ring and the foot counts
 * the assets scanned; Export report awaits `onExport`. Every list scrolls
 * inside a panel of one height, so the card never resizes. Loading holds the
 * figures and the panels as skeletons, and an error with Retry sits over the
 * panels while the figures show a dash.
 * Pass `now` from your server so the ages hydrate; with the demo data it is
 * the demo's own time. Embedded, it stops at its natural width unless `fill`.
 * Reduced motion: the ring, figures and chart are drawn at their values. */

interface ScoreOverviewProps extends Omit<ComponentProps<'section'>, 'children' | 'title'> {
  /** Wraps the card in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (448px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the card's strings, to rewrite or translate. */
  copy?: Partial<ScoreOverviewCopy>
  /** Formats the figures, days and ages (BCP 47). Default: the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** The security score. Default 77. */
  score?: number
  /** What the score is out of. Default 100. */
  maxScore?: number
  /** How the score moved over the period. Default +13. */
  scoreChange?: number
  /** The score over the period, a reading a day, oldest first: a sparkline beside it. */
  scoreHistory?: readonly number[]
  /** Bands of the score, each with its letter and tone. Default: F, D, C, B (from 75) and A (from 90). */
  grades?: readonly ScoreGrade[]
  /** The levels a finding can have, worst first: each with its label, short chip word and color. Default: Critical, High, Medium, Low. */
  severities?: ScoreOverviewSeverity[]
  /** The four figures under the score. */
  stats?: ScoreOverviewStats
  /** Open findings by severity, a point a day, oldest first. */
  trend?: ScoreOverviewTrendPoint[]
  /** The open findings. */
  findings?: ScoreOverviewFinding[]
  /** The assets with open findings. */
  assets?: ScoreOverviewAsset[]
  /** The time the ages are counted from, which the server and the browser agree on. Default: the demo's time with the demo data; with your own, the browser's clock once mounted. */
  now?: Date | string | number
  /** When the last scan finished. */
  lastScanAt?: Date | string | number
  /** A scan your app is running, when it owns the scan. */
  scanning?: boolean
  /** Assets scanned so far in the running scan. */
  scanned?: number
  /** The tab shown, when your app owns it. */
  tab?: ScoreOverviewTab
  /** The tab shown at first. Default `trend`. */
  defaultTab?: ScoreOverviewTab
  onTabChange?: (tab: ScoreOverviewTab) => void
  /** Skeletons in place of the score, the figures and the panels while your data loads. Default false. */
  loading?: boolean
  /** Shown over the panels when they fail to load, with Retry when `onRetry` is set; the figures show a dash. */
  error?: string
  /** Retries after an `error`. */
  onRetry?: () => void
  /** Runs a scan; the card awaits it. */
  onScan?: () => Promise<unknown> | unknown
  /** Opens a finding from the list. */
  onOpenFinding?: (finding: ScoreOverviewFinding) => void
  /** Exports the report; the card awaits it. */
  onExport?: () => Promise<unknown> | unknown
}

const HOUR = 3_600_000
/** How long the demo takes per asset it scans. */
const DEMO_STEP = 110
type ScanState = 'idle' | 'pending' | 'success' | 'error'

function ScoreOverview({
  theme,
  embedded = true,
  fill = false,
  className,
  copy: copyProp,
  locale: localeProp,
  score = 77,
  maxScore = 100,
  scoreChange = 13,
  scoreHistory = SCORE_HISTORY,
  grades = GRADES,
  severities = SEVERITIES,
  stats = STATS,
  trend: trendProp,
  findings: findingsProp,
  assets = ASSETS,
  now: nowProp,
  lastScanAt,
  scanning,
  scanned,
  tab: tabProp,
  defaultTab = 'trend',
  onTabChange,
  onScan,
  onOpenFinding,
  onExport,
  loading = false,
  error,
  onRetry,
  ...rest
}: ScoreOverviewProps) {
  const copy = useMemo(() => ({ ...DEFAULT_COPY, ...copyProp }), [copyProp])
  const locale = useLocale(localeProp)
  const titleId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const { announce, announcer } = useAnnouncer()
  const trend = trendProp ?? TREND
  const findings = findingsProp ?? FINDINGS
  const yours = trendProp !== undefined || findingsProp !== undefined
  const live = useNow(nowProp === undefined && yours ? 60_000 : 0)
  const now = nowProp !== undefined ? +new Date(nowProp) : yours ? live : Date.parse(DEMO_NOW)
  const [tab, setTab] = useControllableState(tabProp, defaultTab)
  const count = numberFormat(locale)

  // The scan: the app's when it says one is running, else the card's own, run by Scan now.
  const [scanState, setScanState] = useState<ScanState>('idle')
  const [progress, setProgress] = useState(0)
  const [finishedAt, setFinishedAt] = useState<number>()
  const timer = useRef<ReturnType<typeof setInterval>>(undefined)
  useEffect(() => () => clearInterval(timer.current), [])
  const busy = scanning ?? scanState === 'pending'
  const done = Math.min(stats.assets, scanned ?? progress)
  const scan = async () => {
    if (busy) return
    setScanState('pending')
    setProgress(0)
    if (!onScan) timer.current = setInterval(() => setProgress((p) => Math.min(stats.assets - 1, p + 1)), DEMO_STEP)
    try {
      await (onScan ? onScan() : demo('ScoreOverview: onScan', stats.assets * DEMO_STEP))
      setProgress(stats.assets)
      setFinishedAt(Date.now())
      setScanState('success')
      announce(copy.announceScanned)
    } catch {
      setScanState('error')
    } finally {
      clearInterval(timer.current)
    }
  }

  const lastScan = finishedAt ?? (lastScanAt !== undefined ? +new Date(lastScanAt) : yours ? undefined : Date.parse(DEMO_NOW) - 2 * HOUR)
  const sinceScan = (() => {
    if (lastScan === undefined || now === null) return undefined
    const relative = relativeTimeFormat(locale, { numeric: 'auto', style: 'narrow' })
    const hours = Math.max(0, (Math.max(now, lastScan) - lastScan) / HOUR)
    return hours < 1
      ? relative.format(-Math.round(hours * 60), 'minute')
      : hours < 48
        ? relative.format(-Math.round(hours), 'hour')
        : relative.format(-Math.round(hours / 24), 'day')
  })()
  // Progress is known when the app reports it, or while the demo scan counts; else just what is being scanned.
  const counted = scanned !== undefined || (!onScan && scanState === 'pending')
  const caption = busy
    ? counted
      ? copy.scanningCaption(count.format(done), count.format(stats.assets))
      : copy.scanningAll(count.format(stats.assets))
    : sinceScan
      ? copy.lastScan(sinceScan, count.format(stats.assets))
      : null

  const days = { style: 'unit', unit: 'day', unitDisplay: 'narrow', maximumFractionDigits: 1 } as const
  const figures = [
    { label: copy.open, value: stats.open, note: copy.urgentCount(count.format(stats.urgent)), alarm: stats.urgent > 0 },
    { label: copy.resolved, value: stats.resolved, note: copy.inPeriod },
    { label: copy.assets, value: stats.assets, note: copy.newAssets(count.format(stats.newAssets)) },
    { label: copy.fixTime, value: stats.fixDays, note: copy.median, format: days },
  ]
  const tabs: { id: ScoreOverviewTab; label: string; count?: number }[] = [
    { id: 'trend', label: copy.trend },
    { id: 'findings', label: copy.findings, count: findings.length },
    { id: 'assets', label: copy.assetsTab, count: assets.length },
  ]
  const grade = [...grades].sort((a, b) => a.from - b.from).reduce<ScoreGrade | undefined>((band, g) => (score >= g.from ? g : band), undefined)
  const ink = grade ? toneColor(grade.tone, 'var(--color-fg-muted)') : 'var(--color-accent)'
  const failure = (cause: unknown) => (cause instanceof Error && cause.message ? cause.message : copy.failed)
  const covered = loading || !!error

  const card = (
    <Card className={cn('w-full text-fg', !embedded && !fill && 'max-w-md')}>
      <CardHeader>
        <CardTitle>
          <Title id={titleId}>{copy.title}</Title>
        </CardTitle>
        <CardDescription>{copy.subtitle}</CardDescription>
        <CardAction>
          <AsyncButton
            variant="secondary"
            size="xs"
            disabled={covered}
            status={busy ? 'pending' : scanState === 'pending' ? 'idle' : scanState}
            onClick={scan}
            pendingLabel={copy.scanning}
            successLabel={copy.scanned}
            errorLabel={copy.failed}
          >
            <RefreshIcon aria-hidden />
            {copy.scan}
          </AsyncButton>
        </CardAction>
      </CardHeader>

      <CardContent className="@container/score flex items-center gap-5">
        {loading || error ? (
          <ScoreFallback loading={loading} copy={copy} />
        ) : (
          <>
            <ScoreRing value={score} max={maxScore} grades={grades} busy={busy} label={copy.score} locale={locale} />
            <div className="flex min-w-0 flex-col gap-1.5">
              <Eyebrow>{copy.score}</Eyebrow>
              <StatValue value={score} size="lg" unit={copy.outOf(count.format(maxScore))} locale={locale} />
              <StatDelta value={scoreChange} format={{ maximumFractionDigits: 0 }} locale={locale}>
                {copy.versus}
              </StatDelta>
            </div>
          </>
        )}
        {!covered && scoreHistory.length > 1 && (
          // youj-allow: fixed size, a container query can't read the scale
          <Sparkline data={scoreHistory} color={ink} className="ms-auto h-12 w-24 shrink-0 self-end @max-[24rem]/score:hidden" />
        )}
      </CardContent>

      <CardContent className="@container/stats p-0">
        <Figures figures={figures} loading={loading} failed={!!error} locale={locale} />
      </CardContent>

      <CardContent>
        <Tabs
          value={tab}
          onValueChange={(value) => {
            setTab(value as ScoreOverviewTab)
            onTabChange?.(value as ScoreOverviewTab)
          }}
          className="gap-3"
        >
          <TabsList aria-label={copy.tabs} className="w-full">
            {tabs.map((t) => (
              <TabsTrigger key={t.id} value={t.id}>
                {t.label}
                {t.count !== undefined && (
                  <Badge variant="secondary" size="sm" className="tabular-nums">
                    {loading ? <Skeleton className="h-3 w-3" /> : error ? '—' : count.format(t.count)}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
          {/* One height for every panel: switching tabs never resizes the card. */}
          <div className="relative">
            <div aria-hidden={covered || undefined} inert={covered || undefined} className={cn('contents', covered && '*:invisible')}>
              <TabsContent value="trend" className="h-52 flex-none">
                {trend.length ? (
                  <Trend
                    points={trend}
                    severities={severities}
                    copy={{ chartTitle: copy.chartTitle, chartSummary: copy.chartSummary }}
                    locale={locale}
                  />
                ) : (
                  <p className="grid h-full place-items-center text-center text-ui text-fg-muted">
                    <span>
                      <span className="block text-fg">{copy.noTrend}</span>
                      {copy.noTrendHint}
                    </span>
                  </p>
                )}
              </TabsContent>
              <TabsContent value="findings" className="h-52 flex-none overflow-y-auto yj-scrollbar">
                <FindingList
                  findings={findings}
                  severities={severities}
                  now={now ?? Date.parse(DEMO_NOW)}
                  locale={locale}
                  copy={copy}
                  onOpen={onOpenFinding}
                />
              </TabsContent>
              <TabsContent value="assets" className="h-52 flex-none">
                <AssetList assets={assets} severities={severities} locale={locale} copy={copy} />
              </TabsContent>
            </div>
            <PanelStates loading={loading} error={error} onRetry={onRetry} tab={tab} severities={severities} copy={copy} />
          </div>
        </Tabs>
      </CardContent>

      <CardFooter className="flex-wrap justify-between gap-3">
        {loading && <Skeleton className="h-4 w-40" />}
        {!covered && caption && (
          <span aria-live="polite" className={cn('tabular-nums', busy && 'text-accent-text')}>
            {caption}
          </span>
        )}
        <AsyncButton
          variant="outline"
          size="sm"
          disabled={covered}
          className="ms-auto"
          onAction={() => (onExport ? onExport() : demo('ScoreOverview: onExport', 900))}
          pendingLabel={copy.exporting}
          successLabel={copy.exported}
          errorLabel={failure}
        >
          <DownloadIcon aria-hidden />
          {copy.export}
        </AsyncButton>
      </CardFooter>
      {announcer}
    </Card>
  )

  const view = embedded ? (
    <section aria-labelledby={titleId} data-slot="score-overview" {...rest} className={cn('w-full', !fill && 'max-w-md', className)}>
      {card}
    </section>
  ) : (
    <main
      aria-labelledby={titleId}
      data-slot="score-overview"
      {...rest}
      className={cn('grid min-h-dvh w-full grid-cols-[minmax(0,1fr)] place-items-center bg-canvas px-4 py-10 text-fg', className)}
    >
      {card}
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { ScoreOverview, type ScoreOverviewProps }
export type {
  ScoreOverviewAsset,
  ScoreOverviewCopy,
  ScoreOverviewFinding,
  ScoreOverviewSeverity,
  ScoreOverviewStats,
  ScoreOverviewTab,
  ScoreOverviewTone,
  ScoreOverviewTrendPoint,
}
