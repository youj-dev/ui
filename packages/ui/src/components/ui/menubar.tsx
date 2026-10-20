'use client'

import type { ComponentProps } from 'react'
import { Menu as MenuPrimitive } from '@base-ui/react/menu'
import { DirectionProvider } from '@base-ui/react/direction-provider'
import { Menubar as MenubarPrimitive } from '@base-ui/react/menubar'
import { useYoujScope, useDirection } from '@youj/core'
import { SlidingIndicator } from '@youj/motion'
import { cn } from '../../lib/utils'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  type DropdownMenuContentProps,
} from './dropdown-menu'

/* A desktop-app menu bar (File, Edit, View) on Base UI's Menubar: one tab
 * stop, ←/→ rove the triggers (mirrored in RTL), ↓/Enter/Space open a menu,
 * and while one is open, hovering or arrowing to a neighbor swaps menus
 * without a click. Its menus are DropdownMenu's: the same popup, sliding row
 * highlight, checks and submenus. The open menu's trigger is marked by one
 * SlidingIndicator that glides from trigger to trigger as you scrub across
 * the bar (smooth spring), so the bar reads as one control rather than a row
 * of buttons blinking. Reduced motion: the mark jumps and popups are instant. */

/** The trigger whose menu is open. */
const OPEN_TRIGGER = '[data-popup-open]'

function Menubar({ className, children, ...props }: MenubarPrimitive.Props) {
  const direction = useDirection()
  return (
    <DirectionProvider direction={direction}>
      <MenubarPrimitive
        data-slot="menubar"
        data-yj-tone="float"
        className={cn(
          'group/menubar relative isolate flex w-fit items-center gap-0.5 rounded-lg border border-line bg-chrome-float own:p-0.5 own:text-fg shadow-xs',
          'data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-stretch',
          className,
        )}
        {...props}
      >
        {children}
        {/* Concentric with the bar: 6px inside its 8px radius and 2px padding. */}
        <SlidingIndicator data-slot="menubar-indicator" match={OPEN_TRIGGER} className="own:rounded-md own:bg-hover" />
      </MenubarPrimitive>
    </DirectionProvider>
  )
}

function MenubarMenu(props: ComponentProps<typeof DropdownMenu>) {
  return <DropdownMenu data-slot="menubar-menu" {...props} />
}

function MenubarTrigger({ className, ...props }: ComponentProps<typeof DropdownMenuTrigger>) {
  return (
    <DropdownMenuTrigger
      data-slot="menubar-trigger"
      className={cn(
        'inline-flex h-control-sm items-center gap-1.5 own:rounded-md own:px-2.5 own:text-ui font-medium text-fg outline-none select-none',
        'transition-[background-color] yj-duration-fast ease-standard focus-ring',
        // Hover paints the key only while no menu is open; the open one is the indicator's.
        'hover:bg-hover group-data-has-submenu-open/menubar:hover:bg-transparent',
        'forced-colors:data-popup-open:outline-2 forced-colors:data-popup-open:-outline-offset-2',
        'data-disabled:pointer-events-none data-disabled:opacity-50',
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  )
}

function MenubarPortal(props: MenuPrimitive.Portal.Props) {
  const scope = useYoujScope()
  return <MenuPrimitive.Portal data-slot="menubar-portal" {...scope} {...props} />
}

/* Its first row lines up under the trigger's label: the popup's 1px border
 * and 4px padding are taken back by alignOffset, less the trigger's inset. */
function MenubarContent({
  align = 'start',
  alignOffset = -3,
  sideOffset = 6,
  className,
  ...props
}: DropdownMenuContentProps) {
  return (
    <DropdownMenuContent
      data-slot="menubar-content"
      align={align}
      alignOffset={alignOffset}
      sideOffset={sideOffset}
      className={cn('min-w-48', className)}
      {...props}
    />
  )
}

function MenubarGroup(props: ComponentProps<typeof DropdownMenuGroup>) {
  return <DropdownMenuGroup data-slot="menubar-group" {...props} />
}

function MenubarLabel(props: ComponentProps<typeof DropdownMenuLabel>) {
  return <DropdownMenuLabel data-slot="menubar-label" {...props} />
}

function MenubarItem(props: ComponentProps<typeof DropdownMenuItem>) {
  return <DropdownMenuItem data-slot="menubar-item" {...props} />
}

function MenubarCheckboxItem(props: ComponentProps<typeof DropdownMenuCheckboxItem>) {
  return <DropdownMenuCheckboxItem data-slot="menubar-checkbox-item" {...props} />
}

function MenubarRadioGroup(props: ComponentProps<typeof DropdownMenuRadioGroup>) {
  return <DropdownMenuRadioGroup data-slot="menubar-radio-group" {...props} />
}

function MenubarRadioItem(props: ComponentProps<typeof DropdownMenuRadioItem>) {
  return <DropdownMenuRadioItem data-slot="menubar-radio-item" {...props} />
}

function MenubarSeparator(props: ComponentProps<typeof DropdownMenuSeparator>) {
  return <DropdownMenuSeparator data-slot="menubar-separator" {...props} />
}

function MenubarShortcut(props: ComponentProps<typeof DropdownMenuShortcut>) {
  return <DropdownMenuShortcut data-slot="menubar-shortcut" {...props} />
}

function MenubarSub(props: ComponentProps<typeof DropdownMenuSub>) {
  return <DropdownMenuSub data-slot="menubar-sub" {...props} />
}

function MenubarSubTrigger(props: ComponentProps<typeof DropdownMenuSubTrigger>) {
  return <DropdownMenuSubTrigger data-slot="menubar-sub-trigger" {...props} />
}

function MenubarSubContent(props: ComponentProps<typeof DropdownMenuSubContent>) {
  return <DropdownMenuSubContent data-slot="menubar-sub-content" {...props} />
}

export {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarPortal,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
}
