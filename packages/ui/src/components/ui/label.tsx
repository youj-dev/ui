import type { ComponentProps } from 'react'
import { cn } from '../../lib/utils'

const labelClass = cn(
  // A 20px line box: a 16px box or an 18px switch beside it centers on the
  // first line with a 2px / 1px offset, whatever the label wraps to.
  'own:flex items-center gap-1.5 own:text-ui own:leading-5 own:font-medium own:text-fg select-none',
  'group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50',
  'peer-disabled:cursor-not-allowed peer-disabled:opacity-50 peer-data-disabled:cursor-not-allowed peer-data-disabled:opacity-50',
)

/**
 * The required mark is decorative: the control's own `required` is what a
 * screen reader announces, so the asterisk is hidden from the accessible name.
 */
function RequiredMark() {
  return (
    <span aria-hidden data-slot="required-mark" className="own:-ms-0.5 own:text-fg-muted">
      *
    </span>
  )
}

interface LabelProps extends ComponentProps<'label'> {
  /** Shows the required mark. */
  required?: boolean
}

/** A plain `<label>`. Inside a Field, use FieldLabel, which wires itself to the control. */
function Label({ className, required, children, ...props }: LabelProps) {
  return (
    <label data-slot="label" className={cn(labelClass, className)} {...props}>
      {children}
      {required && <RequiredMark />}
    </label>
  )
}

export { Label, labelClass, RequiredMark }
