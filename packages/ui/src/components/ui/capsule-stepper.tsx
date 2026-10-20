'use client'

import { useId, useMemo, useRef, type Ref } from 'react'
import { NumberField as NumberFieldPrimitive } from '@base-ui/react/number-field'
import { animate } from 'motion/react'
import { MinusIcon } from '@youj/icons/components/youj/icons/minus'
import { PlusIcon } from '@youj/icons/components/youj/icons/plus'
import { capsuleStepperLabels, useComponentLabels } from '@youj/core/labels'
import { useYouj, useLocale } from '@youj/core/lib/youj/provider'
import { cn, numberFormat } from '../../lib/utils'
import { Button } from './button'
import { Capsule, CapsuleLabel } from './capsule'

/* − value + in a capsule, for a number you nudge more than type: a tempo, a
 * zoom, a count of seats. It's Base UI's NumberField, so the value parses and
 * formats with Intl in the locale, clamps to min/max, steps by `step` (Shift
 * with an arrow by `largeStep`), repeats while a button is held, and can be
 * typed; the discs disable at the ends.
 * Motion: each step rolls the number into place from the side it moved (up
 * from below for more, down from above for less) on the snappy spring, inside
 * a window that clips it, so a held button reads as a counter spinning; a
 * reversal mid-roll starts from where it is. Reduced motion: the number
 * changes in place. */

interface CapsuleStepperProps {
  value?: number | null
  defaultValue?: number | null
  onValueChange?: (value: number | null) => void
  min?: number
  max?: number
  /** Per press and ArrowUp/Down. Default 1. */
  step?: number
  /** Per Shift+ArrowUp/Down. Default 10. */
  largeStep?: number
  /** Intl.NumberFormat options: { maximumFractionDigits: 1 }, { style: 'percent' }… */
  format?: Intl.NumberFormatOptions
  /** Default: the YoujProvider locale. */
  locale?: Intl.LocalesArgument
  /** A short eyebrow at the start ("Tempo"). It names the field too, unless `aria-label` does. */
  label?: string
  'aria-label'?: string
  /** Set small and muted after the value ("BPM", "×"), and read after it. */
  unit?: string
  size?: 'sm' | 'default'
  disabled?: boolean
  readOnly?: boolean
  name?: string
  id?: string
  /** Classes for the capsule. */
  className?: string
  ref?: Ref<HTMLInputElement>
}

const STEPS = new Set(['increment-press', 'decrement-press', 'keyboard', 'wheel'])

function CapsuleStepper({
  value,
  defaultValue,
  onValueChange,
  min,
  max,
  step = 1,
  largeStep = 10,
  format,
  locale: localeProp,
  label,
  'aria-label': ariaLabel,
  unit,
  size = 'default',
  disabled,
  readOnly,
  name,
  id,
  className,
  ref,
}: CapsuleStepperProps) {
  const k = useYouj()
  const labels = useComponentLabels(capsuleStepperLabels)
  const defaultLocale = useLocale()
  const locale = localeProp ?? defaultLocale
  const unitId = useId()
  const input = useRef<HTMLInputElement | null>(null)
  const last = useRef<number | null>(value ?? defaultValue ?? null)
  // The window fits the widest value it can show, so the capsule never jitters as digits change.
  const chars = useMemo(() => {
    const f = numberFormat(locale, format)
    return Math.max(2, ...[min, max, value ?? defaultValue ?? 0].filter((n): n is number => typeof n === 'number' && Number.isFinite(n)).map((n) => f.format(n).length))
  }, [locale, format, min, max, value, defaultValue])
  // The discs fill the capsule’s inner height, so their curves sit concentric with its ends.
  const disc = size === 'sm' ? 'icon-sm' : 'icon'

  return (
    <NumberFieldPrimitive.Root
      data-slot="capsule-stepper"
      id={id}
      value={value}
      defaultValue={defaultValue ?? undefined}
      onValueChange={(next, details) => {
        const previous = last.current
        last.current = next
        if (STEPS.has(details.reason) && !k.reduced && input.current && next !== null && previous !== null && next !== previous) {
          animate(input.current, { y: [next > previous ? '70%' : '-70%', '0%'] }, k.spring('snappy'))
        }
        onValueChange?.(next)
      }}
      min={min}
      max={max}
      step={step}
      largeStep={largeStep}
      format={format}
      locale={locale}
      disabled={disabled}
      readOnly={readOnly}
      name={name}
      className="own:inline-flex max-w-full"
    >
      <NumberFieldPrimitive.Group render={<Capsule size={size} data-slot="capsule-stepper-group" />} className={cn('gap-0.5 data-disabled:opacity-50', className)}>
        {label && <CapsuleLabel aria-hidden>{label}</CapsuleLabel>}
        <NumberFieldPrimitive.Decrement render={<Button variant="ghost" size={disc} aria-label={labels.decrease} className="own:text-fg-muted" />}>
          <MinusIcon trigger="none" />
        </NumberFieldPrimitive.Decrement>
        <span data-slot="capsule-stepper-window" className="relative own:flex h-full items-center overflow-hidden own:rounded-lg focus-ring-within">
          <NumberFieldPrimitive.Input
            ref={(node: HTMLInputElement | null) => {
              input.current = node
              if (typeof ref === 'function') ref(node)
              else if (ref) ref.current = node
            }}
            data-slot="capsule-stepper-value"
            aria-label={ariaLabel ?? label}
            aria-describedby={unit ? unitId : undefined}
            style={{ width: `calc(${chars}ch + 0.75rem)` }}
            className="h-full bg-transparent own:text-center own:font-mono own:text-ui-lg font-medium text-fg own:tabular-nums outline-none"
          />
        </span>
        {unit && (
          <span id={unitId} data-slot="capsule-unit" className="own:-ms-1 own:pe-1 own:text-ui-sm own:text-fg-muted">
            {unit}
          </span>
        )}
        <NumberFieldPrimitive.Increment render={<Button variant="ghost" size={disc} aria-label={labels.increase} className="own:text-fg-muted" />}>
          <PlusIcon trigger="none" />
        </NumberFieldPrimitive.Increment>
      </NumberFieldPrimitive.Group>
    </NumberFieldPrimitive.Root>
  )
}

export { CapsuleStepper, type CapsuleStepperProps }
