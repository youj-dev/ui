'use client'

import { useCallback, useEffect, useId, useMemo, useState, type ComponentProps, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, m } from 'motion/react'
import { MotionFeatures, ThemeScope, useLocale, useYouj, type ThemeInput } from '@youj/core'
import { ArrowUpIcon, CirclePauseIcon, PlayIcon } from '@youj/icons'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { cn, numberFormat } from '../../lib/utils'
import { DataTable } from './data-table'
import { StreamContext, logColumns } from './logs/columns'
import { DEFAULT_COPY, type LogsTableCopy, type LogsTableEvent } from './logs/data'
import { Inspector } from './logs/inspector'
import { useStream } from './logs/use-stream'

/* A live event stream: thousands of rows rendered only as they scroll into
 * view, newest first, each with its time to the millisecond, a level you can
 * pick out in a glance, its service and message. Read from the top and it
 * follows the stream, new rows glowing in; scroll down (or pause) and it
 * holds still, counting what's waiting in a pill that brings you back up.
 * Arrow through the rows and the inspector beside them shows each event in
 * full: request, duration and its payload as JSON to copy. Search, and
 * filter by level and service. With no `events` it simulates a stream and
 * says so. Built on the Data table block. Reduced motion: rows arrive and the
 * pill appears without moving; the live dot stops pulsing. */

const HEIGHT = 480

interface LogsTableProps extends Omit<ComponentProps<'section'>, 'children' | 'title'> {
  /** The events, oldest first; append to stream. A new array updates the table (held while someone reads further down). Default: a simulated stream. */
  events?: LogsTableEvent[]
  /** Holds the view still, counting what arrives. Pair with `onPausedChange`. */
  paused?: boolean
  defaultPaused?: boolean
  onPausedChange?: (paused: boolean) => void
  /** Header buttons after Live. */
  actions?: ReactNode
  loading?: boolean
  error?: ReactNode
  onRetry?: () => void
  /** Shown when there are no events. */
  empty?: ReactNode
  /** The dashed `Demo data` badge shown while the stream is simulated. Default true. */
  demoMarker?: boolean
  /** The title's level when embedded. Default 2. */
  headingLevel?: 2 | 3 | 4
  theme?: ThemeInput
  /** Inside another page: the card alone, a `section` named by its title. Default true; `false` draws a page around it. */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at 72rem. Default false. */
  fill?: boolean
  /** Any of the stream's strings, to rewrite or translate. */
  copy?: Partial<LogsTableCopy>
  /** Formats times and counts (BCP 47). Default: the app's locale (YoujProvider). */
  locale?: string
}

/** The stream's heartbeat: a dot with a slow halo while live; still when reduced or paused. */
function LiveDot({ live }: { live: boolean }) {
  const k = useYouj()
  return (
    <span aria-hidden className="relative flex size-2 shrink-0">
      {live && !k.reduced && (
        <m.span
          className="absolute inset-0 rounded-full bg-success"
          animate={{ scale: [1, 2.6], opacity: [0.5, 0] }}
          transition={{ ...k.tween('deliberate', 'exit'), repeat: Infinity, repeatDelay: k.duration('deliberate') }}
        />
      )}
      <span className={cn('relative size-2 rounded-full', live ? 'bg-success' : 'bg-fg-subtle')} />
    </span>
  )
}

function LogsTable({
  events: eventsProp,
  paused: pausedProp,
  defaultPaused = false,
  onPausedChange,
  actions,
  loading,
  error,
  onRetry,
  empty,
  demoMarker = true,
  headingLevel = 2,
  theme,
  embedded = true,
  fill = false,
  copy: copyProp,
  locale: localeProp,
  className,
  ...rest
}: LogsTableProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const locale = useLocale(localeProp)
  const k = useYouj()
  const titleId = useId()
  const Title = embedded ? (`h${headingLevel}` as const) : 'h1'
  const [ownPaused, setOwnPaused] = useState(defaultPaused)
  const paused = pausedProp ?? ownPaused
  const togglePaused = () => {
    setOwnPaused(!paused)
    onPausedChange?.(!paused)
  }
  const [atTop, setAtTop] = useState(true)
  const stream = useStream(eventsProp, atTop && !paused)
  const [inspectedId, setInspectedId] = useState<string | null>(null)
  const inspected = useMemo(() => (inspectedId ? (stream.shown.find((event) => event.id === inspectedId) ?? null) : null), [inspectedId, stream.shown])
  const errors = useMemo(() => stream.shown.reduce((n, event) => n + (event.level === 'error' ? 1 : 0), 0), [stream.shown])

  // The table's frame, found once it's in the page: the pill floats in it, and its scroll says whether to follow.
  const [frame, setFrame] = useState<HTMLElement | null>(null)
  const host = useCallback((el: HTMLDivElement | null) => setFrame(el?.querySelector<HTMLElement>('[data-slot=data-table-frame]') ?? null), [])
  useEffect(() => {
    if (!frame) return
    const onScroll = (event: Event) => {
      const el = event.target as HTMLElement
      if (el.dataset.slot === 'data-table-scroll') setAtTop(el.scrollTop < 8)
    }
    frame.addEventListener('scroll', onScroll, { capture: true, passive: true })
    return () => frame.removeEventListener('scroll', onScroll, { capture: true })
  }, [frame])
  const backToTop = () => frame?.querySelector('[data-slot=data-table-scroll]')?.scrollTo({ top: 0, behavior: k.reduced ? 'auto' : 'smooth' })

  const copyKey = JSON.stringify(copyProp ?? null)
  // biome-ignore lint/correctness/useExhaustiveDependencies: copyKey is copyProp's JSON, so a copy written inline doesn't rebuild the columns on every render; copy is read from the same value
  const columns = useMemo(
    () => logColumns({ copy, locale }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- copyKey is copyProp's JSON, so a copy written inline doesn't rebuild the columns on every render; copy is read from the same value
    [copyKey, locale],
  )
  const count = useMemo(() => numberFormat(locale), [locale])
  const waiting = copy.newEvents(count.format(stream.pending), stream.pending)
  const pill = stream.pending > 0 && !paused && !atTop
  const streamContext = useMemo(() => ({ fresh: stream.fresh, inspected: inspected?.id ?? null }), [stream.fresh, inspected])

  const card = (
    <MotionFeatures>
      <div className="flex flex-col gap-4 text-fg">
        <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <Title id={titleId} className="text-ui-lg font-semibold tracking-tight text-balance text-fg">
                {copy.title}
              </Title>
              {stream.simulated && demoMarker && (
                <Badge variant="outline" data-slot="demo-marker" className="border-dashed border-line-strong">
                  {copy.demoData}
                </Badge>
              )}
            </div>
            <p className="text-ui-sm text-fg-muted tabular-nums">{copy.description(count.format(stream.shown.length), count.format(errors), errors)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={togglePaused} className="tabular-nums">
              <LiveDot live={!paused} />
              {paused ? copy.paused : copy.live}
              {paused && stream.pending > 0 && <span className="text-fg-muted">· {waiting}</span>}
              <span className="sr-only">, {paused ? copy.resumeStream : copy.pauseStream}</span>
              {paused ? <PlayIcon className="text-fg-muted" /> : <CirclePauseIcon className="text-fg-muted" />}
            </Button>
            {actions}
          </div>
        </header>
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(--spacing(72),--spacing(88))]">
          <div ref={host} className="min-w-0">
            <StreamContext.Provider value={streamContext}>
              <DataTable<LogsTableEvent>
                fill
                // The row the keyboard is on takes the selected tint while the grid has focus.
                className="[&_tr:has(>td:focus)]:[--dt-row-bg:var(--dt-row-selected)]"
                aria-labelledby={titleId}
                rows={stream.shown}
                columns={columns}
                getRowId={(event) => event.id}
                getRowLabel={(event) => event.message}
                copy={{ noun: copy.noun }}
                locale={locale}
                loading={loading}
                error={error}
                onRetry={onRetry}
                empty={empty}
                virtualize
                height={HEIGHT}
                defaultDensity="compact"
                showDensityToggle={false}
                search={{ placeholder: copy.search }}
                exportable={{ filename: 'logs' }}
                initialState={{ sorting: [{ id: 'time', desc: true }] }}
                onActiveCellChange={(cell) => cell && setInspectedId(cell.rowId)}
              />
            </StreamContext.Provider>
            {frame &&
              createPortal(
                <AnimatePresence initial={false}>
                  {pill && (
                    <m.button
                      key="pill"
                      type="button"
                      data-yj-tone="inverse"
                      aria-label={copy.showNew(waiting)}
                      onClick={backToTop}
                      initial={k.reduced ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1, transition: k.reduced ? { type: false } : k.spring('snappy') }}
                      exit={{ opacity: 0, transition: k.tween('fast', 'exit') }}
                      className="absolute inset-x-0 top-[calc(var(--dt-head-h)+--spacing(2))] z-10 mx-auto flex h-7 w-fit items-center gap-1.5 rounded-full bg-inverse ps-2.5 pe-3 text-ui-sm font-medium text-fg shadow-md focus-ring"
                    >
                      <ArrowUpIcon className="size-3.5" />
                      {waiting}
                    </m.button>
                  )}
                </AnimatePresence>,
                frame,
              )}
          </div>
          <Inspector
            event={inspected}
            copy={copy}
            locale={locale}
            headingLevel={embedded ? ((headingLevel + 1) as 3 | 4 | 5) : 2}
            onClose={() => setInspectedId(null)}
            className="h-80 lg:h-auto"
          />
        </div>
        {/* Said once when events start waiting, not on every one that joins them. */}
        <span role="status" aria-live="polite" className="sr-only">
          {pill ? copy.waitingAbove : ''}
        </span>
      </div>
    </MotionFeatures>
  )

  const view = embedded ? (
    <section aria-labelledby={titleId} {...rest} className={cn('w-full', !fill && 'max-w-6xl', className)}>
      {card}
    </section>
  ) : (
    <main aria-labelledby={titleId} {...rest} className={cn('min-h-dvh w-full bg-canvas px-4 py-10 text-fg sm:px-8', className)}>
      <div className={cn('mx-auto w-full', !fill && 'max-w-6xl')}>{card}</div>
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { LogsTable, type LogsTableProps }
export type { LogsTableCopy, LogsTableEvent, LogsTableLevel } from './logs/data'
