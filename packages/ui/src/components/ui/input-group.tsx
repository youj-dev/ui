'use client'

import type { ComponentProps, MouseEvent } from 'react'
import { Input as InputPrimitive } from '@base-ui/react/input'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import { Button } from './button'
import { useFieldRequired } from './field'
import type { TextareaProps } from './textarea'

/* One bordered frame; the text control inside is borderless and the frame
 * takes its focus and invalid treatment. Addons sit on the inline edges (or
 * block edges for toolbars), and clicking an addon's empty space focuses the
 * control, as it would on a native field. */

function InputGroup({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="input-group"
      role="group"
      className={cn(
        'group/input-group relative own:flex own:h-control w-full min-w-0 items-center own:rounded-field own:border own:border-(--ui--field-line) own:bg-(--ui--field-fill)',
        'transition-[border-color,box-shadow] own:yj-duration-fast own:ease-standard',
        'own:hover:border-(--ui--field-line-hover) own:hover:bg-(--ui--field-fill-hover) own:focus-field-within',
        'own:has-[[data-slot=input-group-control][aria-invalid=true]]:border-danger own:has-[[data-slot=input-group-control][data-invalid]]:border-danger',
        // Disabled when its text control is, not when any button inside is (a stepper at its limit).
        'own:has-[[data-slot=input-group-control]:disabled]:cursor-not-allowed own:has-[[data-slot=input-group-control]:disabled]:bg-band',
        'has-[[data-slot=input-group-control]:disabled]:opacity-50 own:has-[[data-slot=input-group-control]:disabled]:hover:border-(--ui--field-line)',
        // A frame that grows past one line takes the capped corner: a pill can't hold a paragraph.
        'own:has-[>textarea]:rounded-field-area own:has-[>[data-align=block-end]]:rounded-field-area own:has-[>[data-align=block-start]]:rounded-field-area',
        'own:has-[>textarea]:h-auto own:has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col own:has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col',
        'has-[>[data-align=inline-start]]:[&>input]:ps-1.5 has-[>[data-align=inline-end]]:[&>input]:pe-1.5',
        'has-[>[data-align=block-start]]:[&>input]:pb-2.5 has-[>[data-align=block-end]]:[&>input]:pt-2.5',
        className,
      )}
      {...props}
    />
  )
}

const inputGroupAddonVariants = cva(
  "own:flex own:h-auto own:cursor-text items-center justify-center own:gap-1.5 own:py-1.5 own:text-ui own:text-fg-muted own:select-none own:group-has-[[data-slot=input-group-control]:disabled]/input-group:cursor-not-allowed [&>svg:not([class*='size-'])]:size-4",
  {
    variants: {
      align: {
        'inline-start': 'order-first own:ps-2.5 own:has-[>button]:-ms-1 own:has-[>kbd]:-ms-0.5',
        'inline-end': 'order-last own:pe-2.5 own:has-[>button]:-me-1 own:has-[>kbd]:-me-0.5',
        'block-start': 'order-first w-full justify-start own:px-2.5 own:pt-2 own:[.border-b]:pb-2',
        'block-end': 'order-last w-full justify-start own:px-2.5 own:pb-2 own:[.border-t]:pt-2',
      },
    },
    defaultVariants: {
      align: 'inline-start',
    },
  },
)

function InputGroupAddon({
  className,
  align = 'inline-start',
  onClick,
  ...props
}: ComponentProps<'div'> & VariantProps<typeof inputGroupAddonVariants>) {
  const focusControl = (event: MouseEvent<HTMLDivElement>) => {
    onClick?.(event)
    if (event.defaultPrevented || (event.target as HTMLElement).closest('button, a, input, textarea, select')) return
    event.currentTarget.parentElement?.querySelector<HTMLElement>('[data-slot=input-group-control]')?.focus()
  }
  return (
    <div
      data-slot="input-group-addon"
      data-align={align}
      className={cn(inputGroupAddonVariants({ align }), className)}
      onClick={focusControl}
      {...props}
    />
  )
}

const inputGroupButtonVariants = cva('own:shadow-none', {
  variants: {
    size: {
      xs: 'own:h-control-xs own:gap-1 own:rounded-field-xs own:px-1.5',
      sm: 'own:h-control-sm own:gap-1.5 own:rounded-field-sm own:px-2',
      'icon-xs': 'own:size-control-xs own:rounded-field-xs own:p-0',
      'icon-sm': 'own:size-control-sm own:rounded-field-sm own:p-0',
    },
  },
  defaultVariants: {
    size: 'xs',
  },
})

function InputGroupButton({
  className,
  type = 'button',
  variant = 'ghost',
  size = 'xs',
  ...props
}: Omit<ComponentProps<typeof Button>, 'size' | 'type'> &
  VariantProps<typeof inputGroupButtonVariants> & {
    type?: 'button' | 'submit' | 'reset'
  }) {
  return (
    <Button
      type={type}
      data-size={size}
      variant={variant}
      size={size === 'icon-xs' || size === 'icon-sm' ? size : size === 'sm' ? 'sm' : 'xs'}
      className={cn(inputGroupButtonVariants({ size }), className)}
      {...props}
    />
  )
}

function InputGroupText({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span
      className={cn(
        "own:flex items-center own:gap-1.5 own:text-ui own:text-fg-muted [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  )
}

/* The controls inside are bare: the frame owns border, hover and focus. */
const bareControlClass =
  'w-full min-w-0 flex-1 own:bg-transparent own:text-ui own:text-fg outline-none own:placeholder:text-fg-muted own:disabled:cursor-not-allowed own:touch:text-base'

function InputGroupInput({ className, required, ...props }: InputPrimitive.Props) {
  const fieldRequired = useFieldRequired()
  return (
    <InputPrimitive
      data-slot="input-group-control"
      required={required ?? fieldRequired}
      className={cn(bareControlClass, 'own:h-full own:px-2.5', className)}
      {...props}
    />
  )
}

function InputGroupTextarea({ className, rows, cols, wrap, required, ...props }: TextareaProps) {
  const fieldRequired = useFieldRequired()
  return (
    <InputPrimitive
      data-slot="input-group-control"
      render={<textarea rows={rows} cols={cols} wrap={wrap} />}
      required={required ?? fieldRequired}
      className={cn(bareControlClass, 'field-sizing-content block own:min-h-18 own:max-h-64 resize-none own:px-2.5 own:py-2 own:leading-5', className)}
      {...(props as InputPrimitive.Props)}
    />
  )
}

export { InputGroup, InputGroupAddon, InputGroupButton, InputGroupText, InputGroupInput, InputGroupTextarea }
/** The bare text-control look inside an InputGroup, for controls that render their own <input> (a number field, time segments). */
export { bareControlClass as inputGroupControlClass }
