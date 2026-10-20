'use client'

import { dateRangePickerLabels, fileUploadLabels } from '@youj/core/labels'
import { useEffect, useId, useRef, useState, type KeyboardEvent, type Ref } from 'react'
import {
  addDays,
  differenceInCalendarDays,
  endOfMonth,
  format,
  isSameDay,
  startOfDay,
  startOfMonth,
  startOfYear,
  subMonths,
} from 'date-fns'
import type { Locale } from 'date-fns'
import type { DateRange, Matcher } from 'react-day-picker'
import { type YoujLabels } from '@youj/core'
import { SlidingIndicator } from '@youj/motion'
import { useComponentLabels } from '@youj/core/labels'
import { CalendarIcon } from '@youj/icons/components/youj/icons/calendar'
import { useControllableState } from '../../hooks/use-controllable-state'
import { useIsMobile } from '../../hooks/use-mobile'
import { cn } from '../../lib/utils'
import { Button } from './button'
import { Calendar, useDateLocale } from './calendar'
import { dateAllowed, datePlaceholder, formatDate, parseDate } from './date-picker'
import { useFieldControl } from './field'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput, InputGroupText } from './input-group'
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from './popover'
import { SHEET_NO_DRAG, useSheetPresentation, type OverlayPresentation } from './presentation'

/* A span of days, typed or picked. The field holds two InputGroup inputs
 * (start – end, each read like DatePicker's: the locale's order, month names,
 * ISO) under one label; the calendar button opens a Popover with presets
 * beside a two-month range Calendar (one month on phones, presets in a row
 * above). The preset matching the current range carries a SlidingIndicator
 * that glides between presets; choosing one moves the calendar to it with the
 * month slide, so you see the band land. The calendar's footer says how many
 * days are chosen, politely announced. Clicking a day after a full range
 * starts a new one. Reduced motion: the pill jumps, the months swap in place.
 *
 * On touch the fields stay typed fields (16px) and the calendar opens as a
 * bottom sheet (Popover's sheet): the presets are one row of 44px chips that
 * scrolls sideways (a drag there scrolls the row, never the sheet), one month
 * with 44px days below, and a Done button, since a range takes two taps and
 * the sheet stays open between them. Pulling it down or Escape closes it too.
 * `presentation="popover"` keeps the popover on touch; "sheet" forces it.
 *
 * An end typed before the start swaps them. `minDate`, `maxDate` and
 * `disabledDates` bound the calendar, typing and the presets (a preset that
 * falls outside them is disabled).
 *
 * Nothing reads the clock while rendering: today (for the presets) and the
 * month the calendar opens on are read when it opens, so a server render and
 * a prerender are stable. */

interface DateRangePreset {
  label: string
  /** The range for `today` (start of day, local time). */
  range: (today: Date) => { from: Date; to: Date }
}

const dateRangePresets: DateRangePreset[] = [
  { label: 'Today', range: (t) => ({ from: t, to: t }) },
  { label: 'Yesterday', range: (t) => ({ from: addDays(t, -1), to: addDays(t, -1) }) },
  { label: 'Last 7 days', range: (t) => ({ from: addDays(t, -6), to: t }) },
  { label: 'Last 30 days', range: (t) => ({ from: addDays(t, -29), to: t }) },
  { label: 'This month', range: (t) => ({ from: startOfMonth(t), to: endOfMonth(t) }) },
  { label: 'Last month', range: (t) => ({ from: startOfMonth(subMonths(t, 1)), to: endOfMonth(subMonths(t, 1)) }) },
  { label: 'Year to date', range: (t) => ({ from: startOfYear(t), to: t }) },
]

// The default presets' names, in the same order, for the provider's labels.
const presetLabels = ['today', 'yesterday', 'last7Days', 'last30Days', 'thisMonth', 'lastMonth', 'yearToDate'] as const satisfies ReadonlyArray<keyof YoujLabels>

interface DateRangePickerProps {
  value?: DateRange | null
  defaultValue?: DateRange | null
  onValueChange?: (range: DateRange | null) => void
  /** Default: Today, Yesterday, Last 7 / 30 days, This / Last month, Year to date. `false` hides them. */
  presets?: DateRangePreset[] | false
  /** A date-fns / react-day-picker locale. Default: YoujProvider's `locale`, through Intl (see Calendar's dateLocale). */
  locale?: Locale
  minDate?: Date
  maxDate?: Date
  /** Days that can't be chosen (react-day-picker matchers); a range can't span them. */
  disabledDates?: Matcher | Matcher[]
  /** Months side by side. Default 2 (1 on phones). */
  numberOfMonths?: number
  disabled?: boolean
  /** Also submits `${name}From` / `${name}To` (yyyy-MM-dd) with a native form. */
  name?: string
  id?: string
  ref?: Ref<HTMLInputElement>
  onBlur?: () => void
  className?: string
  /** Names the start and end fields. Default "Start date" / "End date". */
  startLabel?: string
  endLabel?: string
  /** `auto` (the default) opens the calendar in a popover under a pointer and in a bottom sheet on touch; force either one. */
  presentation?: OverlayPresentation
}

// The sheet's Done button reuses the shared "Done" string, so a translation of it reaches here too.
const sheetLabels = { ...dateRangePickerLabels, done: fileUploadLabels.done }

/** On touch the calendar button is drawn at its input-group size but hit at 44px. */
const touchHitClass = 'touch:after:absolute touch:after:-inset-1.5'

const key = (range: DateRange | null | undefined) =>
  `${range?.from?.getTime() ?? ''}-${range?.to?.getTime() ?? ''}`

function DateRangePicker({
  value: valueProp,
  defaultValue = null,
  onValueChange,
  presets,
  locale: localeProp,
  minDate,
  maxDate,
  disabledDates,
  numberOfMonths,
  disabled,
  name,
  id,
  ref,
  onBlur,
  className,
  startLabel,
  endLabel,
  presentation = 'auto',
}: DateRangePickerProps) {
  const labels = useComponentLabels(sheetLabels)
  const sheet = useSheetPresentation(presentation)
  const locale = useDateLocale(localeProp)
  const control = useFieldControl(undefined, { labelable: false })
  const mobile = useIsMobile()
  const [value, setValue] = useControllableState(valueProp, defaultValue)
  const [open, setOpen] = useState(false)
  const [month, setMonth] = useState<Date | undefined>(() => value?.from)
  // Read each time the calendar opens, never while rendering.
  const [today, setToday] = useState<Date | null>(null)
  const [startText, setStartText] = useState(() => (value?.from ? formatDate(value.from, locale) : ''))
  const [endText, setEndText] = useState(() => (value?.to ? formatDate(value.to, locale) : ''))
  const [invalid, setInvalid] = useState<{ start?: boolean; end?: boolean }>({})
  const frame = useRef<HTMLDivElement>(null)
  // What opened the calendar, where focus returns when it closes: a field (ArrowDown) or, when null, the calendar button.
  const opener = useRef<HTMLElement | null>(null)
  const own = useRef<string | undefined>(undefined)
  const startNameId = useId()
  const endNameId = useId()
  // Each field reads as the Field's label plus its end: "Timeline, Start date".
  const labelledBy = (part: string) => [control.labelId, part].filter(Boolean).join(' ')

  const current = key(value)
  useEffect(() => {
    if (current === own.current) return
    setStartText(value?.from ? formatDate(value.from, locale) : '')
    setEndText(value?.to ? formatDate(value.to, locale) : '')
    setInvalid({})
    // `value` is read through its key; the locale re-formats.
  }, [current, locale])

  const commit = (range: DateRange | null) => {
    const next = range?.from || range?.to ? range : null
    own.current = key(next)
    if (own.current === current) return
    setValue(next)
    onValueChange?.(next)
  }

  const read = (text: string) => {
    const date = parseDate(text, locale)
    return date && dateAllowed(date, minDate, maxDate, disabledDates) ? date : null
  }

  const settle = () => {
    const from = startText.trim() ? read(startText) : null
    const to = endText.trim() ? read(endText) : null
    setInvalid({ start: !!startText.trim() && !from, end: !!endText.trim() && !to })
    // An end before the start: the two were typed the wrong way round.
    const [a, b] = from && to && to < from ? [to, from] : [from, to]
    commit({ from: a ?? undefined, to: b ?? undefined })
    setStartText(a ? formatDate(a, locale) : startText)
    setEndText(b ? formatDate(b, locale) : endText)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') settle()
    else if (event.key === 'ArrowDown' && !disabled) {
      event.preventDefault()
      opener.current = event.currentTarget
      setOpenState(true)
    }
  }

  const setOpenState = (next: boolean) => {
    if (next) {
      const now = startOfDay(new Date())
      setToday(now)
      setMonth(value?.from ?? minDate ?? now)
    }
    setOpen(next)
    // Closed with focus somewhere else (a click outside): the control was left.
    if (!next) requestAnimationFrame(() => !frame.current?.contains(document.activeElement) && onBlur?.())
  }

  const leave = (event: { relatedTarget: EventTarget | null }) => {
    settle()
    // Moving between the two fields, to the button or into the calendar isn't leaving the control.
    if (!open && !frame.current?.contains(event.relatedTarget as Node | null)) onBlur?.()
  }

  const select = (range: DateRange | undefined) => {
    commit(range ?? null)
    setStartText(range?.from ? formatDate(range.from, locale) : '')
    setEndText(range?.to ? formatDate(range.to, locale) : '')
    setInvalid({})
  }

  const presetList =
    presets === false ? [] : (presets ?? dateRangePresets.map((preset, i) => ({ ...preset, label: labels[presetLabels[i]!] })))
  const allowed = (range: { from: Date; to: Date }) =>
    dateAllowed(range.from, minDate, maxDate, disabledDates) && dateAllowed(range.to, minDate, maxDate, disabledDates)
  const applyPreset = (preset: DateRangePreset, today: Date) => {
    const range = preset.range(today)
    select(range)
    setMonth(range.from)
  }

  const days = value?.from && value.to ? differenceInCalendarDays(value.to, value.from) + 1 : 0
  const footer = days
    ? labels.dateRangeSummary(days, format(value!.from!, 'PP', { locale }), format(value!.to!, 'PP', { locale }))
    : value?.from
      ? labels.pickEndDate
      : labels.pickStartDate

  const inputClass = 'tabular-nums'

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) opener.current = null
        setOpenState(next)
      }}
    >
      <InputGroup
        ref={frame}
        data-slot="date-range-picker"
        className={cn('own:has-data-popup-open:border-focus', className)}
      >
        <InputGroupInput
          ref={ref}
          id={id}
          aria-labelledby={labelledBy(startNameId)}
          aria-invalid={invalid.start || undefined}
          autoComplete="off"
          spellCheck={false}
          disabled={disabled}
          placeholder={datePlaceholder(locale)}
          value={startText}
          onChange={(event) => {
            setStartText(event.target.value)
            setInvalid((i) => ({ ...i, start: false }))
          }}
          onKeyDown={onKeyDown}
          onBlur={leave}
          // Sized to a date, so the dash sits right after it rather than mid-field.
          className={cn(inputClass, 'w-[calc(11.5ch_+_var(--spacing)*4)] flex-none own:pe-1')}
        />
        <InputGroupText aria-hidden className="shrink-0 own:px-0.5">
          –
        </InputGroupText>
        <InputGroupInput
          aria-labelledby={labelledBy(endNameId)}
          aria-invalid={invalid.end || undefined}
          autoComplete="off"
          spellCheck={false}
          disabled={disabled}
          required={false}
          placeholder={datePlaceholder(locale)}
          value={endText}
          onChange={(event) => {
            setEndText(event.target.value)
            setInvalid((i) => ({ ...i, end: false }))
          }}
          onKeyDown={onKeyDown}
          onBlur={leave}
          className={cn(inputClass, 'own:ps-1.5')}
        />
        <InputGroupAddon align="inline-end">
          <PopoverTrigger
            disabled={disabled}
            render={<InputGroupButton size="icon-xs" aria-label={labels.chooseDates} className={cn('text-fg-muted', touchHitClass)} />}
          >
            <CalendarIcon size={16} strokeWidth={1.75} />
          </PopoverTrigger>
        </InputGroupAddon>
        <span id={startNameId} className="sr-only">
          {startLabel ?? labels.startDate}
        </span>
        <span id={endNameId} className="sr-only">
          {endLabel ?? labels.endDate}
        </span>
        {name && (
          <>
            <input type="hidden" name={`${name}From`} value={value?.from ? format(value.from, 'yyyy-MM-dd') : ''} />
            <input type="hidden" name={`${name}To`} value={value?.to ? format(value.to, 'yyyy-MM-dd') : ''} />
          </>
        )}
      </InputGroup>
      <PopoverContent
        anchor={frame}
        align="start"
        presentation={presentation}
        finalFocus={() => opener.current ?? true}
        aria-label={labels.chooseDates}
        // As wide as the calendar (and the preset column); on phones the presets wrap above it.
        // A sheet is the screen's width and scrolls when it must, so it keeps its own overflow.
        className={sheet ? 'gap-0 own:px-0!' : 'w-min max-w-(--available-width) gap-0 overflow-hidden own:p-0'}
      >
        <div className={cn('own:flex flex-col', !sheet && 'md:flex-row')}>
          {presetList.length > 0 && today && (
            <div
              role="group"
              aria-label={labels.presets}
              {...(sheet ? { [SHEET_NO_DRAG]: '' } : {})}
              className={cn(
                'relative isolate own:flex shrink-0 gap-0.5 own:border-line',
                sheet
                  ? // One row that scrolls sideways under the thumb, its ends inset like the sheet's content.
                    'flex-nowrap gap-1 overflow-x-auto overscroll-x-contain border-b own:px-3 own:pb-3 [scrollbar-width:none] own:[&::-webkit-scrollbar]:hidden'
                  : // Rows that wrap on phones, every preset in view: w-0 + min-w-full keeps them from widening the popup.
                    'w-0 min-w-full flex-wrap border-b own:p-2 md:w-36 md:min-w-0 md:flex-col md:flex-nowrap md:border-e md:border-b-0',
              )}
            >
              {presetList.map((preset) => {
                const range = preset.range(today)
                const pressed = !!value?.from && !!value.to && isSameDay(value.from, range.from) && isSameDay(value.to, range.to)
                return (
                  <Button
                    key={preset.label}
                    variant="ghost"
                    size="sm"
                    aria-pressed={pressed}
                    disabled={!allowed(range)}
                    onClick={() => applyPreset(preset, today)}
                    // shape: in the phone sheet a preset is a 44px list row
                    className={cn(
                      'shrink-0 justify-start font-normal own:hover:bg-transparent own:aria-pressed:text-fg',
                      sheet ? 'h-11 own:px-3.5 own:active:bg-hover' : 'md:w-full',
                    )}
                  >
                    {preset.label}
                  </Button>
                )
              })}
              <SlidingIndicator match='[aria-pressed="true"]' className="own:rounded-md own:bg-hover" />
            </div>
          )}
          <div className={cn('p-3', sheet && 'own:flex justify-center pb-0')}>
            <Calendar
              mode="range"
              resetOnSelect
              excludeDisabled
              autoFocus={presetList.length === 0}
              locale={locale}
              // A sheet is a phone's column: one month, whatever the window's width.
              numberOfMonths={numberOfMonths ?? (mobile || sheet ? 1 : 2)}
              showOutsideDays={false}
              fixedWeeks={false}
              month={month}
              onMonthChange={setMonth}
              selected={value ?? undefined}
              onSelect={select}
              startMonth={minDate}
              endMonth={maxDate}
              disabled={[
                ...(minDate ? [{ before: minDate }] : []),
                ...(maxDate ? [{ after: maxDate }] : []),
                ...(disabledDates === undefined ? [] : [disabledDates].flat()),
              ]}
              footer={footer}
            />
          </div>
        </div>
        {sheet && (
          <div className="px-4 pt-3">
            <PopoverClose render={<Button size="lg" className="w-full" />}>{labels.done}</PopoverClose>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

export { DateRangePicker, dateRangePresets, type DateRange, type DateRangePickerProps, type DateRangePreset }
