'use client'

import { dateTimeFormat, toneColor } from '../../../lib/utils'
import type { CauseLogCause, CauseLogCopy, CauseLogEntry } from './data'
import { busiestSources, entryMarks, windowTicks, zoneOffset } from './layout'

/* The last 24 hours, one row per source: each entry is a mark at its place in
 * the day, in its cause's color, and a line at the right edge is now. A mark
 * is as wide as the entry was long (never under 2px). The rows are one image
 * each with a text alternative; the table above is the readable record. */

interface TimelineProps {
  entries: CauseLogEntry[]
  causes: CauseLogCause[]
  /** The entries the table has ticked: they stay lit and the rest recede. */
  selected: ReadonlySet<string>
  now: number
  locale: string
  timeZone?: string
  format: (duration: number) => string
  copy: CauseLogCopy
}

export function Timeline({ entries, causes, selected, now, locale, timeZone, format, copy }: TimelineProps) {
  const marks = entryMarks(entries, now)
  const sources = busiestSources(marks)
  const byId = new Map(entries.map((e) => [e.id, e]))
  const toneOf = (cause: string) => toneColor(causes.find((c) => c.id === cause)?.tone ?? 'neutral')
  const hour = dateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone })
  const dim = selected.size > 0

  return (
    <div data-slot="cause-log-timeline" className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between text-ui-sm text-fg-muted">
        <span>{copy.lastDay}</span>
        <span className="tabular-nums">
          {copy.now} {hour.format(now)}
        </span>
      </div>
      <div className="grid grid-cols-[--spacing(14)_minmax(0,1fr)] items-center gap-x-3 gap-y-2.5">
        {sources.map((source) => {
          const own = marks.filter((m) => m.source === source)
          const total = own.reduce((sum, m) => sum + (byId.get(m.id)?.duration ?? 0), 0)
          return (
            <div key={source} className="contents">
              <span className="truncate text-ui font-medium tabular-nums">{source}</span>
              <div role="img" aria-label={copy.timelineLabel(source, own.length, copy.duration(format(total)))} className="relative h-4 border-b border-line">
                {own.map((mark) => {
                  const entry = byId.get(mark.id)
                  const lit = !dim || selected.has(mark.id)
                  return (
                    <span
                      key={mark.id}
                      className="absolute inset-y-0.5 min-w-0.5 transition-opacity yj-duration-fast ease-standard"
                      style={{ insetInlineStart: `${mark.left}%`, width: `${mark.width}%`, background: toneOf(entry?.cause ?? ''), opacity: lit ? 1 : 0.3 }}
                    />
                  )
                })}
                <span aria-hidden className="absolute inset-y-0 end-0 w-px bg-fg" />
              </div>
            </div>
          )
        })}
        <span aria-hidden />
        <div aria-hidden className="relative h-4 text-ui-xs text-fg-subtle tabular-nums">
          {windowTicks(now, 24, 6, zoneOffset(now, timeZone)).map((tick) => (
            <span key={tick.at} className="absolute top-0 -translate-x-1/2 rtl:translate-x-1/2" style={{ insetInlineStart: `${tick.position}%` }}>
              {hour.format(tick.at)}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
