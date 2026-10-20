'use client'

import { useId, type ComponentProps, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { MoreHorizontalIcon } from '@youj/icons'
import { Button } from '../../components/ui/button'
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import type { SlotGridSlot } from '../../components/ui/slot-grid'
import { useAnnouncer } from '../../hooks/use-announcer'
import { availability, DEFAULT_COPY, OPENS, PASS, SERVICES, timetable, WEEK, type SlotBookingCopy, type SlotBookingPass, type SlotBookingService, type SlotBookingSlot } from './slot-booking/data'
import { MonthView } from './slot-booking/month-view'
import { SlotBookingEmpty, SlotBookingError, SlotBookingLoading } from './slot-booking/states'
import { WeekView } from './slot-booking/week-view'
import { cn, numberFormat } from '../../lib/utils'

/* A timetable of bookable slots, booked the calm way. By default a month Calendar
 * sits beside the chosen day: open days wear a soft wash of the accent, days
 * holding your bookings a small dot. The day's slots rise in on a tight
 * Stagger, one quiet row a slot: the time and its length, the service and its
 * host behind a thin line of the service's color, and the places left in
 * words, warm when only a few remain. A SegmentedControl narrows the month to
 * one service, and a day without one offers the next day that has it. Picking a
 * slot turns the pane into its review (what, when, who, duration, price,
 * places and the pass it draws on, with Change and Book); Book is an
 * async Button that settles into a drawn check and the confirmation, and
 * Change returns focus to the row you came from. Services with no price show
 * none, and `pass={null}` drops the pass.
 *
 * `variant="grid"` keeps the studio grid instead: the week as a SlotGrid of
 * pips, a column a day and a row a start time, with the pick springing into a
 * confirm well; under 36rem it shows one day at a time.
 *
 * Swap the demo timetable (`schedule`, or `slots` for the grid) and wait
 * for your scheduling API through `onBook`. Loading, an error with Retry and
 * an empty timetable take the body's place at its size. Reduced motion: rows,
 * panes and the well change in place.
 * It is built for the compact layout density (ui.css), taken from the page; embedded,
 * it stops at its natural width, as it does on its own, unless `fill`. */

interface SlotBookingProps extends Omit<ComponentProps<'section'>, 'children'> {
  /** Wraps the block in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (896px at 100% scale, 960px as the grid). Default false. */
  fill?: boolean
  /** `calendar`: a month and the chosen day's slots. `grid`: the week as a SlotGrid. Default `calendar`. */
  variant?: 'calendar' | 'grid'
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<SlotBookingCopy>
  /** How its dates, times and numbers read (BCP 47). Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** What can be booked, in the track's order. */
  services?: SlotBookingService[]
  /** Calendar: the slots on a day (local midnight). Default: the demo's timetable. */
  schedule?: (day: number, services: SlotBookingService[]) => SlotBookingSlot[]
  /** Calendar: the first bookable day (local midnight); five weeks from it are open. Default: the demo's. */
  from?: number
  /** Grid: a service's slots for the week starting at `week`. Default: the demo's availability. */
  slots?: (service: SlotBookingService, week: number) => SlotGridSlot[]
  /** Grid: the first week shown (a Monday at midnight). Default: the demo week. */
  week?: number
  /** What a booking draws on (a pass or credit), counted down as you book. `null` for none: no meter, no top-up. Default: the demo's class pass. */
  pass?: SlotBookingPass | null
  /** Formats a service's price. Default: the locale's currency format in `copy.currency`. */
  format?: (price: number) => string
  /** Books a slot; resolve when it's confirmed. Default: a short demo wait. */
  onBook?: (slot: SlotGridSlot, service: SlotBookingService) => Promise<unknown> | unknown
  /** Skeletons in place of the body while your timetable loads. Default false. */
  loading?: boolean
  /** Shown in place of the body when it fails to load, with Retry when `onRetry` is set. */
  error?: string
  /** Retries after an `error`. */
  onRetry?: () => void
  /** Replaces the message when there is nothing to book. Default: `copy.emptyTitle` and `copy.emptyDescription`. */
  empty?: ReactNode
}

function SlotBooking({
  theme,
  embedded = true,
  fill = false,
  variant = 'calendar',
  copy: copyProp,
  locale,
  services = SERVICES,
  schedule = timetable,
  from = OPENS,
  slots = availability,
  week = WEEK,
  pass = PASS,
  format,
  onBook,
  loading = false,
  error,
  onRetry,
  empty,
  className,
  ...rest
}: SlotBookingProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp, locale: useLocale(locale ?? copyProp?.locale) }
  const formatPrice = format ?? numberFormat(copy.locale, { style: 'currency', currency: copy.currency }).format
  const titleId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const { announce, announcer } = useAnnouncer()
  // Its natural width: on the card on its own page, on the section embedded (where a className can change it).
  const cap = !fill && (variant === 'grid' ? 'max-w-240' : 'max-w-224')

  const card = (
    <Card className={cn('w-full text-fg', !embedded && cap)}>
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

      {loading ? (
        <SlotBookingLoading variant={variant} copy={copy} />
      ) : error ? (
        <SlotBookingError variant={variant} message={error} onRetry={onRetry} copy={copy} />
      ) : services.length === 0 ? (
        <SlotBookingEmpty variant={variant} empty={empty} copy={copy} />
      ) : variant === 'grid' ? (
        <WeekView copy={copy} services={services} slotsFor={slots} firstWeek={week} pass={pass} formatPrice={formatPrice} onBook={onBook} announce={announce} />
      ) : (
        <MonthView copy={copy} services={services} schedule={schedule} from={from} pass={pass} formatPrice={formatPrice} onBook={onBook} announce={announce} level={embedded ? 'h3' : 'h2'} />
      )}

      <CardFooter className="flex-wrap">
        <span className="me-auto text-ui-sm text-fg-muted">{copy.status}</span>
        {pass && <Button variant="secondary">{copy.topUp}</Button>}
      </CardFooter>
      {announcer}
    </Card>
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

export { SlotBooking, type SlotBookingProps }
export type { SlotBookingCopy, SlotBookingPass, SlotBookingService, SlotBookingSlot }
