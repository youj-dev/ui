'use client'

import { ContextMenu as ContextMenuPrimitive } from '@base-ui/react/context-menu'
import { DirectionProvider } from '@base-ui/react/direction-provider'
import { useYoujScope, usePortalContainer, useDirection } from '@youj/core'
import { cn } from '../../lib/utils'
import {
  DropdownMenuCheckboxItem,
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
  MenuPopup,
  type MenuPopupProps,
} from './dropdown-menu'
import {
  SheetLayer,
  sheetPositionerClass,
  sheetScrimClass,
  useSheetPresentation,
  type OverlayPresentation,
} from './presentation'

/* The menu for the thing under the pointer: right click, long press on
 * touch, or the Menu key / Shift+F10 on a focused trigger (browsers send
 * those as a contextmenu event). It is DropdownMenu's popup and rows, so it
 * moves the same way: it grows out of the exact point it was opened at
 * (yj-pop from --transform-origin), and one SlidingIndicator glides between
 * its rows. Reduced motion: instant popup, the highlight jumps.
 *
 * On touch, a long press on the trigger opens it as DropdownMenu's action
 * sheet (presentation.tsx): it rises from the bottom edge with a grab handle,
 * rows are 48px, shortcut hints are gone, and pulling it down dismisses it.
 * Base UI's trigger does the long press itself (half a second, cancelled once the
 * finger moves 10px, so a list of triggers still scrolls), because iOS
 * Safari never sends a contextmenu event for one; it also keeps the page's
 * own callout and text selection from appearing. `presentation="popover"`
 * keeps the popup at the finger on touch; "sheet" forces the sheet.
 *
 * Use it as an enhancement: the same actions should be reachable from a
 * visible control too, since a context menu is easy to miss, and on a phone
 * a long press is easier still to miss. */

function ContextMenu(props: ContextMenuPrimitive.Root.Props) {
  const direction = useDirection()
  return (
    <DirectionProvider direction={direction}>
      <ContextMenuPrimitive.Root data-slot="context-menu" {...props} />
    </DirectionProvider>
  )
}

/**
 * The area that opens the menu. Make it, or something inside it, focusable:
 * the Menu key and Shift+F10 open the menu from there, beside the focused
 * element. Browsers only turn those keys into a contextmenu event on some
 * platforms (not macOS), so the trigger sends one itself.
 */
function ContextMenuTrigger({ className, onKeyDown, ...props }: ContextMenuPrimitive.Trigger.Props) {
  return (
    <ContextMenuPrimitive.Trigger
      data-slot="context-menu-trigger"
      className={cn('select-none', className)}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        const menuKey = event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')
        if (event.defaultPrevented || !menuKey) return
        event.preventDefault()
        const target = event.target as HTMLElement
        // Just under the element: Base UI tucks a pointer-opened menu 5px up under the cursor.
        const { left, bottom } = target.getBoundingClientRect()
        const init = { bubbles: true, cancelable: true, clientX: left, clientY: bottom + 6 }
        target.dispatchEvent(new MouseEvent('contextmenu', init))
      }}
      {...props}
    />
  )
}

type ContextMenuContentProps = MenuPopupProps &
  Pick<ContextMenuPrimitive.Positioner.Props, 'align' | 'alignOffset' | 'side' | 'sideOffset' | 'collisionPadding'> & {
    /** `auto` (the default) is a popup at the pointer and a bottom sheet on touch; force either one. */
    presentation?: OverlayPresentation
  }

/* Placement is left to Base UI unless asked: it puts the popup's corner at
 * the pointer, a few px under it, and flips it inside the viewport. */
function ContextMenuContent({
  align,
  alignOffset,
  side,
  sideOffset,
  collisionPadding = 8,
  container,
  presentation = 'auto',
  ...props
}: ContextMenuContentProps) {
  const scope = useYoujScope()
  const portalContainer = usePortalContainer()
  const sheet = useSheetPresentation(presentation)
  if (sheet) {
    return (
      <ContextMenuPrimitive.Portal container={container ?? portalContainer} {...scope}>
        <SheetLayer>
          <ContextMenuPrimitive.Backdrop data-sheet-scrim="" className={sheetScrimClass} />
          <ContextMenuPrimitive.Positioner side="top" sideOffset={0} className={sheetPositionerClass}>
            <MenuPopup data-slot="context-menu-content" sheet {...props} />
          </ContextMenuPrimitive.Positioner>
        </SheetLayer>
      </ContextMenuPrimitive.Portal>
    )
  }
  return (
    <ContextMenuPrimitive.Portal container={container ?? portalContainer} {...scope}>
      <ContextMenuPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className="isolate z-50 outline-none"
      >
        <MenuPopup data-slot="context-menu-content" {...props} />
      </ContextMenuPrimitive.Positioner>
    </ContextMenuPrimitive.Portal>
  )
}

export {
  ContextMenu,
  DropdownMenuCheckboxItem as ContextMenuCheckboxItem,
  ContextMenuContent,
  DropdownMenuGroup as ContextMenuGroup,
  DropdownMenuItem as ContextMenuItem,
  DropdownMenuLabel as ContextMenuLabel,
  DropdownMenuRadioGroup as ContextMenuRadioGroup,
  DropdownMenuRadioItem as ContextMenuRadioItem,
  DropdownMenuSeparator as ContextMenuSeparator,
  DropdownMenuShortcut as ContextMenuShortcut,
  DropdownMenuSub as ContextMenuSub,
  DropdownMenuSubContent as ContextMenuSubContent,
  DropdownMenuSubTrigger as ContextMenuSubTrigger,
  ContextMenuTrigger,
}
export type { ContextMenuContentProps }
