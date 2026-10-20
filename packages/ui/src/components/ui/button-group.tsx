import type { ComponentProps } from 'react'
import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import { Separator } from './separator'
import { buttonGroupVariants } from './button-group.variants'

/* shadcn's button group: buttons, inputs, selects and menus joined into one
 * strip. Joined edges lose their inner corners and the doubled border, and a
 * focused member rises above its neighbors so its ring isn't clipped. Each
 * member keeps its own press and hover. Corners are logical (start/end), so
 * the strip mirrors in RTL. Nested groups sit apart as clusters. */

function ButtonGroup({
  className,
  orientation = 'horizontal',
  ...props
}: ComponentProps<'div'> & VariantProps<typeof buttonGroupVariants>) {
  return (
    <div
      role="group"
      data-slot="button-group"
      data-orientation={orientation}
      className={cn(buttonGroupVariants({ orientation }), className)}
      {...props}
    />
  )
}

/** A static label joined to the strip: a unit, a prefix, a count. */
function ButtonGroupText({ className, render, ...props }: useRender.ComponentProps<'div'>) {
  return useRender({
    defaultTagName: 'div',
    props: mergeProps<'div'>(
      {
        className: cn(
          'own:flex items-center gap-2 rounded-md border border-line bg-band px-2.5 own:text-ui own:font-medium text-fg-muted',
          "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
          className,
        ),
      },
      props,
    ),
    render,
    state: {
      slot: 'button-group-text',
    },
  })
}

/** A hairline between joined members that have no border of their own (filled or ghost buttons). */
function ButtonGroupSeparator({ className, orientation = 'vertical', ...props }: ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="button-group-separator"
      orientation={orientation}
      className={cn(
        'relative self-stretch bg-line data-[orientation=horizontal]:w-auto data-[orientation=vertical]:h-auto',
        className,
      )}
      {...props}
    />
  )
}

export { ButtonGroup, ButtonGroupSeparator, ButtonGroupText, buttonGroupVariants }
