'use client'

import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'
import { Capsule, CapsuleLabel } from './capsule'
import { SegmentedControl, SegmentedControlItem, type SegmentedControlProps } from './segmented-control'

/* Two or three options in a capsule: a SegmentedControl whose track is the
 * capsule itself, so the lit key glides inside the floating pill (motion's
 * SlidingIndicator on the smooth spring, retargeting mid-glide; it jumps
 * under reduced motion). Everything a SegmentedControl does holds: one tab
 * stop, arrows rove, a choice is always made, and a new choice sounds with sound on.
 * A short `label` can lead it as a mono eyebrow, and
 * `iconOnly` keeps just the icons, each named by its label. Past three
 * options, use a SegmentedControl or Tabs. */

interface CapsuleToggleOption {
  value: string
  /** The option's words, and its name when `iconOnly`. */
  label: string
  icon?: ReactNode
}

interface CapsuleToggleProps extends Omit<SegmentedControlProps, 'children' | 'size'> {
  /** Two or three options. */
  options: readonly CapsuleToggleOption[]
  /** A short eyebrow at the start ("View"). It names the group too, unless `aria-label` does. */
  label?: string
  /** Shows only the icons; each option is named by its label. */
  iconOnly?: boolean
  size?: 'sm' | 'default'
}

function CapsuleToggle({ options, label, iconOnly = false, size = 'default', className, 'aria-label': ariaLabel, ...props }: CapsuleToggleProps) {
  return (
    <Capsule data-slot="capsule-toggle" size={size} className={cn('gap-0', className)}>
      {label && <CapsuleLabel aria-hidden>{label}</CapsuleLabel>}
      <SegmentedControl
        {...props}
        aria-label={ariaLabel ?? label}
        size={size}
        variant="pill"
        className="h-full own:bg-transparent own:p-0"
      >
        {options.map((option) => (
          <SegmentedControlItem
            key={option.value}
            value={option.value}
            aria-label={iconOnly ? option.label : undefined}
            // shape: the keys ride inside the capsule, at its corner less the 4px it holds them in
            className={cn('h-full own:rounded-[max(0px,calc(var(--radius-control-lg)-var(--spacing)))]', iconOnly && 'aspect-square own:px-0')}
          >
            {option.icon}
            {!iconOnly && option.label}
          </SegmentedControlItem>
        ))}
      </SegmentedControl>
    </Capsule>
  )
}

export { CapsuleToggle, type CapsuleToggleProps, type CapsuleToggleOption }
