'use client'

import { useId, useMemo, useRef, useState, type ComponentProps, type CSSProperties, type FocusEvent, type KeyboardEvent } from 'react'
import { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip'
import { useInView } from 'motion/react'
import { historyStripLabels, useComponentLabels } from '@youj/core/labels'
import { useYouj, useLocale, useDirection } from '@youj/core/lib/youj/provider'
import { cn, dateTimeFormat, numberFormat, relativeTimeFormat } from '../../lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip'

/* Availability a day at a time: one slim cell per day, oldest at the inline
 * start, today at the end (so it reads right to left in RTL). A cell's color
 * is its uptime, mixed in the theme's status tokens: at or above `target` it
 * is the success tone; below it the color slides through warning, and below
 * `critical` on toward danger, so a bad day is as loud as it was bad. A day
 * without data is a dim well, and a day with an incident carries a pip.
 * - Detail: hover or focus a day for its date, uptime, downtime, incidents
 *   and note, in one tooltip that follows the pointer from cell to cell; the
 *   other days dim while you read one.
 * - Keyboard: one tab stop (today). Arrow keys step a day in the reading
 *   direction, Page Up and Page Down a week, Home and End go to the ends.
 * - Narrow: under about 28rem it keeps the latest 60 days, under 18rem the
 *   latest 30, so cells never thin past legibility (container queries).
 * - `size="sm"` is the mini strip for a list row, and `interactive={false}`
 *   draws it as decoration for a row that says the numbers itself.
 * - Semantics: a named group holding a list of days, each named with its
 *   date, uptime, downtime and incidents; a summary as its description.
 * - Motion: the cells rise from the baseline oldest to newest as the strip
 *   scrolls into view (the whole wave inside the deliberate token), and new
 *   data sweeps the colors across in the same order. A day in reading lifts
 *   2px on the fast token. Reduced motion: drawn in place; changes land at once. */

type UptimeTone = 'success' | 'warning' | 'danger' | 'none'

interface UptimeDay {
  /** The day: a Date, or an ISO date ("2026-09-12") read as a calendar day. */
  date: string | Date
  /** The share of the day the service was up, 0–1; `null` when there's no data for it. */
  uptime: number | null
  /** Incidents opened that day. */
  incidents?: number
  /** Minutes of downtime. Default: worked out from `uptime`. */
  downtimeMinutes?: number
  /** One line on what happened, for the tooltip and the spoken text. */
  note?: string
}

interface HistoryStripProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** One entry per day, oldest first; the last one is today. */
  days: readonly UptimeDay[]
  /** Days at or above this uptime are healthy. Default 0.999. */
  target?: number
  /** Days below this mix from warning toward danger. Default 0.99. */
  critical?: number
  /** `sm`: the mini strip for a list row: short cells, hairline gaps, no axis. Default 'default'. */
  size?: 'default' | 'sm'
  /** Focusable days with tooltips. `false` draws a decorative strip (hidden from assistive technology) for a row that speaks for itself. Default true. */
  interactive?: boolean
  /** Accessible name. Default: the labels' "Uptime". */
  label?: string
  /** Formats a day for the tooltip and the spoken text. Default: weekday, month and day in the locale. */
  formatDate?: (date: Date) => string
}

const DAY_MINUTES = 1440

/** Container-query classes: under the first width the strip keeps 60 days, under the second 30. Literal, so Tailwind sees them. */
const NARROW = {
  default: { older60: 'own:@max-[28rem]/uptime:hidden', older30: 'own:@max-[18rem]/uptime:hidden' },
  sm: { older60: 'own:@max-[20rem]/uptime:hidden', older30: 'own:@max-[13rem]/uptime:hidden' },
}
const AXIS_START = {
  all: 'own:@max-[28rem]/uptime:hidden',
  sixty: 'own:hidden own:@max-[28rem]/uptime:inline own:@max-[18rem]/uptime:hidden',
  thirty: 'own:hidden own:@max-[18rem]/uptime:inline',
}

/** An ISO date is a calendar day where the reader is, not midnight in UTC. */
function toDate(value: string | Date) {
  if (value instanceof Date) return value
  const day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  return day ? new Date(Number(day[1]), Number(day[2]) - 1, Number(day[3])) : new Date(value)
}

/** The day's tone and its color: success, then a slide through warning toward danger as uptime falls. */
function toneOf(uptime: number | null, target: number, critical: number): [UptimeTone, string] {
  if (uptime === null) return ['none', 'color-mix(in oklab, var(--color-fg) 11%, transparent)']
  if (uptime >= target) return ['success', 'var(--color-success)']
  if (uptime >= critical) {
    const t = (target - uptime) / Math.max(target - critical, 1e-9)
    return ['warning', `color-mix(in oklch, var(--color-warning) ${Math.round(45 + 55 * t)}%, var(--color-success))`]
  }
  // Full danger a few bands below critical (95.4% with the defaults).
  const floor = critical - (target - critical) * 4
  const t = Math.min(1, (critical - uptime) / Math.max(critical - floor, 1e-9))
  return ['danger', `color-mix(in oklch, var(--color-danger) ${Math.round(40 + 60 * t)}%, var(--color-warning))`]
}

const shown = (el: HTMLElement | undefined) => !!el && getComputedStyle(el).display !== 'none'

function HistoryStrip({
  days,
  target = 0.999,
  critical = 0.99,
  size = 'default',
  interactive = true,
  label,
  formatDate,
  className,
  ...props
}: HistoryStripProps) {
  const k = useYouj()
  const locale = useLocale()
  const labels = useComponentLabels(historyStripLabels)
  const direction = useDirection()
  const summaryId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const cellRefs = useRef<(HTMLElement | undefined)[]>([])
  const inView = useInView(rootRef, { once: true, amount: 0.3 })
  const risen = k.reduced || inView
  const [handle] = useState(() => TooltipPrimitive.createHandle<number>())
  const [focusIndex, setFocusIndex] = useState<number>()
  const [active, setActive] = useState<number | null>(null)

  const format = useMemo(() => {
    const percent = numberFormat(locale, { style: 'percent', maximumFractionDigits: 2 })
    const minutes = numberFormat(locale, { style: 'unit', unit: 'minute', unitDisplay: 'short' })
    const hours = numberFormat(locale, { style: 'unit', unit: 'hour', unitDisplay: 'short' })
    const day = dateTimeFormat(locale, { weekday: 'short', month: 'short', day: 'numeric' })
    return {
      // Rounded down, so a day with any downtime never reads as 100%.
      percent: (share: number) => percent.format(Math.floor(share * 10000) / 10000),
      duration: (m: number) => (m < 60 ? minutes.format(m) : m % 60 ? `${hours.format(Math.floor(m / 60))} ${minutes.format(m % 60)}` : hours.format(m / 60)),
      date: formatDate ?? ((date: Date) => day.format(date)),
      ago: relativeTimeFormat(locale, { numeric: 'auto' }),
    }
  }, [locale, formatDate])

  const model = useMemo(
    () =>
      days.map((day, i) => {
        const [tone, color] = toneOf(day.uptime, target, critical)
        const down = day.uptime === null ? 0 : Math.max(0, Math.round(day.downtimeMinutes ?? (1 - day.uptime) * DAY_MINUTES))
        const date = format.date(toDate(day.date))
        const spoken =
          day.uptime === null
            ? labels.uptimeNoData(date)
            : [
                labels.uptimeDay(date, format.percent(day.uptime)),
                down > 0 && labels.uptimeDowntime(format.duration(down)),
                // Spoken only when there were some; the tooltip says "No incidents" too.
                !!day.incidents && labels.uptimeIncidents(day.incidents),
              ]
                .filter(Boolean)
                .join(', ')
        return { day, tone, color, down, date, spoken: day.note ? `${spoken}. ${day.note}` : spoken, age: days.length - 1 - i }
      }),
    [days, target, critical, format, labels],
  )

  const count = model.length
  const measured = days.filter((d) => d.uptime !== null) as (UptimeDay & { uptime: number })[]
  const average = measured.length ? measured.reduce((sum, d) => sum + d.uptime, 0) / measured.length : null
  const affected = measured.filter((d) => d.uptime < 1).length
  const current = focusIndex !== undefined && focusIndex < count ? focusIndex : count - 1
  // The rise runs oldest to newest across half the deliberate token; each cell takes the base token.
  const step = k.reduced || count < 2 ? 0 : (k.ms('deliberate') * 0.5) / (count - 1)
  const narrow = NARROW[size]
  const sm = size === 'sm'

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // The cells lay out by the document's direction, so read it there first; the provider's is the fallback.
    const dir = event.currentTarget.closest('[dir]')?.getAttribute('dir')
    const rtl = dir ? dir === 'rtl' : direction === 'rtl'
    const visible = model.map((_, i) => i).filter((i) => shown(cellRefs.current[i]))
    const moves: Record<string, number> = { ArrowLeft: rtl ? 1 : -1, ArrowRight: rtl ? -1 : 1, PageUp: -7, PageDown: 7 }
    const at = Math.max(0, visible.indexOf(current))
    let next: number | undefined
    if (event.key === 'Home') next = visible[0]
    else if (event.key === 'End') next = visible.at(-1)
    else if (moves[event.key] !== undefined) next = visible[Math.min(visible.length - 1, Math.max(0, at + moves[event.key]!))]
    else return
    event.preventDefault()
    if (next === undefined || next === current) return
    setFocusIndex(next)
    cellRefs.current[next]?.focus()
  }
  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setActive(null)
  }

  const cells = model.map((m, i) => {
    const reading = interactive && active !== null
    const classes = cn(
      'relative own:flex h-full min-w-0 flex-1 flex-col',
      !sm && 'gap-1',
      m.age >= 60 ? narrow.older60 : m.age >= 30 && narrow.older30,
      interactive && [
        'cursor-default outline-none focus-ring focus-visible:z-10 transition-[translate,opacity] yj-duration-fast ease-standard',
        reading && active !== i && 'opacity-45',
        active === i && '-translate-y-0.5',
      ],
    )
    const style = { '--uptime-color': m.color } as CSSProperties
    const parts = (
      <>
        {!sm && (
          <span data-slot="history-strip-pip-slot" aria-hidden className="own:flex h-1 shrink-0 justify-center">
            {!!m.day.incidents && <span data-slot="history-strip-pip" className="size-1 shrink-0 own:rounded-full bg-(--uptime-color)" />}
          </span>
        )}
        <span
          data-slot="history-strip-bar"
          aria-hidden
          className={cn(
            'own:block min-h-0 flex-1 origin-bottom bg-(--uptime-color)',
            sm ? 'own:rounded-[min(var(--radius-xs),1px)]' : 'own:rounded-[min(var(--radius-xs),2px)]',
            'transition-[scale,opacity,background-color] yj-duration-base ease-enter',
            risen ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0',
          )}
          style={step ? { transitionDelay: `${Math.round(i * step)}ms` } : undefined}
        />
      </>
    )
    const ref = (el: HTMLElement | null) => {
      cellRefs.current[i] = el ?? undefined
    }
    if (!interactive) {
      return (
        <span key={i} ref={ref} data-slot="history-strip-cell" data-tone={m.tone} className={classes} style={style}>
          {parts}
        </span>
      )
    }
    return (
      <TooltipTrigger
        key={i}
        handle={handle}
        payload={i}
        delay={0}
        closeDelay={0}
        render={
          <div
            ref={ref}
            role="listitem"
            tabIndex={i === current ? 0 : -1}
            aria-label={m.spoken}
            data-slot="history-strip-cell"
            data-tone={m.tone}
            data-active={active === i || undefined}
            onFocus={() => {
              setFocusIndex(i)
              setActive(i)
            }}
            onPointerEnter={() => setActive(i)}
            className={classes}
            style={style}
          />
        }
      >
        {parts}
      </TooltipTrigger>
    )
  })

  const reading = active !== null ? model[active] : undefined
  return (
    <div
      ref={rootRef}
      role={interactive ? 'group' : undefined}
      aria-label={interactive ? (label ?? labels.uptime) : undefined}
      aria-describedby={interactive && average !== null ? summaryId : undefined}
      aria-hidden={interactive ? undefined : true}
      data-slot="history-strip"
      data-size={size}
      data-reading={reading ? '' : undefined}
      data-reduced-motion={k.reduced || undefined}
      className={cn('@container/uptime own:flex w-full min-w-0 flex-col', className)}
      {...props}
    >
      <div
        role={interactive && count ? 'list' : undefined}
        data-slot="history-strip-list"
        onKeyDown={interactive ? onKeyDown : undefined}
        onPointerLeave={interactive ? () => setActive(null) : undefined}
        onBlur={interactive ? onBlur : undefined}
        className={cn('own:flex w-full', sm ? 'h-3.5 gap-px' : 'h-10 gap-0.5', !count && 'own:rounded-xs border border-dashed border-line')}
      >
        {cells}
      </div>
      {!sm && count > 0 && (
        <div data-slot="history-strip-axis" aria-hidden className="mt-2.5 own:flex items-center gap-3 own:font-mono own:text-ui-xs text-fg-muted own:tabular-nums">
          <span data-slot="history-strip-axis-start" className="shrink-0">
            {/* The oldest day shown: all of them, or the latest 60 or 30 in a narrow strip. */}
            <span className={count > 60 ? AXIS_START.all : count > 30 ? NARROW.default.older30 : undefined}>{format.ago.format(-(count - 1), 'day')}</span>
            {count > 60 && <span className={AXIS_START.sixty}>{format.ago.format(-59, 'day')}</span>}
            {count > 30 && <span className={AXIS_START.thirty}>{format.ago.format(-29, 'day')}</span>}
          </span>
          <span data-slot="history-strip-axis-rule" className="h-px min-w-4 flex-1 bg-line" />
          <span data-slot="history-strip-axis-end" className="shrink-0">
            {labels.today}
          </span>
        </div>
      )}
      {interactive && average !== null && (
        <p id={summaryId} data-slot="history-strip-summary" className="sr-only">
          {labels.uptimeSummary(count, format.percent(average), affected)}
        </p>
      )}
      {interactive && (
        <Tooltip handle={handle}>
          {({ payload }) => {
            const m = model[payload as number]
            if (!m) return null
            return (
              <TooltipContent data-slot="history-strip-tooltip" className="flex-col items-start gap-0.5 own:py-1.5">
                {m.day.uptime === null ? (
                  <span data-slot="history-strip-tooltip-date">{labels.uptimeNoData(m.date)}</span>
                ) : (
                  <>
                    <span data-slot="history-strip-tooltip-date">{m.date}</span>
                    <span data-slot="history-strip-tooltip-value" className="own:flex items-center gap-1.5 own:font-normal">
                      <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-(--uptime-color)" style={{ '--uptime-color': m.color } as CSSProperties} />
                      <span className="own:font-mono own:tabular-nums">{format.percent(m.day.uptime)}</span>
                      {m.down > 0 && <span className="opacity-75">· {labels.uptimeDowntime(format.duration(m.down))}</span>}
                    </span>
                    {m.day.incidents !== undefined && (
                      <span data-slot="history-strip-tooltip-incidents" className="own:font-normal opacity-75">
                        {labels.uptimeIncidents(m.day.incidents)}
                      </span>
                    )}
                  </>
                )}
                {m.day.note && (
                  <span data-slot="history-strip-tooltip-note" className="own:font-normal opacity-75">
                    {m.day.note}
                  </span>
                )}
              </TooltipContent>
            )
          }}
        </Tooltip>
      )}
    </div>
  )
}

export { HistoryStrip, type UptimeDay, type HistoryStripProps, type UptimeTone }
