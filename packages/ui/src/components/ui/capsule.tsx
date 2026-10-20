import type { ComponentProps } from 'react'
import { cn } from '../../lib/utils'

/* The shell every capsule shares: one row of controls or figures on a
 * floating surface, a step above the page, with just enough inset that the
 * discs inside sit concentric with its ends. It's the control height plus
 * that inset, so a capsule lines up with buttons and fields of its size.
 * Classic draws it as a bordered rounded panel; Bezel makes it a pill (a
 * square theme keeps it square) lifted on a hairline with a lit top edge.
 * Every capsule carries `data-capsule`, the hook the style's recipe keys on,
 * and a `data-slot` of its own (`capsule`, `stat-pill`, `capsule-player`…).
 * Short labels inside take `data-slot="capsule-label"` (a mono eyebrow in
 * Bezel) and units `data-slot="capsule-unit"`. */

interface CapsuleProps extends ComponentProps<'div'> {
  /** `sm` for a dense toolbar; the default lines up with default-size controls. Default `default`. */
  size?: 'sm' | 'default'
}

const capsuleSize = {
  sm: 'h-[calc(var(--spacing-control-sm)+--spacing(2))]',
  default: 'h-[calc(var(--spacing-control)+--spacing(2))]',
}

function Capsule({ className, size = 'default', ...props }: CapsuleProps) {
  return (
    <div
      data-capsule=""
      data-slot="capsule"
      data-yj-tone="float"
      data-size={size}
      className={cn(
        'own:inline-flex max-w-full shrink-0 items-center gap-1 own:rounded-2xl border own:border-line own:bg-chrome-float own:p-1 own:text-fg own:shadow-xs',
        capsuleSize[size],
        className,
      )}
      {...props}
    />
  )
}

/** A short name inside a capsule, before what it names: a mono eyebrow in Bezel. */
function CapsuleLabel({ className, ...props }: ComponentProps<'span'>) {
  return <span data-slot="capsule-label" className={cn('shrink-0 own:px-2 own:text-ui-sm whitespace-nowrap own:text-fg-muted', className)} {...props} />
}

export { Capsule, CapsuleLabel, type CapsuleProps }
