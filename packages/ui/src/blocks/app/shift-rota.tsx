'use client'

import { memo, useCallback, useId, useLayoutEffect, useMemo, useRef, useState, type ComponentProps, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { MoreHorizontalIcon } from '@youj/icons'
import { Button } from '../../components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import { Hatch } from '../../components/ui/hatched-bar'
import { TimeLanes } from '../../components/ui/time-lanes'
import { Eyebrow } from '../../components/ui/typography'
import { useAnnouncer } from '../../hooks/use-announcer'
import { useVisible } from '../../hooks/use-visible'
import { cn, dateTimeFormat } from '../../lib/utils'
import { Clock, useClockNow } from './shift-rota/clock'
import { CurrentCard } from './shift-rota/current-card'
import { DEFAULT_COPY, NOW, PEOPLE, SHIFTS, WEEK, demo, type ShiftRotaCopy, type ShiftRotaPerson, type ShiftRotaShift } from './shift-rota/data'

/* A week of shifts as an instrument: who is on shift now, with the time
 * left on their shift counting down in mono, one cell per hour of it, who's
 * next, and Swap (hand the rest of the shift to a teammate, drawn as a
 * hatched override) and a contact button (Page, in your words). Under it the week in TimeLanes: a lane per
 * person in the chart colors, 09:00 handoffs as dashed batons, overrides
 * hatched, and now as a line in the accent. Arrow keys walk the shifts and
 * Enter opens one's detail. Swap the demo `wait` with `onContact`; every string is in `copy`. It is built
 * for the compact layout density (ui.css), taken from the page; embedded, it keeps
 * its natural width unless `fill`. Reduced motion: the line and the cells move
 * in place. */

interface ShiftRotaProps extends Omit<ComponentProps<'section'>, 'children' | 'title'> {
  /** Wraps the block in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (832px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<ShiftRotaCopy>
  people?: ShiftRotaPerson[]
  shifts?: ShiftRotaShift[]
  /** The first day shown. Default: the demo week. */
  week?: number
  /** Where the clock starts; it then runs in real time. Default: the demo's Wednesday afternoon. */
  now?: number
  /** Reaches whoever is on shift now (the button reads `copy.contact`); resolve when it's sent. Default: a short demo wait. */
  onContact?: (person: ShiftRotaPerson) => Promise<unknown> | unknown
  /** Formats its numbers and dates (BCP 47). Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
}

const MINUTE = 60_000

/* The week's lanes move their now-line a pixel in about twelve minutes, so they
 * take the time by the minute: a tick between two minutes leaves them alone. */
const Lanes = memo(function Lanes({ people, shifts, week, minute, copy }: { people: ShiftRotaPerson[]; shifts: ShiftRotaShift[]; week: number; minute: number; copy: ShiftRotaCopy & { locale: string } }) {
  return <TimeLanes lanes={people} shifts={shifts} start={week} now={minute} locale={copy.locale} label={copy.rota} />
})

interface RotaProps {
  people: ShiftRotaPerson[]
  shifts: ShiftRotaShift[]
  week: number
  copy: ShiftRotaCopy & { locale: string }
  legend: ReactNode
  onSwap: (lane: string, now: number, current: ShiftRotaShift) => void
  onContact: (person: ShiftRotaPerson) => unknown
}

/* What reads the clock: the shift on call, and the week's lanes. A tick re-renders this
 * and the countdown inside the current card; the card, its header and the legend wait. */
function Rota({ people, shifts, week, copy, legend, onSwap, onContact }: RotaProps) {
  const now = useClockNow()
  // The override wins over the shift it covers.
  const current = shifts.filter((s) => +s.start <= now && now < +s.end).sort((a, b) => Number(!!b.override) - Number(!!a.override))[0]
  const upcoming = current && shifts.find((s) => !s.override && s.lane !== current.lane && +s.start === +current.end)
  const laneOf = (id: string) => people.find((p) => p.id === id)!
  const lane = current && laneOf(current.lane)
  const tone = current && `var(--color-chart-${(people.findIndex((p) => p.id === current.lane) % 5) + 1})`
  const next = useMemo(() => upcoming && { lane: people.find((p) => p.id === upcoming.lane)!, shift: upcoming }, [upcoming, people])
  // The card is memoised, so what it is given must keep its identity from one tick to the next.
  const fresh = useRef({ now, current, lane, onSwap, onContact })
  useLayoutEffect(() => {
    fresh.current = { now, current, lane, onSwap, onContact }
  })
  const swapWith = useCallback((id: string) => fresh.current.current && fresh.current.onSwap(id, fresh.current.now, fresh.current.current), [])
  const page = useCallback(() => fresh.current.lane && fresh.current.onContact(fresh.current.lane), [])

  return (
    <>
      {current && lane && tone && (
        <CardContent role="group" aria-label={copy.current}>
          <CurrentCard lane={lane} shift={current} tone={tone} next={next} people={people} copy={copy} onSwap={swapWith} onContact={page} />
        </CardContent>
      )}

      <CardContent className="flex flex-col gap-4">
        {legend}
        <Lanes people={people} shifts={shifts} week={week} minute={Math.floor(now / MINUTE) * MINUTE} copy={copy} />
      </CardContent>
    </>
  )
}

function ShiftRota({ theme, embedded = true, fill = false, copy: copyProp, people = PEOPLE, shifts: initial = SHIFTS, week = WEEK, now: start = NOW, onContact, locale, className, ...rest }: ShiftRotaProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp, locale: useLocale(locale ?? copyProp?.locale) }
  const titleId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const { announce, announcer } = useAnnouncer()
  const [shifts, setShifts] = useState(initial)
  const root = useRef<HTMLElement>(null)
  const visible = useVisible(root)

  const laneOf = (id: string) => people.find((p) => p.id === id)!
  const hm = dateTimeFormat(copy.locale, { weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })

  const swap = (lane: string, now: number, current: ShiftRotaShift) => {
    const from = laneOf(current.lane)
    setShifts((list) => [...list, { id: `swap-${now}`, lane, start: now, end: current.end, override: true, note: copy.covering(from.name) }])
    announce(copy.swapped(laneOf(lane).name, hm.format(current.end)))
  }

  const legend = (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <Eyebrow>{copy.rota}</Eyebrow>
      <ul aria-hidden className="flex items-center gap-4 text-ui-sm text-fg-muted">
        <li className="flex items-center gap-1.5">
          <span className="h-3 w-0.5 rounded-full bg-accent" />
          {copy.legendNow}
        </li>
        <li className="flex items-center gap-1.5">
          <span className="size-1.5 rotate-45 bg-fg-muted" />
          {copy.legendHandoff}
        </li>
        <li className="flex items-center gap-1.5">
          <Hatch tone="chart-2" className="h-3 w-5" />
          {copy.legendOverride}
        </li>
      </ul>
    </div>
  )

  const card = (
    <Card className={cn('w-full text-fg', !embedded && !fill && 'max-w-208')}>
      <CardHeader>
        <CardTitle>
          <Title id={titleId}>{copy.title}</Title>
        </CardTitle>
        <CardDescription>{copy.subtitle}</CardDescription>
        <CardAction>
          <Button variant="ghost" size="icon-sm" aria-label={copy.more}>
            <MoreHorizontalIcon size={16} />
          </Button>
        </CardAction>
      </CardHeader>

      <Clock start={start} active={visible}>
        <Rota people={people} shifts={shifts} week={week} copy={copy} legend={legend} onSwap={swap} onContact={(person) => (onContact ? onContact(person) : demo('ShiftRota: onContact', 1200))} />
      </Clock>

      <CardFooter className="flex-wrap justify-end">
        <span className="me-auto text-ui-sm text-fg-muted">{copy.status}</span>
        <Button variant="secondary">{copy.schedule}</Button>
      </CardFooter>
      {announcer}
    </Card>
  )

  const view = embedded ? (
    <section ref={root} aria-labelledby={titleId} {...rest} className={cn('w-full', !fill && 'max-w-208', className)}>
      {card}
    </section>
  ) : (
    <main ref={root} aria-labelledby={titleId} {...rest} className={cn('grid min-h-dvh w-full grid-cols-[minmax(0,1fr)] place-items-center bg-canvas px-4 py-10 text-fg', className)}>
      {card}
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { ShiftRota, type ShiftRotaProps }
