'use client'

import { useState, type ComponentProps, type MouseEvent } from 'react'
import { Dialog as SheetPrimitive } from '@base-ui/react/dialog'
import { useComponentLabels } from '@youj/core/labels'
import { sheetLabels } from '@youj/core/labels'
import { cn } from '../../lib/utils'
import { Button } from './button'
import { Dialog, DialogOverlay, DialogPortal, useDialogFocus, useScrollRegion, type DialogProps } from './dialog'
import { SheetHandle, SheetLayer, sheetPopupClass, useSheetPresentation } from './presentation'

/* A panel that slides in from an edge of the screen: settings, filters, the
 * details of a row. It is a positioned Dialog (modal, focus-trapped, Escape
 * and the scrim close it, focus returns to the trigger), animated by motion's
 * yj-sheet-*: it slides fully off its edge, decelerating in on the slow token
 * and accelerating away on the base token, while the scrim fades. A reversal
 * mid-slide continues from where the panel is. Reduced motion: instant.
 *
 * `side` takes physical edges or the logical `start` / `end`, which mirror
 * under RTL; the default is `end`. For swipe-to-dismiss, use Drawer.
 *
 * On touch a side sheet is a full screen panel on a phone (the whole width,
 * up to 28rem on a tablet), so it reads as a page pushed over the app rather
 * than a desktop panel with a sliver of page beside it. Its × is a 44px
 * target, it clears the notch and the home indicator, and the footer's
 * actions share its width. It still isn't pulled away: that is Drawer's job,
 * and a Drawer on the bottom edge is what a phone sheet should be.
 *
 * `variant="floating"` lifts the panel off its edge: it is inset by a gap on
 * every side, rounded on the theme's panel radius and raised on the largest
 * shadow, so it reads as a card over the page (a record's details over the
 * list it came from). It slides the same way, past the gap too
 * (--yj-sheet-gap). On touch it is the bottom sheet a Dialog becomes, pulled
 * down to dismiss. `backdrop="blur"` also softens the page behind the scrim:
 * a static backdrop-filter on the scrim, which only fades. */

type SheetSide = 'top' | 'right' | 'bottom' | 'left' | 'start' | 'end'

/* On touch a side sheet takes the whole width of a phone, up to 28rem, and
 * keeps its content below the notch. */
const touchSideClass = 'touch:w-[min(calc(var(--spacing)*112),100vw)] own:touch:pt-[env(safe-area-inset-top)]'

/* Full class names, so Tailwind generates every yj-sheet-* variant. */
const sideClass: Record<SheetSide, string> = {
  top: 'yj-sheet-top own:inset-x-0 own:top-0 max-h-[85dvh] own:border-b own:touch:pt-[env(safe-area-inset-top)]',
  bottom: 'yj-sheet-bottom own:inset-x-0 own:bottom-0 max-h-[85dvh] own:border-t',
  // youj-allow: physical side, a sheet asked for the left edge
  left: `yj-sheet-left own:inset-y-0 own:left-0 h-dvh w-[min(calc(var(--spacing)*96),calc(100vw_-_var(--spacing)*10))] own:border-r ${touchSideClass}`,
  // youj-allow: physical side, a sheet asked for the right edge
  right: `yj-sheet-right own:inset-y-0 own:right-0 h-dvh w-[min(calc(var(--spacing)*96),calc(100vw_-_var(--spacing)*10))] own:border-l ${touchSideClass}`,
  start: `yj-sheet-start own:inset-y-0 own:start-0 h-dvh w-[min(calc(var(--spacing)*96),calc(100vw_-_var(--spacing)*10))] own:border-e ${touchSideClass}`,
  end: `yj-sheet-end own:inset-y-0 own:end-0 h-dvh w-[min(calc(var(--spacing)*96),calc(100vw_-_var(--spacing)*10))] own:border-s ${touchSideClass}`,
}

/* Floating: inset by the gap on every side, rounded and raised. Side panels
 * fill the height between the gaps; top and bottom ones are a centered
 * column. The panel clips its corners, so the body scrolls inside them. */
const floatingClass = cn(
  '[--yj-sheet-gap:calc(var(--spacing)*3)] own:overflow-hidden own:rounded-[min(var(--radius-overlay-lg),var(--ui--panel-radius-max))] own:border own:shadow-lg',
)
const floatingSideClass: Record<SheetSide, string> = {
  top: 'yj-sheet-top own:inset-x-(--yj-sheet-gap) own:top-(--yj-sheet-gap) own:mx-auto max-h-[85dvh] max-w-2xl',
  bottom: 'yj-sheet-bottom own:inset-x-(--yj-sheet-gap) own:bottom-(--yj-sheet-gap) own:mx-auto max-h-[85dvh] max-w-2xl',
  // youj-allow: physical side, a sheet asked for the left edge
  left: 'yj-sheet-left own:inset-y-(--yj-sheet-gap) own:left-(--yj-sheet-gap) w-[min(calc(var(--spacing)*112),calc(100vw_-_var(--yj-sheet-gap)*2))]',
  // youj-allow: physical side, a sheet asked for the right edge
  right: 'yj-sheet-right own:inset-y-(--yj-sheet-gap) own:right-(--yj-sheet-gap) w-[min(calc(var(--spacing)*112),calc(100vw_-_var(--yj-sheet-gap)*2))]',
  start: 'yj-sheet-start own:inset-y-(--yj-sheet-gap) own:start-(--yj-sheet-gap) w-[min(calc(var(--spacing)*112),calc(100vw_-_var(--yj-sheet-gap)*2))]',
  end: 'yj-sheet-end own:inset-y-(--yj-sheet-gap) own:end-(--yj-sheet-gap) w-[min(calc(var(--spacing)*112),calc(100vw_-_var(--yj-sheet-gap)*2))]',
}

/* The page behind a blurred backdrop: a small, static blur on the scrim, under
 * a thinner wash than the plain scrim's (the blur already sets the page back).
 * Only the scrim's opacity animates, so the blur fades in with it. */
const blurClass = cn(
  'backdrop-blur-sm',
  'own:bg-[color-mix(in_oklab,var(--color-scrim)_60%,transparent)]',
)

/* On touch a floating sheet is the bottom sheet a Dialog becomes: full width
 * up to a column, its body scrolling up to 90% of the screen, clearing the
 * home indicator, pulled down to dismiss. Its header, body and footer bring
 * their own padding, so the surface's goes. */
const touchViewportClass = 'fixed own:inset-0 z-50 own:flex items-end justify-center'
const touchPopupClass = cn(
  sheetPopupClass,
  // `!`: Bezel pads a touch sheet for rows of a menu; this one's parts pad themselves.
  'max-h-[90dvh] own:overflow-hidden own:px-0 own:pt-0 own:pb-[env(safe-area-inset-bottom)] own:text-ui',
)

/** A press on the empty viewport around a touch sheet must not move focus to the page first (see Dialog). */
function keepFocusOnViewportPress(event: MouseEvent<HTMLDivElement>) {
  if (event.target === event.currentTarget) event.preventDefault()
}

/* The × keeps its size; on touch an invisible 4px ring around it makes the
 * target 44px, and below a notch it moves down with the content. */
const closeClass = 'absolute end-3 top-3 touch:after:absolute touch:after:-inset-1'
const closeBelowNotchClass = 'touch:top-[calc(var(--spacing)*3+env(safe-area-inset-top))]'

/** A Dialog underneath, so it opens and closes with the dialog's sounds. */
function Sheet(props: DialogProps) {
  return <Dialog data-slot="sheet" {...props} />
}

function SheetTrigger(props: SheetPrimitive.Trigger.Props) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose(props: SheetPrimitive.Close.Props) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

interface SheetContentProps extends SheetPrimitive.Popup.Props {
  /** The edge it slides from. `start` / `end` follow the writing direction. Default `end`. */
  side?: SheetSide
  /** Renders the × button in the top corner. Default true. */
  showCloseButton?: boolean
  /** `docked` sits flush on its edge. `floating` is inset from every edge, rounded and raised, and a bottom sheet on touch. Default `docked`. */
  variant?: 'docked' | 'floating'
  /** The page behind: `dim` washes it with the scrim, `blur` also blurs it a little. Default `dim`. */
  backdrop?: 'dim' | 'blur'
}

function SheetContent({
  className,
  children,
  side = 'end',
  showCloseButton = true,
  variant = 'docked',
  backdrop = 'dim',
  ref,
  initialFocus,
  ...props
}: SheetContentProps) {
  const focus = useDialogFocus(ref)
  const labels = useComponentLabels(sheetLabels)
  const floating = variant === 'floating'
  const touch = useSheetPresentation('auto') && floating
  const close = showCloseButton && (
    <SheetPrimitive.Close
      data-slot="sheet-close"
      render={<Button variant="ghost" size="icon-sm" className={cn(closeClass, !touch && side !== 'bottom' && closeBelowNotchClass)} />}
    >
      {/* Youj's x drawn inline: an animated icon would bring Motion's runtime into every sheet, whose own motion is CSS. */}
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M18 6 L6 18 M6 6 L18 18" />
      </svg>
      <span className="sr-only">{labels.close}</span>
    </SheetPrimitive.Close>
  )
  if (touch) {
    return (
      <DialogPortal>
        <SheetLayer>
          <DialogOverlay data-sheet-scrim="" className={cn(backdrop === 'blur' && blurClass)} />
          <SheetPrimitive.Viewport data-slot="sheet-viewport" className={touchViewportClass} onMouseDown={keepFocusOnViewportPress}>
            <SheetPrimitive.Popup
              ref={focus.ref}
              initialFocus={initialFocus ?? focus.initialFocus}
              data-slot="sheet-content"
              data-yj-tone="overlay"
              data-side="bottom"
              data-variant={variant}
              data-sheet-popup=""
              className={cn(touchPopupClass, className)}
              {...props}
            >
              <SheetHandle className="mt-2 mb-0" />
              {children}
              {close}
            </SheetPrimitive.Popup>
          </SheetPrimitive.Viewport>
        </SheetLayer>
      </DialogPortal>
    )
  }
  return (
    <DialogPortal>
      <DialogOverlay className={cn(backdrop === 'blur' && blurClass)} />
      <SheetPrimitive.Popup
        ref={focus.ref}
        initialFocus={initialFocus ?? focus.initialFocus}
        data-slot="sheet-content"
        data-yj-tone="overlay"
        data-side={side}
        data-variant={variant}
        className={cn(
          'fixed z-50 own:flex flex-col own:border-line own:bg-overlay own:text-ui own:text-fg own:shadow-lg outline-none',
          floating ? [floatingClass, floatingSideClass[side]] : sideClass[side],
          className,
        )}
        {...props}
      >
        {children}
        {close}
      </SheetPrimitive.Popup>
    </DialogPortal>
  )
}

function SheetHeader({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="sheet-header"
      // Clears the close button in the top corner.
      className={cn('own:flex flex-col own:gap-1.5 own:border-b own:border-line own:p-[calc(var(--spacing)*(5_-_var(--ui--compact,0)))] own:pe-12', className)}
      {...props}
    />
  )
}

/** The scrolling middle of a sheet. With nothing focusable inside, an overflowing body becomes a tab stop. */
function SheetBody({ className, ...props }: ComponentProps<'div'>) {
  const [body, setBody] = useState<HTMLDivElement | null>(null)
  const scrollRegion = useScrollRegion(body)
  return (
    <div
      ref={setBody}
      data-slot="sheet-body"
      {...(scrollRegion ? { tabIndex: 0 } : {})}
      className={cn(
        'own:flex min-h-0 flex-1 flex-col own:gap-[calc(var(--spacing)*(5_-_var(--ui--compact,0)))] own:overflow-y-auto yj-scrollbar overscroll-contain own:p-[calc(var(--spacing)*(5_-_var(--ui--compact,0)))]',
        'outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus',
        className,
      )}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn(
        'own:mt-auto own:flex items-center justify-end own:gap-2 own:border-t own:border-line own:bg-band own:px-[calc(var(--spacing)*(5_-_var(--ui--compact,0)))] own:py-[calc(var(--spacing)*(3_-_0.5*var(--ui--compact,0)))]',
        // On touch the actions share the width at 44px tall, above the home indicator.
        'own:touch:pb-[calc(var(--spacing)*(3_-_0.5*var(--ui--compact,0))_+_env(safe-area-inset-bottom))] touch:[&>:is(button,a)]:min-h-11 touch:[&>:is(button,a)]:flex-1',
        className,
      )}
      {...props}
    />
  )
}

function SheetTitle({ className, ...props }: SheetPrimitive.Title.Props) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn('own:text-base own:leading-6 own:font-semibold own:tracking-tight own:text-fg', className)}
      {...props}
    />
  )
}

function SheetDescription({ className, ...props }: SheetPrimitive.Description.Props) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn('own:text-ui own:text-fg-muted', className)}
      {...props}
    />
  )
}

export { Sheet, SheetBody, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger }
export type { SheetContentProps, SheetSide }
