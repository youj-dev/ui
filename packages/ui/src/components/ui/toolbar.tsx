'use client'

import { Toggle as TogglePrimitive } from '@base-ui/react/toggle'
import { DirectionProvider } from '@base-ui/react/direction-provider'
import { Toolbar as ToolbarPrimitive } from '@base-ui/react/toolbar'
import type { VariantProps } from 'class-variance-authority'
import { useYouj, useDirection } from '@youj/core/lib/youj/provider'
import { cn } from '../../lib/utils'
import { fieldControlClass } from './input'
import { toggleVariants } from './toggle'

/* Base UI's toolbar: a row of controls that is one tab stop. The arrow keys
 * rove its buttons, toggles, links and inputs (wrapping at the ends, mirrored in
 * RTL); a disabled button stays focusable so the roving order doesn't jump.
 * A separator turns across the toolbar's orientation by itself.
 * A ToggleGroup placed inside hands its items to the toolbar's roving focus,
 * so its keys join the same arrow-key path. Buttons and toggles share Toggle's key: ink on a transparent key,
 * the hover surface under the pointer, a filled key when pressed, and the
 * same precise press. Reduced motion: presses don't scale. */

type ToolbarSize = NonNullable<VariantProps<typeof toggleVariants>['size']>

function Toolbar({ className, ...props }: ToolbarPrimitive.Root.Props) {
  const direction = useDirection()
  return (
    <DirectionProvider direction={direction}>
      <ToolbarPrimitive.Root
        data-slot="toolbar"
        data-yj-tone="float"
        className={cn(
          'flex w-fit items-center gap-1 own:rounded-lg border own:border-line own:bg-chrome-float own:p-1 own:text-fg own:shadow-xs',
          'data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-stretch',
          'data-[orientation=horizontal]:max-w-full data-[orientation=horizontal]:overflow-x-auto data-[orientation=horizontal]:[scrollbar-width:none] data-[orientation=horizontal]:[&::-webkit-scrollbar]:hidden',
          className,
        )}
        {...props}
      />
    </DirectionProvider>
  )
}

function ToolbarGroup({ className, ...props }: ToolbarPrimitive.Group.Props) {
  return (
    <ToolbarPrimitive.Group
      data-slot="toolbar-group"
      className={cn('flex items-center gap-0.5 data-[orientation=vertical]:flex-col', className)}
      {...props}
    />
  )
}

/** The key every toolbar button and toggle wears: Toggle's, a step smaller by default. */
function useKey(size: ToolbarSize, className: ToolbarPrimitive.Button.Props['className']) {
  const k = useYouj()
  return {
    'data-reduced-motion': k.reduced || undefined,
    className: cn(toggleVariants({ size }), 'touch:yj-hit', className),
  }
}

type ToolbarButtonProps = ToolbarPrimitive.Button.Props & {
  /** The key's size, as Toggle's. Default `sm`. */
  size?: ToolbarSize
}

function ToolbarButton({ className, size = 'sm', ...props }: ToolbarButtonProps) {
  return <ToolbarPrimitive.Button data-slot="toolbar-button" data-size={size} {...useKey(size, className)} {...props} />
}

type ToolbarToggleProps = Omit<ToolbarPrimitive.Button.Props, 'value'> &
  Pick<TogglePrimitive.Props, 'pressed' | 'defaultPressed' | 'onPressedChange' | 'value'> & {
    /** The key's size, as Toggle's. Default `sm`. */
    size?: ToolbarSize
  }

/**
 * A two-state key (aria-pressed) in the toolbar's roving order. Inside a
 * ToggleGroup, pass `value` and the group owns the pressed state.
 */
function ToolbarToggle({
  className,
  size = 'sm',
  pressed,
  defaultPressed,
  onPressedChange,
  value,
  ...props
}: ToolbarToggleProps) {
  return (
    <ToolbarPrimitive.Button
      data-slot="toolbar-toggle"
      data-size={size}
      render={<TogglePrimitive pressed={pressed} defaultPressed={defaultPressed} onPressedChange={onPressedChange} value={value} />}
      {...useKey(size, className)}
      {...props}
    />
  )
}

function ToolbarLink({ className, ...props }: ToolbarPrimitive.Link.Props) {
  return (
    <ToolbarPrimitive.Link
      data-slot="toolbar-link"
      className={cn(
        'relative inline-flex h-control-sm touch:yj-hit items-center own:rounded-md own:px-2 text-ui own:text-fg-muted underline-offset-4 outline-none',
        'transition-colors yj-duration-fast ease-standard hover:text-fg hover:underline focus-ring',
        className,
      )}
      {...props}
    />
  )
}

function ToolbarInput({ className, ...props }: ToolbarPrimitive.Input.Props) {
  return (
    <ToolbarPrimitive.Input
      data-slot="toolbar-input"
      className={cn(fieldControlClass, 'h-control-sm w-40 own:rounded-field-sm own:px-2', className)}
      {...props}
    />
  )
}

function ToolbarSeparator({ className, ...props }: ToolbarPrimitive.Separator.Props) {
  return (
    <ToolbarPrimitive.Separator
      data-slot="toolbar-separator"
      className={cn(
        'shrink-0 self-center own:bg-line data-[orientation=vertical]:mx-1 data-[orientation=vertical]:h-4 data-[orientation=vertical]:w-px',
        'data-[orientation=horizontal]:my-1 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-4',
        className,
      )}
      {...props}
    />
  )
}

export { Toolbar, ToolbarButton, ToolbarGroup, ToolbarInput, ToolbarLink, ToolbarSeparator, ToolbarToggle }
export type { ToolbarButtonProps, ToolbarToggleProps }
