import type { ComponentProps } from 'react'
import { LoaderRingIcon } from '@youj/icons/components/youj/icons/loader-ring'
import { useComponentLabels } from '@youj/core/labels'
import { spinnerLabels } from '@youj/core/labels'
import { cn } from '../../lib/utils'

interface SpinnerProps extends Omit<ComponentProps<'span'>, 'children'> {
  /**
   * Announced politely. Pass `null` when the surrounding thing already
   * announces the wait (a loading Button, an aria-busy region): two
   * announcements for one wait are worse than none.
   */
  label?: string | null
  /** Rendered size in px. Default 16. */
  size?: number
}

/**
 * youj's LoaderRingIcon: a constant-rate turn with a breathing arc, paused
 * offscreen and in hidden tabs, time-scaled by the provider. Under reduced
 * motion it holds a static quarter arc on a faint track.
 */
function Spinner({ label, size = 16, className, ...props }: SpinnerProps) {
  const labels = useComponentLabels(spinnerLabels)
  return (
    <span
      data-slot="spinner"
      role={label === null ? undefined : 'status'}
      className={cn('own:inline-flex own:shrink-0 own:items-center own:justify-center', className)}
      {...props}
    >
      {/* A constant 1.5px stroke at small sizes, whatever the size. */}
      <LoaderRingIcon size={size} strokeWidth={Math.max(1.5, 36 / size)} />
      {label !== null && <span className="sr-only">{label ?? labels.loading}</span>}
    </span>
  )
}

export { Spinner, type SpinnerProps }
