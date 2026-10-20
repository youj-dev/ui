'use client'

import { createContext, useContext, type ComponentProps } from 'react'
import { Menu as MenuPrimitive } from '@base-ui/react/menu'
import { DirectionProvider } from '@base-ui/react/direction-provider'
import { ChevronRightIcon } from '@youj/icons/components/youj/icons/chevron-right'
import { useYoujScope, usePortalContainer, useDirection } from '@youj/core'
import { SlidingIndicator } from '@youj/motion'
import { CheckIcon } from '@youj/icons'
import { cn } from '../../lib/utils'
import {
  SheetHandle,
  SheetLayer,
  sheetLabelClass,
  sheetPopupClass,
  sheetPositionerClass,
  sheetRowClass,
  sheetScrimClass,
  useSheetPresentation,
  type OverlayPresentation,
} from './presentation'

/* Base UI's menu: roving focus, typeahead, Home/End, submenus on hover or
 * →/Enter (← closes them, mirrored in RTL), Escape returns focus to the
 * trigger. The popup grows out of the trigger with motion's yj-pop and the
 * highlight is one SlidingIndicator per popup: it glides between rows on the
 * smooth spring instead of each row lighting up on its own. Crossing a
 * separator or a group label keeps it where it was for a moment, so it glides
 * on rather than blinking out. Destructive rows wash red on top of it; checks
 * draw themselves in. Reduced motion: the popup is instant, the highlight
 * jumps and checks appear drawn.
 *
 * On touch the same menu is an action sheet (presentation.tsx): it rises from
 * the bottom edge with a grab handle, rows are 48px, keyboard hints are not
 * shown, and pulling it down dismisses it. `presentation="popover"` keeps the
 * popover on a touch device; "sheet" forces the sheet. */

/* ── Highlight ─────────────────────────────────────────────────────────── */

/* Base UI's highlighted row or, while no row is, the row whose submenu is
 * open. Base UI drops the highlight whenever the pointer is over something
 * that isn't an item (a separator, a label, the padding); `linger` holds it
 * for the fast token first, so moving between groups glides across instead
 * of fading out and reappearing. */
const MENU_HIGHLIGHT = '[data-highlighted], [role=menu]:not(:has([data-highlighted])) [data-popup-open]'

function MenuHighlight() {
  return <SlidingIndicator match={MENU_HIGHLIGHT} linger className="own:rounded-[max(0px,calc(var(--radius-overlay)-var(--spacing)))] own:bg-cursor" />
}

/* ── Surfaces ──────────────────────────────────────────────────────────── */

/* Shared with ContextMenu. The popup is the indicator's container, so it is
 * `relative isolate`; it scrolls when it would pass the viewport. */
const menuPopupClass = cn(
  'yj-pop relative isolate max-h-(--available-height) w-max max-w-(--available-width) min-w-[max(var(--anchor-width),var(--spacing)*44)]',
  'scroll-py-1 overflow-x-hidden overflow-y-auto overscroll-contain yj-scrollbar',
  'own:rounded-overlay border border-line bg-overlay own:p-1 text-fg shadow-md outline-none',
)

type MenuPopupProps = MenuPrimitive.Popup.Props & {
  /** Where the portal renders. Default: document.body. */
  container?: MenuPrimitive.Portal.Props['container']
}

/**
 * The popup and its highlight. Used by DropdownMenuContent, its submenus and
 * ContextMenuContent. It is a tab stop (Base UI's is -1) so a menu long
 * enough to scroll is a keyboard-reachable scroll region; Tab still closes
 * the menu, as Base UI handles it before focus moves.
 */
function MenuPopup({ className, children, sheet, ...props }: MenuPrimitive.Popup.Props & { sheet?: boolean }) {
  return (
    <MenuPrimitive.Popup
      tabIndex={0}
      data-yj-tone="overlay"
      {...(sheet ? { 'data-sheet-popup': '' } : {})}
      className={cn(sheet ? sheetPopupClass : menuPopupClass, className)}
      {...props}
    >
      {sheet && <SheetHandle />}
      {children}
      <MenuHighlight />
    </MenuPrimitive.Popup>
  )
}

function DropdownMenu(props: MenuPrimitive.Root.Props) {
  const direction = useDirection()
  return (
    <DirectionProvider direction={direction}>
      <MenuPrimitive.Root data-slot="dropdown-menu" {...props} />
    </DirectionProvider>
  )
}

function DropdownMenuTrigger(props: MenuPrimitive.Trigger.Props) {
  return <MenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />
}

type DropdownMenuContentProps = MenuPopupProps &
  Pick<MenuPrimitive.Positioner.Props, 'align' | 'alignOffset' | 'side' | 'sideOffset' | 'collisionPadding' | 'anchor'> & {
    /** `auto` (the default) is a popover under a pointer and a bottom sheet on touch; force either one. */
    presentation?: OverlayPresentation
  }

function DropdownMenuContent({
  align = 'start',
  alignOffset = 0,
  side = 'bottom',
  sideOffset = 6,
  collisionPadding = 8,
  anchor,
  container,
  presentation = 'auto',
  ...props
}: DropdownMenuContentProps) {
  const scope = useYoujScope()
  const portalContainer = usePortalContainer()
  const sheet = useSheetPresentation(presentation)
  if (sheet) {
    return (
      <MenuPrimitive.Portal container={container ?? portalContainer} {...scope}>
        <SheetLayer>
          <MenuPrimitive.Backdrop data-sheet-scrim="" className={sheetScrimClass} />
          <MenuPrimitive.Positioner side="top" sideOffset={0} className={sheetPositionerClass}>
            <MenuPopup data-slot="dropdown-menu-content" sheet {...props} />
          </MenuPrimitive.Positioner>
        </SheetLayer>
      </MenuPrimitive.Portal>
    )
  }
  return (
    <MenuPrimitive.Portal container={container ?? portalContainer} {...scope}>
      <MenuPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        anchor={anchor}
        className="isolate z-50 outline-none"
      >
        <MenuPopup data-slot="dropdown-menu-content" {...props} />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  )
}

/* ── Rows ──────────────────────────────────────────────────────────────── */

/* Rows paint nothing on highlight (the indicator does) but take its lettering
 * (on-cursor), except a destructive row, which covers the indicator with
 * its own red wash over hover and keeps its red. Leading icons are muted and
 * turn to ink with the highlight. Forced colors drop the indicator's fill, so
 * the row gets an outline. */
const menuRowClass = cn(
  'group/menu-item relative flex min-h-control-sm w-full cursor-default items-center gap-2 own:rounded-[max(0px,calc(var(--radius-overlay)-var(--spacing)))] px-2 py-1 text-ui outline-none select-none',
  'data-inset:ps-8 data-disabled:pointer-events-none data-disabled:opacity-50',
  sheetRowClass,
  'forced-colors:data-highlighted:outline-2 forced-colors:data-highlighted:-outline-offset-2',
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  '[&>svg]:text-fg-muted data-highlighted:[&>svg]:text-fg',
  'data-highlighted:not-data-[variant=danger]:yj-on-cursor',
  '[[role=menu]:not(:has([data-highlighted]))_&]:data-popup-open:yj-on-cursor',
)

/* Base UI's GroupLabel labels its group (aria-labelledby) and throws outside
 * one, but shadcn menus put a label anywhere ("Toggle columns" above a list).
 * Inside a Group or RadioGroup the label is Base UI's; elsewhere it is a
 * plain caption with the same look. */
const InMenuGroup = createContext(false)

function DropdownMenuGroup({ children, ...props }: MenuPrimitive.Group.Props) {
  return (
    <MenuPrimitive.Group data-slot="dropdown-menu-group" {...props}>
      <InMenuGroup.Provider value>{children}</InMenuGroup.Provider>
    </MenuPrimitive.Group>
  )
}

const menuLabelClass = cn(
  'own:px-2 own:pt-2 own:pb-1 own:text-ui-xs own:font-medium own:tracking-wide own:text-fg-muted own:uppercase select-none data-inset:ps-8',
  sheetLabelClass,
)

function DropdownMenuLabel({
  className,
  inset,
  render,
  ...props
}: MenuPrimitive.GroupLabel.Props & { inset?: boolean }) {
  const grouped = useContext(InMenuGroup)
  const shared = {
    'data-slot': 'dropdown-menu-label',
    'data-inset': inset || undefined,
    className: cn(menuLabelClass, className),
  }
  return grouped ? (
    <MenuPrimitive.GroupLabel {...shared} render={render} {...props} />
  ) : (
    <div {...shared} {...(props as ComponentProps<'div'>)} />
  )
}

/* shadcn's menu items take `onSelect`. Here it is the DOM's text-selection event
 * and never fires, so it compiles away from shadcn code that would silently do
 * nothing: the type carries the fix, and the compiler prints it. */
type OnSelectIsOnClick = { onSelect?: 'onSelect is the DOM text-selection event and never fires on a menu item: use onClick' }

interface DropdownMenuItemProps extends Omit<MenuPrimitive.Item.Props, 'onSelect'>, OnSelectIsOnClick {
  /** Indents the label to line up with rows that have an icon. */
  inset?: boolean
  /** `danger` tints the row red: deleting, revoking, leaving. */
  variant?: 'default' | 'danger'
}

function DropdownMenuItem({ className, inset, variant = 'default', ...props }: DropdownMenuItemProps) {
  return (
    <MenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset || undefined}
      data-variant={variant}
      className={cn(
        menuRowClass,
        'data-[variant=danger]:text-danger-text data-[variant=danger]:[&>svg]:text-danger-text',
        'transition-[background-color] yj-duration-fast ease-standard own:data-[variant=danger]:data-highlighted:[background:linear-gradient(var(--color-danger-subtle),var(--color-danger-subtle)),linear-gradient(var(--color-hover),var(--color-hover)),var(--color-overlay)]',
        className,
      )}
      {...(props as MenuPrimitive.Item.Props)}
    />
  )
}

/** A trailing check that draws itself in when the row turns on, in the accent like Select's. */
function MenuItemCheck({ radio }: { radio?: boolean }) {
  const Indicator = radio ? MenuPrimitive.RadioItemIndicator : MenuPrimitive.CheckboxItemIndicator
  return (
    <Indicator
      data-slot={radio ? 'dropdown-menu-radio-item-indicator' : 'dropdown-menu-checkbox-item-indicator'}
      className="yj-fade pointer-events-none absolute end-2 own:flex size-4 items-center justify-center own:text-accent"
    >
      <CheckIcon trigger="mount" size={16} strokeWidth={2.25} />
    </Indicator>
  )
}

function DropdownMenuCheckboxItem({
  className,
  children,
  inset,
  ...props
}: Omit<MenuPrimitive.CheckboxItem.Props, 'onSelect'> & OnSelectIsOnClick & { inset?: boolean }) {
  return (
    <MenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      data-inset={inset || undefined}
      className={cn(menuRowClass, 'own:pe-8', className)}
      {...(props as MenuPrimitive.CheckboxItem.Props)}
    >
      {children}
      <MenuItemCheck />
    </MenuPrimitive.CheckboxItem>
  )
}

function DropdownMenuRadioGroup({ children, ...props }: MenuPrimitive.RadioGroup.Props) {
  return (
    <MenuPrimitive.RadioGroup data-slot="dropdown-menu-radio-group" {...props}>
      <InMenuGroup.Provider value>{children}</InMenuGroup.Provider>
    </MenuPrimitive.RadioGroup>
  )
}

function DropdownMenuRadioItem({
  className,
  children,
  inset,
  ...props
}: Omit<MenuPrimitive.RadioItem.Props, 'onSelect'> & OnSelectIsOnClick & { inset?: boolean }) {
  return (
    <MenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      data-inset={inset || undefined}
      className={cn(menuRowClass, 'own:pe-8', className)}
      {...(props as MenuPrimitive.RadioItem.Props)}
    >
      {children}
      <MenuItemCheck radio />
    </MenuPrimitive.RadioItem>
  )
}

function DropdownMenuSeparator({ className, ...props }: MenuPrimitive.Separator.Props) {
  return (
    <MenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn('pointer-events-none own:-mx-1 own:my-1 h-px own:bg-line', className)}
      {...props}
    />
  )
}

/** A row's keyboard shortcut, trailing and muted. */
function DropdownMenuShortcut({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        'own:ms-auto own:ps-4 own:font-sans own:text-ui-sm own:tracking-wider own:text-fg-muted group-data-highlighted/menu-item:text-fg-muted own:touch:hidden',
        className,
      )}
      {...props}
    />
  )
}

/* ── Submenus ──────────────────────────────────────────────────────────── */

function DropdownMenuSub(props: MenuPrimitive.SubmenuRoot.Props) {
  return <MenuPrimitive.SubmenuRoot data-slot="dropdown-menu-sub" {...props} />
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: Omit<MenuPrimitive.SubmenuTrigger.Props, 'onSelect'> & OnSelectIsOnClick & { inset?: boolean }) {
  return (
    <MenuPrimitive.SubmenuTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset || undefined}
      className={cn(menuRowClass, 'data-popup-open:[&>svg]:text-fg', className)}
      {...(props as MenuPrimitive.SubmenuTrigger.Props)}
    >
      {children}
      <ChevronRightIcon trigger="none" className="own:ms-auto own:-me-0.5 rtl:-scale-x-100" />
    </MenuPrimitive.SubmenuTrigger>
  )
}

/* A submenu opens beside its row with its first item level with the row: the
 * popup's 1px border and 4px padding are taken back by alignOffset. */
function DropdownMenuSubContent({
  side = 'inline-end',
  align = 'start',
  alignOffset = -5,
  sideOffset = 8,
  className,
  ...props
}: DropdownMenuContentProps) {
  return (
    <DropdownMenuContent
      data-slot="dropdown-menu-sub-content"
      side={side}
      align={align}
      alignOffset={alignOffset}
      sideOffset={sideOffset}
      className={cn('min-w-40 own:shadow-lg', className)}
      {...props}
    />
  )
}

export {
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
  MenuPopup,
}
export type { DropdownMenuContentProps, DropdownMenuItemProps, MenuPopupProps }
