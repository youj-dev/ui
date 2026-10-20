'use client'

import type { ComponentProps } from 'react'
import { useSoundCue } from '@youj/core'
import { useControllableState } from '../../hooks/use-controllable-state'
import { ToggleGroup, ToggleGroupItem } from './toggle-group'

/* One choice out of a few, always made: plain labels on a hairline, with a
 * 2px accent bar that glides to the pressed segment (`variant="pill"` makes it
 * a recessed track with a raised key instead). It is ToggleGroup's `segmented`
 * look with a single-string value that can't be emptied, which is what a view
 * switcher or a range picker wants: pressing the pressed segment again does
 * nothing. The glide is motion's SlidingIndicator (the `smooth` spring,
 * retargeting mid-flight); under reduced motion it jumps. With sound on, a
 * new choice sounds as the indicator sets off. */

type ToggleGroupProps = ComponentProps<typeof ToggleGroup>

interface SegmentedControlProps
  extends Omit<ToggleGroupProps, 'value' | 'defaultValue' | 'onValueChange' | 'multiple' | 'variant' | 'spacing'> {
  /** `underline` (a bar on a hairline) or `pill` (a raised key in a recessed track). Default 'underline'. */
  variant?: 'underline' | 'pill'
  /** The pressed segment's value (controlled). */
  value?: string
  /** The segment pressed at first (uncontrolled). Leave it out to start with none pressed. */
  defaultValue?: string
  /** Called with the newly pressed segment's value. Never called with an empty value. */
  onValueChange?: (value: string) => void
  /** Names the control for assistive tech, e.g. "View" or "Range". */
  'aria-label'?: string
  /** With sound on (`YoujProvider`’s `sound`), a new choice plays `select`. `false` keeps this one silent. Default true. */
  sound?: boolean
}

function SegmentedControl({ variant = 'underline', value, defaultValue = '', onValueChange, sound = true, ...props }: SegmentedControlProps) {
  const [current, setCurrent] = useControllableState(value, defaultValue)
  const cue = useSoundCue()
  return (
    <ToggleGroup
      {...props}
      data-slot="segmented-control"
      variant={variant === 'pill' ? 'pill' : 'segmented'}
      value={current ? [current] : []}
      onValueChange={(next) => {
        // Pressing the pressed segment would empty the group: a segmented control always has a choice.
        const pressed = next[0]
        if (pressed === undefined || pressed === current) return
        setCurrent(pressed)
        onValueChange?.(pressed)
        if (sound) cue('select')
      }}
    />
  )
}

type SegmentedControlItemProps = Omit<ComponentProps<typeof ToggleGroupItem>, 'variant' | 'value'> & {
  /** The value this segment stands for. */
  value: string
}

function SegmentedControlItem(props: SegmentedControlItemProps) {
  return <ToggleGroupItem data-slot="segmented-control-item" {...props} />
}

export { SegmentedControl, SegmentedControlItem, type SegmentedControlProps, type SegmentedControlItemProps }
