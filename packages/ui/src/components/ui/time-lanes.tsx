'use client'

import { useId, useRef, useState, type ComponentProps, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import { timeLanesLabels, useComponentLabels } from '@youj/core/labels'
import { useYouj, useLocale } from '@youj/core/lib/youj/provider'
import { useNow } from '../../hooks/use-now'
import { cn, dateTimeFormat, numberFormat, initials, toneColor } from '../../lib/utils'
import { Badge, BadgeDot } from './badge'
import { Popover, PopoverContent, PopoverTrigger } from './popover'

/* Who is on call when, as a week of lanes: one lane per person or team, each
 * shift a bar from its start to its end, an override hatched over it, a
 * dashed baton where one lane hands off to another, and now as a vertical
 * line in the accent that moves with the clock. Lanes take the chart colors
 * in turn; shifts that ended fade, and the one on call now is lit.
 * - Keyboard: the shifts are one tab stop. Left and right move along a lane
 *   (mirrored in RTL), up and down to the nearest shift in the next lane,
 *   Home and End to a lane's ends; Enter or Space opens the shift's detail
 *   in a popover (who, when, how long, whether it's an override, who takes
 *   over), with room for your own actions through `renderDetail`.
 * - A proposed shift (a suggestion not yet accepted) is a dashed outline in
 *   the accent, never on call, and says so in its name and detail. `hours`
 *   turns the week into a day: the axis counts hours, and bars can carry a
 *   `label` (a job, a load) and a `tone` of their own (danger for late).
 * - Motion: the now line glides to its new place on the slow token each
 *   time the clock ticks. Reduced motion: it jumps. */

type RotaTone = 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5' | 'accent' | 'danger' | 'neutral'

interface RotaLane {
  id: string
  /** The person or team: "Grace Hopper". */
  name: string
  /** A second line under the name: "Primary". */
  detail?: string
  /** Up to two letters for the disc. Default: the name's initials. */
  initials?: string
  /** Default: the chart colors in turn. */
  tone?: RotaTone
}

interface RotaShift {
  id: string
  /** The lane it sits in. */
  lane: string
  start: Date | number
  end: Date | number
  /** Covering someone else's shift: drawn hatched. */
  override?: boolean
  /** A line for the detail: "Covering Ada's dentist visit". */
  note?: string
  /** Suggested, not yet accepted: drawn as a dashed outline in the accent (or its `tone`), never on call. */
  proposed?: boolean
  /** Text on the bar in place of its start time: a job or load ("48291"). Read before the lane's name. */
  label?: string
  /** The bar's own color, over its lane's: `danger` for a late run. */
  tone?: RotaTone
}

interface TimeLanesProps extends Omit<ComponentProps<'div'>, 'children'> {
  lanes: RotaLane[]
  shifts: RotaShift[]
  /** The first moment shown: usually a Monday at midnight. */
  start: Date | number
  /** Days shown. Default 7. */
  days?: number
  /** Hours shown instead of days, for a day view ("08:00 to 17:00" is 9): the axis counts hours. */
  hours?: number
  /** Where the now line sits. Default: the clock, read every 30 s once the page is live. */
  now?: Date | number | null
  /** The rota's accessible name. Default "On-call rota". */
  label?: string
  /** Default: the YoujProvider locale. */
  locale?: string
  /** Extra content at the foot of a shift's detail: actions, links. */
  renderDetail?: (shift: RotaShift, lane: RotaLane) => ReactNode
}

const HOUR = 3_600_000
const DAY = 86_400_000
const TONES: RotaTone[] = ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5']
/** Stripes of the lane's tone over a wash of it, like Hatch. */
const HATCH =
  'own:[background-image:repeating-linear-gradient(-45deg,color-mix(in_oklab,var(--rota-tone)_70%,transparent)_0_1.5px,transparent_1.5px_5px)] own:bg-[color-mix(in_oklab,var(--rota-tone)_12%,transparent)]'

function TimeLanes({ lanes, shifts, start, days = 7, hours: hoursProp, now: nowProp, label, locale: localeProp, renderDetail, className, style, ...props }: TimeLanesProps) {
  const k = useYouj()
  const labels = useComponentLabels(timeLanesLabels)
  const locale = useLocale(localeProp)
  const clock = useNow(30_000)
  const now = nowProp === undefined ? clock : nowProp === null ? null : +nowProp
  const t0 = +start
  const span = hoursProp ? hoursProp * HOUR : days * DAY
  // A day view ticks every hour or two (up to six labels); a week view by the day.
  const tickStep = hoursProp ? Math.max(1, Math.ceil(hoursProp / 6)) * HOUR : DAY
  const ticks = Array.from({ length: Math.ceil(span / tickStep) }, (_, i) => i * tickStep)
  const at = (t: number) => Math.min(1, Math.max(0, (t - t0) / span))
  const refs = useRef(new Map<string, HTMLButtonElement>())
  const [active, setActive] = useState<string>()
  const hintId = useId()

  const tone = (lane: RotaLane, i: number) => lane.tone ?? TONES[i % TONES.length]!
  const shiftTone = (s: RotaShift, lane: RotaLane, i: number) => s.tone ?? (s.proposed ? 'accent' : tone(lane, i))
  const laneOf = new Map(lanes.map((l, i) => [l.id, { lane: l, index: i }]))
  const visible = shifts.filter((s) => laneOf.has(s.lane) && +s.end > t0 && +s.start < t0 + span)
  const byLane = lanes.map((l) => visible.filter((s) => s.lane === l.id).sort((a, b) => +a.start - +b.start))
  const committed = visible.filter((s) => !s.proposed)
  const current = now === null ? undefined : committed.filter((s) => +s.start <= now && now < +s.end).sort((a, b) => Number(!!b.override) - Number(!!a.override))[0]
  const tabStop = visible.some((s) => s.id === active) ? active : (current?.id ?? byLane.flat()[0]?.id)
  // A baton wherever one lane's shift ends as another lane's begins.
  const handoffs = committed.flatMap((s) =>
    committed.filter((p) => p.lane !== s.lane && +p.end === +s.start).map((p) => ({ id: `${p.id}>${s.id}`, at: +s.start, from: laneOf.get(p.lane)!.index, to: laneOf.get(s.lane)!.index })),
  )
  const nextOf = (s: RotaShift) => committed.find((n) => n.lane !== s.lane && +n.start === +s.end)

  const time = dateTimeFormat(locale, { weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
  const long = dateTimeFormat(locale, { weekday: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
  const hm = dateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
  const hours = numberFormat(locale, { style: 'unit', unit: 'hour', unitDisplay: 'narrow', maximumFractionDigits: 1 })
  const weekday = (f: 'short' | 'narrow') => dateTimeFormat(locale, { weekday: f })
  const dayNum = dateTimeFormat(locale, { day: 'numeric' })

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const id = (e.target as HTMLElement).dataset.shiftId
    if (!id) return
    const li = byLane.findIndex((list) => list.some((s) => s.id === id))
    const list = byLane[li]!
    const i = list.findIndex((s) => s.id === id)
    const rtl = getComputedStyle(e.currentTarget).direction === 'rtl'
    let next: RotaShift | undefined
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') next = list[i + ((e.key === 'ArrowRight') !== rtl ? 1 : -1)]
    else if (e.key === 'Home') next = list[0]
    else if (e.key === 'End') next = list.at(-1)
    else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const step = e.key === 'ArrowDown' ? 1 : -1
      const mid = (+list[i]!.start + +list[i]!.end) / 2
      for (let j = li + step; j >= 0 && j < byLane.length && !next; j += step)
        next = byLane[j]!.reduce<RotaShift | undefined>((best, s) => (!best || Math.abs((+s.start + +s.end) / 2 - mid) < Math.abs((+best.start + +best.end) / 2 - mid) ? s : best), undefined)
    }
    if (!next || next.id === id) return
    e.preventDefault()
    setActive(next.id)
    refs.current.get(next.id)?.focus()
  }

  return (
    <div
      role="group"
      aria-label={label ?? labels.rota}
      aria-describedby={hintId}
      data-slot="time-lanes"
      data-reduced-motion={k.reduced || undefined}
      className={cn('own:grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 [--rota-lane:2.75rem] sm:gap-x-4', className)}
      style={style}
      onKeyDown={onKeyDown}
      {...props}
    >
      <span id={hintId} className="sr-only">
        {labels.rotaHint}
      </span>

      <div data-slot="time-lanes-heads" className="own:flex flex-col own:pt-7">
        {lanes.map((lane, i) => (
          <div key={lane.id} data-slot="time-lanes-head" className="own:flex own:h-(--rota-lane) own:min-w-0 items-center gap-2.5 own:sm:w-36">
            <span
              data-slot="time-lanes-avatar"
              aria-hidden
              className="own:grid own:size-7 own:shrink-0 place-items-center own:rounded-full own:bg-[color-mix(in_oklab,var(--rota-tone)_22%,transparent)] own:font-mono own:text-ui-xs own:font-medium own:text-fg"
              style={{ '--rota-tone': toneColor(tone(lane, i)) } as CSSProperties}
            >
              {lane.initials ?? initials(lane.name)}
            </span>
            <span className="own:hidden min-w-0 flex-col own:sm:flex">
              <span className="truncate own:text-ui own:text-fg">
                {lane.name}
              </span>
              {lane.detail && <span className="truncate own:text-ui-sm own:text-fg-muted">{lane.detail}</span>}
            </span>
          </div>
        ))}
      </div>

      <div data-slot="time-lanes-body" className="relative own:min-w-0 overflow-x-clip [--rota-dir:1] [overflow-clip-margin:6px] rtl:[--rota-dir:-1]">
        <div data-slot="time-lanes-axis" aria-hidden className="relative own:h-7">
          {hoursProp
            ? ticks.map((t) => (
                <span
                  key={t}
                  data-slot="time-lanes-hour"
                  className="absolute top-1 own:ps-1.5 own:font-mono own:text-ui-xs whitespace-nowrap own:text-fg-muted own:tabular-nums"
                  style={{ insetInlineStart: `${(t / span) * 100}%` }}
                >
                  {hm.format(t0 + t)}
                </span>
              ))
            : Array.from({ length: days }, (_, d) => {
            const day = new Date(t0 + d * DAY)
            const today = now !== null && now >= +day && now < +day + DAY
            return (
              <span
                key={d}
                data-slot="time-lanes-day"
                data-today={today || undefined}
                className={cn(
                  'absolute top-1 own:flex gap-1 own:ps-1.5 own:font-(family-name:--yj-label-font) own:text-ui-xs own:tracking-(--yj-label-tracking) whitespace-nowrap own:[text-transform:var(--yj-label-case)]',
                  today ? 'own:text-fg' : 'own:text-fg-muted',
                )}
                style={{ insetInlineStart: `${(d / days) * 100}%` }}
              >
                <span className="own:sm:hidden">{weekday('narrow').format(day)}</span>
                <span className="own:hidden own:sm:inline">{weekday('short').format(day)}</span>
                <span className="own:hidden own:tabular-nums own:md:inline">{dayNum.format(day)}</span>
              </span>
            )
          })}
          {handoffs.map((h) => (
            <span
              key={h.id}
              data-slot="time-lanes-handoff"
              className="absolute bottom-0 own:size-1.5 -translate-x-1/2 translate-y-1/2 rotate-45 own:bg-fg-muted rtl:translate-x-1/2"
              style={{ insetInlineStart: `${at(h.at) * 100}%` }}
            />
          ))}
        </div>

        <div data-slot="time-lanes-grid" className="relative">
          {ticks.map((t) => {
            const weekend = !hoursProp && [0, 6].includes(new Date(t0 + t).getDay())
            return (
              <span
                key={t}
                aria-hidden
                className={cn('absolute inset-y-0 border-s border-line-subtle', weekend && 'bg-transparent')}
                style={{ insetInlineStart: `${(t / span) * 100}%`, width: `${(tickStep / span) * 100}%` }}
              />
            )
          })}
          {handoffs.map((h) => (
            <span
              key={h.id}
              aria-hidden
              data-slot="time-lanes-baton"
              className="absolute own:-ms-px border-s border-dashed own:border-line-strong"
              style={{
                insetInlineStart: `${at(h.at) * 100}%`,
                top: `calc(var(--rota-lane) * ${Math.min(h.from, h.to)} + var(--rota-lane) / 2)`,
                height: `calc(var(--rota-lane) * ${Math.abs(h.to - h.from)})`,
              }}
            />
          ))}

          {lanes.map((lane, li) => (
            <div key={lane.id} role="group" aria-label={lane.name} data-slot="time-lanes-lane" className="relative own:h-(--rota-lane)">
              {byLane[li]!.map((s) => {
                const from = at(+s.start)
                const width = at(+s.end) - from
                const state = now === null ? 'upcoming' : +s.end <= now ? 'ended' : +s.start <= now && !s.proposed ? 'current' : 'upcoming'
                const next = s.proposed ? undefined : nextOf(s)
                const color = toneColor(shiftTone(s, lane, li))
                const name = labels.rotaShift(lane.name, time.format(s.start), time.format(s.end), !!s.override)
                return (
                  <Popover key={s.id}>
                    <PopoverTrigger
                      ref={(el: HTMLButtonElement | null) => void (el ? refs.current.set(s.id, el) : refs.current.delete(s.id))}
                      data-slot="time-lanes-shift"
                      data-shift-id={s.id}
                      data-state={state}
                      data-override={s.override || undefined}
                      data-proposed={s.proposed || undefined}
                      tabIndex={s.id === tabStop ? 0 : -1}
                      aria-label={[s.label, name, s.proposed && labels.proposed].filter(Boolean).join(', ')}
                      onFocus={() => setActive(s.id)}
                      className={cn(
                        'focus-ring absolute inset-y-2 min-w-1.5 overflow-hidden own:rounded-[min(var(--radius-md),0.375rem)] text-start transition-[opacity,box-shadow,background-color] yj-duration-fast ease-standard',
                        s.proposed
                          ? 'z-10 border-[1.5px] border-dashed own:border-[color-mix(in_oklab,var(--rota-tone)_80%,transparent)] own:bg-[color-mix(in_oklab,var(--rota-tone)_7%,var(--color-surface))] hover:bg-[color-mix(in_oklab,var(--rota-tone)_14%,var(--color-surface))]'
                          : s.override
                          ? cn(HATCH, 'z-10 border border-dashed own:border-[color-mix(in_oklab,var(--rota-tone)_75%,transparent)]')
                          : 'own:bg-[color-mix(in_oklab,var(--rota-tone)_26%,transparent)] shadow-[inset_2px_0_0_var(--rota-tone)] hover:bg-[color-mix(in_oklab,var(--rota-tone)_36%,transparent)] rtl:shadow-[inset_-2px_0_0_var(--rota-tone)]',
                        state === 'current' && !s.override && 'own:bg-[color-mix(in_oklab,var(--rota-tone)_44%,transparent)] ring-1 ring-(--rota-tone)',
                        state === 'ended' && 'opacity-70 hover:opacity-100',
                        'data-popup-open:ring-2 data-popup-open:ring-(--rota-tone)',
                      )}
                      style={{ '--rota-tone': color, insetInlineStart: `${from * 100}%`, width: `${width * 100}%` } as CSSProperties}
                    >
                      {s.label ? (
                        <span aria-hidden data-slot="time-lanes-label" className="own:flex min-w-0 items-center gap-1.5 px-2 own:font-mono own:text-ui-xs own:leading-none own:font-medium own:text-fg own:tabular-nums">
                          {s.proposed && <span className="size-1.5 shrink-0 rounded-full bg-(--rota-tone)" />}
                          <span className="truncate">{s.label}</span>
                        </span>
                      ) : (
                        <span aria-hidden className="own:hidden truncate px-2 own:font-mono own:text-ui-xs own:leading-none own:text-fg own:tabular-nums own:lg:block">
                          {width * span >= DAY * 0.6 ? hm.format(s.start) : null}
                        </span>
                      )}
                    </PopoverTrigger>
                    <PopoverContent data-slot="time-lanes-detail" side="top" className="w-64 gap-3">
                      <div className="own:flex items-start gap-3">
                        <span
                          aria-hidden
                          className="own:grid size-8 shrink-0 place-items-center rounded-full bg-[color-mix(in_oklab,var(--rota-tone)_22%,transparent)] own:font-mono own:text-ui-xs own:font-medium"
                          style={{ '--rota-tone': toneColor(tone(lane, li)) } as CSSProperties}
                        >
                          {lane.initials ?? initials(lane.name)}
                        </span>
                        <div className="own:flex min-w-0 flex-1 flex-col">
                          <span className="truncate own:text-ui own:font-medium own:text-fg">{s.label ? `${s.label} · ${lane.name}` : lane.name}</span>
                          {lane.detail && <span className="truncate own:text-ui-sm own:text-fg-muted">{lane.detail}</span>}
                        </div>
                        {s.proposed ? (
                          // shape: dashed, like the demo marker: a slot proposed, not booked
                          <Badge variant="outline" className="own:shrink-0 border-dashed own:border-accent-line own:text-accent-text">
                            {labels.proposed}
                          </Badge>
                        ) : (
                          <Badge variant={state === 'current' ? 'success' : 'secondary'} className="own:shrink-0">
                            {state === 'current' && <BadgeDot />}
                            {state === 'current' ? labels.rotaOnCall : state === 'ended' ? labels.rotaEnded : labels.rotaUpcoming}
                          </Badge>
                        )}
                      </div>
                      <p data-slot="time-lanes-when" className="own:flex flex-wrap items-baseline gap-x-2 own:font-mono own:text-ui-sm own:text-fg own:tabular-nums">
                        <span>{long.format(s.start)}</span>
                        <span aria-hidden className="own:text-fg-muted">
                          →
                        </span>
                        <span>{long.format(s.end)}</span>
                        <span className="own:ms-auto own:text-fg-muted">{hours.format((+s.end - +s.start) / 3_600_000)}</span>
                      </p>
                      {(s.override || s.note) && (
                        <p className="own:flex items-center gap-2 own:text-ui-sm own:text-fg-muted">
                          {s.override && <span aria-hidden className={cn('h-3 w-5 shrink-0 rounded-[2px]', HATCH)} style={{ '--rota-tone': toneColor(tone(lane, li)) } as CSSProperties} />}
                          <span>{[s.override && labels.rotaOverride, s.note].filter(Boolean).join(' · ')}</span>
                        </p>
                      )}
                      {next && <p className="own:text-ui-sm own:text-fg-muted">{labels.rotaHandoff(laneOf.get(next.lane)!.lane.name)}</p>}
                      {renderDetail?.(s, lane)}
                    </PopoverContent>
                  </Popover>
                )
              })}
            </div>
          ))}
        </div>
        <div aria-hidden className="h-6" />

        {now !== null && now >= t0 && now <= t0 + span && (
          <div
            aria-hidden
            data-slot="time-lanes-now"
            className="pointer-events-none absolute inset-0 z-20 transition-[translate] yj-duration-slow ease-standard reduced:transition-none"
            style={{ translate: `calc(${at(now)} * 100% * var(--rota-dir)) 0` }}
          >
            <span className="absolute start-0 top-7 bottom-5 w-0.5 -translate-x-1/2 rounded-full bg-accent shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-accent)_18%,transparent)] rtl:translate-x-1/2" />
            <span className="absolute start-0 bottom-0 -translate-x-1/2 rounded-full bg-accent px-1.5 own:font-mono own:text-ui-xs own:leading-4 own:font-medium own:text-on-accent own:tabular-nums rtl:translate-x-1/2">
              {hm.format(now)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export { TimeLanes, type RotaLane, type TimeLanesProps, type RotaShift, type RotaTone }
