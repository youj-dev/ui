'use client'

import { Toggle as TogglePrimitive } from '@base-ui/react/toggle'
import { type VariantProps } from 'class-variance-authority'
import { useSoundCue } from '@youj/core'
import { useYouj } from '@youj/core/lib/youj/provider'
import { cn } from '../../lib/utils'
import { toggleVariants } from './toggle.variants'

/* A two-state button (aria-pressed). Pressed reads as a filled neutral key
 * with full-strength text; the accent stays reserved for actions. Same
 * precise press as Button. With sound on, pressing it in plays
 * `toggleOn` and letting it out `toggleOff`. */

interface ToggleProps extends TogglePrimitive.Props, VariantProps<typeof toggleVariants> {
  /** With sound on (`YoujProvider`’s `sound`), pressing plays `toggleOn` and releasing `toggleOff`. `false` keeps this one silent. Default true. */
  sound?: boolean
}

function Toggle({ className, variant = 'default', size = 'default', sound = true, onPressedChange, ...props }: ToggleProps) {
  const k = useYouj()
  const cue = useSoundCue()
  return (
    <TogglePrimitive
      data-slot="toggle"
      data-reduced-motion={k.reduced || undefined}
      onPressedChange={(pressed, details) => {
        onPressedChange?.(pressed, details)
        if (sound && !details.isCanceled) cue(pressed ? 'toggleOn' : 'toggleOff')
      }}
      className={cn(toggleVariants({ variant, size }), 'touch:yj-hit', className)}
      {...props}
    />
  )
}

export { Toggle, toggleVariants, type ToggleProps }
