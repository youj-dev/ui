'use client'

import { Checkbox as CheckboxPrimitive } from '@base-ui/react/checkbox'
import { useEffect, useRef } from 'react'
import { m } from 'motion/react'
import { useYouj } from '@youj/core/lib/youj/provider'
import { cn } from '../../lib/utils'
import { useFieldRequired } from './field'
import { MotionFeatures, useSoundCue } from '@youj/core'

/* A tick is two moves: the fill scales up out of the box (.6 → 1 on the
 * snappy spring, opaque at once) and the check draws itself on the same
 * spring. The check and the mixed state's dash are one path with the same
 * three vertices, so going between them morphs the stroke instead of swapping
 * glyphs. An untick fades the mark and the fill on the instant token while
 * the fill sinks back; both stay mounted, so a reversal mid-flight never
 * jumps. The press scales the box to .95. With sound on, a tick and an untick
 * sound as the stroke starts. */

/** The box both the Checkbox and its decorative CheckboxMark wear. The fill (CheckboxGlyph) carries the checked colour. */
const boxClass = cn(
  'relative own:inline-flex own:size-4 shrink-0 items-center justify-center own:rounded-sm border border-line-control own:bg-transparent own:text-on-accent',
  'transition-[border-color,scale] yj-duration-fast ease-standard',
  'data-checked:border-accent data-indeterminate:border-accent',
)

interface CheckboxProps extends CheckboxPrimitive.Root.Props {
  /** With sound on (`YoujProvider`’s `sound`), ticking plays `toggleOn` and unticking `toggleOff`. `false` keeps this one silent. Default true. */
  sound?: boolean
}

function Checkbox({ className, required, sound = true, onCheckedChange, ...props }: CheckboxProps) {
  const k = useYouj()
  const cue = useSoundCue()
  const fieldRequired = useFieldRequired()
  return (
    <MotionFeatures>
      <CheckboxPrimitive.Root
        data-slot="checkbox"
        data-reduced-motion={k.reduced || undefined}
        required={required ?? fieldRequired}
        onCheckedChange={(checked, details) => {
          onCheckedChange?.(checked, details)
          if (sound && !details.isCanceled) cue(checked ? 'toggleOn' : 'toggleOff')
        }}
        className={cn(
          'peer group/checkbox',
          boxClass,
          'hover:border-fg-muted focus-ring',
          // Inside a choice card the card carries the ring.
          'in-[[data-slot=field-label]:has(>[data-slot=field])]:focus-visible:outline-none',
          'active:scale-95 active:yj-duration-instant reduced:active:scale-100',
          'aria-invalid:not-data-checked:border-danger data-invalid:not-data-checked:border-danger',
          'data-disabled:cursor-not-allowed data-disabled:opacity-50 data-disabled:active:scale-100',
          // 24px target (WCAG 2.5.8) from a 16px box; 40px on touch.
          'after:absolute after:-inset-1 touch:after:-inset-3.5',
          className,
        )}
        {...props}
      >
        <CheckboxPrimitive.Indicator
          keepMounted
          data-slot="checkbox-indicator"
          className="pointer-events-none own:grid place-items-center own:rounded-[inherit]"
          render={(indicatorProps, state) => (
            <span {...indicatorProps}>
              <CheckboxGlyph state={state.indeterminate ? 'indeterminate' : state.checked} hover />
            </span>
          )}
        />
      </CheckboxPrimitive.Root>
    </MotionFeatures>
  )
}

/**
 * The Checkbox's look without the control: for rows that are themselves the
 * checkable thing (a multi-select option carries aria-checked), where a real
 * checkbox inside would be a second, nested control. Decorative (aria-hidden).
 * The check draws in and fades out exactly as the Checkbox's does.
 */
function CheckboxMark({ checked, className }: { checked: boolean | 'indeterminate'; className?: string }) {
  const indeterminate = checked === 'indeterminate'
  return (
    <MotionFeatures>
      <span
        aria-hidden
        data-slot="checkbox-mark"
        data-checked={checked === true || undefined}
        data-indeterminate={indeterminate || undefined}
        className={cn(boxClass, 'pointer-events-none', className)}
      >
        <span className="own:grid place-items-center rounded-[inherit]">
          <CheckboxGlyph state={indeterminate ? 'indeterminate' : checked === true} />
        </span>
      </span>
    </MotionFeatures>
  )
}

/* One stroke, three vertices: a check, or the dash through the middle. In a 24 box, drawn at 14px. */
const CHECK = 'M4 12.5 L9 17.5 L20 6.5'
const DASH = 'M6.5 12 L12 12 L17.5 12'

/** The fill and the mark, shared by the Checkbox and CheckboxMark. */
function CheckboxGlyph({ state, hover = false }: { state: boolean | 'indeterminate'; hover?: boolean }) {
  const k = useYouj()
  const on = state !== false
  // Unticked, the stroke keeps the shape it last showed, so it fades without morphing; from there it
  // arrives as its new shape and draws in. Only a change between check and dash while shown morphs.
  const last = useRef({ on, shape: state === 'indeterminate' ? DASH : CHECK })
  const shape = on ? (state === 'indeterminate' ? DASH : CHECK) : last.current.shape
  const morph = on && last.current.on && last.current.shape !== shape
  useEffect(() => {
    last.current = { on, shape }
  })
  const spring = k.reduced ? { type: false as const } : k.spring('snappy')
  const fade = k.reduced || on ? { type: false as const } : k.tween('instant')
  return (
    <>
      <m.span
        aria-hidden
        data-slot="checkbox-fill"
        initial={false}
        animate={{ scale: on ? 1 : 0.6, opacity: on ? 1 : 0 }}
        transition={{ scale: spring, opacity: fade }}
        className={cn('absolute -inset-(--yj-stroke-width,1px) own:rounded-[inherit] own:bg-accent', hover && 'transition-colors yj-duration-fast ease-standard own:group-hover/checkbox:yj-solid-shade')}
      />
      <svg aria-hidden viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className="relative">
        <m.path
          data-slot="checkbox-check"
          data-shape={state === 'indeterminate' ? 'dash' : 'check'}
          initial={false}
          animate={{ d: shape, pathLength: on ? 1 : 0, opacity: on ? 1 : 0 }}
          transition={{
            d: morph ? spring : { type: false },
            // Undrawn once it has faded, so the next tick draws from nothing.
            pathLength: on ? spring : { type: false, delay: k.reduced ? 0 : k.duration('instant') },
            opacity: fade,
          }}
        />
      </svg>
    </>
  )
}

export { Checkbox, CheckboxMark, type CheckboxProps }
