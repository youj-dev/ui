'use client'

import { useEffect, useMemo, useRef, type ComponentProps } from 'react'
import { ChevronDownIcon } from '@youj/icons/components/youj/icons/chevron-down'
import { ChevronLeftIcon } from '@youj/icons/components/youj/icons/chevron-left'
import { ChevronRightIcon } from '@youj/icons/components/youj/icons/chevron-right'
import { ChevronUpIcon } from '@youj/icons/components/youj/icons/chevron-up'
import type { Locale } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { DateLib, DayPicker, type ChevronProps, type DayButtonProps, type Labels } from 'react-day-picker'
import { useComponentLabels } from '@youj/core/labels'
import { calendarLabels } from '@youj/core/labels'
import { useYouj, useLocale, useDirection } from '@youj/core/lib/youj/provider'
import { useNow } from '../../hooks/use-now'
import { cn, dateTimeFormat } from '../../lib/utils'
import { Button } from './button'

/* react-day-picker, dressed in youj's controls: every day and both
 * arrows are the library's Button (ghost), so hover, press and focus ring
 * match everything else. The grid is react-day-picker's (role="grid", arrows
 * move by day, PageUp/PageDown by month, Home/End by week, Shift+PageUp by
 * year), labeled in the locale you pass, or else the YoujProvider's
 * (see dateLocale).
 *
 * Motion: changing month from the arrows pushes the new month in from the
 * side it comes from while the old one leaves the other way (a third of the
 * width, faded, base token, flipped under RTL). Moving across a month edge
 * from the keyboard doesn't slide, as react-day-picker keeps focus stable.
 * Reduced motion: the month simply changes.
 *
 * Today carries a dot under its number. A range is one continuous band with
 * solid ends; weeks keep a small gap so the band reads as rows.
 *
 * On touch every day and both arrows are 44px, the smallest target a thumb
 * hits without looking; a month is then 308px wide, which fits a phone.
 *
 * Today is the browser's, read after hydration (or the `today` you pass):
 * the server's clock and time zone aren't the browser's, and a prerender
 * can't read the clock. Until then no day is today, and a calendar with no
 * `month` or `defaultMonth` of its own keeps its room but stays hidden. */

type CalendarProps = ComponentProps<typeof DayPicker>

// What react-day-picker gets for today before the browser's is known, so it never reads the clock itself (mid-month, so the same month in every time zone).
const NO_TODAY = new Date(2000, 0, 15)

function Calendar({
  className,
  classNames,
  components,
  showOutsideDays = true,
  fixedWeeks = true,
  animate = true,
  dir,
  labels,
  locale,
  ...props
}: CalendarProps) {
  const now = useNow(0)
  const today = useMemo(() => props.today ?? (now === null ? undefined : new Date(now)), [props.today, now])
  // No month to show yet: it opens on today's once that's known.
  const pending = !today && !props.month && !props.defaultMonth
  const k = useYouj()
  const providerLocale = useDateLocale()
  const translated = useDayPickerLabels()
  const direction = useDirection()
  return (
    <DayPicker
      key={pending ? 'pending' : undefined}
      data-slot="calendar"
      dir={dir ?? direction}
      animate={animate && !k.reduced}
      showOutsideDays={showOutsideDays}
      fixedWeeks={fixedWeeks}
      className={cn('relative w-fit own:text-ui text-fg rtl:[--ui--calendar-dir:-1]', pending && 'invisible', className)}
      classNames={{
        months: 'relative flex flex-col gap-4 sm:flex-row sm:gap-6',
        month: 'flex flex-col gap-1.5',
        nav: 'pointer-events-none absolute inset-x-0 top-0 z-1 flex h-control items-center justify-between touch:h-11',
        button_previous: '',
        button_next: '',
        month_caption: 'flex h-control items-center justify-center own:px-9 touch:h-11 own:touch:px-12',
        caption_label: 'text-ui font-medium tracking-tight',
        dropdowns: 'flex items-center gap-1',
        month_grid: 'border-separate border-spacing-x-0 border-spacing-y-0.5',
        weekdays: '',
        weekday: 'h-7 w-control own:p-0 text-center text-ui-xs font-normal text-fg-muted touch:w-11',
        week: '',
        week_number_header: 'w-control touch:w-11',
        week_number: 'w-control text-center text-ui-xs text-fg-muted touch:w-11',
        day: 'relative own:p-0 text-center',
        // The band sits on the cells so it runs unbroken across a week and
        // rounds off at the range's ends, at each week's edges and where the
        // month begins or ends mid-week.
        range_start: 'rounded-s-md bg-accent-subtle',
        range_end: 'rounded-e-md bg-accent-subtle',
        range_middle:
          'bg-accent-subtle first:rounded-s-md last:rounded-e-md [[data-hidden]+&]:rounded-s-md [&:has(+[data-hidden])]:rounded-e-md',
        hidden: 'invisible',
        footer: 'own:pt-2 text-ui-sm text-fg-muted',
        weeks_before_enter: 'animate-calendar-from-start',
        weeks_before_exit: 'animate-calendar-to-start',
        weeks_after_enter: 'animate-calendar-from-end',
        weeks_after_exit: 'animate-calendar-to-end',
        caption_before_enter: 'animate-calendar-from-start',
        caption_before_exit: 'animate-calendar-to-start',
        caption_after_enter: 'animate-calendar-from-end',
        caption_after_exit: 'animate-calendar-to-end',
        ...classNames,
      }}
      components={{
        Chevron: CalendarChevron,
        PreviousMonthButton: CalendarNavButton,
        NextMonthButton: CalendarNavButton,
        DayButton: CalendarDayButton,
        ...components,
      }}
      labels={{ ...translated, ...labels }}
      locale={locale ?? providerLocale}
      {...props}
      today={today ?? NO_TODAY}
    />
  )
}

/* The date components' locale. A date-fns locale passed as `locale` wins;
 * without one they follow YoujProvider's `locale` (a BCP 47 tag) through
 * a date-fns locale built from Intl: the date orders (short "05.01.2026",
 * medium, long, full), month and weekday names, and the week start from
 * Intl.Locale's week info where the runtime has it (Monday, ISO 8601, where it
 * doesn't). Digits stay Latin, as typed. Reading typed month names ("5 Jan
 * 2026") stays English: pass the date-fns locale for that. en-US is date-fns's
 * own enUS, so the default is unchanged. */

const SAMPLE = new Date(2026, 0, 5)
const cache = new Map<string, Locale>()

type Width = 'narrow' | 'short' | 'abbreviated' | 'wide' | 'any'
const intlWidth = (width: Width | undefined, fallback: 'short' | 'long') =>
  width === 'narrow' ? 'narrow' : width === 'short' || width === 'abbreviated' ? 'short' : width === 'wide' ? 'long' : fallback

/** Intl's date order as a date-fns pattern: numeric parts keep their padding, names their width, literals are quoted. */
function datePatternFor(tag: string, options: Intl.DateTimeFormatOptions): string {
  return dateTimeFormat(tag, { ...options, numberingSystem: 'latn' })
    .formatToParts(SAMPLE)
    .map(({ type, value }) => {
      if (type === 'day') return value.length > 1 ? 'dd' : 'd'
      if (type === 'month') return options.month === 'long' ? 'MMMM' : options.month === 'short' ? 'MMM' : value.length > 1 ? 'MM' : 'M'
      if (type === 'year') return value.length === 2 ? 'yy' : options.month === '2-digit' ? 'yyyy' : 'y'
      if (type === 'weekday') return 'EEEE'
      if (type !== 'literal') return ''
      // Bidi marks around Arabic separators aren't typed; Latin letters (date-fns tokens) are quoted, a quote doubled.
      const text = value.replace(/[\u200e\u200f\u061c]/g, '')
      return /[A-Za-z']/.test(text) ? `'${text.replace(/'/g, "''")}'` : text
    })
    .join('')
}

function weekInfo(tag: string): { firstDay: number; minimalDays: number } | undefined {
  try {
    const intl = new Intl.Locale(tag) as Intl.Locale & { getWeekInfo?: () => { firstDay: number; minimalDays: number }; weekInfo?: { firstDay: number; minimalDays: number } }
    return intl.getWeekInfo?.() ?? intl.weekInfo
  } catch {
    return undefined
  }
}

function buildDateLocale(tag: string): Locale {
  const month = (index: number, { width, context }: { width?: Width; context?: string } = {}) => {
    const date = new Date(2026, index, 5)
    const style = intlWidth(width, 'long')
    // Standalone (a calendar's caption) and in-date (genitive in many languages) forms differ.
    if (context === 'standalone') return dateTimeFormat(tag, { month: style }).format(date)
    return dateTimeFormat(tag, { day: 'numeric', month: style }).formatToParts(date).find((p) => p.type === 'month')?.value ?? ''
  }
  // 4 January 2026 is a Sunday: date-fns counts weekdays from Sunday = 0.
  const day = (index: number, { width }: { width?: Width } = {}) => dateTimeFormat(tag, { weekday: intlWidth(width, 'long') }).format(new Date(2026, 0, 4 + index))
  const patterns = {
    short: datePatternFor(tag, { day: '2-digit', month: '2-digit', year: 'numeric' }),
    medium: datePatternFor(tag, { day: 'numeric', month: 'short', year: 'numeric' }),
    long: datePatternFor(tag, { day: 'numeric', month: 'long', year: 'numeric' }),
    full: datePatternFor(tag, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
  }
  const week = weekInfo(tag)
  return {
    ...enUS,
    code: tag,
    formatLong: { ...enUS.formatLong, date: (options?: { width?: string }) => patterns[(options?.width ?? 'full') as keyof typeof patterns] ?? patterns.full },
    localize: { ...enUS.localize, month: month as Locale['localize']['month'], day: day as Locale['localize']['day'] },
    options: {
      weekStartsOn: ((week?.firstDay ?? 1) % 7) as 0 | 1 | 2 | 3 | 4 | 5 | 6,
      // date-fns takes 1 or 4: the week numbering's two conventions (US and ISO).
      firstWeekContainsDate: (week?.minimalDays ?? 4) >= 4 ? 4 : 1,
    },
  }
}

/** A date-fns locale for a BCP 47 tag, built from Intl (en-US is date-fns's enUS); cached per tag. An invalid tag gives enUS. */
function dateLocale(tag: string): Locale {
  const cached = cache.get(tag)
  if (cached) return cached
  let locale = enUS
  try {
    const canonical = Intl.getCanonicalLocales(tag)[0] ?? 'en-US'
    if (canonical !== 'en-US') locale = buildDateLocale(canonical)
  } catch {
    locale = enUS
  }
  cache.set(tag, locale)
  return locale
}

/** The date-fns locale to use: `explicit` when passed, else the provider's locale through dateLocale. */
function useDateLocale(explicit?: Locale): Locale {
  const tag = useLocale()
  return explicit ?? dateLocale(tag)
}

/* The provider's calendar labels, only where they're translated: untouched,
 * react-day-picker keeps its own, including those of its locales
 * (`react-day-picker/locale`). */
function useDayPickerLabels(): Partial<Labels> {
  const labels = useComponentLabels(calendarLabels)
  const own: Partial<Labels> = {}
  if (labels.nextMonth !== calendarLabels.nextMonth) own.labelNext = () => labels.nextMonth
  if (labels.previousMonth !== calendarLabels.previousMonth) own.labelPrevious = () => labels.previousMonth
  if (labels.calendarDay !== calendarLabels.calendarDay) {
    own.labelDayButton = (date, modifiers, options, dateLib) =>
      labels.calendarDay((dateLib ?? new DateLib(options)).format(date, 'PPPP'), !!modifiers.today, !!modifiers.selected)
  }
  return own
}

function CalendarChevron({ orientation, className }: ChevronProps) {
  const Icon = { left: ChevronLeftIcon, right: ChevronRightIcon, up: ChevronUpIcon, down: ChevronDownIcon }[orientation ?? 'left']
  // Held still: a nav chevron points the way; its turn is for disclosures.
  return <Icon trigger="none" className={cn('size-4', className)} />
}

function CalendarNavButton({ className, ...props }: ComponentProps<'button'>) {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      // shape: the month arrows grow to a 44px target on touch, beside the 44px day cells
      className={cn('pointer-events-auto aria-disabled:pointer-events-none aria-disabled:opacity-40 touch:size-11', className)}
      {...(props as ComponentProps<typeof Button>)}
    />
  )
}

function CalendarDayButton({ className, day, modifiers, ...props }: DayButtonProps) {
  const ref = useRef<HTMLButtonElement>(null)
  // react-day-picker moves focus by marking the day focused; the button follows.
  useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])
  const ranged = modifiers.range_start || modifiers.range_end || modifiers.range_middle
  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.isoDate}
      data-selected-single={(modifiers.selected && !ranged) || undefined}
      data-range-start={modifiers.range_start || undefined}
      data-range-end={modifiers.range_end || undefined}
      data-range-middle={(modifiers.range_middle && !modifiers.range_start && !modifiers.range_end) || undefined}
      data-today={modifiers.today || undefined}
      data-outside={modifiers.outside || undefined}
      // shape: a day is a cell of the month grid (44px on touch, no edge so the range band runs through it)
      className={cn(
        // No border: a transparent one would show the range band as a ring.
        'border-0 font-normal own:text-fg own:tabular-nums own:hover:text-fg touch:size-11 own:touch:text-base',
        'own:data-outside:text-fg-muted',
        // Today: a dot under the number, in the ink of whatever it sits on.
        'after:pointer-events-none after:absolute after:inset-x-0 after:bottom-1 after:mx-auto after:size-1 own:after:rounded-full',
        'own:data-today:after:bg-accent',
        'own:data-today:data-selected-single:after:bg-on-accent own:data-today:data-range-start:after:bg-on-accent own:data-today:data-range-end:after:bg-on-accent',
        'own:data-selected-single:bg-accent own:data-selected-single:text-on-accent own:data-selected-single:yj-solid-hover',
        'own:data-range-start:bg-accent own:data-range-start:text-on-accent own:data-range-start:yj-solid-hover',
        'own:data-range-end:bg-accent own:data-range-end:text-on-accent own:data-range-end:yj-solid-hover',
        'own:data-range-middle:hover:bg-accent-subtle',
        className,
      )}
      {...(props as ComponentProps<typeof Button>)}
    />
  )
}

export { Calendar, CalendarDayButton, dateLocale, useDateLocale, type CalendarProps }
