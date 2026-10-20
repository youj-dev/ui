import { Input as InputPrimitive } from '@base-ui/react/input'
import { cn } from '../../lib/utils'
import { useFieldRequired } from './field'

/* Shared by Input, Textarea and the Select trigger so every text-like control
 * has one border, one hover and one focus treatment. */
const fieldControlClass = cn(
  'w-full min-w-0 own:rounded-field border own:border-(--ui--field-line) own:bg-(--ui--field-fill) text-ui text-fg',
  'transition-[color,background-color,border-color,box-shadow] yj-duration-fast ease-standard',
  'placeholder:text-fg-muted own:hover:border-(--ui--field-line-hover) own:hover:bg-(--ui--field-fill-hover)',
  'own:focus-field',
  'aria-invalid:border-danger data-invalid:border-danger',
  'disabled:cursor-not-allowed disabled:bg-band disabled:opacity-50 disabled:hover:border-(--ui--field-line)',
  // 16px text on touch keeps iOS from zooming the page on focus.
  'touch:text-base',
)

function Input({ className, type, required, ...props }: InputPrimitive.Props) {
  const fieldRequired = useFieldRequired()
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      required={required ?? fieldRequired}
      className={cn(
        fieldControlClass,
        'own:h-control own:px-2.5 own:[&[readonly]]:bg-band',
        'own:file:me-2 own:file:inline-flex own:file:h-full own:file:border-0 own:file:bg-transparent own:file:text-ui own:file:font-medium own:file:text-fg',
        className,
      )}
      {...props}
    />
  )
}

export { Input, fieldControlClass }
