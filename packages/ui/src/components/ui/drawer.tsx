'use client'

import { createContext, useContext, type ComponentProps } from 'react'
import { Drawer as DrawerPrimitive } from '@base-ui/react/drawer'
import { useDirection, useYoujScope } from '@youj/core'
import { cn } from '../../lib/utils'
import { overlayScrimClass, useDialogFocus, useScrollRegion } from './dialog'

/* A sheet you can throw away. Base UI's Drawer: a modal panel on an edge that
 * follows the finger (or the mouse, from the handle and the panel's chrome)
 * and dismisses when swiped towards its edge; a flick leaves faster than a
 * slow drag, a short drag springs back. motion's yj-sheet-* drives it: it
 * slides fully off its edge (slow token in, base out, scaled by the swipe's
 * strength) and the scrim thins as the panel is pulled away. Reduced motion:
 * it appears and leaves instantly, and a swipe still tracks the finger.
 *
 * The panel bleeds past its edge by 3rem, so pulling it the other way never
 * shows a gap. Focus is trapped and returns to the trigger; Escape and a
 * press on the scrim close it. `swipeDirection` picks the edge: down (the
 * default, a bottom sheet), up, left or right, or the logical start or end,
 * which follow the reading direction. Top and bottom drawers are a
 * centered 36rem column, full width on a phone; their actions stack full
 * width, as touch sheets do. */

type DrawerDirection = 'up' | 'down' | 'left' | 'right'

const DrawerDirectionContext = createContext<DrawerDirection>('down')

/* Full class names, so Tailwind generates every yj-sheet-* variant. */
// youj-allow: physical side: each entry is the physical edge Base UI's swipeDirection names; start and end resolve to one.
const directionClass: Record<DrawerDirection, { viewport: string; popup: string }> = {
  down: {
    viewport: 'items-end justify-center',
    popup:
      'yj-sheet-bottom own:-mb-12 max-h-dvh w-full max-w-xl own:rounded-t-2xl own:border-x own:border-t own:pb-[calc(var(--spacing)*12_+_env(safe-area-inset-bottom))]',
  },
  up: {
    viewport: 'items-start justify-center',
    popup: 'yj-sheet-top own:-mt-12 max-h-dvh w-full max-w-xl own:rounded-b-2xl own:border-x own:border-b own:pt-12',
  },
  left: {
    viewport: 'items-stretch justify-start',
    // youj-allow: physical side, the left edge
    popup: 'yj-sheet-left own:-ml-12 h-full w-[calc(min(var(--spacing)*88,100vw_-_var(--spacing)*12)_+_var(--spacing)*12)] own:rounded-r-2xl own:border-r own:pl-12',
  },
  right: {
    viewport: 'items-stretch justify-end',
    // youj-allow: physical side, the right edge
    popup: 'yj-sheet-right own:-mr-12 h-full w-[calc(min(var(--spacing)*88,100vw_-_var(--spacing)*12)_+_var(--spacing)*12)] own:rounded-l-2xl own:border-l own:pr-12',
  },
}

interface DrawerProps extends Omit<DrawerPrimitive.Root.Props, 'swipeDirection'> {
  /** The edge it sits on and is swiped towards: `down` (default), `up`, `left`, `right`, or `start` / `end`, which mirror under RTL. */
  swipeDirection?: DrawerDirection | 'start' | 'end'
}

function Drawer({ swipeDirection: setting = 'down', ...props }: DrawerProps) {
  const rtl = useDirection() === 'rtl'
  const swipeDirection: DrawerDirection = setting === 'start' ? (rtl ? 'right' : 'left') : setting === 'end' ? (rtl ? 'left' : 'right') : setting
  return (
    <DrawerDirectionContext.Provider value={swipeDirection}>
      <DrawerPrimitive.Root data-slot="drawer" swipeDirection={swipeDirection} {...props} />
    </DrawerDirectionContext.Provider>
  )
}

function DrawerTrigger(props: DrawerPrimitive.Trigger.Props) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />
}

function DrawerClose(props: DrawerPrimitive.Close.Props) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />
}

interface DrawerContentProps extends DrawerPrimitive.Popup.Props {
  /** The grab handle on a top or bottom drawer. Default true. */
  showHandle?: boolean
}

function DrawerContent({ className, children, showHandle = true, ref, initialFocus, ...props }: DrawerContentProps) {
  const direction = useContext(DrawerDirectionContext)
  const scope = useYoujScope()
  const focus = useDialogFocus(ref)
  // The panel is the scroller: with nothing focusable inside, it becomes a tab stop.
  const scrollRegion = useScrollRegion(focus.node)
  const vertical = direction === 'up' || direction === 'down'
  const handle = vertical && showHandle && (
    <div
      aria-hidden
      data-slot="drawer-handle"
      className={cn('own:mx-auto h-1 w-9 shrink-0 own:rounded-full own:bg-well', direction === 'down' ? 'own:mt-2.5' : 'own:mb-2.5')}
    />
  )
  return (
    <DrawerPrimitive.Portal {...scope}>
      <DrawerPrimitive.Backdrop data-slot="drawer-overlay" className={overlayScrimClass} />
      <DrawerPrimitive.Viewport
        data-slot="drawer-viewport"
        className={cn('fixed own:inset-0 z-50 own:flex', directionClass[direction].viewport)}
      >
        <DrawerPrimitive.Popup
          ref={focus.ref}
          initialFocus={initialFocus ?? focus.initialFocus}
          data-slot="drawer-content"
          data-yj-tone="overlay"
          {...(scrollRegion ? { tabIndex: 0 } : {})}
          className={cn(
            'relative own:flex flex-col own:border-line own:bg-overlay own:text-ui own:text-fg shadow-lg outline-none',
            'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus',
            'own:overflow-y-auto yj-scrollbar overscroll-contain touch-auto data-swiping:cursor-grabbing data-swiping:select-none',
            directionClass[direction].popup,
            className,
          )}
          {...props}
        >
          {direction !== 'up' && handle}
          {/* Grows to fill a tall panel but never shrinks: the panel is the scroller, so a
              shrunk body let its content (and its bottom padding) spill past the scroll end. */}
          <DrawerPrimitive.Content data-slot="drawer-body" className="own:flex flex-[1_0_auto] flex-col">
            {children}
          </DrawerPrimitive.Content>
          {direction === 'up' && handle}
        </DrawerPrimitive.Popup>
      </DrawerPrimitive.Viewport>
    </DrawerPrimitive.Portal>
  )
}

function DrawerHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="drawer-header" className={cn('own:flex flex-col own:gap-1.5 own:px-[calc(var(--spacing)*(5_-_var(--ui--compact,0)))] own:pt-[calc(var(--spacing)*(4_-_var(--ui--compact,0)))] own:pb-[calc(var(--spacing)*(3_-_var(--ui--compact,0)))]', className)} {...props} />
}

function DrawerFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn('own:mt-auto own:flex flex-col own:gap-2 own:px-[calc(var(--spacing)*(5_-_var(--ui--compact,0)))] own:pt-[calc(var(--spacing)*(3_-_var(--ui--compact,0)))] own:pb-[calc(var(--spacing)*(5_-_var(--ui--compact,0)))]', className)}
      {...props}
    />
  )
}

function DrawerTitle({ className, ...props }: DrawerPrimitive.Title.Props) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn('own:text-base own:leading-6 own:font-semibold own:tracking-tight own:text-fg', className)}
      {...props}
    />
  )
}

function DrawerDescription({ className, ...props }: DrawerPrimitive.Description.Props) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn('own:text-ui own:text-fg-muted', className)}
      {...props}
    />
  )
}

export { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger }
export type { DrawerContentProps, DrawerDirection, DrawerProps }
