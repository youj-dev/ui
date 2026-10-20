'use client'

import { Toggle } from '../../../components/ui/toggle'
import { cn } from '../../../lib/utils'
import type { SetupStepperOption } from './data'

/* The options as a row of pills that wrap: each a Toggle (aria-pressed), its
 * dot filling in the accent when it's on. The pill follows the theme's
 * corner scale, so a square theme keeps square chips. */

interface OptionChipsProps {
  options: SetupStepperOption[]
  value: string[]
  onValueChange: (value: string[]) => void
  labelledBy: string
}

function OptionChips({ options, value, onValueChange, labelledBy }: OptionChipsProps) {
  return (
    <div role="group" aria-labelledby={labelledBy} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const on = value.includes(option.value)
        return (
          <Toggle
            key={option.value}
            variant="outline"
            size="sm"
            pressed={on}
            onPressedChange={(pressed) => onValueChange(pressed ? [...value, option.value] : value.filter((v) => v !== option.value))}
            className="gap-2 rounded-chip ps-2.5 pe-3 data-pressed:bg-hover"
          >
            <span
              aria-hidden
              className={cn(
                'size-2 shrink-0 rounded-full border border-line-strong transition-[background-color,border-color,scale] yj-duration-fast ease-enter',
                on && 'scale-110 border-accent bg-accent',
              )}
            />
            {option.label}
          </Toggle>
        )
      })}
    </div>
  )
}

export { OptionChips }
