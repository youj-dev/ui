'use client'

import { useEffect, useId, useMemo, useRef, useState, type ComponentProps } from 'react'
import { ThemeScope, useLocale, useYouj, type ThemeInput } from '@youj/core'
import { Badge, BadgeDot } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { AsyncButton } from '../../components/ui/async-button'
import { Card, CardContent, CardFooter } from '../../components/ui/card'
import { SeverityTimeline, type SeverityEvent, type SeverityLevel } from '../../components/ui/severity-timeline'
import { Eyebrow } from '../../components/ui/typography'
import { useAnnouncer } from '../../hooks/use-announcer'
import { useVisible } from '../../hooks/use-visible'
import { cn } from '../../lib/utils'
import { useControllableState } from '../../hooks/use-controllable-state'
import {
  ARRIVALS,
  DEFAULT_COPY,
  EVENT,
  history,
  ITEMS,
  NOW,
  OPEN_FOR,
  PHASES,
  SCALE,
  SEVERITIES,
  STATUSES,
  demo,
  type EventTimelineCopy,
  type EventTimelineEvent,
  type EventTimelineItem,
  type EventTimelinePhase,
  type EventTimelineSeverity,
  type EventTimelineStatus,
} from './event-timeline/data'
import { useEventClock } from './event-timeline/clock'
import { AffectedItems } from './event-timeline/items'
import { BADGE, clock, Head } from './event-timeline/head'
import { Stats } from './event-timeline/stats'

/* An open event as one instrument card: where it stands (a soft status
 * pill, its severity, how long it has been open, ticking), how fast it's
 * being worked (the time each phase took to reach), the items it
 * touches with their rates as runs of cells, and what happened, on a
 * SeverityTimeline whose ribbon lines every event up against the
 * milestones. The ink action walks it forward through the `phases` (Acknowledge →
 * Mitigate → Resolve): each adds its milestone (it draws in), moves the pill, fills its
 * time and eases the items' rates; the last phase stops the clock.
 * Escalate raises the severity a step and pages the lead. Until someone
 * acknowledges, new alerts keep arriving. Swap the demo `wait`s for your API
 * with the `on…` callbacks. Pass your own `event`, `entries` and `items`,
 * with `phases`, `severities` and `statuses` for your own words,
 * (and `now`, the server's time, so the clock hydrates); control `phase` and
 * `severity` from your app if it owns them; every string is in `copy`.
 * It is built for the compact layout density (ui.css), taken from the page: 16px
 * sides, 12px bands, a one-line head; embedded, it sits at the elevation of
 * the cards beside it and stops at its natural width unless `fill`.
 * Reduced motion: rows, bars and cells change in place. */

interface EventTimelineProps extends Omit<ComponentProps<'section'>, 'children' | 'title'> {
  /** Wraps the block in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (736px at 100% scale). Default false. */
  fill?: boolean
  /** The title's heading level; the block's own sections sit one under it. Default 1, or 2 when `embedded`. */
  headingLevel?: 1 | 2 | 3
  /** Formats durations and clock times. Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** Any of the block's UI strings, to rewrite or translate. The event's own words are in `event`. */
  copy?: Partial<EventTimelineCopy>
  /** The event: its id, title, subject, lead and start. Default: the demo's INC-2817 on checkout-api. */
  event?: EventTimelineEvent
  /** The stages it passes through, in order: the first is where it starts, the last closes it. Default: triggered, acknowledged, mitigated, resolved. */
  phases?: EventTimelinePhase[]
  /** Levels of urgency, most urgent first (level 1), at most four. Default: SEV1 to SEV4. */
  severities?: EventTimelineSeverity[]
  /** How an item reads from its rate, worst first. Default: down, degraded, operational. */
  statuses?: EventTimelineStatus[]
  /** The rate (0–1) at which an item's bar is full. Default 0.4. */
  scale?: number
  /** Writes an item's rate (0–1). Default: a percentage with one decimal in the locale. */
  format?: { rate?: (rate: number) => string }
  /** The id of the phase it is in, when your app owns it; pair with `onPhaseChange`. The block adds milestone entries only when its own action moves it. */
  phase?: string
  /** The id of the phase it starts in, when the block owns it. Default: the first phase. */
  defaultPhase?: string
  /** Called with the new phase's id after the action that moves it has run. */
  onPhaseChange?: (phase: string) => void
  /** Its severity, 1–4, when your app owns it; pair with `onSeverityChange`. */
  severity?: SeverityLevel
  /** Its severity at first, 1–4. Default 2. */
  defaultSeverity?: SeverityLevel
  /** Called with the new severity after Escalate, or when a phase eases it. */
  onSeverityChange?: (severity: SeverityLevel) => void
  /** What has happened so far, read when the block mounts (give it a new `key` to replace them). Default: the demo's four, opened 12 minutes before `now`. */
  entries?: SeverityEvent[]
  /** What it touches, each with its rate per phase. Default: the demo's three. */
  items?: EventTimelineItem[]
  /** The time the block first renders at, in ms, which the server and the browser agree on; the clock ticks on from it once mounted. Default: the demo's fixed time with the demo events; with your own `entries`, the browser's clock once mounted. */
  now?: Date | number
  /** Clock times on the timeline in this zone, e.g. "UTC"; set it when you render on the server. Default: the browser's. */
  timeZone?: string
  /** Keep the demo alive: new demo alerts arrive until someone acknowledges (never with your own `entries`). Default true. */
  live?: boolean
  /** Shows a dashed "Demo data" badge while the block runs on the demo's entries (no `entries` passed). Default true. */
  demoMarker?: boolean
  /** Moves it into the next phase, which it receives; resolve when done, reject to show the message. Default: a short demo wait. */
  onAdvance?: (phase: EventTimelinePhase) => Promise<unknown> | unknown
  onEscalate?: (severity: SeverityLevel) => Promise<unknown> | unknown
  /** The menu's Copy link. Default: nothing. */
  onCopyLink?: () => void
  /** The menu's Open runbook. Default: nothing. */
  onOpenRunbook?: () => void
  /** Start postmortem, once resolved. Default: nothing. */
  onPostmortem?: () => void
  /** Classes for its parts: `card` holds the block's size (717px tall at 100%; the timeline scrolls inside it, so alerts, escalations and milestones never resize it). */
  classNames?: { card?: string }
}

function EventTimeline({
  theme,
  embedded = true,
  fill = false,
  className,
  headingLevel,
  locale: localeProp,
  copy: copyProp,
  event = EVENT,
  phases = PHASES,
  severities = SEVERITIES,
  statuses = STATUSES,
  scale = SCALE,
  format,
  phase: phaseProp,
  defaultPhase,
  onPhaseChange,
  severity: severityProp,
  defaultSeverity = 2,
  onSeverityChange,
  entries: initialEvents,
  items = ITEMS,
  now: nowProp,
  timeZone,
  live = true,
  demoMarker = true,
  onAdvance,
  onEscalate,
  onCopyLink,
  onOpenRunbook,
  onPostmortem,
  classNames,
  ...rest
}: EventTimelineProps) {
  const locale = useLocale(localeProp ?? copyProp?.locale)
  const copy = useMemo(() => ({ ...DEFAULT_COPY, ...copyProp, locale }), [copyProp, locale])
  const nowAt = nowProp === undefined ? undefined : +nowProp
  const titleId = useId()
  const itemsId = useId()
  const timelineId = useId()
  const k = useYouj()
  const scroller = useRef<HTMLDivElement>(null)
  const level = headingLevel ?? (embedded ? 2 : 1)
  const Title = level === 1 ? 'h1' : level === 2 ? 'h2' : 'h3'
  const Section = level === 1 ? 'h2' : level === 2 ? 'h3' : 'h4'
  // What the last action's callback rejected with, shown under the actions until the next one.
  const [failure, setFailure] = useState<string | null>(null)
  const { announce, announcer } = useAnnouncer()
  // The demo's events sit at a fixed time, so the server and the browser draw the same timeline.
  // Without your events it runs the demo incident, with alerts arriving, marked as such.
  const simulated = initialEvents === undefined
  const [events, setEvents] = useState<SeverityEvent[]>(() => initialEvents ?? history((nowAt ?? NOW) - OPEN_FOR))
  const [phase, setPhaseState] = useControllableState(phaseProp, defaultPhase ?? phases[0]?.id ?? '')
  const [severity, setSeverityState] = useControllableState(severityProp, defaultSeverity)
  const first = phases[0]
  const final = phases.length > 1 ? phases[phases.length - 1] : undefined
  const phaseIndex = Math.max(
    0,
    phases.findIndex((p) => p.id === phase),
  )
  const current = phases[phaseIndex]
  // The phase the primary action moves it into; none once it is closed.
  const next = phases[phaseIndex + 1]
  const closedPhase = !next
  const severityOf = (level: SeverityLevel): EventTimelineSeverity =>
    severities[level - 1] ?? { id: String(level), label: String(level), tone: 'neutral' }
  const latest = events.reduce((t, e) => Math.max(t, e.at), 0)
  const root = useRef<HTMLElement>(null)
  const visible = useVisible(root)
  const { now, read } = useEventClock(nowAt ?? (initialEvents ? undefined : NOW), latest, !closedPhase && visible)
  const arrived = useRef(0)
  const lead = event.leadHandle ?? event.lead

  const setPhase = (next: string) => {
    setPhaseState(next)
    onPhaseChange?.(next)
  }
  const setSeverity = (level: SeverityLevel) => {
    setSeverityState(level)
    onSeverityChange?.(level)
  }

  const start = event.startedAt ?? (events.length ? events.reduce((t, e) => Math.min(t, e.at), Infinity) : now)
  const reached = (milestone: string) => events.find((e) => e.milestone === milestone)?.at
  const resolvedAt = final ? reached(final.id) : undefined
  const elapsed = (resolvedAt ?? now) - start

  // Until someone acknowledges, the alerts keep coming (a few, for the demo).
  useEffect(() => {
    if (!simulated || !live || !visible || phase !== first?.id) return
    const id = setInterval(() => {
      const next = ARRIVALS[arrived.current]
      if (!next) return clearInterval(id)
      arrived.current += 1
      setEvents((list) => [...list, { ...next, id: `arrival-${arrived.current}`, at: read() }])
      announce(copy.announceEvent(next.title))
    }, 7000)
    return () => clearInterval(id)
  }, [simulated, live, visible, phase, first?.id, announce, copy, read])

  // Runs an action's callback; a rejection shows its message and plays the button's error.
  const attempt = async (run: () => unknown) => {
    setFailure(null)
    try {
      await run()
    } catch (error) {
      setFailure(error instanceof Error && error.message ? error.message : copy.failed)
      throw error
    }
  }

  const advance = async () => {
    if (!next) return
    await attempt(() => (onAdvance ? onAdvance(next) : demo('EventTimeline: onAdvance', 700)))
    const at = read()
    setEvents((list) => [
      // Resolving ends what was still going, at the resolution.
      ...list.map((e) => (next === final && e.ongoing ? { ...e, ongoing: false, duration: at - e.at } : e)),
      {
        id: next.id,
        at,
        milestone: next.id,
        title: event.milestones?.[next.id] ?? (next.milestone ?? next.label).replace('{lead}', event.lead),
        actor: lead,
      },
    ])
    setPhase(next.id)
    if (next.eases && severity < next.eases) setSeverity(next.eases)
    announce(next.announce ?? next.label)
  }

  const escalate = async () => {
    const level = Math.max(1, severity - 1) as SeverityLevel
    await attempt(() => (onEscalate ? onEscalate(level) : demo('EventTimeline: onEscalate', 600)))
    const at = read()
    setSeverity(level)
    setEvents((list) => [
      ...list,
      { id: `sev-${level}-${at}`, at, severity: level, title: copy.escalated(severityOf(level).label), detail: copy.escalatedDetail, actor: lead },
    ])
    announce(copy.escalated(severityOf(level).label))
  }

  const stats = phases.filter((p) => p.stat).map((p) => ({ id: p.id, label: p.stat!.label, name: p.stat!.name, at: reached(p.id) }))
  // The entries as the timeline draws them: each severity as your severities write it, each milestone as its phase.
  const shown = events.map((e) => {
    const phased = e.milestone ? phases.find((p) => p.id === e.milestone) : undefined
    const level = e.severity ? severityOf(e.severity) : undefined
    return {
      ...e,
      ...(phased ? { milestoneLabel: phased.label, final: phased === final } : null),
      ...(level ? { severityLabel: { code: level.label, name: level.name ?? level.label, tone: level.tone } } : null),
    }
  })

  // A new event lands at the foot of the timeline: follow it there.
  const seen = useRef(events.length)
  useEffect(() => {
    const el = scroller.current
    if (el && events.length > seen.current) el.scrollTo?.({ top: el.scrollHeight, behavior: k.reduced ? 'auto' : 'smooth' })
    seen.current = events.length
  }, [events.length, k.reduced])

  const card = (
    // A fixed height: the timeline scrolls in what the figures, the services and the actions leave.
    <Card className={cn('h-179.25 w-full', !embedded && !fill && 'max-w-184', !embedded && 'shadow-lg', classNames?.card)}>
      <Head Title={Title} titleId={titleId} event={event} demoMarker={simulated && demoMarker} copy={copy} onCopyLink={onCopyLink} onOpenRunbook={onOpenRunbook} />

      <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="flex items-center gap-2">
          <Badge variant={BADGE[current?.tone ?? 'accent']} data-phase={phase}>
            <BadgeDot />
            {current?.label}
          </Badge>
          <Badge variant={BADGE[severityOf(severity).tone]} className="font-mono">
            <span aria-hidden>{severityOf(severity).label}</span>
            <span className="sr-only">{severityOf(severity).name ?? severityOf(severity).label}</span>
          </Badge>
        </div>
        <p className="ms-auto flex items-baseline gap-3">
          <Eyebrow>{resolvedAt ? copy.closedAfter : copy.open}</Eyebrow>
          <span aria-live="off" className="font-mono text-2xl leading-none font-medium tracking-tight text-fg tabular-nums">
            {clock(elapsed)}
          </span>
        </p>
      </CardContent>

      <CardContent className="px-0">
        <Stats stats={stats} start={start} copy={copy} locale={locale} />
      </CardContent>

      <CardContent>
        <AffectedItems
          items={items}
          phase={phase}
          statuses={statuses}
          scale={scale}
          formatRate={format?.rate}
          copy={copy}
          locale={locale}
          heading={Section}
          id={itemsId}
        />
      </CardContent>

      <CardContent className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <Eyebrow id={timelineId} render={<Section />}>
            {copy.timeline}
          </Eyebrow>
          <span className="font-mono text-ui-sm text-fg-muted tabular-nums">{copy.entries(events.length)}</span>
        </div>
        <div
          ref={scroller}
          role="region"
          aria-label={copy.timeline}
          tabIndex={0}
          className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1 yj-scrollbar focus-ring"
        >
          <SeverityTimeline label={copy.timeline} events={shown} start={start} now={now} locale={locale} timeZone={timeZone} />
        </div>
      </CardContent>

      <CardFooter className="flex-wrap">
        <p>{copy.lead(event.lead)}</p>
        <div className="ms-auto flex gap-2">
          <AsyncButton variant="secondary" disabled={closedPhase || severity === 1} pendingLabel={copy.escalating} onAction={escalate}>
            {copy.escalate}
          </AsyncButton>
          {!next ? (
            <Button onClick={onPostmortem}>{copy.postmortem}</Button>
          ) : (
            <AsyncButton pendingLabel={next.pending ?? next.action} successLabel={next.label} onAction={advance}>
              {next.action ?? next.label}
            </AsyncButton>
          )}
        </div>
        {failure && (
          <p role="alert" className="basis-full text-end text-ui-sm text-danger-text">
            {failure}
          </p>
        )}
      </CardFooter>
      {announcer}
    </Card>
  )

  const view = embedded ? (
    <section ref={root} aria-labelledby={titleId} {...rest} className={cn('w-full', !fill && 'max-w-184', className)}>
      {card}
    </section>
  ) : (
    <main
      ref={root}
      aria-labelledby={titleId}
      {...rest}
      className={cn('grid min-h-dvh w-full grid-cols-[minmax(0,1fr)] place-items-center bg-canvas px-4 py-10 text-fg', className)}
    >
      {card}
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export {
  EventTimeline,
  type EventTimelineProps,
  type EventTimelineCopy,
  type EventTimelineEvent,
  type EventTimelineItem,
  type EventTimelinePhase,
  type EventTimelineSeverity,
  type EventTimelineStatus,
}
