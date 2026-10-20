'use client'

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent, type Ref } from 'react'
import { ClockIcon } from '@youj/icons/components/youj/icons/clock'
import { useLocale } from '@youj/core/lib/youj/provider'
import { useComponentLabels } from '@youj/core/labels'
import { timePickerLabels } from '@youj/core/labels'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn, dateTimeFormat } from '../../lib/utils'
import { useFieldControl } from './field'
import { InputGroup, InputGroupAddon, inputGroupControlClass } from './input-group'

/* A time as segments, like the platform's own time field: hours, minutes and
 * (on a 12-hour clock) AM/PM, each a spinbutton in one InputGroup frame. Type
 * digits and it moves on by itself once a segment can't take another ("7" in
 * the hour means 07; "1" waits for a second digit); ":" or ArrowRight moves
 * on too. ArrowUp/Down step (minutes by `step`, wrapping), Home/End go to the
 * ends, Backspace clears a segment, A/P set the period. The value is "HH:mm"
 * (24-hour, like <input type="time">) once hours and minutes are both set,
 * and null otherwise. The 12/24-hour clock and the AM/PM words follow the
 * locale unless `hourCycle` says otherwise. The focused segment takes a soft
 * accent tint (fast token); nothing else moves, so reduced motion changes
 * nothing. A typed minute that falls between steps snaps to the nearest on
 * blur. */

type Period = 'AM' | 'PM'
interface Parts {
  /** 0–23 on a 24-hour clock, 1–12 on a 12-hour one. */
  hour: number | null
  minute: number | null
  period: Period | null
}

interface TimePickerProps {
  /** "HH:mm", 24-hour. */
  value?: string | null
  defaultValue?: string | null
  onValueChange?: (value: string | null) => void
  /** 12 or 24. Default: the locale's. */
  hourCycle?: 12 | 24
  /** A BCP 47 locale for the clock and the AM/PM words. Default: the YoujProvider locale. */
  locale?: string
  /** Minutes per ArrowUp/Down, and the grid a typed minute snaps to. Default 1. */
  step?: number
  disabled?: boolean
  /** Also submits "HH:mm" with a native form. */
  name?: string
  id?: string
  ref?: Ref<HTMLInputElement>
  onBlur?: () => void
  className?: string
  'aria-label'?: string
}

const pad = (n: number) => String(n).padStart(2, '0')

function parseTime(value: string | null | undefined, twelve: boolean): Parts {
  const match = value?.match(/^(\d{1,2}):(\d{2})/)
  if (!match) return { hour: null, minute: null, period: null }
  const h = Math.min(23, Number(match[1]))
  const minute = Math.min(59, Number(match[2]))
  if (!twelve) return { hour: h, minute, period: null }
  return { hour: h % 12 || 12, minute, period: h < 12 ? 'AM' : 'PM' }
}

function toValue({ hour, minute, period }: Parts, twelve: boolean): string | null {
  if (hour === null || minute === null) return null
  const h = twelve ? (hour % 12) + ((period ?? 'AM') === 'PM' ? 12 : 0) : hour
  return `${pad(h)}:${pad(minute)}`
}

function useClock(locale: string, hourCycle: 12 | 24 | undefined) {
  return useMemo(() => {
    const format = dateTimeFormat(locale, { hour: 'numeric' })
    const twelve = hourCycle ? hourCycle === 12 : ['h11', 'h12'].includes(format.resolvedOptions().hourCycle ?? 'h23')
    const period = (h: number) =>
      dateTimeFormat(locale, { hour: 'numeric', hour12: true })
        .formatToParts(new Date(2000, 0, 1, h))
        .find((p) => p.type === 'dayPeriod')?.value ?? (h < 12 ? 'AM' : 'PM')
    return { twelve, am: period(9), pm: period(21) }
  }, [locale, hourCycle])
}

function TimePicker({
  value: valueProp,
  defaultValue = null,
  onValueChange,
  hourCycle,
  locale,
  step = 1,
  disabled: disabledProp,
  name,
  id,
  ref,
  onBlur,
  className,
  'aria-label': ariaLabel,
}: TimePickerProps) {
  const labels = useComponentLabels(timePickerLabels)
  const control = useFieldControl(id)
  const disabled = disabledProp || control.disabled
  const clock = useClock(useLocale(locale), hourCycle)
  const [value, setValue] = useControllableState(valueProp, defaultValue)
  const [parts, setParts] = useState<Parts>(() => parseTime(value, clock.twelve))
  const buffer = useRef<{ segment: number; digits: string } | null>(null)
  const segments = useRef<Array<HTMLInputElement | null>>([])
  const group = useRef<HTMLDivElement>(null)
  // The value this picker committed itself; only a value from outside re-reads the parts.
  const own = useRef<string | null | undefined>(undefined)

  useEffect(() => {
    if (value === own.current) return
    setParts(parseTime(value, clock.twelve))
  }, [value, clock.twelve])

  const update = (next: Parts) => {
    setParts(next)
    const v = toValue(next, clock.twelve)
    own.current = v
    if (v !== value) {
      setValue(v)
      onValueChange?.(v)
    }
  }

  const count = clock.twelve ? 3 : 2
  const focus = (index: number) => {
    buffer.current = null
    segments.current[Math.max(0, Math.min(count - 1, index))]?.focus()
  }

  const hourRange = clock.twelve ? { min: 1, max: 12 } : { min: 0, max: 23 }
  const now = () => {
    const d = new Date()
    return {
      hour: clock.twelve ? d.getHours() % 12 || 12 : d.getHours(),
      minute: Math.floor(d.getMinutes() / step) * step,
      period: (d.getHours() < 12 ? 'AM' : 'PM') as Period,
    }
  }
  const withPeriod = (next: Parts): Parts =>
    clock.twelve && next.hour !== null && next.period === null ? { ...next, period: now().period } : next

  const stepHour = (by: number) => {
    const { min, max } = hourRange
    const span = max - min + 1
    const hour = parts.hour === null ? now().hour : ((((parts.hour - min + by) % span) + span) % span) + min
    update(withPeriod({ ...parts, hour }))
  }
  const stepMinute = (by: number) => {
    if (parts.minute === null) return update(withPeriod({ ...parts, minute: now().minute }))
    // From off-grid, the first step lands on the grid.
    const base = by > 0 ? Math.ceil(parts.minute / step) * step : Math.floor(parts.minute / step) * step
    const moved = base === parts.minute ? parts.minute + by * step : base
    update({ ...parts, minute: ((moved % 60) + 60) % 60 })
  }
  const togglePeriod = (period?: Period) =>
    update({ ...parts, period: period ?? (parts.period === 'PM' ? 'AM' : 'PM') })

  const typeDigit = (index: number, digit: string) => {
    const max = index === 0 ? hourRange.max : 59
    let digits = (buffer.current?.segment === index ? buffer.current.digits : '') + digit
    // A pair that can't be a value ("29" for an hour) starts over from its last digit.
    if (Number(digits) > max) digits = digit
    const n = Number(digits)
    if (index === 0) update(withPeriod({ ...parts, hour: Math.max(hourRange.min, n) }))
    else update({ ...parts, minute: n })
    // Done once no second digit could follow: "7" in the hour, "6" in the minutes.
    if (digits.length === 2 || n * 10 > max) {
      if (index + 1 < count) focus(index + 1)
      else buffer.current = null
    } else {
      buffer.current = { segment: index, digits }
    }
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>, index: number) => {
    const key = event.key
    const handled = () => event.preventDefault()
    if (key === 'Tab' || event.metaKey || event.ctrlKey) return
    if (key === 'ArrowUp' || key === 'ArrowDown') {
      handled()
      buffer.current = null
      const by = key === 'ArrowUp' ? 1 : -1
      if (index === 0) stepHour(by)
      else if (index === 1) stepMinute(by)
      else togglePeriod()
    } else if (key === 'ArrowLeft') {
      handled()
      focus(index - 1)
    } else if (key === 'ArrowRight' || key === ':' || (key === ' ' && index < count - 1)) {
      handled()
      focus(index + 1)
    } else if (key === 'Home' || key === 'End') {
      handled()
      const end = key === 'End'
      if (index === 0) update(withPeriod({ ...parts, hour: end ? hourRange.max : hourRange.min }))
      else if (index === 1) update({ ...parts, minute: end ? 60 - step : 0 })
      else togglePeriod(end ? 'PM' : 'AM')
    } else if (key === 'Backspace' || key === 'Delete') {
      handled()
      buffer.current = null
      const cleared = [{ hour: null }, { minute: null }, { period: null }][index]
      const empty = index === 0 ? parts.hour === null : index === 1 ? parts.minute === null : parts.period === null
      if (empty && key === 'Backspace') return focus(index - 1)
      update({ ...parts, ...cleared })
    } else if (/^\d$/.test(key) && index < 2) {
      handled()
      typeDigit(index, key)
    } else if (index === 2 && /^[ap]$/i.test(key)) {
      handled()
      togglePeriod(key.toLowerCase() === 'a' ? 'AM' : 'PM')
    } else if (key.length === 1) {
      handled()
    }
  }

  // Virtual keyboards send no usable key code: read what was typed instead.
  const onChange = (event: ChangeEvent<HTMLInputElement>, index: number) => {
    const typed = event.target.value.slice(-1)
    if (/\d/.test(typed) && index < 2) typeDigit(index, typed)
    else if (index === 2 && /[ap]/i.test(typed)) togglePeriod(typed.toLowerCase() === 'a' ? 'AM' : 'PM')
  }

  const onGroupBlur = () => {
    // Only once focus has left every segment.
    requestAnimationFrame(() => {
      if (group.current?.contains(document.activeElement)) return
      buffer.current = null
      if (parts.minute !== null && step > 1 && parts.minute % step !== 0) {
        update({ ...parts, minute: (Math.round(parts.minute / step) * step) % 60 })
      }
      onBlur?.()
    })
  }

  const periodText = parts.period === 'PM' ? clock.pm : parts.period === 'AM' ? clock.am : ''
  const segmentClass = cn(
    inputGroupControlClass,
    'h-6 w-[calc(2ch_+_var(--spacing)*2)] flex-none own:rounded-sm own:px-1 own:text-center own:tabular-nums caret-transparent',
    'transition-[background-color,color] yj-duration-fast ease-standard',
    'selection:bg-transparent own:focus:bg-accent-subtle own:focus:text-fg',
    'own:placeholder:text-fg-muted disabled:cursor-not-allowed',
  )
  const common = (index: number) => ({
    ref: (node: HTMLInputElement | null) => {
      segments.current[index] = node
      if (index === 0) {
        if (typeof ref === 'function') ref(node)
        else if (ref) ref.current = node
      }
    },
    type: 'text' as const,
    role: 'spinbutton',
    'data-slot': 'input-group-control',
    autoComplete: 'off',
    spellCheck: false,
    disabled,
    'aria-invalid': control.invalid || undefined,
    'aria-describedby': control.describedBy,
    onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => onKeyDown(event, index),
    onChange: (event: ChangeEvent<HTMLInputElement>) => onChange(event, index),
    onFocus: (event: { currentTarget: HTMLInputElement }) => event.currentTarget.select(),
    onMouseUp: (event: { currentTarget: HTMLInputElement; preventDefault: () => void }) => {
      event.preventDefault()
      event.currentTarget.select()
    },
  })

  return (
    <InputGroup
      ref={group}
      data-slot="time-picker"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabel ? undefined : control.labelId}
      onBlur={onGroupBlur}
      className={cn('w-fit min-w-36 cursor-text', className)}
      onClick={(event) => {
        if (event.target === event.currentTarget) segments.current[parts.hour === null ? 0 : count - 1]?.focus()
      }}
    >
      <div dir="ltr" className="own:flex h-full flex-1 items-center ps-1.5 own:text-ui">
        <input
          {...common(0)}
          id={control.id}
          aria-label={labels.hours}
          aria-required={control.required}
          aria-valuemin={hourRange.min}
          aria-valuemax={hourRange.max}
          aria-valuenow={parts.hour ?? undefined}
          aria-valuetext={parts.hour === null ? labels.empty : String(parts.hour)}
          inputMode="numeric"
          placeholder="--"
          value={parts.hour === null ? '' : pad(parts.hour)}
          className={segmentClass}
        />
        <span aria-hidden className="px-px own:text-fg-muted">
          :
        </span>
        <input
          {...common(1)}
          aria-label={labels.minutes}
          aria-valuemin={0}
          aria-valuemax={59}
          aria-valuenow={parts.minute ?? undefined}
          aria-valuetext={parts.minute === null ? labels.empty : pad(parts.minute)}
          inputMode="numeric"
          placeholder="--"
          value={parts.minute === null ? '' : pad(parts.minute)}
          className={segmentClass}
        />
        {clock.twelve && (
          <input
            {...common(2)}
            aria-label={labels.dayPeriod}
            aria-valuetext={periodText || labels.empty}
            placeholder="--"
            value={periodText}
            className={cn(segmentClass, 'own:ms-1 w-[calc(2.5ch_+_var(--spacing)*3)] own:uppercase')}
          />
        )}
      </div>
      <InputGroupAddon align="inline-end" className="pointer-events-none">
        <ClockIcon size={16} strokeWidth={1.75} aria-hidden />
      </InputGroupAddon>
      {name && <input type="hidden" name={name} value={value ?? ''} />}
    </InputGroup>
  )
}

export { TimePicker, type TimePickerProps }
