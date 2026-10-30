'use client'

import { useEffect, useRef, useState, type KeyboardEvent, type Ref } from 'react'
import { addDays, format, isValid, parse, startOfDay } from 'date-fns'
import { enUS } from 'date-fns/locale'
import type { Locale } from 'date-fns'
import { dateMatchModifiers, type Matcher } from 'react-day-picker'
import { CalendarIcon } from '@youj/icons/components/youj/icons/calendar'
import { useComponentLabels } from '@youj/core/labels'
import { datePickerLabels } from '@youj/core/labels'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn } from '../../lib/utils'
import { Calendar, useDateLocale } from './calendar'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from './input-group'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { useSheetPresentation, type OverlayPresentation } from './presentation'
import { selectGhostTriggerClass, selectTriggerClass } from './select'

/* A date you can type or pick. The field is an InputGroup text input in the
 * locale's short format (09/27/2026, 27.09.2026, 27/09/2026…); typing a
 * complete date selects it as you go, and on blur or Enter the text settles
 * into the canonical form. It also reads "Sep 27, 2026", ISO dates and
 * today / tomorrow / yesterday. Text that isn't a date, or is outside
 * min/max or disabled, marks the field invalid and clears the value.
 *
 * The calendar button (its icon tears off a day on hover) opens a Popover
 * with the Calendar, focused on the chosen day; ArrowDown in the field opens
 * it too. Picking a day or Escape closes it and returns focus to whichever
 * opened it: the calendar button, or the field. Motion: the
 * popup's yj-pop and the calendar's month slide; reduced motion makes both
 * instant.
 *
 * On touch the field stays a typed field (16px, so iOS doesn't zoom) and the
 * calendar opens as a bottom sheet (Popover's sheet): the month centered, day
 * cells 44px, picking a day or pulling the sheet down closes it. The calendar
 * button's hit area grows to 44px there. `presentation="popover"` keeps the
 * popover on touch; "sheet" forces the sheet.
 *
 * `variant="ghost"` trades the typed field for a quiet button that shows the
 * date ("Sep 27, 2026") and opens the same calendar: SelectTrigger's ghost,
 * for a dense row of properties where every value is a picker. */

/** The locale's short date pattern, e.g. "MM/dd/yyyy". */
function datePattern(locale: Locale = enUS) {
  return locale.formatLong?.date({ width: 'short' }) ?? 'MM/dd/yyyy'
}

/** A placeholder spelling the locale's order: "MM/DD/YYYY", "DD.MM.YYYY". */
function datePlaceholder(locale: Locale = enUS) {
  return datePattern(locale)
    .replace(/d+/g, 'DD')
    .replace(/M+/g, 'MM')
    .replace(/y+/g, 'YYYY')
}

function formatDate(date: Date, locale: Locale = enUS) {
  return format(date, datePattern(locale), { locale })
}

const WORDS: Record<string, number> = { today: 0, tomorrow: 1, yesterday: -1 }

/**
 * Reads a typed date in the locale's short order with any separator
 * ("9-27-26", "9/27/2026"), the locale's medium and long forms, ISO
 * (2026-09-27) and today / tomorrow / yesterday. Null when it isn't a date.
 */
function parseDate(text: string, locale: Locale = enUS, reference = new Date(), { twoDigitYear = true } = {}): Date | null {
  const input = text.trim()
  if (!input) return null
  const word = WORDS[input.toLowerCase()]
  if (word !== undefined) return addDays(startOfDay(reference), word)
  const pattern = datePattern(locale)
  const separator = pattern.match(/[^A-Za-z]/)?.[0] ?? '/'
  const normalized = input.replace(/[\s./-]+/g, separator)
  const attempts: Array<[string, string]> = [
    [normalized, pattern],
    ...(twoDigitYear ? [[normalized, pattern.replace(/y+/, 'yy')] as [string, string]] : []),
    [input, 'PP'],
    [input, 'PPP'],
    [input, 'yyyy-MM-dd'],
  ]
  for (const [value, form] of attempts) {
    const date = parse(value, form, reference, { locale })
    if (isValid(date) && date.getFullYear() > 999) return date
  }
  return null
}

/** Whether `date` is allowed by min, max and the disabled matchers (react-day-picker's own matching). */
function dateAllowed(date: Date, minDate?: Date, maxDate?: Date, disabled?: Matcher | Matcher[]) {
  if (minDate && date < startOfDay(minDate)) return false
  if (maxDate && date > startOfDay(maxDate)) return false
  return disabled === undefined || !dateMatchModifiers(date, disabled)
}

interface DatePickerProps {
  value?: Date | null
  defaultValue?: Date | null
  onValueChange?: (date: Date | null) => void
  /** A date-fns / react-day-picker locale: order, names, week start, parsing of month names. Default: YoujProvider's `locale`, through Intl (see Calendar's dateLocale). */
  locale?: Locale
  minDate?: Date
  maxDate?: Date
  /** Days that can't be chosen (react-day-picker matchers). */
  disabledDates?: Matcher | Matcher[]
  /** Default: the locale's pattern ("MM/DD/YYYY"). */
  placeholder?: string
  disabled?: boolean
  /** Also submits the date (yyyy-MM-dd) with a native form. */
  name?: string
  id?: string
  ref?: Ref<HTMLInputElement>
  onBlur?: () => void
  className?: string
  'aria-label'?: string
  /** `auto` (the default) opens the calendar in a popover under a pointer and in a bottom sheet on touch; force either one. */
  presentation?: OverlayPresentation
  /** `ghost`: no typed field, a quiet button showing the date that opens the calendar, matching `SelectTrigger variant="ghost"` (for a property row or a table cell). Default `default`, the typed field. */
  variant?: 'default' | 'ghost'
  /** The ghost trigger's height, as SelectTrigger's. The field takes its height from the theme. */
  size?: 'sm' | 'default'
}

/** On touch the calendar button is drawn at its input-group size but hit at 44px. */
const touchHitClass = 'touch:after:absolute touch:after:-inset-1.5'

function DatePicker({
  value: valueProp,
  defaultValue = null,
  onValueChange,
  locale: localeProp,
  minDate,
  maxDate,
  disabledDates,
  placeholder,
  disabled,
  name,
  id,
  ref,
  onBlur,
  className,
  'aria-label': ariaLabel,
  presentation = 'auto',
  variant = 'default',
  size = 'default',
}: DatePickerProps) {
  const labels = useComponentLabels(datePickerLabels)
  const sheet = useSheetPresentation(presentation)
  const locale = useDateLocale(localeProp)
  const [value, setValue] = useControllableState(valueProp, defaultValue)
  // What the ghost button shows: the date, or the placeholder.
  const shown = value ? format(value, 'PP', { locale }) : (placeholder ?? labels.chooseDate)
  const [open, setOpen] = useState(false)
  const [text, setText] = useState(() => (value ? formatDate(value, locale) : ''))
  const [invalid, setInvalid] = useState(false)
  const frame = useRef<HTMLDivElement>(null)
  const ghost = useRef<HTMLButtonElement>(null)
  const input = useRef<HTMLInputElement | null>(null)
  // What opened the calendar, where focus returns when it closes: the field (ArrowDown) or, when null, the calendar button.
  const opener = useRef<HTMLElement | null>(null)
  // The value this picker last committed itself: it already set the text
  // for it (or, while typing, left the text as typed), so only a value from
  // outside rewrites the text.
  const own = useRef<number | null | undefined>(undefined)

  const time = value?.getTime() ?? null
  useEffect(() => {
    if (time === own.current) return
    setText(value ? formatDate(value, locale) : '')
    setInvalid(false)
    // `value` is read through `time`; the locale re-formats.
  }, [time, locale])

  const commit = (date: Date | null) => {
    const next = date?.getTime() ?? null
    own.current = next
    if (next === time) return
    setValue(date)
    onValueChange?.(date)
  }

  const read = (raw: string, live = false) => {
    // While typing, "9/27/20" is on its way to 2026, not 2020: only four-digit years count.
    const date = parseDate(raw, locale, undefined, { twoDigitYear: !live })
    return date && dateAllowed(date, minDate, maxDate, disabledDates) ? date : null
  }

  const settle = () => {
    if (!text.trim()) {
      setInvalid(false)
      return commit(null)
    }
    const date = read(text)
    setInvalid(!date)
    commit(date)
    if (date) setText(formatDate(date, locale))
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') settle()
    else if (event.key === 'ArrowDown' && !disabled) {
      event.preventDefault()
      opener.current = event.currentTarget
      setOpen(true)
    }
  }

  const pick = (date: Date | undefined) => {
    commit(date ?? null)
    if (date) setText(formatDate(date, locale))
    setInvalid(false)
    setOpen(false)
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) opener.current = null
        setOpen(next)
        // Closed with focus somewhere else (a click outside): the control was left.
        if (!next) requestAnimationFrame(() => !(frame.current ?? ghost.current)?.contains(document.activeElement) && onBlur?.())
      }}
    >
      {variant === 'ghost' ? (
        <>
          <PopoverTrigger
            ref={ghost}
            id={id}
            disabled={disabled}
            data-slot="date-picker"
            data-variant="ghost"
            data-size={size}
            data-placeholder={value ? undefined : ''}
            // The name says what the date is for, then what the button shows: "Due date, Sep 27, 2026", "Due date, No due date".
            aria-label={shown === (ariaLabel ?? labels.chooseDate) ? shown : `${ariaLabel ?? labels.chooseDate}, ${shown}`}
            className={cn(selectTriggerClass, selectGhostTriggerClass, 'own:justify-start own:tabular-nums', className)}
          >
            <CalendarIcon size={16} strokeWidth={1.75} className="own:text-fg-muted" />
            <span className="truncate">{shown}</span>
          </PopoverTrigger>
          {name && <input type="hidden" name={name} value={value ? format(value, 'yyyy-MM-dd') : ''} />}
        </>
      ) : (
        <InputGroup ref={frame} data-slot="date-picker" className={cn('own:has-data-popup-open:border-focus', className)}>
          <InputGroupInput
            ref={(node: HTMLInputElement | null) => {
              input.current = node
              if (typeof ref === 'function') ref(node)
              else if (ref) ref.current = node
            }}
            id={id}
            aria-label={ariaLabel}
            aria-invalid={invalid || undefined}
            autoComplete="off"
            spellCheck={false}
            disabled={disabled}
            placeholder={placeholder ?? datePlaceholder(locale)}
            value={text}
            onChange={(event) => {
              const next = event.target.value
              setText(next)
              setInvalid(false)
              // A complete date selects as you type; the text stays as typed.
              const date = read(next, true)
              if (date) commit(date)
            }}
            onKeyDown={onKeyDown}
            onBlur={(event) => {
              settle()
              // Moving to the calendar button or into the calendar isn't leaving the control.
              if (!open && !frame.current?.contains(event.relatedTarget as Node | null)) onBlur?.()
            }}
            className="own:tabular-nums"
          />
          <InputGroupAddon align="inline-end">
            <PopoverTrigger
              disabled={disabled}
              render={<InputGroupButton size="icon-xs" aria-label={labels.chooseDate} className={cn('text-fg-muted', touchHitClass)} />}
            >
              <CalendarIcon size={16} strokeWidth={1.75} />
            </PopoverTrigger>
          </InputGroupAddon>
          {name && <input type="hidden" name={name} value={value ? format(value, 'yyyy-MM-dd') : ''} />}
        </InputGroup>
      )}
      <PopoverContent
        anchor={variant === 'ghost' ? undefined : frame}
        align="start"
        presentation={presentation}
        finalFocus={() => opener.current ?? true}
        aria-label={labels.chooseDate}
        // A sheet is the screen's width: the month sits in the middle of it.
        className={sheet ? 'items-center own:px-3' : 'w-auto own:p-3'}
      >
        <Calendar
          mode="single"
          autoFocus
          locale={locale}
          selected={value ?? undefined}
          onSelect={pick}
          defaultMonth={value ?? minDate ?? undefined}
          startMonth={minDate}
          endMonth={maxDate}
          disabled={[
            ...(minDate ? [{ before: minDate }] : []),
            ...(maxDate ? [{ after: maxDate }] : []),
            ...(disabledDates === undefined ? [] : [disabledDates].flat()),
          ]}
        />
      </PopoverContent>
    </Popover>
  )
}

export { DatePicker, dateAllowed, datePattern, datePlaceholder, formatDate, parseDate, type DatePickerProps }
