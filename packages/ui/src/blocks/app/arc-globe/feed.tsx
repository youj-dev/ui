'use client'

import { useEffect, useRef } from 'react'
import { useYouj } from '@youj/core'
import { ArrowRightIcon } from '@youj/icons'
import type { ArcGlobeCopy, ArcGlobePlace, ArcGlobeRegion, ArcGlobeTone, ArcGlobeVisit } from './data'
import { cn } from '../../../lib/utils'

/* The latest visits as they land, newest first: the page, where the visitor
 * is and the site's region that served them, and the time it landed. A
 * conveyor: the track holds one more card than shows, and each landing
 * slides it along by one card (a single transform,
 * no layout read), so the new card enters at the start and the oldest runs
 * off the end under the clip. It isn't a live region: it moves too often to
 * be spoken, and Pause stops it. Reduced motion: the cards change in place. */

const DOT: Record<ArcGlobeTone, string> = {
  'chart-1': 'bg-chart-1',
  'chart-2': 'bg-chart-2',
  'chart-3': 'bg-chart-3',
  'chart-4': 'bg-chart-4',
  'chart-5': 'bg-chart-5',
}

/** `n` cards' pitch along the track (their width and gaps), toward the inline start. */
const pitch = (n: number) => `calc((100% + var(--spacing) * 2) / var(--cols) * var(--dir) * ${n})`

export function Feed({
  visits,
  places,
  regions,
  copy,
  time,
  labelId,
}: {
  visits: ArcGlobeVisit[]
  places: ArcGlobePlace[]
  regions: ArcGlobeRegion[]
  copy: ArcGlobeCopy
  time: Intl.DateTimeFormat
  labelId: string
}) {
  const k = useYouj()
  const track = useRef<HTMLOListElement>(null)
  const newest = visits[0]?.id
  const shown = useRef(newest)
  useEffect(() => {
    const el = track.current
    const before = shown.current
    if (newest === before) return
    shown.current = newest
    if (!el?.animate || k.reduced || before === undefined) return
    // However many landed together, the track slides by that many cards and they fade in.
    const at = visits.findIndex((o) => o.id === before)
    const count = Math.min(5, at < 0 ? visits.length : at)
    const timing = { duration: k.ms('slow'), easing: `cubic-bezier(${k.ease('enter').join(',')})` } // youj-allow: the enter token's own curve, for a Web Animation
    el.animate([{ translate: pitch(count) }, { translate: '0' }], timing)
    for (const card of [...el.children].slice(0, count)) card.animate([{ opacity: 0 }, { opacity: 1 }], timing)
  }, [newest, visits, k])

  const byId = (id: string) => places.find((m) => m.id === id)
  if (!visits.length) return <p className="py-2 text-ui-sm text-fg-muted">{copy.waiting}</p>
  return (
    <div className="overflow-hidden [--cols:2] [--dir:-1] sm:[--cols:3] lg:[--cols:4] rtl:[--dir:1]">
      <ol
        ref={track}
        aria-labelledby={labelId}
        className="grid auto-cols-[calc((100%-(var(--cols)-1)*var(--spacing)*2)/var(--cols))] grid-flow-col gap-2"
      >
        {visits.slice(0, 5).map((visit) => {
          const from = byId(visit.from)
          const to = byId(visit.to)
          const tone = regions.find((r) => r.id === from?.region)?.tone ?? 'chart-1'
          return (
            <li key={visit.id} className="flex min-w-0 flex-col gap-1 rounded-md border border-line bg-surface px-3 py-2">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate font-mono text-ui font-medium">{visit.label}</span>
                <time
                  dateTime={new Date(visit.at).toISOString()}
                  className="font-mono text-ui-xs whitespace-nowrap text-fg-muted tabular-nums max-sm:hidden"
                >
                  {time.format(visit.at)}
                </time>
              </div>
              <div className="flex min-w-0 items-center gap-1.5 text-ui-sm text-fg-muted">
                <span aria-hidden className={cn('size-1.5 shrink-0 rounded-full', DOT[tone])} />
                <span className="flex min-w-0 items-center gap-1">
                  <span className="truncate">{from?.city}</span>
                  {to && (
                    <>
                      <ArrowRightIcon size={11} aria-hidden className="shrink-0 rtl:-scale-x-100" />
                      <span className="sr-only">{copy.via}</span>
                      <span className="shrink-0 font-mono text-ui-xs">{to.code ?? to.city}</span>
                    </>
                  )}
                </span>
                <span className="ms-auto shrink-0 text-ui-xs max-sm:hidden">{copy.units(visit.weight)}</span>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
