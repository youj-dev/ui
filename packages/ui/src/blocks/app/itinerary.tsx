'use client'

import { useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { MoreHorizontalIcon, PlaneIcon, PlusIcon, ShareIcon } from '@youj/icons'
import { Button } from '../../components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import { Skeleton } from '../../components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { useAnnouncer } from '../../hooks/use-announcer'
import { useVisible } from '../../hooks/use-visible'
import { cn } from '../../lib/utils'
import {
  BOOKINGS,
  DAYS,
  DEFAULT_COPY,
  KINDS,
  LEGS,
  NOW,
  START,
  STATUSES,
  STAYS,
  STOPS,
  localFormat,
  type ItineraryBooking,
  type ItineraryBookingKind,
  type ItineraryBookingStatus,
  type ItineraryCopy,
  type ItineraryLeg,
  type ItineraryStay,
  type ItineraryStop,
  type ItineraryTone,
} from './itinerary/data'
import { DayPlans } from './itinerary/day-plans'
import { NextLeg } from './itinerary/next-leg'
import { ItineraryEmpty, ItineraryError, ItineraryLoading } from './itinerary/states'

/* A trip, a conference week or a shoot, the way a travel app keeps it: the
 * next leg as a boarding pass (codes, local times, its length, a countdown to
 * departure and then to arrival, the plane riding the route line while under
 * way, and the booking reference to copy), then the days as a strip of
 * dates, each with the place it's spent in (a plane marks a travel day), and
 * under it the picked day: where you sleep that night and its bookings in
 * time order on a quiet thread, each with its confirmation code to copy.
 * What a booking can be (`kinds`, each with an icon) and where it stands
 * (`statuses`, each with a tone and whether it's done) are data. Loading, an
 * error with Retry and a trip with nothing in it take the body's place at its
 * size.
 * The clock starts at `now` and runs in real time while the card is on
 * screen. Motion: the day key glides between days and the day's plans morph
 * in (Tabs); the plane glides as the clock ticks. Reduced motion: the key
 * and the plane jump, the panel swaps at once.
 * It is built for the compact layout density (ui.css), taken from the page; embedded,
 * it stops at its natural width, as it does on its own, unless `fill`. */

const DAY = 86_400_000
const TONES: ItineraryTone[] = ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5']
const DOT: Record<ItineraryTone, string> = { 'chart-1': 'bg-chart-1', 'chart-2': 'bg-chart-2', 'chart-3': 'bg-chart-3', 'chart-4': 'bg-chart-4', 'chart-5': 'bg-chart-5' }

interface ItineraryProps extends Omit<ComponentProps<'section'>, 'children'> {
  /** Wraps the block in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (832px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<ItineraryCopy>
  /** How its dates, times and numbers read (BCP 47). Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** The places on the trip, the first where it starts. */
  stops?: ItineraryStop[]
  /** The ways between them; the next one to leave is the pass. */
  legs?: ItineraryLeg[]
  /** Where you sleep. */
  stays?: ItineraryStay[]
  /** Each day's plans. */
  bookings?: ItineraryBooking[]
  /** The sorts of booking, each with its icon. Default: flight, stay, ticket, table. */
  kinds?: ItineraryBookingKind[]
  /** Where a booking can stand, each with a tone (a badge) and whether it's done. Default: checked in, confirmed, check-in opens soon, done. */
  statuses?: ItineraryBookingStatus[]
  /** The first day's midnight, at the first stop. */
  start?: number
  days?: number
  /** Where the clock starts; it then runs in real time. Default: day 2, mid-afternoon. */
  now?: number
  /** The day shown, from 0. Controlled. */
  day?: number
  /** The day shown first. Default: today, if the trip is under way, else the first day. */
  defaultDay?: number
  onDayChange?: (day: number) => void
  /** Skeletons in place of the pass and the days while your trip loads. Default false. */
  loading?: boolean
  /** Shown in place of the pass and the days when they fail to load, with Retry when `onRetry` is set. */
  error?: string
  /** Retries after an `error`. */
  onRetry?: () => void
  /** Replaces the message when the trip has nothing in it. Default: `copy.emptyTitle` and `copy.emptyDescription`. */
  empty?: ReactNode
}

function Itinerary({
  theme,
  embedded = true,
  fill = false,
  copy: copyProp,
  locale,
  stops = STOPS,
  legs = LEGS,
  stays = STAYS,
  bookings = BOOKINGS,
  kinds = KINDS,
  statuses = STATUSES,
  start = START,
  days = DAYS,
  now: startAt = NOW,
  day,
  defaultDay,
  onDayChange,
  loading = false,
  error,
  onRetry,
  empty,
  className,
  ...rest
}: ItineraryProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp, locale: useLocale(locale ?? copyProp?.locale) }
  const titleId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const { announce, announcer } = useAnnouncer()
  const root = useRef<HTMLElement>(null)
  const visible = useVisible(root)
  const [now, setNow] = useState(startAt)
  useEffect(() => {
    if (!visible) return
    const id = setInterval(() => setNow((t) => t + 1000), 1000)
    return () => clearInterval(id)
  }, [visible])

  const ordered = [...legs].sort((a, b) => +a.depart - +b.depart)
  const next = ordered.find((l) => +l.arrive > now)
  const home = stops[0]?.utcOffset ?? 0
  const stopOf = (id?: string) => stops.find((s) => s.id === id)
  const toneOf = (id?: string) => {
    const i = stops.findIndex((s) => s.id === id)
    return stops[i]?.tone ?? TONES[Math.max(0, i) % TONES.length]!
  }
  const today = now >= start && now < start + days * DAY ? Math.floor((now - start) / DAY) : undefined

  // A day's facts: the stay that night, else where its last leg lands, else the trip's first stop; and whether a flight leaves that day.
  const dayOf = (d: number) => {
    const from = start + d * DAY
    const night = from + 22 * 3_600_000
    const stay = stays.find((s) => +s.start <= night && night < +s.end)
    const at = stay?.at ?? [...ordered].reverse().find((l) => +l.arrive <= night)?.to ?? stops[0]?.id
    const flies = ordered.some((l) => +l.depart >= from && +l.depart < from + DAY)
    const nights = stay ? Math.max(1, Math.round((+stay.end - +stay.start) / DAY)) : 0
    const tonight = stay ? copy.tonight(stay.name, Math.floor((night - +stay.start) / DAY) + 1, nights) : undefined
    return { at, place: stopOf(at)?.name, flies, tonight }
  }

  const weekday = localFormat(copy.locale, { weekday: 'short' })
  const dayNum = localFormat(copy.locale, { day: 'numeric' })
  const dateLong = localFormat(copy.locale, { weekday: 'long', day: 'numeric', month: 'long' })
  const dates = localFormat(copy.locale, { day: 'numeric', month: 'short' }).range(start + DAY / 2, start + (days - 0.5) * DAY, home)

  // Its natural width: on the card on its own page, on the section embedded (where a className can change it).
  const cap = !fill && 'max-w-208'
  const card = (
    <Card className={cn('w-full text-fg', !embedded && cap)}>
      <CardHeader>
        <CardTitle>
          <Title id={titleId}>{copy.title}</Title>
        </CardTitle>
        <CardDescription className="tabular-nums">
          {loading ? <Skeleton className="inline-block h-4 w-40 align-middle" /> : error ? '—' : copy.subtitle(dates, days)}
        </CardDescription>
        <CardAction>
          <Button variant="ghost" size="icon-sm" aria-label={copy.more}>
            <MoreHorizontalIcon size={16} />
          </Button>
        </CardAction>
      </CardHeader>

      {loading ? (
        <ItineraryLoading copy={copy} />
      ) : error ? (
        <ItineraryError message={error} onRetry={onRetry} copy={copy} />
      ) : legs.length === 0 && stays.length === 0 && bookings.length === 0 ? (
        <ItineraryEmpty empty={empty} copy={copy} />
      ) : (
        <>
      <CardContent role="group" aria-label={next && now >= +next.depart ? copy.underway : copy.next}>
        <NextLeg leg={next} stops={stops} now={now} copy={copy} onCopied={(code) => announce(copy.copied(code))} />
      </CardContent>

      <CardContent>
        <Tabs
          value={day}
          defaultValue={defaultDay ?? today ?? 0}
          onValueChange={(v) => onDayChange?.(Number(v))}
          className="flex flex-col gap-5"
        >
          <TabsList variant="pill" aria-label={copy.days} className="h-auto w-full">
            {Array.from({ length: days }, (_, d) => {
              const t = start + d * DAY + DAY / 2
              const { at, place, flies } = dayOf(d)
              return (
                <TabsTrigger
                  key={d}
                  value={d}
                  data-yj-today={d === today || undefined}
                  aria-label={[copy.plans(d + 1), dateLong.format(t, home), d === today && copy.today, place && (flies ? copy.travelTo(place) : place)].filter(Boolean).join(', ')}
                  className="h-auto min-w-11 flex-1 flex-col items-stretch justify-start gap-1 px-2 py-2 text-start sm:px-2.5"
                >
                  <span className="flex items-center gap-1.5 text-ui-xs text-fg-muted">
                    {/* Narrow, the dot alone says today: the word won't fit a column. */}
                    <span className={cn(d === today && 'sm:hidden')}>{weekday.format(t, home)}</span>
                    {d === today && <span className="hidden sm:inline">{copy.today}</span>}
                    {d === today && <span className="size-1.5 rounded-full bg-accent" />}
                  </span>
                  <span className="font-mono text-xl leading-none text-fg tabular-nums">{dayNum.format(t, home)}</span>
                  <span className="flex h-4 min-w-0 items-center gap-1.5 text-ui-xs font-normal text-fg-muted">
                    {flies ? <PlaneIcon size={11} className="shrink-0 rtl:-scale-x-100" /> : <span className={cn('size-1.5 shrink-0 rounded-full', DOT[toneOf(at)])} />}
                    <span className="hidden truncate sm:inline">{place}</span>
                  </span>
                </TabsTrigger>
              )
            })}
          </TabsList>
          {Array.from({ length: days }, (_, d) => {
            const { place, tonight } = dayOf(d)
            return (
              // The busiest day's room at 100%: switching days never resizes the card.
              <TabsContent key={d} value={d} className="h-49 flex-none overflow-y-auto yj-scrollbar">
                <DayPlans
                  date={dateLong.format(start + d * DAY + DAY / 2, home)}
                  place={place}
                  tonight={tonight}
                  bookings={bookings.filter((b) => b.day === d).sort((a, b) => a.time.localeCompare(b.time))}
                  kinds={kinds}
                  statuses={statuses}
                  copy={copy}
                  heading={embedded ? 'h3' : 'h2'}
                  onCopied={(code) => announce(copy.copied(code))}
                />
              </TabsContent>
            )
          })}
        </Tabs>
      </CardContent>
        </>
      )}

      <CardFooter className="flex-wrap justify-end">
        <span className="me-auto basis-full text-ui-sm text-fg-muted sm:basis-auto">{copy.footer}</span>
        <Button variant="secondary">
          <ShareIcon size={14} />
          {copy.share}
        </Button>
        <Button>
          <PlusIcon size={14} />
          {copy.addPlan}
        </Button>
      </CardFooter>
      {announcer}
    </Card>
  )

  const view = embedded ? (
    <section ref={root} aria-labelledby={titleId} {...rest} className={cn('w-full', cap, className)}>
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
  Itinerary,
  type ItineraryProps,
  type ItineraryCopy,
  type ItineraryStop,
  type ItineraryLeg,
  type ItineraryStay,
  type ItineraryBooking,
  type ItineraryBookingKind,
  type ItineraryBookingStatus,
  type ItineraryTone,
}
