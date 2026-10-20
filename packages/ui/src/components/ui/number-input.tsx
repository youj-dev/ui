'use client'

import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type Ref } from 'react'
import { NumberField as NumberFieldPrimitive } from '@base-ui/react/number-field'
import { MinusIcon } from '@youj/icons/components/youj/icons/minus'
import { PlusIcon } from '@youj/icons/components/youj/icons/plus'
import { useYouj, useLocale } from '@youj/core/lib/youj/provider'
import { Counter } from '@youj/motion'
import { useComponentLabels } from '@youj/core/labels'
import { numberInputLabels } from '@youj/core/labels'
import { cn } from '../../lib/utils'
import { useFieldRequired } from './field'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupText, inputGroupControlClass } from './input-group'

/* A number with steppers: Base UI's NumberField (parsing and formatting with
 * Intl in the locale, min/max clamping, step / largeStep, press-and-hold on
 * the buttons, ArrowUp/Down, Shift+arrows by largeStep, Home/End) rendered as an
 * InputGroup, with InputGroupButtons for − and + at the end. `format` takes
 * Intl.NumberFormat options, so currency, percent (0.25 shows as 25%) and
 * units come from the platform; `unit` and `prefix` add plain addons instead.
 * The mouse wheel doesn't change the value unless `allowWheelScrub` (a
 * scrolling page shouldn't edit a form).
 *
 * Motion: a step (a button, an arrow key, the wheel) rolls the figure like
 * an odometer: motion's Counter is laid over the input's text, which goes
 * clear underneath, and each digit turns the way the value moved, so a held
 * button reads as a count. Once the value rests, the input's own text shows
 * again; typing drops the roll at once. The buttons press like every Button.
 * Reduced motion: the value just changes. */

interface NumberInputProps {
  value?: number | null
  defaultValue?: number | null
  onValueChange?: (value: number | null) => void
  min?: number
  max?: number
  /** Per ArrowUp/Down and button press. Default 1. */
  step?: number
  /** Per Shift+ArrowUp/Down. Default 10. */
  largeStep?: number
  /** Intl.NumberFormat options: { style: 'currency', currency: 'USD' }, { style: 'percent' }, { style: 'unit', unit: 'gigabyte' }… */
  format?: Intl.NumberFormatOptions
  /** Default: the YoujProvider locale. */
  locale?: Intl.LocalesArgument
  /** A plain suffix addon ("GB", "req/s"). */
  unit?: ReactNode
  /** A plain prefix addon. */
  prefix?: ReactNode
  /** Let the mouse wheel step the value while the field is focused. Default false. */
  allowWheelScrub?: boolean
  /** Shows the − / + buttons. Default true. */
  steppers?: boolean
  placeholder?: string
  disabled?: boolean
  readOnly?: boolean
  required?: boolean
  name?: string
  id?: string
  ref?: Ref<HTMLInputElement>
  onBlur?: () => void
  className?: string
  'aria-label'?: string
}

const STEPS = new Set(['increment-press', 'decrement-press', 'keyboard', 'wheel'])

function NumberInput({
  value,
  defaultValue,
  onValueChange,
  min,
  max,
  step = 1,
  largeStep = 10,
  format,
  locale,
  unit,
  prefix,
  allowWheelScrub = false,
  steppers = true,
  placeholder,
  disabled,
  readOnly,
  required,
  name,
  id,
  ref,
  onBlur,
  className,
  'aria-label': ariaLabel,
}: NumberInputProps) {
  const k = useYouj()
  const labels = useComponentLabels(numberInputLabels)
  const defaultLocale = useLocale()
  const tag = locale === undefined ? defaultLocale : String(Array.isArray(locale) ? (locale[0] ?? defaultLocale) : locale)
  const fieldRequired = useFieldRequired()
  const input = useRef<HTMLInputElement | null>(null)
  const last = useRef<number | null>(value ?? defaultValue ?? null)
  // The roll over the input: where its text sits, and the values it turns between.
  const [roll, setRoll] = useState<{ from: number; to: number; style: CSSProperties } | null>(null)
  const rest = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(rest.current), [])

  return (
    <NumberFieldPrimitive.Root
      data-slot="number-input"
      id={id}
      value={value}
      defaultValue={defaultValue ?? undefined}
      onValueChange={(next, details) => {
        const previous = last.current
        last.current = next
        const el = input.current
        if (STEPS.has(details.reason) && !k.reduced && el && next !== null && previous !== null && next !== previous) {
          const cs = getComputedStyle(el)
          // Laid exactly over the input's text box, in its type.
          const style: CSSProperties = {
            left: el.offsetLeft,
            top: el.offsetTop,
            width: el.offsetWidth,
            height: el.offsetHeight,
            paddingInline: `${cs.paddingLeft} ${cs.paddingRight}`,
            fontFamily: cs.fontFamily,
            fontSize: cs.fontSize,
            fontWeight: cs.fontWeight,
            lineHeight: cs.lineHeight,
            letterSpacing: cs.letterSpacing,
            justifyContent: cs.textAlign === 'right' || cs.textAlign === 'end' ? 'flex-end' : cs.textAlign === 'center' ? 'center' : 'flex-start',
          }
          setRoll((r) => ({ from: r?.from ?? previous, to: next, style: r?.style ?? style }))
          clearTimeout(rest.current)
          rest.current = setTimeout(() => setRoll(null), k.ms('deliberate'))
        } else if (roll) {
          clearTimeout(rest.current)
          setRoll(null)
        }
        onValueChange?.(next)
      }}
      min={min}
      max={max}
      step={step}
      largeStep={largeStep}
      format={format}
      locale={locale ?? defaultLocale}
      allowWheelScrub={allowWheelScrub}
      disabled={disabled}
      readOnly={readOnly}
      required={required ?? fieldRequired}
      name={name}
      className={cn('w-full min-w-0', className)}
    >
      <NumberFieldPrimitive.Group render={<InputGroup />}>
        {prefix !== undefined && (
          <InputGroupAddon>
            <InputGroupText>{prefix}</InputGroupText>
          </InputGroupAddon>
        )}
        <NumberFieldPrimitive.Input
          ref={(node: HTMLInputElement | null) => {
            input.current = node
            if (typeof ref === 'function') ref(node)
            else if (ref) ref.current = node
          }}
          data-slot="input-group-control"
          data-rolling={roll ? '' : undefined}
          aria-label={ariaLabel}
          placeholder={placeholder}
          onBlur={onBlur}
          className={cn(inputGroupControlClass, 'h-full px-2.5 own:tabular-nums data-rolling:text-transparent data-rolling:caret-fg')}
        />
        {roll && (
          <span
            aria-hidden
            data-slot="number-input-roll"
            className="pointer-events-none absolute own:flex items-center own:text-fg own:tabular-nums"
            style={roll.style}
          >
            {/* The input's text, exactly: none of the units-small styling a figure gets elsewhere. */}
            <Counter
              mode="roll"
              from={roll.from}
              value={roll.to}
              format={format}
              locale={tag}
              inView={false}
              className="[&_[data-part]]:[color:inherit] [&_[data-part]]:[font-size:inherit] [&_[data-part]]:[letter-spacing:inherit] [&>[dir=ltr]]:items-baseline"
            />
          </span>
        )}
        {unit !== undefined && (
          <InputGroupAddon align="inline-end">
            <InputGroupText>{unit}</InputGroupText>
          </InputGroupAddon>
        )}
        {steppers && (
          <InputGroupAddon align="inline-end" className="gap-0.5 own:ps-1">
            <NumberFieldPrimitive.Decrement
              render={<InputGroupButton size="icon-xs" aria-label={labels.decrease} className="text-fg-muted" />}
            >
              <MinusIcon trigger="none" />
            </NumberFieldPrimitive.Decrement>
            <NumberFieldPrimitive.Increment
              render={<InputGroupButton size="icon-xs" aria-label={labels.increase} className="text-fg-muted" />}
            >
              <PlusIcon trigger="none" />
            </NumberFieldPrimitive.Increment>
          </InputGroupAddon>
        )}
      </NumberFieldPrimitive.Group>
    </NumberFieldPrimitive.Root>
  )
}

export { NumberInput, type NumberInputProps }
