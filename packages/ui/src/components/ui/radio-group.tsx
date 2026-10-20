'use client'

import { Radio as RadioPrimitive } from '@base-ui/react/radio'
import { DirectionProvider } from '@base-ui/react/direction-provider'
import { RadioGroup as RadioGroupPrimitive } from '@base-ui/react/radio-group'
import { useYouj, useDirection } from '@youj/core/lib/youj/provider'
import { cn } from '../../lib/utils'
import { useFieldRequired } from './field'

/* Arrow keys move the selection (Base UI's roving focus). The dot grows in on
 * the enter curve as the previous one shrinks out on the exit curve, both on
 * the fast token; a reversal mid-way picks up from the current scale. */

function RadioGroup({ className, required, ...props }: RadioGroupPrimitive.Props) {
  const direction = useDirection()
  const fieldRequired = useFieldRequired()
  return (
    <DirectionProvider direction={direction}>
      <RadioGroupPrimitive
        data-slot="radio-group"
        required={required ?? fieldRequired}
        className={cn('grid own:w-full own:gap-2.5', className)}
        {...props}
      />
    </DirectionProvider>
  )
}

function RadioGroupItem({ className, ...props }: RadioPrimitive.Root.Props) {
  const k = useYouj()
  return (
    <RadioPrimitive.Root
      data-slot="radio-group-item"
      data-reduced-motion={k.reduced || undefined}
      className={cn(
        'peer group/radio relative inline-flex own:size-4 shrink-0 items-center justify-center own:rounded-full border own:border-line-control own:bg-transparent',
        'transition-[background-color,border-color,scale] yj-duration-fast ease-standard',
        'own:hover:border-fg-muted focus-ring',
        // Inside a choice card the card carries the ring.
        'in-[[data-slot=field-label]:has(>[data-slot=field])]:focus-visible:outline-none',
        'active:scale-90 active:yj-duration-instant reduced:active:scale-100',
        'own:data-checked:border-accent own:data-checked:bg-accent data-checked:yj-solid-hover',
        'own:aria-invalid:not-data-checked:border-danger own:data-invalid:not-data-checked:border-danger',
        'data-disabled:cursor-not-allowed data-disabled:opacity-50 data-disabled:active:scale-100',
        'after:absolute after:-inset-1 touch:after:-inset-3.5',
        className,
      )}
      {...props}
    >
      <RadioPrimitive.Indicator
        keepMounted
        data-slot="radio-group-indicator"
        className={cn(
          'own:size-1.5 own:rounded-full own:bg-on-accent',
          'scale-0 transition-[scale] yj-duration-fast ease-exit data-checked:scale-100 data-checked:ease-enter',
          'reduced:transition-none',
        )}
      />
    </RadioPrimitive.Root>
  )
}

export { RadioGroup, RadioGroupItem }
