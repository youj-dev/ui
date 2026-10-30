'use client'

import { useId, useState, type ComponentProps, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { MoreHorizontalIcon, PlayIcon, RotateCcwIcon, SkipForwardIcon } from '@youj/icons'
import { Button } from '../../components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import { SegmentedRing } from '../../components/ui/segmented-ring'
import { ShareBar } from '../../components/ui/share-bar'
import { Eyebrow } from '../../components/ui/typography'
import { useAnnouncer } from '../../hooks/use-announcer'
import { cn, numberFormat } from '../../lib/utils'
import { DEFAULT_COPY, ELAPSED, ENTRIES, INTERVALS, ITEMS, type IntervalTimerCopy, type IntervalTimerEntry, type IntervalTimerInterval, type IntervalTimerItem } from './interval-timer/data'
import { SetLogger } from './interval-timer/set-logger'
import { TimerPlaceholder, WELL } from './interval-timer/states'
import { useTimer } from './interval-timer/use-timer'

/* Intervals of work and rest as one instrument: the SegmentedRing (every
 * interval an arc as long as it lasts, work and rest in their own colors, the
 * one running filling with a bright head, the round in big mono), beside it
 * the item at hand (an exercise, a task, a step) or, while resting, a
 * countdown that drains with +15 s and Skip rest, then what's next, and a
 * logger with count × amount steppers and the entries so far. Start, Pause and
 * Skip run the clock; the ring announces each interval and ticks through its
 * last three seconds. The demo is an evening HIIT session; pass your own
 * intervals and items, and the words in `copy`. Swap `useTimer` for your own
 * clock. Loading, an error with Retry and no intervals take the card's body
 * at its size.
 * Reduced motion: the round changes in place; the ring follows the clock either way.
 * It is built for the compact layout density (ui.css), taken from the page; embedded,
 * it stops at its natural width, as it does on its own, unless `fill`. */

interface IntervalTimerProps extends Omit<ComponentProps<'section'>, 'children'> {
  /** Wraps the block in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (960px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<IntervalTimerCopy>
  /** How its dates, times and numbers read (BCP 47). Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** The ring's arcs in order: warm-up, work and rest, cool-down. Default: eight rounds of 40 s work and 20 s rest. */
  intervals?: IntervalTimerInterval[]
  /** What the work intervals are on, each matched by its `name` to an interval's label. */
  items?: IntervalTimerItem[]
  /** Entries logged so far. Default: the demo's two. */
  entries?: IntervalTimerEntry[]
  /** Seconds into the session when the block mounts. Default: 24 s into round 3. */
  elapsed?: number
  /** Called with each logged entry. */
  onLog?: (entry: IntervalTimerEntry) => void
  /** Skeletons in the card's body while your intervals load. Default false. */
  loading?: boolean
  /** Shown in the card's body when the intervals fail to load, with Retry when `onRetry` is set. */
  error?: string
  /** Retries after an `error`. */
  onRetry?: () => void
  /** Replaces the message when there are no intervals. Default: `copy.emptyTitle` and `copy.emptyDescription`. */
  empty?: ReactNode
}

const SWAP = 'col-start-1 row-start-1 transition-[opacity,translate] yj-duration-base ease-standard reduced:transition-none data-[shown=false]:pointer-events-none data-[shown=false]:translate-y-1 data-[shown=false]:opacity-0'

function IntervalTimer({ theme, embedded = true, fill = false, copy: copyProp, locale, intervals = INTERVALS, items = ITEMS, entries = ENTRIES, elapsed = ELAPSED, onLog, loading = false, error, onRetry, empty, className, ...rest }: IntervalTimerProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp, locale: useLocale(locale ?? copyProp?.locale) }
  const titleId = useId()
  const Title = embedded ? 'h2' : 'h1'
  // Its natural width: on the card on its own page, on the section embedded (where a className can change it).
  const cap = !fill && 'max-w-240'
  const state = loading ? 'loading' : error ? 'error' : intervals.length === 0 || items.length === 0 ? 'empty' : null
  const frame = { copy, Title, titleId, cap, embedded } as const

  // The clock and the log are its own state from the first paint: a card that was loading mounts again when its intervals arrive.
  const card = state ? (
    <Frame {...frame} subtitle={<span className="text-fg-subtle">—</span>} footer={<span className="me-auto text-fg-subtle">—</span>}>
      <TimerPlaceholder state={state} copy={copy} error={error} onRetry={onRetry} empty={empty} />
    </Frame>
  ) : (
    <TimerCard {...frame} intervals={intervals} items={items} entries={entries} elapsed={elapsed} onLog={onLog} />
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

interface FrameProps {
  copy: IntervalTimerCopy
  Title: 'h1' | 'h2'
  titleId: string
  cap: string | false
  embedded: boolean
  subtitle: ReactNode
  /** The foot's buttons, after its status text. */
  actions?: ReactNode
  footer?: ReactNode
  children: ReactNode
  /** After the foot: what is not drawn, like the live region. */
  tail?: ReactNode
}

/** The card around the body: its head and its foot, the same whether the intervals are there or not. */
function Frame({ copy, Title, titleId, cap, embedded, subtitle, footer, actions, children, tail }: FrameProps) {
  return (
    <Card className={cn('w-full text-fg', !embedded && cap)}>
      <CardHeader>
        <CardTitle>
          <Title id={titleId}>{copy.title}</Title>
        </CardTitle>
        <CardDescription>{subtitle}</CardDescription>
        <CardAction>
          <Button variant="ghost" size="icon-sm" aria-label={copy.more}>
            <MoreHorizontalIcon size={16} />
          </Button>
        </CardAction>
      </CardHeader>
      {children}
      <CardFooter className="flex-wrap">
        {footer}
        {actions ?? (
          <>
            <Button variant="secondary" disabled aria-label={copy.skipLabel}>
              <SkipForwardIcon size={14} className="rtl:-scale-x-100" />
              {copy.skip}
            </Button>
            <Button disabled className="min-w-28">
              <PlayIcon size={14} />
              {copy.start}
            </Button>
          </>
        )}
      </CardFooter>
      {tail}
    </Card>
  )
}

type TimerCardProps = Omit<FrameProps, 'subtitle' | 'children' | 'footer' | 'actions' | 'tail'> & Required<Pick<IntervalTimerProps, 'intervals' | 'items' | 'entries' | 'elapsed'>> & Pick<IntervalTimerProps, 'onLog'>

function TimerCard({ intervals: initial, items, entries: logged, elapsed: start, onLog, ...frame }: TimerCardProps) {
  const { copy } = frame
  const { announce, announcer } = useAnnouncer()
  const w = useTimer(initial, start)
  const [entries, setEntries] = useState(logged)
  const two = numberFormat(copy.locale, { minimumIntegerDigits: 2, useGrouping: false })
  const num = numberFormat(copy.locale)
  const clock = (s: number) => `${num.format(Math.floor(Math.ceil(s) / 60))}:${two.format(Math.ceil(s) % 60)}`

  const resting = w.current.interval.kind === 'rest' && !w.finished
  const left = w.current.to - w.elapsed
  const itemOf = (interval?: IntervalTimerInterval) => items.find((e) => e.name === interval?.label)
  // The item at hand: the one running, or during a rest the one coming up.
  const upcoming = w.intervals.slice(w.index + 1).find((i) => i.kind === 'work')
  const item = itemOf(w.current.interval.kind === 'work' ? w.current.interval : upcoming) ?? items[0]!
  const next = w.intervals[w.index + 1]
  const after = w.intervals.slice(w.index + 2).find((i) => i.kind === 'work')
  const phaseName = (i: IntervalTimerInterval) => (i.kind === 'rest' ? copy.rest : (i.label ?? ''))

  const log = (entry: IntervalTimerEntry) => {
    setEntries((list) => [...list, entry])
    onLog?.(entry)
    const logged = items.find((e) => e.id === entry.item)
    announce(copy.logged(logged?.name ?? entry.item, entry.count, entry.amount ? `${num.format(entry.amount)} ${copy.unit}` : copy.noAmount))
  }

  return (
    <Frame
      {...frame}
      subtitle={copy.subtitle(Math.round(w.total / 60))}
      footer={<span className="me-auto tabular-nums">{w.finished ? copy.done : copy.left(clock(w.total - w.elapsed))}</span>}
      actions={
        <>
          <Button variant="secondary" onClick={w.skip} disabled={w.finished} aria-label={copy.skipLabel}>
            <SkipForwardIcon size={14} className="rtl:-scale-x-100" />
            {copy.skip}
          </Button>
          <Button onClick={w.toggle} className="min-w-28">
            {w.finished ? <RotateCcwIcon size={14} /> : w.running ? <PauseGlyph /> : <PlayIcon size={14} />}
            {w.finished ? copy.restart : w.running ? copy.pause : w.elapsed > 0 ? copy.resume : copy.start}
          </Button>
        </>
      }
      tail={announcer}
    >
      <CardContent className="grid items-center gap-8 md:grid-cols-[minmax(0,--spacing(76))_minmax(0,1fr)] md:gap-10">
        <SegmentedRing intervals={w.intervals} elapsed={w.elapsed} locale={copy.locale} className="mx-auto max-w-76" />

        <div className="flex min-w-0 flex-col gap-4">
          <div className="grid">
            <div data-shown={!resting} inert={resting} className={cn(WELL, SWAP, 'flex flex-col gap-4')}>
              <div className="flex items-baseline justify-between gap-3">
                <Eyebrow>{copy.now}</Eyebrow>
                <span className="font-mono text-ui-sm text-fg-muted tabular-nums">{copy.target(item.target)}</span>
              </div>
              <div className="flex items-end justify-between gap-4">
                <p className="min-w-0 text-2xl leading-tight font-medium tracking-tight text-balance text-fg">{w.finished ? copy.done : item.name}</p>
                <p className="shrink-0 font-mono text-4xl leading-none font-medium tracking-tight text-fg tabular-nums">{clock(w.finished ? 0 : left)}</p>
              </div>
              <ShareBar value={w.finished ? 1 : 1 - left / w.current.interval.duration} segments={Math.min(40, w.current.interval.duration)} tone="chart-1" />
            </div>

            <div data-shown={resting} inert={!resting} className={cn(WELL, SWAP, 'flex flex-col gap-4')}>
              <div className="flex items-baseline justify-between gap-3">
                <Eyebrow>{copy.rest}</Eyebrow>
                <span className="text-ui-sm text-fg-muted">{copy.restHint}</span>
              </div>
              <div className="flex items-end justify-between gap-4">
                <p role="timer" aria-live="off" className="font-mono text-4xl leading-none font-medium tracking-tight text-fg tabular-nums">
                  {clock(resting ? left : 0)}
                </p>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" aria-label={`${copy.addRest}, ${copy.addRestLabel}`} onClick={() => w.extend(15)}>
                    {copy.addRest}
                  </Button>
                  <Button variant="secondary" size="sm" onClick={w.skip}>
                    {copy.skipRest}
                  </Button>
                </div>
              </div>
              {/* Drains as the rest runs out. */}
              <ShareBar value={resting ? left / w.current.interval.duration : 0} segments={Math.min(40, w.current.interval.duration)} tone="chart-5" />
            </div>
          </div>

          {next && !w.finished && (
            <div className="flex items-center gap-3 px-1">
              <Eyebrow>{copy.next}</Eyebrow>
              <span
                aria-hidden
                className={cn('size-2 shrink-0 rounded-full', next.kind === 'rest' ? 'bg-chart-5' : next.kind === 'work' ? 'bg-chart-1' : 'bg-chart-3')}
              />
              <p className="min-w-0 flex-1 truncate text-ui text-fg">
                {phaseName(next) || copy.rest}
                {next.kind === 'rest' && after?.label && <span className="text-fg-muted"> · {copy.then(after.label)}</span>}
              </p>
              <span className="font-mono text-ui-sm text-fg-muted tabular-nums">{clock(next.duration)}</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardContent>
        <SetLogger item={item} items={items} entries={entries} onLog={log} copy={copy} />
      </CardContent>
    </Frame>
  )
}

/** Two bars: the kit has no pause icon yet. */
function PauseGlyph() {
  return (
    <span aria-hidden className="flex h-3.5 w-3.5 items-center justify-center gap-[3px]">
      <span className="h-3 w-[3px] rounded-[1px] bg-current" />
      <span className="h-3 w-[3px] rounded-[1px] bg-current" />
    </span>
  )
}

export { IntervalTimer, type IntervalTimerProps }
export type { IntervalTimerCopy, IntervalTimerEntry, IntervalTimerInterval, IntervalTimerItem }
