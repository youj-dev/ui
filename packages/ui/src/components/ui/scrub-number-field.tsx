'use client'

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode, type Ref } from 'react'
import { useLocale } from '@youj/core/lib/youj/provider'
import { cn, numberFormat } from '../../lib/utils'
import { useControllableState } from '../../hooks/use-controllable-state'
import { InputGroup, InputGroupAddon, InputGroupText, inputGroupControlClass } from './input-group'

/* A compact number you can drag. The leading `label` (an icon, or a letter
 * such as X) is the handle: press it and move sideways and the value follows,
 * one `step` per few pixels (Shift ×10, Alt ×0.1, read live so a key pressed
 * mid-drag changes the pace from there). The pointer is captured, so the drag
 * carries on over the rest of the page, and the value stops at `min` and `max`.
 * Clicking the handle without moving focuses the field.
 *
 * The field is a text input with role="spinbutton", so a number can be typed
 * (committed on Enter or blur, put back on Escape or when unreadable; a typed
 * value is clamped but not snapped to the step). ArrowUp/Down step by `step`
 * (Shift ×10, Alt ×0.1), PageUp/Down by `largeStep`, Home/End go to `min` and
 * `max`. aria-valuetext reads the value with its unit. The mouse wheel does
 * nothing: a scrolling page shouldn't edit a form. No motion to reduce: the
 * value just changes. */

const clamp = (n: number, min?: number, max?: number) => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n))
/** Float noise out: 0.1 + 0.2 → 0.3. */
const tidy = (n: number) => Number(n.toFixed(8))
const PIXELS_PER_STEP = 4

interface ScrubNumberFieldProps {
  value?: number
  defaultValue?: number
  onValueChange?: (value: number) => void
  min?: number
  max?: number
  /** Per ArrowUp/Down and per few pixels of drag. Default 1. */
  step?: number
  /** Per PageUp/PageDown. Default `step × 10`. */
  largeStep?: number
  /** The drag handle: an icon, or a letter. Hidden from assistive tech; name the field with `aria-label`. */
  label?: ReactNode
  /** A plain suffix inside the field: "px", "%", "°". */
  unit?: string
  /** `sm` fits a dense panel. Default 'default'. */
  size?: 'sm' | 'default'
  /** Default: the YoujProvider locale. */
  locale?: string
  disabled?: boolean
  readOnly?: boolean
  invalid?: boolean
  required?: boolean
  name?: string
  id?: string
  ref?: Ref<HTMLInputElement>
  onBlur?: () => void
  className?: string
  /** Names the field for assistive tech ("Blur"). */
  'aria-label'?: string
  'aria-labelledby'?: string
}

function ScrubNumberField({
  value: valueProp,
  defaultValue = 0,
  onValueChange,
  min,
  max,
  step = 1,
  largeStep = step * 10,
  label,
  unit,
  size = 'default',
  locale,
  disabled,
  readOnly,
  invalid,
  required,
  name,
  id,
  ref,
  onBlur,
  className,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
}: ScrubNumberFieldProps) {
  const providerLocale = useLocale()
  const format = numberFormat(locale ?? providerLocale, { maximumFractionDigits: 6, useGrouping: false })
  const [value, setValue] = useControllableState(valueProp, clamp(defaultValue, min, max))
  const [draft, setDraft] = useState<string | null>(null)
  const [scrubbing, setScrubbing] = useState(false)
  const drag = useRef<{ x: number; carry: number; value: number } | null>(null)
  const inert = disabled || readOnly

  const commit = (next: number) => {
    const clamped = tidy(clamp(next, min, max))
    if (clamped === value) return
    setValue(clamped)
    onValueChange?.(clamped)
  }

  const read = (text: string) => {
    const t = text.trim().replace(/\s/g, '')
    const n = Number(t.includes('.') ? t : t.replace(',', '.'))
    return t === '' || Number.isNaN(n) ? null : n
  }
  const commitDraft = () => {
    if (draft === null) return
    const n = read(draft)
    if (n !== null) commit(n)
    setDraft(null)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') return commitDraft()
    if (event.key === 'Escape') return setDraft(null)
    if (inert) return
    const pace = event.shiftKey ? 10 : event.altKey ? 0.1 : 1
    const base = draft !== null ? (read(draft) ?? value) : value
    let next: number | undefined
    if (event.key === 'ArrowUp') next = base + step * pace
    else if (event.key === 'ArrowDown') next = base - step * pace
    else if (event.key === 'PageUp') next = base + largeStep
    else if (event.key === 'PageDown') next = base - largeStep
    else if (event.key === 'Home' && min !== undefined) next = min
    else if (event.key === 'End' && max !== undefined) next = max
    if (next === undefined) return
    event.preventDefault()
    setDraft(null)
    commit(next)
  }

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (inert || event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = { x: event.clientX, carry: 0, value }
  }
  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    const d = drag.current
    if (!d) return
    const pace = event.shiftKey ? 10 : event.altKey ? 0.1 : 1
    d.carry += (event.clientX - d.x) / PIXELS_PER_STEP
    d.x = event.clientX
    const whole = Math.trunc(d.carry)
    if (whole === 0) return
    d.carry -= whole
    d.value = clamp(d.value + whole * step * pace, min, max)
    if (!scrubbing) {
      setScrubbing(true)
      setDraft(null)
      ;(document.activeElement as HTMLElement | null)?.blur?.()
    }
    commit(d.value)
  }
  const endDrag = () => {
    drag.current = null
    setScrubbing(false)
  }

  // The cursor stays a resize arrow wherever the captured pointer travels.
  useEffect(() => {
    if (!scrubbing) return
    const previous = document.body.style.cursor
    document.body.style.cursor = 'ew-resize'
    return () => {
      document.body.style.cursor = previous
    }
  }, [scrubbing])

  const shown = format.format(value)
  return (
    // shape: the compact field takes the theme's small control height and corner (h-control-sm, rounded-field-sm)
    <InputGroup
      role={undefined}
      data-slot="scrub-number-field"
      data-yj-scrubbing={scrubbing || undefined}
      className={cn('own:select-none', size === 'sm' && 'own:h-control-sm own:rounded-field-sm', className)}
    >
      {label !== undefined && (
        <InputGroupAddon
          aria-hidden
          data-slot="scrub-number-field-handle"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className={cn(
            'min-w-6 own:cursor-ew-resize touch-none own:ps-2 own:pe-0 own:text-ui-sm own:font-medium',
            'hover:text-fg data-yj-scrubbing:text-fg',
            (disabled || readOnly) && 'own:cursor-default',
          )}
          data-yj-scrubbing={scrubbing || undefined}
        >
          {label}
        </InputGroupAddon>
      )}
      <input
        ref={ref}
        id={id}
        name={name}
        role="spinbutton"
        inputMode="decimal"
        autoComplete="off"
        spellCheck={false}
        data-slot="input-group-control"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuetext={unit ? `${shown} ${unit}` : shown}
        aria-invalid={invalid || undefined}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        value={draft ?? shown}
        onChange={(event) => setDraft(event.currentTarget.value)}
        onFocus={(event) => event.currentTarget.select()}
        onBlur={() => {
          commitDraft()
          onBlur?.()
        }}
        onKeyDown={onKeyDown}
        className={cn(inputGroupControlClass, 'h-full own:px-2 own:tabular-nums own:select-text', label !== undefined && 'own:ps-1.5')}
      />
      {unit !== undefined && (
        <InputGroupAddon align="inline-end" className="own:pe-2.5 own:ps-0">
          <InputGroupText className="own:text-ui-sm">{unit}</InputGroupText>
        </InputGroupAddon>
      )}
    </InputGroup>
  )
}

export { ScrubNumberField, type ScrubNumberFieldProps }
