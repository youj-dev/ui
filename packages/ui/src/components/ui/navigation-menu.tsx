'use client'

import type { ComponentProps, CSSProperties } from 'react'
import { NavigationMenu as NavigationMenuPrimitive } from '@base-ui/react/navigation-menu'
import { DirectionProvider } from '@base-ui/react/direction-provider'
import { SlidingIndicator } from '@youj/motion'
import { useYoujScope, useDirection } from '@youj/core/lib/youj/provider'
import { cn } from '../../lib/utils'
import { CollapsibleChevron } from './collapsible'
import { navigationMenuTriggerStyle } from './navigation-menu.variants'

/* Base UI's navigation menu, choreographed with youj tokens:
 * - A hover pill (motion SlidingIndicator, follow="hover") glides between the
 *   top-level triggers and links, following the pointer and keyboard focus.
 * - The popup grows out of its trigger (scale .96 + fade), then, moving to
 *   another trigger, slides to it while its box morphs to the next panel's
 *   size; the outgoing panel drifts away from the way you moved as the
 *   incoming one arrives from it. Every duration is a token × --yj-motion, so
 *   Speed and reduced motion reach the portaled popup through its scope.
 * - The trigger's chevron turns over while its panel is open. */

function NavigationMenu({
  align = 'start',
  alignOffset,
  side,
  sideOffset,
  collisionPadding,
  className,
  children,
  ...props
}: NavigationMenuPrimitive.Root.Props &
  Pick<NavigationMenuPrimitive.Positioner.Props, 'align' | 'alignOffset' | 'side' | 'sideOffset' | 'collisionPadding'>) {
  const direction = useDirection()
  return (
    <DirectionProvider direction={direction}>
      <NavigationMenuPrimitive.Root
        data-slot="navigation-menu"
        className={cn('group/navigation-menu relative flex max-w-max flex-1 items-center justify-center', className)}
        {...props}
      >
        {children}
        <NavigationMenuPositioner align={align} alignOffset={alignOffset} side={side} sideOffset={sideOffset} collisionPadding={collisionPadding} />
      </NavigationMenuPrimitive.Root>
    </DirectionProvider>
  )
}

function NavigationMenuList({ className, children, ...props }: ComponentProps<typeof NavigationMenuPrimitive.List>) {
  return (
    <NavigationMenuPrimitive.List
      data-slot="navigation-menu-list"
      className={cn('relative isolate flex flex-1 list-none items-center justify-center gap-0.5', className)}
      {...props}
    >
      {children}
      <SlidingIndicator follow="hover" data-slot="navigation-menu-hover-indicator" className="own:rounded-md own:bg-hover" />
    </NavigationMenuPrimitive.List>
  )
}

function NavigationMenuItem({ className, ...props }: ComponentProps<typeof NavigationMenuPrimitive.Item>) {
  return <NavigationMenuPrimitive.Item data-slot="navigation-menu-item" className={cn('relative', className)} {...props} />
}

function NavigationMenuTrigger({ className, children, ...props }: NavigationMenuPrimitive.Trigger.Props) {
  return (
    <NavigationMenuPrimitive.Trigger
      data-slot="navigation-menu-trigger"
      className={cn(navigationMenuTriggerStyle(), 'own:pe-2', className)}
      {...props}
    >
      {children}
      <CollapsibleChevron size={14} className="text-fg-subtle" />
    </NavigationMenuPrimitive.Trigger>
  )
}

function NavigationMenuContent({ className, ...props }: NavigationMenuPrimitive.Content.Props) {
  return (
    <NavigationMenuPrimitive.Content
      data-slot="navigation-menu-content"
      className={cn(
        // Natural size, never the viewport's animated one: the popup's height and width ease between panels, and a panel sized to them would overflow (and flash bars) on the way.
        'w-auto own:p-1.5',
        // Never taller than the room the positioner found (less the popup's border). Only a panel that truly doesn't fit scrolls, vertically, in the thin bar; never sideways.
        'max-h-[calc(var(--available-height)-2px)] overflow-x-hidden overflow-y-auto overscroll-contain yj-scrollbar',
        // Mid-swap, either panel is on its way in or out at the viewport's animated size: no bar until it settles.
        'data-activation-direction:overflow-y-hidden data-starting-style:overflow-y-hidden data-ending-style:overflow-y-hidden',
        // Panels trade places: the incoming one arrives from the side you moved
        // toward, the outgoing one drifts the other way; both fade.
        'transition-[opacity,translate] yj-duration-slow ease-standard data-starting-style:opacity-0 data-ending-style:opacity-0',
        'data-starting-style:data-[activation-direction=left]:-translate-x-6 data-starting-style:data-[activation-direction=right]:translate-x-6',
        'data-ending-style:data-[activation-direction=left]:translate-x-6 data-ending-style:data-[activation-direction=right]:-translate-x-6',
        className,
      )}
      {...props}
    />
  )
}

/* Durations for the popup: it grows in on `fast` with the enter curve, leaves
 * on `instant`, and morphs size (and slides between triggers) on `slow`. */
const popupTransition =
  '[transition:opacity_calc(var(--yj-duration-fast)*var(--yj-motion,1))_var(--ease-enter),scale_calc(var(--yj-duration-fast)*var(--yj-motion,1))_var(--ease-enter),width_calc(var(--yj-duration-slow)*var(--yj-motion,1))_var(--ease-standard),height_calc(var(--yj-duration-slow)*var(--yj-motion,1))_var(--ease-standard)]'

function NavigationMenuPositioner({
  className,
  side = 'bottom',
  sideOffset = 8,
  align = 'start',
  alignOffset = 0,
  // Pass `{ top: <header height> + 8 }` under a sticky header, so a tall panel stays below it.
  collisionPadding = 8,
  ...props
}: NavigationMenuPrimitive.Positioner.Props) {
  // The portal renders into <body>: the scope carries Speed and reduced motion.
  const scope = useYoujScope()
  return (
    <NavigationMenuPrimitive.Portal {...scope}>
      <NavigationMenuPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        collisionPadding={collisionPadding}
        className={cn(
          'isolate z-50 h-(--positioner-height) w-(--positioner-width) max-w-(--available-width)',
          'transition-[top,left,right,bottom] yj-duration-slow ease-standard data-instant:transition-none',
          // A bridge across the offset, on whichever side the popup opened, so the pointer can travel to it.
          "before:absolute before:content-['']",
          'data-[side=bottom]:before:inset-x-0 data-[side=bottom]:before:bottom-full data-[side=bottom]:before:h-(--bridge)',
          'data-[side=top]:before:inset-x-0 data-[side=top]:before:top-full data-[side=top]:before:h-(--bridge)',
          'data-[side=right]:before:inset-y-0 data-[side=right]:before:right-full data-[side=right]:before:w-(--bridge)',
          'data-[side=left]:before:inset-y-0 data-[side=left]:before:left-full data-[side=left]:before:w-(--bridge)',
          'data-[side=inline-end]:before:inset-y-0 data-[side=inline-end]:before:end-full data-[side=inline-end]:before:w-(--bridge)',
          'data-[side=inline-start]:before:inset-y-0 data-[side=inline-start]:before:start-full data-[side=inline-start]:before:w-(--bridge)',
          className,
        )}
        style={{ '--bridge': `${typeof sideOffset === 'number' ? sideOffset : 8}px` } as CSSProperties}
        {...props}
      >
        <NavigationMenuPrimitive.Popup
          data-slot="navigation-menu-popup"
          data-yj-tone="overlay"
          className={cn(
            'relative h-(--popup-height) w-(--popup-width) origin-(--transform-origin) overflow-hidden own:rounded-xl border own:border-line own:bg-overlay text-fg shadow-lg outline-none',
            popupTransition,
            'data-starting-style:scale-[0.96] data-starting-style:opacity-0',
            'data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-ending-style:[transition-duration:calc(var(--yj-duration-instant)*var(--yj-motion,1))] data-ending-style:[transition-timing-function:var(--ease-standard)]',
          )}
        >
          <NavigationMenuPrimitive.Viewport data-slot="navigation-menu-viewport" className="relative size-full overflow-hidden" />
        </NavigationMenuPrimitive.Popup>
      </NavigationMenuPrimitive.Positioner>
    </NavigationMenuPrimitive.Portal>
  )
}

function NavigationMenuLink({ className, ...props }: NavigationMenuPrimitive.Link.Props) {
  return (
    <NavigationMenuPrimitive.Link
      data-slot="navigation-menu-link"
      className={cn(
        'flex items-start gap-3 own:rounded-lg own:p-2.5 text-ui text-fg',
        'transition-colors yj-duration-fast ease-standard own:hover:bg-hover own:focus-visible:bg-hover focus-ring own:data-active:bg-selected',
        "[&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
        className,
      )}
      {...props}
    />
  )
}

export {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuPositioner,
  navigationMenuTriggerStyle,
}
