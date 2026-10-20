'use client'

import { useEffect, useMemo, useRef, type ComponentProps, type CSSProperties, type ReactNode } from 'react'
import { m } from 'motion/react'
import { MotionFeatures } from '@youj/core'
import { PresenceItem, PresenceList } from '@youj/motion'
import { severityTimelineLabels, useComponentLabels } from '@youj/core/labels'
import { useYouj, useLocale } from '@youj/core/lib/youj/provider'
import { useNow } from '../../hooks/use-now'
import { clamp, cn, dateTimeFormat, listFormat, numberFormat } from '../../lib/utils'

/* An incident, event by event: each row has its clock time and how long
 * after the start it came, a node on a rail (a dot in its severity's tone,
 * a diamond for a milestone), a soft SEV chip, the title and the detail.
 * Beside it runs the ribbon, the part that reads at a glance: a thin track
 * spanning the incident on every row, with the event's own bar at its offset
 * and length, and every milestone (acknowledged, mitigated, resolved) drawn
 * as a dashed rule at its moment on every row, so the phases line up down
 * the list like a gantt. While the incident is open, its window auto-ranges
 * in whole steps (5, 15, 30 min…) and a solid edge marks now; ongoing bars
 * run to it, their live end breathing.
 * - Motion: events arrive through PresenceList (the row fades down while the
 *   rows below glide), the new node lands on the snappy spring and its bar
 *   grows from its start; bars and rules move on the slow token when the
 *   window re-ranges. Geometry is clip-path and translate only.
 * - Narrow (under 34rem of its own width): the ribbon drops under the body.
 * - Reduced motion: drawn in place; the live end holds still. */

type Severity = 1 | 2 | 3 | 4
type Milestone = 'acknowledged' | 'mitigated' | 'resolved'
type SeverityTimelineTone = 'accent' | 'neutral' | 'success' | 'warning' | 'danger' | 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'

interface SeverityEvent {
  id: string
  /** When it happened, in ms since the epoch. */
  at: number
  title: string
  detail?: ReactNode
  /** 1 is the worst. Draws the SEV chip and tones the node and the bar. */
  severity?: Severity
  /** Writes the severity's chip yourself instead of "SEV1": its visible code, its spoken name and, optionally, the tone of the node, the bar and the chip. */
  severityLabel?: { code: string; name: string; tone?: SeverityTimelineTone }
  /** Marks a phase of the incident: a diamond node and a rule on every row. Besides the three known ones it takes any id, with `milestoneLabel` for its word. */
  milestone?: Milestone | (string & {})
  /** The milestone's word. Default: the labels' word for acknowledged, mitigated and resolved, else none. */
  milestoneLabel?: string
  /** The milestone that closes the incident, as resolved does: a success tone, and the window ends at it. Default: only `resolved`. */
  final?: boolean
  /** How long it lasted, in ms. Draws a bar on the ribbon; without it, a tick. */
  duration?: number
  /** Still going: its bar runs to now (or to the resolution). */
  ongoing?: boolean
  /** Who or what raised it: "pagerbot", "M. Oyelaran". */
  actor?: string
  /** The node's and the bar's color when it has no severity: a chart color for its kind, say. Default 'neutral'. */
  tone?: SeverityTimelineTone
}

interface SeverityTimelineProps extends Omit<ComponentProps<'div'>, 'children'> {
  events: readonly SeverityEvent[]
  /** When the incident began, in ms. Default: the first event. */
  start?: number
  /** When it ended, in ms. Default: the resolved milestone, else it's open and runs to now. */
  end?: number
  /** The current time, in ms. Default: a live clock (every second while the incident is open). */
  now?: number
  /** Default: the YoujProvider locale. */
  locale?: string
  /** Clock times in this zone, e.g. "UTC". Default: the browser's. */
  timeZone?: string
  /** The list's accessible name. Default: the labels' "Incident timeline". */
  label?: string
  /** Formats clock times. Default: 24-hour HH:mm in the locale. */
  formatTime?: (ms: number) => string
}

type Tone = SeverityTimelineTone | 'ink'

const SEVERITY_TONE: Record<Severity, Tone> = { 1: 'danger', 2: 'warning', 3: 'accent', 4: 'neutral' }
const MILESTONE_LABEL = { acknowledged: 'milestoneAcknowledged', mitigated: 'milestoneMitigated', resolved: 'milestoneResolved' } as const
const toneColor = (tone: Tone) => (tone === 'ink' ? 'var(--color-fg)' : tone === 'neutral' ? 'var(--color-fg-subtle)' : `var(--color-${tone})`)
const toneInk = (tone: Tone) => (tone === 'ink' || tone === 'neutral' || tone.startsWith('chart-') ? 'var(--color-fg-muted)' : `var(--color-${tone}-text)`)

const MINUTE = 60_000
/** The open window grows in whole steps, so the scale holds still between them. */
const STEPS = [5, 15, 30, 60, 120, 240, 720, 1440]

/** "1 h 4 min" (long) or "1h 4m" (narrow), in the locale, to the second under ten minutes. */
function durationText(ms: number, locale: string, display: 'long' | 'narrow') {
  const total = Math.max(0, Math.round(ms / 1000))
  const h = Math.floor(total / 3600)
  const min = Math.floor((total % 3600) / 60)
  const s = total % 60
  const unit = (value: number, u: 'hour' | 'minute' | 'second') => numberFormat(locale, { style: 'unit', unit: u, unitDisplay: display }).format(value)
  const parts = h ? [unit(h, 'hour'), ...(min ? [unit(min, 'minute')] : [])] : min ? [unit(min, 'minute'), ...(min < 10 && s ? [unit(s, 'second')] : [])] : [unit(s, 'second')]
  return listFormat(locale, { type: 'unit', style: display === 'long' ? 'long' : 'narrow' }).format(parts)
}

/** Places a full-width layer so its inline-start edge sits at `--p` of the ribbon (RTL mirrors). */
const AT = 'absolute inset-y-0 start-0 w-full [translate:calc(var(--p)*(100%_-_1px))_0] rtl:[translate:calc(var(--p)*(1px_-_100%))_0]'
const GRID =
  'own:grid grid-cols-[--spacing(13)_--spacing(3)_minmax(0,1fr)_minmax(--spacing(28),max(--spacing(52),30%))] gap-x-3 @max-[34rem]:grid-cols-[--spacing(11)_--spacing(3)_minmax(0,1fr)]'

function SeverityTimeline({ events, start, end, now: nowProp, locale: localeProp, timeZone, label, formatTime, className, ...props }: SeverityTimelineProps) {
  const k = useYouj()
  const labels = useComponentLabels(severityTimelineLabels)
  const locale = useLocale(localeProp)
  const sorted = useMemo(() => [...events].sort((a, b) => a.at - b.at), [events])
  const resolvedAt = sorted.find((e) => e.milestone === 'resolved' || (e.milestone && e.final))?.at
  const closed = end !== undefined || resolvedAt !== undefined
  const live = useNow(closed || nowProp !== undefined ? 0 : 1000)
  // New rows (not the first render's) land their node; the first render is drawn in place.
  const mounted = useRef(false)
  useEffect(() => {
    mounted.current = true
  }, [])

  const time = useMemo(
    () => formatTime ?? dateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone }).format,
    [formatTime, locale, timeZone],
  )
  const from = start ?? sorted[0]?.at ?? 0
  const lastMark = sorted.reduce((t, e) => Math.max(t, e.at + (e.ongoing ? 0 : (e.duration ?? 0))), from)
  const stop = end ?? resolvedAt ?? Math.max(nowProp ?? live ?? lastMark, lastMark)
  const span = Math.max(stop - from, MINUTE)
  const step = (STEPS.find((s) => span <= s * 6 * MINUTE) ?? 1440) * MINUTE
  // A closed incident keeps a little room past its end, so the last rule and its diamond sit inside.
  const windowEnd = closed ? from + span * 1.04 : from + Math.ceil((span * 1.06) / step) * step
  const pos = (t: number) => clamp((t - from) / (windowEnd - from), 0, 1)
  const milestones = sorted.filter((e) => e.milestone)
  const nowAt = closed ? undefined : pos(stop)

  const ribbonMarks = (
    <>
      {milestones.map((e) => (
        <span
          key={e.id}
          data-slot="severity-timeline-rule"
          data-milestone={e.milestone}
          style={{ '--p': pos(e.at) } as CSSProperties}
          className={cn(AT, 'border-s border-dashed transition-[translate] yj-duration-slow ease-standard', e.milestone === 'resolved' || e.final ? 'border-success-line' : 'border-line-strong')}
        />
      ))}
      {nowAt !== undefined && (
        <span
          data-slot="severity-timeline-now"
          style={{ '--p': nowAt } as CSSProperties}
          className={cn(AT, 'border-s border-line-strong transition-[translate] yj-duration-slow ease-standard')}
        />
      )}
    </>
  )

  return (
    <MotionFeatures>
      <div
        data-slot="severity-timeline"
        data-state={closed ? 'closed' : 'open'}
        data-reduced-motion={k.reduced || undefined}
        className={cn('@container own:flex w-full min-w-0 flex-col', className)}
        {...props}
      >
        {sorted.length > 0 && (
          <div aria-hidden data-slot="severity-timeline-axis" className={GRID}>
            <span className="col-start-3 own:@max-[34rem]:hidden" />
            <div className="col-start-4 own:flex flex-col @max-[34rem]:col-start-3">
              <span data-slot="severity-timeline-value" className="own:flex h-4 justify-between own:font-mono own:text-ui-xs own:leading-none own:text-fg-subtle own:tabular-nums">
                <span>{time(from)}</span>
                <span>{time(windowEnd)}</span>
              </span>
              {/* Each milestone's diamond, where its rule begins; and the now edge's head. */}
              <span className="relative h-3.5 overflow-clip">
                {milestones.map((e) => (
                  <span key={e.id} style={{ '--p': pos(e.at) } as CSSProperties} className={cn(AT, 'transition-[translate] yj-duration-slow ease-standard')}>
                    <span className={cn('absolute top-1 -start-[3.5px] size-2 rotate-45 rounded-[1.5px]', e.milestone === 'resolved' || e.final ? 'bg-success' : 'bg-fg')} />
                    <span className={cn('absolute top-2 bottom-0 start-0 border-s border-dashed', e.milestone === 'resolved' || e.final ? 'border-success-line' : 'border-line-strong')} />
                  </span>
                ))}
                {nowAt !== undefined && (
                  <span style={{ '--p': nowAt } as CSSProperties} className={cn(AT, 'transition-[translate] yj-duration-slow ease-standard')}>
                    <span className="absolute top-1.25 -start-[2.5px] size-1.5 rounded-full bg-fg-subtle" />
                    <span className="absolute top-2 bottom-0 start-0 border-s border-line-strong" />
                  </span>
                )}
              </span>
            </div>
          </div>
        )}
        <PresenceList as="ol" aria-label={label ?? labels.severityTimeline} data-slot="severity-timeline-list" className="own:flex flex-col">
          {sorted.map((e, i) => {
            const tone: Tone = e.milestone
              ? e.milestone === 'resolved' || e.final
                ? 'success'
                : 'ink'
              : e.severity
                ? (e.severityLabel?.tone ?? SEVERITY_TONE[e.severity])
                : (e.tone ?? 'neutral')
            const until = e.ongoing ? stop : e.at + (e.duration ?? 0)
            const bar = e.ongoing || (e.duration ?? 0) > 0
            const lasted = durationText(until - e.at, locale, 'narrow')
            const milestoneWord = e.milestone && (e.milestoneLabel ?? (e.milestone in MILESTONE_LABEL ? labels[MILESTONE_LABEL[e.milestone as Milestone]] : undefined))
            return (
              <PresenceItem
                key={e.id}
                as="li"
                data-slot="severity-timeline-event"
                data-severity={e.severity}
                data-milestone={e.milestone}
                data-ongoing={(e.ongoing && !closed) || undefined}
                style={{ '--tone': toneColor(tone), '--ink': toneInk(tone) } as CSSProperties}
                className={cn(GRID, 'group/event rounded-md transition-[background-color] yj-duration-fast ease-standard hover:bg-hover')}
              >
                <div data-slot="severity-timeline-time" className="own:flex flex-col items-end gap-0.5 pt-2.75 pb-2.5 @max-[34rem]:row-span-2">
                  <time dateTime={new Date(e.at).toISOString()} className="own:font-mono own:text-ui-sm own:text-fg-muted own:tabular-nums">
                    {time(e.at)}
                  </time>
                  {/* Isolated, so the sign stays on the value's own side in either direction. */}
                  <bdi aria-hidden data-slot="severity-timeline-value" className="own:font-mono own:text-ui-xs whitespace-nowrap text-fg-subtle own:tabular-nums">
                    +{durationText(e.at - from, locale, 'narrow')}
                  </bdi>
                </div>

                <div aria-hidden data-slot="severity-timeline-node" className="relative @max-[34rem]:row-span-2">
                  {i > 0 && <span className="absolute start-1/2 top-0 h-3 w-px -translate-x-1/2 bg-line rtl:translate-x-1/2" />}
                  {i < sorted.length - 1 && <span className="absolute start-1/2 top-7 bottom-0 w-px -translate-x-1/2 bg-line rtl:translate-x-1/2" />}
                  <m.span
                    initial={mounted.current && !k.reduced ? { scale: 0.4, opacity: 0 } : false}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={k.reduced ? { type: false } : k.spring('snappy')}
                    className={cn(
                      'absolute top-5 start-1/2 -translate-x-1/2 -translate-y-1/2 rtl:translate-x-1/2',
                      e.milestone
                        ? 'size-2.5 rotate-45 rounded-[1.5px] bg-(--tone)'
                        : 'size-2 rounded-full bg-(--tone) shadow-[0_0_0_3px_color-mix(in_oklab,var(--tone)_22%,transparent)]',
                    )}
                  />
                </div>

                <div data-slot="severity-timeline-body" className="own:flex min-w-0 flex-col gap-0.5 py-2.5 @max-[34rem]:pb-1.5">
                  <p className="own:flex min-w-0 items-start gap-2">
                    {e.severity !== undefined && !e.milestone && (
                      <span
                        data-slot="severity-timeline-severity"
                        className="own:inline-flex h-5 shrink-0 items-center rounded-full bg-[color-mix(in_oklab,var(--tone)_calc(12%+6%*var(--yj-dark)),transparent)] px-1.5 own:font-mono own:text-ui-xs own:font-medium own:text-(--ink)"
                      >
                        <span aria-hidden>{e.severityLabel?.code ?? `SEV${e.severity}`}</span>
                        <span className="sr-only">{e.severityLabel?.name ?? labels.severity(e.severity)}</span>
                      </span>
                    )}
                    {milestoneWord && (
                      <span
                        data-slot="severity-timeline-label"
                        className="shrink-0 own:font-(family-name:--yj-label-font) own:text-ui-sm own:font-medium own:tracking-(--yj-label-tracking) own:text-(--ink) own:[text-transform:var(--yj-label-case)]"
                      >
                        {milestoneWord}
                      </span>
                    )}
                    <span data-slot="severity-timeline-title" className="min-w-0 own:text-ui-lg text-pretty own:text-fg">
                      {e.title}
                    </span>
                  </p>
                  {e.detail != null && (
                    <div data-slot="severity-timeline-detail" className="own:text-ui text-pretty own:text-fg-muted">
                      {e.detail}
                    </div>
                  )}
                  {(e.actor || bar) && (
                    <p className="own:flex flex-wrap items-baseline gap-x-2 own:font-mono own:text-ui-sm own:text-fg-subtle own:tabular-nums">
                      {e.actor && <span data-slot="severity-timeline-actor">{e.actor}</span>}
                      {e.actor && bar && <span aria-hidden>·</span>}
                      {bar && (
                        <span data-slot="severity-timeline-value" className="own:text-fg-muted">
                          <span aria-hidden>{lasted}</span>
                          <span className="sr-only">{durationText(until - e.at, locale, 'long')}</span>
                          {e.ongoing && !closed && <span className="own:ms-2 own:text-(--ink)">{labels.ongoing}</span>}
                        </span>
                      )}
                    </p>
                  )}
                  <span className="sr-only">{labels.sinceStart(durationText(e.at - from, locale, 'long'))}</span>
                </div>

                <div
                  aria-hidden
                  data-slot="severity-timeline-ribbon"
                  className="relative overflow-clip py-2.5 @max-[34rem]:col-start-3 @max-[34rem]:pt-0 @max-[34rem]:pb-3"
                >
                  {ribbonMarks}
                  <span className="relative own:mt-[7px] own:block h-1.5 rounded-full bg-[color-mix(in_oklab,var(--color-canvas)_calc(100%*var(--yj-dark)),color-mix(in_oklab,var(--color-fg)_8%,transparent))] own:@max-[34rem]:mt-1">
                    {bar ? (
                      <span
                        data-slot="severity-timeline-bar"
                        style={{ '--s': pos(e.at), '--e': pos(until) } as CSSProperties}
                        className={cn(
                          'absolute inset-0 rounded-full bg-(--tone)',
                          '[--l:calc(var(--s)*100%)] [--r:calc(min((1_-_var(--e))*100%,(1_-_var(--s))*100%_-_4px))]',
                          '[clip-path:inset(0_var(--r)_0_var(--l)_round_999px)] rtl:[clip-path:inset(0_var(--l)_0_var(--r)_round_999px)]',
                          'transition-[clip-path] yj-duration-slow ease-standard',
                          // A new bar grows from its start edge.
                          'starting:[--r:calc((1_-_var(--s))*100%_-_4px)]',
                        )}
                      />
                    ) : (
                      // A moment, not a span: a tick through the track.
                      <span
                        data-slot="severity-timeline-bar"
                        data-point=""
                        style={{ '--p': pos(e.at) } as CSSProperties}
                        className={cn(AT, 'transition-[translate] yj-duration-slow ease-standard')}
                      >
                        <span className="absolute -inset-y-1 -start-px w-0.5 rounded-full bg-(--tone)" />
                      </span>
                    )}
                    {e.ongoing && !closed && (
                      <span style={{ '--p': pos(until) } as CSSProperties} className={cn(AT, 'transition-[translate] yj-duration-slow ease-standard')}>
                        <m.span
                          animate={k.reduced ? { opacity: 1 } : { opacity: [1, 0.3] }}
                          transition={k.reduced ? { type: false } : { ...k.tween('deliberate', 'standard'), repeat: Infinity, repeatType: 'mirror' }}
                          className="absolute inset-y-[-2px] -start-[3px] w-[3px] rounded-full bg-(--tone) shadow-[0_0_6px_var(--tone)]"
                        />
                      </span>
                    )}
                  </span>
                </div>
              </PresenceItem>
            )
          })}
        </PresenceList>
        {sorted.length === 0 && (
          <div
            data-slot="severity-timeline-empty"
            className="own:grid min-h-24 place-items-center rounded-[min(var(--radius-lg),12px)] border border-dashed border-line px-4 py-6 own:text-ui own:text-fg-muted"
          >
            {labels.incidentNoEvents}
          </div>
        )}
      </div>
    </MotionFeatures>
  )
}

export {
  SeverityTimeline,
  type SeverityEvent,
  type SeverityTimelineProps,
  type SeverityTimelineTone,
  type Severity as SeverityLevel,
  type Milestone as SeverityMilestone,
}
