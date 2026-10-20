'use client'

import { type ComponentProps, type ReactNode, useId, useMemo, useState } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { MoreHorizontalIcon } from '@youj/icons'
import { Alert, AlertAction, AlertDescription } from '../../components/ui/alert'
import { Button } from '../../components/ui/button'
import { AsyncButton } from '../../components/ui/async-button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../components/ui/empty'
import { DayRing, findOverlaps, type ScheduleJob } from '../../components/ui/day-ring'
import { Eyebrow } from '../../components/ui/typography'
import { useNow } from '../../hooks/use-now'
import { cn, dateTimeFormat, numberFormat } from '../../lib/utils'
import { describeCron, minutesUntil, runsOn, shiftCron } from './day-schedule/cron'
import { DEFAULT_COPY, JOBS, demo, type DayScheduleJob, type DayScheduleCopy } from './day-schedule/data'
import { JobList, type DayScheduleRow } from './day-schedule/job-list'
import { ListPlaceholder, ReadoutPlaceholder, RingPlaceholder } from './day-schedule/placeholder'

/* A day of scheduled jobs as an instrument: a 24-hour DayRing with each
 * job on its own track, its runs as arcs as long as they take, a hand at now
 * and a countdown to the next run; beside it today's figures (runs, overlaps,
 * the next start, how many are paused). Below, every job in the ring's track
 * order: its cron expression in mono with the schedule in words, its next
 * start and a switch to pause it. Where runs collide the ring draws a warning
 * zone and both rows say with whom and when; pausing a job clears its
 * collisions. Pointing at a row lights its job on the ring. Stagger overlaps
 * moves each later-starting job 15 minutes on (Button onAction), and its runs
 * glide round the ring as the zones fade. Swap the demo `wait` with
 * `onStagger`. It is built for the compact layout density (ui.css),
 * taken from the page; embedded, it keeps its natural width unless `fill`, at the elevation of
 * the cards beside it. Reduced motion: drawn in place; runs that move jump. */

interface DayScheduleProps extends Omit<ComponentProps<'section'>, 'children' | 'title'> {
  /** Wraps the card in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (704px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the card's strings, to rewrite or translate. */
  copy?: Partial<DayScheduleCopy>
  /** The jobs, with five-field cron expressions. Default: a production day with two collisions. */
  jobs?: DayScheduleJob[]
  /** The time zone the schedules run in. Default `UTC`. */
  timeZone?: string
  /** Pins the clock (screenshots, tests). Default: the live clock. */
  now?: Date | number
  /** Moves the jobs that collide; resolve when saved. Default: a short demo wait. */
  onStagger?: (moves: { id: string; cron: string }[]) => Promise<unknown> | unknown
  /** New schedule. */
  onCreate?: () => void
  /** Formats its numbers and dates (BCP 47). Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** Skeletons in place of the figures while your jobs load. Default false. */
  loading?: boolean
  /** Shown in place of the job list when it fails to load, with Retry when `onRetry` is set. */
  error?: string
  /** Loads the jobs again after an `error`. */
  onRetry?: () => void
  /** Replaces the message when `jobs` is empty. Default: `copy.emptyTitle` and `copy.emptyDescription`. */
  empty?: ReactNode
}

const DAY = 1440

function weekdayIn(time: number, timeZone: string) {
  // lint-blocks-allow: reads the zone's weekday by its English name, not display
  const name = dateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(time)
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(name)
}
function minuteIn(time: number, timeZone: string) {
  // lint-blocks-allow: reads the zone's clock from Latin digits, not display
  const parts = dateTimeFormat('en-US', { timeZone, hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23' }).formatToParts(time)
  const part = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0)
  return (part('hour') % 24) * 60 + part('minute') + part('second') / 60
}
/** Whether `minute` falls inside a run of `length` minutes starting at `run`, across midnight. */
const within = (minute: number, run: number, length: number) => (((minute - run) % DAY) + DAY) % DAY < length

function DaySchedule({ theme, embedded = true, fill = false, copy: copyProp, jobs: initialJobs = JOBS, timeZone = 'UTC', now: nowProp, onStagger, onCreate, locale, loading = false, error, onRetry, empty, className, ...rest }: DayScheduleProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp, locale: useLocale(locale ?? copyProp?.locale) }
  const titleId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const [defs, setDefs] = useState(initialJobs)
  // Fresh jobs from the app replace what's shown (and any change made here since).
  const [source, setSource] = useState(initialJobs)
  if (source !== initialJobs) {
    setSource(initialJobs)
    setDefs(initialJobs)
  }
  const state = loading ? 'loading' : error ? 'error' : defs.length === 0 ? 'empty' : 'ready'
  const [highlight, setHighlight] = useState<string>()
  const clock = useNow(nowProp === undefined ? 1000 : 0)
  const time = nowProp === undefined ? clock : typeof nowProp === 'number' ? nowProp : nowProp.getTime()
  const [syncedAt] = useState(() => Date.now())

  const clockTime = useMemo(() => {
    const format = dateTimeFormat(copy.locale, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'UTC' })
    return (minute: number) => format.format(Date.UTC(2000, 0, 1, 0, Math.round(minute) % DAY))
  }, [copy.locale])
  const list = useMemo(() => {
    const format = new Intl.ListFormat(copy.locale, { type: 'conjunction' })
    return (items: string[]) => format.format(items)
  }, [copy.locale])

  // Today's runs, from each job's cron; weekday-only jobs sit out the weekend.
  const weekday = time === null ? 1 : weekdayIn(time, timeZone)
  const minute = time === null ? null : minuteIn(time, timeZone)
  const ring: ScheduleJob[] = useMemo(
    () => defs.map((d) => ({ id: d.id, name: d.name, runs: runsOn(d.cron, weekday), duration: d.minutes, tone: d.tone, paused: d.paused })),
    [defs, weekday],
  )
  const overlaps = useMemo(() => findOverlaps(ring), [ring])
  const active = ring.filter((j) => !j.paused)
  const runsToday = active.reduce((sum, j) => sum + j.runs.length, 0)
  const nameOf = (id: string) => ring.find((j) => j.id === id)?.name ?? id

  let next: { name: string; at: number } | undefined
  if (minute !== null) {
    for (const job of active) {
      const ahead = minutesUntil(job.runs, minute)
      if (Number.isFinite(ahead) && (!next || minute + ahead < next.at)) next = { name: job.name, at: minute + ahead }
    }
  }

  const rows: DayScheduleRow[] = defs.map((def, i) => {
    const job = ring[i]!
    const clash = overlaps.find((o) => o.jobs.includes(def.id))
    const ahead = minute === null ? Infinity : minutesUntil(job.runs, minute)
    return {
      job: def,
      human: describeCron(def.cron, copy, clockTime, list),
      next: def.paused || !Number.isFinite(ahead) ? undefined : clockTime(Math.ceil(minute! + ahead)),
      overlap: clash && {
        text: copy.overlapsWith(list(clash.jobs.filter((id) => id !== def.id).map(nameOf)), clockTime(clash.start % DAY)),
        time: clockTime(clash.start % DAY),
      },
    }
  })

  // Each collision moves the job whose run starts later (the later in the list on a tie) 15 minutes on.
  const moves = () => {
    const moving = new Set<string>()
    for (const o of overlaps) {
      let latest: { id: string; run: number } | undefined
      for (const id of o.jobs) {
        const job = ring.find((j) => j.id === id)!
        const run = job.runs.find((r) => within(o.start, r, Math.max(1, job.duration ?? 0))) ?? 0
        if (!latest || run >= latest.run) latest = { id, run }
      }
      if (latest) moving.add(latest.id)
    }
    return defs.filter((d) => moving.has(d.id)).map((d) => ({ id: d.id, cron: shiftCron(d.cron, 15) }))
  }
  const setPaused = (id: string, paused: boolean) => setDefs((list) => list.map((d) => (d.id === id ? { ...d, paused } : d)))
  const allPaused = defs.every((d) => d.paused)

  const ago = time === null ? 0 : Math.max(0, Math.floor((time - syncedAt) / 1000))
  const seconds = numberFormat(copy.locale, { style: 'unit', unit: 'second', unitDisplay: 'narrow' }).format(ago)
  const [before, after = ''] = copy.synced.split('{ago}')
  const readout = [
    { label: copy.runsToday, value: runsToday.toLocaleString(copy.locale) },
    { label: copy.overlaps, value: overlaps.length.toLocaleString(copy.locale), tone: overlaps.length > 0 && 'text-warning-text' },
    { label: copy.next, value: next ? `${clockTime(next.at % DAY)} · ${next.name}` : copy.noRuns },
    { label: copy.paused, value: defs.filter((d) => d.paused).length.toLocaleString(copy.locale) },
  ]

  const card = (
    <Card className={cn('w-full', !embedded && !fill && 'max-w-176', !embedded && 'shadow-lg')}>
      <CardHeader>
        <CardTitle>
          <Title id={titleId}>{copy.title}</Title>
        </CardTitle>
        <CardDescription>{copy.subtitle}</CardDescription>
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={copy.more} />}>
              <MoreHorizontalIcon size={15} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>{copy.exportCrontab}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDefs((list) => list.map((d) => ({ ...d, paused: !allPaused })))}>
                {allPaused ? copy.resumeAll : copy.pauseAll}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>

      <CardContent className="grid items-center gap-6 sm:grid-cols-[minmax(0,--spacing(68))_minmax(0,1fr)] sm:gap-8">
        {state === 'ready' ? (
          <>
            <DayRing
              jobs={ring}
              now={time ?? undefined}
              timeZone={timeZone}
              highlight={highlight}
              locale={copy.locale}
              label={copy.ring}
              nextLabel={copy.nextRun}
              formatTime={clockTime}
              className="mx-auto w-full max-w-68"
            />
            <dl className="flex min-w-0 flex-col">
              {readout.map((row) => (
                <div key={row.label} className="flex items-baseline justify-between gap-4 border-b border-line py-2.5 last:border-b-0">
                  <Eyebrow render={<dt />}>{row.label}</Eyebrow>
                  <dd className={cn('min-w-0 truncate font-mono text-ui-lg tabular-nums', row.tone || 'text-fg')}>{row.value}</dd>
                </div>
              ))}
            </dl>
          </>
        ) : (
          <>
            <RingPlaceholder loading={loading} label={copy.loadingLabel} />
            <ReadoutPlaceholder labels={[copy.runsToday, copy.overlaps, copy.next, copy.paused]} loading={loading} />
          </>
        )}
      </CardContent>

      <CardContent>
        <Eyebrow render={embedded ? <h3 /> : <h2 />} className="mb-1 block">
          {copy.jobs}
        </Eyebrow>
        {state === 'ready' ? (
          <JobList rows={rows} copy={copy} highlight={highlight} onHighlight={setHighlight} onPausedChange={setPaused} />
        ) : (
          <ListPlaceholder loading={loading}>
            {state === 'error' ? (
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
            ) : state === 'empty' ? (
              (empty ?? (
                <Empty className="rounded-lg border border-dashed border-line">
                  <EmptyHeader>
                    <EmptyTitle>{copy.emptyTitle}</EmptyTitle>
                    <EmptyDescription>{copy.emptyDescription}</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ))
            ) : null}
          </ListPlaceholder>
        )}
      </CardContent>

      <CardFooter className="flex-wrap justify-end">
        <p className="me-auto basis-full text-ui-sm text-fg-muted sm:basis-auto">
          {ago < 2 ? (
            copy.syncedNow
          ) : (
            <>
              {before}
              <span className="normal-case tabular-nums">{seconds}</span>
              {after}
            </>
          )}
        </p>
        <AsyncButton
          variant="secondary"
          disabled={overlaps.length === 0}
          pendingLabel={copy.staggering}
          successLabel={copy.staggered}
          onAction={async () => {
            const moved = moves()
            await (onStagger ? onStagger(moved) : demo('DaySchedule: onStagger', 900))
            setDefs((list) => list.map((d) => ({ ...d, cron: moved.find((m) => m.id === d.id)?.cron ?? d.cron })))
          }}
        >
          {copy.stagger}
        </AsyncButton>
        <Button onClick={onCreate}>{copy.newSchedule}</Button>
      </CardFooter>
    </Card>
  )

  const view = embedded ? (
    <section aria-labelledby={titleId} {...rest} className={cn('w-full', !fill && 'max-w-176', className)}>
      {card}
    </section>
  ) : (
    <main aria-labelledby={titleId} {...rest} className={cn('grid min-h-dvh w-full grid-cols-[minmax(0,1fr)] place-items-center bg-canvas px-4 py-10 text-fg', className)}>
      {card}
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { DaySchedule, type DayScheduleProps }
export type { DayScheduleCopy, DayScheduleJob }
