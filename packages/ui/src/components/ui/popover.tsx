'use client'

import { useCallback, type ComponentProps } from 'react'
import { Popover as PopoverPrimitive } from '@base-ui/react/popover'
import { DirectionProvider } from '@base-ui/react/direction-provider'
import { useDevice, useYoujScope, usePortalContainer, useDirection } from '@youj/core'
import { cn } from '../../lib/utils'
import {
  SheetHandle,
  SheetLayer,
  sheetPopupClass,
  sheetPositionerClass,
  sheetKeyboardClass,
  sheetScrimClass,
  useSheetPresentation,
  useVisualViewportInset,
  type OverlayPresentation,
} from './presentation'

/* A panel anchored to the thing it is about. It grows out of the point Base UI
 * anchors it to (--transform-origin) with motion's yj-pop: a short scale and
 * fade on the enter curve, gone on the instant token when it closes, and a
 * reversal mid-flight continues from where it is. Opened from the keyboard or
 * closed with Escape it is instant, as Base UI asks. Reduced motion: instant.
 *
 * Focus moves to the first tabbable element inside (or the popup itself) and
 * returns to the trigger on close. The surface is the popover elevation:
 * white in light, raised in dark, a hairline border and the md shadow.
 *
 * On touch the same content is a bottom sheet (presentation.tsx): it rises
 * from the bottom edge with a grab handle over a scrim, spans the screen's
 * width, and goes away when pulled down, tapped outside or on Escape. A
 * finger would cover anything anchored to the trigger, so placement props
 * don't apply there. It is modal on touch unless `modal` says otherwise, so
 * the page under the sheet doesn't scroll. `presentation="popover"` keeps the
 * popover on touch; "sheet" forces the sheet. */

function Popover({ modal, ...props }: PopoverPrimitive.Root.Props) {
  const direction = useDirection()
  // A sheet covers the page's width: like a phone's own sheets, the page under it stays put.
  const touch = useDevice() === 'touch'
  return (
    <DirectionProvider direction={direction}>
      <PopoverPrimitive.Root data-slot="popover" modal={modal ?? touch} {...props} />
    </DirectionProvider>
  )
}

function PopoverTrigger(props: PopoverPrimitive.Trigger.Props) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

function PopoverClose(props: PopoverPrimitive.Close.Props) {
  return <PopoverPrimitive.Close data-slot="popover-close" {...props} />
}

type PopoverContentProps = PopoverPrimitive.Popup.Props &
  Pick<
    PopoverPrimitive.Positioner.Props,
    'align' | 'alignOffset' | 'side' | 'sideOffset' | 'anchor' | 'collisionPadding' | 'sticky'
  > & {
    /** Where the portal renders. Default: the provider's portal container, else document.body. */
    container?: PopoverPrimitive.Portal.Props['container']
    /** `auto` (the default) is a popover under a pointer and a bottom sheet on touch; force either one. */
    presentation?: OverlayPresentation
  }

/* The sheet keeps the consumer's content and horizontal padding; its top
 * (under the handle) and bottom (over the home indicator) belong to the sheet,
 * so they win (with `!`) over a `p-*` tuned for the popover and over the
 * Bezel style's popover padding and all-round radius. A field inside raises the
 * on-screen keyboard; the sheet rides above it and stays within what is
 * visible (sheetKeyboardClass). */
const popoverSheetClass = cn(
  sheetPopupClass,
  sheetKeyboardClass,
  // The popover's gap and padding, a step tighter at the compact layout density.
  'gap-[calc(var(--spacing)*(3_-_0.5*var(--ui--compact,0)))] own:px-[calc(var(--spacing)*(4_-_var(--ui--compact,0)))] text-ui',
)
const popoverSheetEdgesClass =
  'own:rounded-b-none own:pt-1 own:pb-[calc(var(--spacing)*(4_-_var(--ui--compact,0))_+_env(safe-area-inset-bottom))]'

function PopoverContent({
  className,
  align = 'center',
  alignOffset = 0,
  side = 'bottom',
  sideOffset = 6,
  anchor,
  collisionPadding = 8,
  sticky,
  container,
  presentation = 'auto',
  children,
  ref,
  ...props
}: PopoverContentProps) {
  const scope = useYoujScope()
  const portalContainer = usePortalContainer()
  const sheet = useSheetPresentation(presentation)
  // A field in the sheet raises the on-screen keyboard: the sheet rides above it (presentation.tsx).
  const keyboardInset = useVisualViewportInset()
  const sheetRef = useCallback(
    (node: HTMLDivElement | null) => {
      const release = keyboardInset(node)
      if (typeof ref === 'function') ref(node)
      else if (ref) ref.current = node
      return () => {
        release?.()
        if (typeof ref === 'function') ref(null)
        else if (ref) ref.current = null
      }
    },
    [keyboardInset, ref],
  )
  if (sheet) {
    return (
      <PopoverPrimitive.Portal container={container ?? portalContainer} {...scope}>
        <SheetLayer>
          <PopoverPrimitive.Backdrop data-sheet-scrim="" className={sheetScrimClass} />
          <PopoverPrimitive.Positioner side="top" sideOffset={0} className={sheetPositionerClass}>
            <PopoverPrimitive.Popup
              ref={sheetRef}
              data-slot="popover-content"
              data-yj-tone="overlay"
              data-sheet-popup=""
              className={cn(popoverSheetClass, className, popoverSheetEdgesClass)}
              {...props}
            >
              <SheetHandle />
              {children}
            </PopoverPrimitive.Popup>
          </PopoverPrimitive.Positioner>
        </SheetLayer>
      </PopoverPrimitive.Portal>
    )
  }
  return (
    <PopoverPrimitive.Portal container={container ?? portalContainer} {...scope}>
      <PopoverPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        anchor={anchor}
        collisionPadding={collisionPadding}
        sticky={sticky}
        className="isolate z-50 outline-none"
      >
        <PopoverPrimitive.Popup
          ref={ref}
          data-slot="popover-content"
          data-yj-tone="overlay"
          className={cn(
            'yj-pop own:flex w-72 max-w-(--available-width) flex-col own:gap-[calc(var(--spacing)*(3_-_0.5*var(--ui--compact,0)))] own:rounded-overlay own:border own:border-line own:bg-overlay own:p-[calc(var(--spacing)*(4_-_var(--ui--compact,0)))] own:text-fg',
            'own:text-ui own:text-fg own:shadow-md own:outline-none',
            className,
          )}
          {...props}
        >
          {children}
        </PopoverPrimitive.Popup>
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  )
}

function PopoverHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="popover-header" className={cn('own:flex flex-col own:gap-1', className)} {...props} />
}

function PopoverTitle({ className, ...props }: PopoverPrimitive.Title.Props) {
  return (
    <PopoverPrimitive.Title
      data-slot="popover-title"
      className={cn('own:text-ui-lg own:font-semibold own:tracking-tight own:text-fg', className)}
      {...props}
    />
  )
}

function PopoverDescription({ className, ...props }: PopoverPrimitive.Description.Props) {
  return (
    <PopoverPrimitive.Description
      data-slot="popover-description"
      className={cn('own:text-ui own:text-fg-muted', className)}
      {...props}
    />
  )
}

export { Popover, PopoverClose, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger }
export type { PopoverContentProps }
