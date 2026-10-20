'use client'

import { dialogLabels } from '@youj/core/labels'
import { useCallback, useEffect, useRef, useState, type ComponentProps, type MouseEvent, type Ref } from 'react'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { useYouj, useYoujScope, usePortalContainer, useSoundCue } from '@youj/core'
import { useComponentLabels } from '@youj/core/labels'
import { cn } from '../../lib/utils'
import { Button } from './button'
import {
  SheetHandle,
  SheetLayer,
  overlayScrimClass,
  sheetKeyboardClass,
  sheetPopupClass,
  useSheetPresentation,
  useVisualViewportInset,
} from './presentation'

/* A modal window over the page. The popup rises a few px while scaling up on
 * the enter curve (motion's yj-dialog) and the scrim fades in behind it; it
 * leaves faster than it came. A dialog opened from inside another dialog
 * pushes its parent a step back: the parent sinks, shrinks and dims (Base UI
 * sets --nested-dialogs), so the stack reads as depth. Reduced motion:
 * instant, and the parent simply dims.
 *
 * Focus is trapped inside, moves to the first tabbable element (the dialog
 * itself when that element is below the fold, or wherever `initialFocus`
 * says), and returns to the trigger on close. Escape and a
 * press on the scrim close it. The popup sits in Base UI's Viewport, a flex
 * container that centers it without a -50% translate (which blurs text on
 * odd heights) and lets a tall dialog scroll.
 *
 * On touch it is a bottom sheet instead (presentation.tsx): it rises from the
 * bottom edge with a grab handle, where the thumb already is, and is pulled
 * down to dismiss (a flick leaves faster, a short pull springs back, the scrim
 * thins as it goes). Its content scrolls inside it up to 90% of the screen, it
 * clears the home indicator and rides above the on-screen keyboard, and the
 * footer's actions stack full width, primary on top. It is the same Base UI
 * Dialog, so focus trapping, nested dialogs, scroll lock, Escape and the
 * scrim behave as they do centered; opened by a touch, focus goes to the
 * sheet rather than its first field, so the keyboard doesn't cover it before
 * it is read. A dialog opened from a sheet stacks over it and the sheet
 * underneath recedes. `presentation="dialog"` keeps it centered on touch;
 * "sheet" forces the sheet. Reduced motion: it appears at once, and a pull
 * still tracks the finger. */

/* The scrim (overlayScrimClass) is the elevation ink, the same color the
 * shadows use: a thin ink wash in light, a deep one in dark. Shared by the
 * sheet, the drawer and the alert dialog. It is defined in presentation.tsx,
 * which this file imports for the touch sheet, and re-exported from here. */

/** The dialog surface and its motion. Shared with the alert dialog. While a
 * nested dialog is open, yj-dialog makes it recede under a wash that keeps its
 * text above 4.5:1; `relative` gives that wash its box. */
const dialogPopupClass = cn(
  'yj-dialog relative own:m-auto flex w-full max-w-md flex-col own:gap-[calc(var(--spacing)*(4_-_var(--ui--compact,0)))] outline-none',
  'own:rounded-overlay border border-line own:bg-overlay own:p-[calc(var(--spacing)*(5_-_var(--ui--compact,0)))] text-ui text-fg shadow-lg',
)

/** The Viewport that centers a dialog popup and scrolls a tall one. Shared with the alert dialog. */
const dialogViewportClass = 'fixed own:inset-0 z-50 own:flex own:overflow-y-auto yj-scrollbar own:p-4'

/**
 * A press on the empty viewport would move focus to the page before Base UI
 * decides what the press means. A dialog closes and restores focus anyway;
 * an alert dialog ignores the press and must keep focus where it was.
 */
function keepFocusOnViewportPress(event: MouseEvent<HTMLDivElement>) {
  if (event.target === event.currentTarget) event.preventDefault()
}

interface DialogProps extends DialogPrimitive.Root.Props {
  /** With sound on (`YoujProvider`’s `sound`), opening plays `open` and closing `close`. `false` keeps this dialog silent. Default true. */
  sound?: boolean
}

/* The open and close sounds start with the popup's motion. A dialog that
 * keeps its own state sounds from Base UI's change; a controlled one from its
 * `open` prop, since a shortcut or a menu item can open it without a press on
 * a trigger. Shared with the sheet. */
function Dialog({ sound = true, ...props }: DialogProps) {
  const cue = useSoundCue()
  const { open, onOpenChange } = props
  const was = useRef(open)
  useEffect(() => {
    if (sound && open !== undefined && was.current !== undefined && open !== was.current) cue(open ? 'open' : 'close')
    was.current = open
  }, [open])
  return (
    <DialogPrimitive.Root
      data-slot="dialog"
      {...props}
      onOpenChange={(next, details) => {
        onOpenChange?.(next, details)
        if (sound && open === undefined && !details.isCanceled) cue(next ? 'open' : 'close')
      }}
    />
  )
}

function DialogTrigger(props: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

/**
 * Base UI's Portal with the youj scope, so the dialog follows Speed and
 * reduced motion, rendered where the provider's `portalContainer` says (a
 * phone-sized preview keeps its dialogs inside it).
 */
function DialogPortal({ container, ...props }: DialogPrimitive.Portal.Props) {
  const scope = useYoujScope()
  const portalContainer = usePortalContainer()
  return <DialogPrimitive.Portal data-slot="dialog-portal" container={container ?? portalContainer} {...props} {...scope} />
}

function DialogClose(props: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({ className, ...props }: DialogPrimitive.Backdrop.Props) {
  return <DialogPrimitive.Backdrop data-slot="dialog-overlay" className={cn(overlayScrimClass, className)} {...props} />
}

const TABBABLE =
  'a[href], button:not(:disabled), input:not(:disabled):not([type=hidden]), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'

/** `el`'s top edge in `frame`, from layout offsets: transforms (an entrance mid-flight) don't count. */
function layoutTop(el: HTMLElement, frame: HTMLElement) {
  let top = 0
  let node: HTMLElement | null = el
  while (node && node !== frame) {
    top += node.offsetTop
    node = node.offsetParent as HTMLElement | null
  }
  return node === frame ? top : null
}

/**
 * The popup's ref, plus Base UI's default initial focus with one exception.
 * Base UI focuses the first tabbable element; in a dialog taller than the
 * screen that can sit below the fold, and focusing it scrolls the start of
 * the dialog away. As the APG advises, focus then starts on the dialog itself
 * so the reader begins at its title. It measures layout, not rects, because
 * the popup is still in its entrance transform (a sheet is off-screen) when
 * Base UI asks. Shared with the alert dialog, sheet and drawer.
 */
function useDialogFocus(ref: Ref<HTMLDivElement> | undefined) {
  const popup = useRef<HTMLDivElement | null>(null)
  const [node, setNode] = useState<HTMLDivElement | null>(null)
  const setRef = useCallback(
    (el: HTMLDivElement | null) => {
      popup.current = el
      setNode(el)
      if (typeof ref === 'function') ref(el)
      else if (ref) ref.current = el
    },
    [ref],
  )
  const initialFocus = useCallback((interactionType?: string) => {
    const el = popup.current
    // Opened by a touch, focus goes to the dialog itself, as Base UI does by
    // default: focusing a field would raise the on-screen keyboard over the
    // dialog before it has been read. A tap on the field raises it.
    if (el && interactionType === 'touch') return el
    const first = el?.querySelector<HTMLElement>(TABBABLE)
    if (!el || !first) return true
    // The frame the reader sees: the Viewport around the popup, or the popup itself.
    const frame = el.parentElement?.matches('[data-slot$="viewport"]') ? el.parentElement : el
    const top = layoutTop(first, frame)
    return top !== null && top + first.offsetHeight > frame.clientHeight ? el : true
  }, [])
  return { ref: setRef, initialFocus, node }
}

/**
 * Whether `el` scrolls with nothing focusable inside, in which case a keyboard
 * user can't reach its overflow unless it is a tab stop itself. Kept current
 * as it resizes and its content changes.
 */
function useScrollRegion(el: HTMLElement | null) {
  const [unreachable, setUnreachable] = useState(false)
  useEffect(() => {
    if (!el) return
    const check = () => setUnreachable(el.scrollHeight > el.clientHeight + 1 && !el.querySelector(TABBABLE))
    check()
    const resize = new ResizeObserver(check)
    resize.observe(el)
    const content = new MutationObserver(check)
    content.observe(el, { childList: true, subtree: true })
    return () => {
      resize.disconnect()
      content.disconnect()
    }
  }, [el])
  return unreachable
}

/** Where a dialog is presented: `auto` is centered under a pointer and a bottom sheet on touch. */
type DialogPresentation = 'auto' | 'sheet' | 'dialog'

interface DialogContentProps extends DialogPrimitive.Popup.Props {
  /** Renders the × button in the top corner. Default true. */
  showCloseButton?: boolean
  /** `auto` (the default) is a centered dialog under a pointer and a bottom sheet on touch; `dialog` or `sheet` forces one. */
  presentation?: DialogPresentation
}

/** The Viewport of a dialog presented as a sheet: it holds the sheet on the bottom edge, centered on a wide screen. */
const dialogSheetViewportClass = 'fixed own:inset-0 z-50 own:flex items-end justify-center'

/* The sheet is presentation.tsx's surface with a dialog's layout on it (its
 * gap, padding and type), up to 90% of the screen, and above the on-screen
 * keyboard while a field in it is typed in (sheetKeyboardClass). With a
 * dialog open over it, it recedes a step: it shrinks towards its top edge,
 * where it peeks out above the new sheet, under the scrim's wash. */
const dialogSheetPopupClass = cn(
  sheetPopupClass,
  sheetKeyboardClass,
  '[--yj-sheet-max-height:min(90dvh,calc(var(--yj-sheet-visible,100dvh)_-_0.75rem))] text-ui',
  // The centered dialog's gap and padding, a step tighter at the compact layout density.
  'own:gap-[calc(var(--spacing)*(4_-_var(--ui--compact,0)))] own:px-[calc(var(--spacing)*(5_-_var(--ui--compact,0)))] own:pt-0 own:pb-[calc(var(--spacing)*(5_-_var(--ui--compact,0)))]',
  // The home indicator's inset is a transparent bottom border, not padding:
  // the Bezel style lays a dialog out in edge-to-edge bands and zeroes its
  // padding, and it must clear the indicator there too. The sheet scrolls
  // (Bezel clips a dialog) and is square at the bottom edge.
  'border-b-[length:env(safe-area-inset-bottom)] border-b-transparent own:overflow-y-auto own:rounded-b-none',
  'origin-top data-nested-dialog-open:[--yj-sheet-rest:scale(0.94)]',
  'after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:opacity-0 data-nested-dialog-open:after:opacity-100',
  'after:bg-scrim',
  'after:transition-opacity after:duration-[calc(var(--yj-duration-base)*var(--yj-motion,1))] after:ease-standard',
)

/* A consumer's className is written for the centered dialog. Margins that
 * place it (CommandDialog hangs from the top third) would lift the sheet off
 * the bottom edge, so the sheet takes them back; its bottom margin is the
 * keyboard's (sheetKeyboardClass). Width loses to sheetPopupClass already. */
const dialogSheetPinClass = 'own:mt-0 own:mb-[max(0px,calc(var(--yj-sheet-inset,0px)_-_env(safe-area-inset-bottom)))]'

/* The × keeps its size; on touch an invisible 4px ring around it makes the
 * target 44px. */
const closeButtonClass = 'absolute end-3 top-3 touch:after:absolute touch:after:-inset-1'

/* The popup is centered by auto margins in a scrolling flex Viewport: when it
 * fits it sits in the middle, and when it doesn't it starts at the top and
 * the viewport scrolls (a centered flex item would be clipped at the top). */
function DialogContent({
  className,
  children,
  showCloseButton = true,
  presentation = 'auto',
  ref,
  initialFocus,
  ...props
}: DialogContentProps) {
  const focus = useDialogFocus(ref)
  const labels = useComponentLabels(dialogLabels)
  const k = useYouj()
  const sheet = useSheetPresentation(presentation === 'dialog' ? 'popover' : presentation)
  const inset = useVisualViewportInset<HTMLDivElement>()
  const { ref: focusRef } = focus
  // The sheet's popup also follows the visual viewport (the on-screen keyboard).
  const sheetRef = useCallback(
    (el: HTMLDivElement | null) => {
      focusRef(el)
      if (!el) return
      const release = inset(el)
      return () => {
        release?.()
        focusRef(null)
      }
    },
    [focusRef, inset],
  )
  const close = showCloseButton && (
    <DialogPrimitive.Close
      data-slot="dialog-close"
      render={<Button variant="ghost" size="icon-sm" className={closeButtonClass} />}
    >
      {/* Youj's x drawn inline: an animated icon would bring Motion's runtime into every dialog, whose own motion is CSS. */}
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M18 6 L6 18 M6 6 L18 18" />
      </svg>
      <span className="sr-only">{labels.close}</span>
    </DialogPrimitive.Close>
  )
  if (sheet) {
    return (
      <DialogPortal>
        <SheetLayer>
          <DialogOverlay data-sheet-scrim="" />
          <DialogPrimitive.Viewport
            data-slot="dialog-viewport"
            className={dialogSheetViewportClass}
            onMouseDown={keepFocusOnViewportPress}
          >
            <DialogPrimitive.Popup
              ref={sheetRef}
              initialFocus={initialFocus ?? focus.initialFocus}
              data-slot="dialog-content"
              data-yj-tone="overlay"
              data-sheet-popup=""
              data-reduced-motion={k.reduced || undefined}
              className={cn(dialogSheetPopupClass, className, dialogSheetPinClass)}
              {...props}
            >
              {/* p-0!: Bezel pads a dialog's sections, and the handle is not one. */}
              <SheetHandle className="mt-2 mb-0 own:p-0" />
              {children}
              {close}
            </DialogPrimitive.Popup>
          </DialogPrimitive.Viewport>
        </SheetLayer>
      </DialogPortal>
    )
  }
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Viewport
        data-slot="dialog-viewport"
        className={dialogViewportClass}
        onMouseDown={keepFocusOnViewportPress}
      >
        <DialogPrimitive.Popup
          ref={focus.ref}
          initialFocus={initialFocus ?? focus.initialFocus}
          data-slot="dialog-content"
          data-yj-tone="overlay"
          className={cn(dialogPopupClass, className)}
          {...props}
        >
          {children}
          {close}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Viewport>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      // Clears the close button, which sits in the top corner.
      className={cn('own:flex flex-col own:gap-1.5 own:pe-8', className)}
      {...props}
    />
  )
}

/* In a touch sheet the actions stack full width at any screen width, primary
 * on top, each at least 44px tall: the `!` wins over the wide screen's row. */
const sheetFooterClass =
  'group-data-sheet-popup/sheet:flex-col-reverse! group-data-sheet-popup/sheet:items-stretch! group-data-sheet-popup/sheet:justify-start! own:group-data-sheet-popup/sheet:gap-2 group-data-sheet-popup/sheet:[&>:is(button,a)]:min-h-11'

/** Actions, end-aligned. Stacks with the primary action on top on narrow screens, and always in a touch sheet. */
function DialogFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn('own:mt-1 own:flex flex-col-reverse own:gap-3 sm:flex-row sm:items-center sm:justify-end own:sm:gap-2', sheetFooterClass, className)}
      {...props}
    />
  )
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn('own:text-base own:leading-6 own:font-semibold own:tracking-tight own:text-fg', className)}
      {...props}
    />
  )
}

function DialogDescription({ className, ...props }: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        'own:text-ui own:text-fg-muted *:[a]:text-fg *:[a]:underline *:[a]:underline-offset-3',
        className,
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  dialogPopupClass,
  dialogViewportClass,
  keepFocusOnViewportPress,
  overlayScrimClass,
  useDialogFocus,
  useScrollRegion,
}
export type { DialogContentProps, DialogPresentation, DialogProps }
