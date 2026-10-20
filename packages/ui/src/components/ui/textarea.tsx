import type { ComponentProps } from 'react'
import { Input as InputPrimitive } from '@base-ui/react/input'
import { cn } from '../../lib/utils'
import { useFieldRequired } from './field'
import { fieldControlClass } from './input'

type TextareaProps = Omit<ComponentProps<'textarea'>, 'value' | 'defaultValue'> & {
  value?: string
  defaultValue?: string
}

/**
 * A textarea rendered through Base UI's field control, so inside a Field it is
 * labeled, described and validated exactly like Input. It grows with its
 * content (field-sizing) up to a cap, then scrolls.
 */
function Textarea({ className, rows, cols, wrap, required, ...props }: TextareaProps) {
  const fieldRequired = useFieldRequired()
  return (
    <InputPrimitive
      data-slot="textarea"
      render={<textarea rows={rows} cols={cols} wrap={wrap} />}
      required={required ?? fieldRequired}
      className={cn(
        fieldControlClass,
        'field-sizing-content block own:rounded-field-area own:min-h-18 own:max-h-64 resize-y own:px-2.5 own:py-1.5 own:leading-5',
        className,
      )}
      {...(props as InputPrimitive.Props)}
    />
  )
}

export { Textarea, type TextareaProps }
