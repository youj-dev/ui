'use client'

import { useCallback, useEffect, useRef, type ComponentProps } from 'react'
import { useDevice } from '@youj/core'
import { cn } from '../../lib/utils'

/* How an overlay is presented where it is operated. A menu or a picker under
 * a mouse is a popover that grows out of its trigger. Under a thumb it is a
 * sheet: it rises from the bottom edge where the hand already is, rows are
 * big enough to hit without looking, and it goes away the way a phone's own
 * sheets do, by being pulled down. The same Base UI primitive drives both, so
 * roles, focus, typeahead and dismissal are the ones the popover has; only
 * the placement, the surface and the way it is dismissed change.
 *
 * `useSheetPresentation()` decides (the device, or the component's
 * `presentation` prop). The pieces below are what a component renders in the
 * sheet case:
 *
 *   <Portal>
 *     <SheetLayer>                       carries the drag, owns no box
 *       <Backdrop className={sheetScrimClass} data-sheet-scrim />
 *       <Positioner className={sheetPositionerClass}>
 *         <Popup data-sheet-popup className={sheetPopupClass}>
 *           <SheetHandle />…rows
 *
 * The sheet follows the finger from the handle or from anywhere on it once
 * its list is scrolled to the top (a flick, or a drag past a quarter of its
 * height, dismisses it; a short drag springs back), and the scrim thins as it
 * leaves. It reuses motion's `yj-sheet-bottom` and `yj-backdrop` presets, which
 * already read `--drawer-swipe-*`, so a pulled sheet and a Drawer move alike.
 * Dismissal sends the Escape the keyboard would, so focus returns to the
 * trigger exactly as it does there. */

export type OverlayPresentation = 'auto' | 'sheet' | 'popover'

/** True when an overlay should be a bottom sheet: on touch (or forced), unless it was told to stay a popover. */
export function useSheetPresentation(presentation: OverlayPresentation = 'auto'): boolean {
  const device = useDevice()
  return presentation === 'sheet' || (presentation === 'auto' && device === 'touch')
}

/* The Positioner is floating-ui's: it writes top, left and a transform inline.
 * In a sheet it is a full-width box on the bottom edge, so each of those is
 * taken back with `!` (an inline style loses to an important rule). */
const sheetPositionerClass =
  // youj-allow: physical side, overrides the positioner's inline left
  'fixed! inset-x-0! top-auto! bottom-0! left-0! z-50 w-full! max-w-none! translate-none! transform-none! outline-none'

/** The popup as a sheet: rounded on top, full width up to a phone-ish column, scrolling past 85% of the screen. */
const sheetPopupClass = cn(
  'group/sheet yj-sheet-bottom relative isolate mx-auto own:flex max-h-[85dvh] w-full! min-w-0! max-w-xl! flex-col overflow-x-hidden overflow-y-auto yj-scrollbar overscroll-contain',
  'own:rounded-t-2xl own:rounded-b-none border-x border-t border-line bg-overlay own:px-1.5 own:pt-1 own:pb-[calc(var(--spacing)*2+env(safe-area-inset-bottom))] text-fg shadow-lg outline-none',
  'data-swiping:select-none',
)

/* The scrim role: the elevation ink, the same color the shadows use, a thin
 * wash in light and a deep one in dark. Dialog, Alert Dialog, Sheet and
 * Drawer share it (dialog.tsx re-exports it). It lives here, not in
 * dialog.tsx, because Dialog presents as a sheet on touch and imports this
 * file: defining it there would make the two modules import each other, and
 * reading it at load time across that cycle throws. */
const overlayScrimClass = cn(
  'yj-backdrop fixed inset-0 z-50 min-h-dvh supports-[-webkit-touch-callout:none]:absolute',
  'bg-scrim',
)

/** The scrim behind a sheet. Same wash as Dialog's, and it thins as the sheet is pulled away. */
const sheetScrimClass = overlayScrimClass

/** A group caption in a sheet lines up with the row text under it. */
const sheetLabelClass = 'group-data-sheet-popup/sheet:ps-3'

/** Rows in a sheet are 48px, type is the touch size, and keyboard hints (⌘K) are not shown: there is no keyboard. */
const sheetRowClass =
  'group-data-sheet-popup/sheet:min-h-12 group-data-sheet-popup/sheet:rounded-lg group-data-sheet-popup/sheet:ps-3 group-data-sheet-popup/sheet:text-base group-data-sheet-popup/sheet:active:bg-hover'

/** The grab handle. Decorative: the way to dismiss for a keyboard or a screen reader is Escape, as for a popover. */
function SheetHandle({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      aria-hidden
      data-slot="sheet-handle"
      className={cn('own:mx-auto own:mt-1 own:mb-2 h-1 w-9 shrink-0 own:rounded-full own:bg-well', className)}
      {...props}
    />
  )
}

/* The drag is imperative on purpose: it runs at the finger's rate and touches
 * three CSS custom properties and two attributes, so React never re-renders
 * while a sheet moves. `--drawer-swipe-movement-y` moves the popup,
 * `--drawer-swipe-progress` thins the scrim, `--drawer-swipe-strength` makes
 * a flick leave faster; `data-swiping` turns the transitions off while the
 * finger is down (yj-sheet-base and yj-backdrop key on it). */

/**
 * Mark an element inside a sheet with this attribute (`data-sheet-no-drag=""`)
 * when it handles a drag of its own: a touch that starts in it never moves the
 * sheet, so dragging a colour area or a slider down can't dismiss it.
 */
const SHEET_NO_DRAG = 'data-sheet-no-drag'

const DISMISS_FRACTION = 0.25
const DISMISS_VELOCITY = 0.55 // px per ms
const START_SLOP = 6 // px before a touch becomes a drag or a scroll

type Phase = 'idle' | 'pending' | 'drag' | 'scroll'

function setDragging(layer: HTMLElement, on: boolean) {
  for (const el of layer.querySelectorAll<HTMLElement>('[data-sheet-popup], [data-sheet-scrim]')) {
    if (on) el.setAttribute('data-swiping', '')
    else el.removeAttribute('data-swiping')
  }
}

/** Whether `el` or an ancestor below `root` has `touch-action: none`: it handles its own drags. */
function ownsTouch(el: Element | null, root: HTMLElement): boolean {
  for (let node = el; node && node !== root; node = node.parentElement) {
    if (getComputedStyle(node).touchAction === 'none') return true
  }
  return false
}

/** The nearest scroll container from `el` up to `root`, or root. A list scrolled partway must scroll, not drag the sheet. */
function scrollParent(el: Element | null, root: HTMLElement): HTMLElement {
  for (let node = el; node && node !== root; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node)
    if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) return node as HTMLElement
  }
  return root
}

/**
 * Wraps a sheet's scrim and popup. It renders a `display: contents` element
 * (no box of its own), so its children keep the Portal's layout, and carries
 * the drag from the pointer or finger to the popup and scrim.
 */
function SheetLayer({ className, children, ...props }: ComponentProps<'div'>) {
  const layerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const layer = layerRef.current
    if (!layer) return
    let phase: Phase = 'idle'
    let startY = 0
    let lastY = 0
    let lastT = 0
    let velocity = 0
    let movement = 0
    let height = 1
    let scroller: HTMLElement | null = null

    const popup = () => layer.querySelector<HTMLElement>('[data-sheet-popup]')

    const begin = (target: EventTarget | null, y: number) => {
      const el = popup()
      if (!el || !(target instanceof Node) || !el.contains(target)) return false
      // A control that owns its own drag (a colour area, a slider, a row that scrolls sideways) opts out.
      if ((target instanceof Element ? target : target.parentElement)?.closest(`[${SHEET_NO_DRAG}]`)) return false
      // So does one that takes the touch over with `touch-action: none` (a crop area, a signature pad) without saying so.
      if (ownsTouch(target instanceof Element ? target : target.parentElement, el)) return false
      phase = 'pending'
      startY = lastY = y
      lastT = performance.now()
      velocity = 0
      movement = 0
      height = el.getBoundingClientRect().height || 1
      scroller = scrollParent(target instanceof Element ? target : target.parentElement, el)
      return true
    }

    // Returns true while the sheet is being dragged, so a touch can cancel the page scroll.
    const move = (y: number) => {
      if (phase === 'idle' || phase === 'scroll') return false
      const dy = y - startY
      if (phase === 'pending') {
        if (Math.abs(dy) < START_SLOP) return false
        // Down from the top of the list drags the sheet; anything else is the list's own scroll.
        if (dy > 0 && (scroller?.scrollTop ?? 0) <= 0) {
          phase = 'drag'
          setDragging(layer, true)
        } else {
          phase = 'scroll'
          return false
        }
      }
      const now = performance.now()
      velocity = (y - lastY) / Math.max(now - lastT, 1)
      lastY = y
      lastT = now
      movement = Math.max(0, dy - START_SLOP)
      layer.style.setProperty('--drawer-swipe-movement-y', `${movement}px`)
      layer.style.setProperty('--drawer-swipe-progress', String(Math.min(1, movement / height)))
      return true
    }

    const end = () => {
      if (phase === 'drag') {
        setDragging(layer, false)
        const flick = velocity > DISMISS_VELOCITY
        if (flick || movement > height * DISMISS_FRACTION) {
          layer.style.setProperty('--drawer-swipe-strength', flick ? '0.5' : '1')
          popup()?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
          // The owner may refuse to close (a controlled Dialog busy saving): then the sheet springs back instead of staying pulled down.
          requestAnimationFrame(() => {
            const el = popup()
            if (!el?.isConnected || el.hasAttribute('data-closed') || el.hasAttribute('data-ending-style')) return
            layer.style.setProperty('--drawer-swipe-strength', '1')
            layer.style.setProperty('--drawer-swipe-movement-y', '0px')
            layer.style.setProperty('--drawer-swipe-progress', '0')
          })
        } else {
          layer.style.setProperty('--drawer-swipe-movement-y', '0px')
          layer.style.setProperty('--drawer-swipe-progress', '0')
        }
      }
      phase = 'idle'
    }

    // Touch: a non-passive touchmove so a drag can stop the page from scrolling.
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) begin(e.target, e.touches[0]!.clientY)
      else phase = 'idle'
    }
    const onTouchMove = (e: TouchEvent) => {
      if (move(e.touches[0]!.clientY) && e.cancelable) e.preventDefault()
    }
    // Mouse and pen (a forced touch preview on a desktop): pointer events, captured so the drag survives leaving the sheet.
    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'touch' || e.button !== 0) return
      if (begin(e.target, e.clientY)) (e.target as Element).setPointerCapture?.(e.pointerId)
    }
    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== 'touch') move(e.clientY)
    }
    const onPointerEnd = (e: PointerEvent) => {
      if (e.pointerType !== 'touch') end()
    }

    layer.addEventListener('touchstart', onTouchStart, { passive: true })
    layer.addEventListener('touchmove', onTouchMove, { passive: false })
    layer.addEventListener('touchend', end)
    layer.addEventListener('touchcancel', end)
    layer.addEventListener('pointerdown', onPointerDown)
    layer.addEventListener('pointermove', onPointerMove)
    layer.addEventListener('pointerup', onPointerEnd)
    layer.addEventListener('pointercancel', onPointerEnd)
    return () => {
      layer.removeEventListener('touchstart', onTouchStart)
      layer.removeEventListener('touchmove', onTouchMove)
      layer.removeEventListener('touchend', end)
      layer.removeEventListener('touchcancel', end)
      layer.removeEventListener('pointerdown', onPointerDown)
      layer.removeEventListener('pointermove', onPointerMove)
      layer.removeEventListener('pointerup', onPointerEnd)
      layer.removeEventListener('pointercancel', onPointerEnd)
    }
  }, [])

  return (
    <div ref={layerRef} data-slot="sheet-layer" className={cn('own:contents', className)} {...props}>
      {children}
    </div>
  )
}

export {
  SHEET_NO_DRAG,
  SheetHandle,
  SheetLayer,
  overlayScrimClass,
  sheetLabelClass,
  sheetPopupClass,
  sheetPositionerClass,
  sheetRowClass,
  sheetScrimClass,
}

/* ── Sheets with a text field: the on-screen keyboard ──────────────────── */

/* A sheet with a search field meets the on-screen keyboard. On iOS the
 * keyboard covers the bottom of the page without shrinking it: `100vh` and
 * `100dvh` stay the screen's height, so a sheet on the bottom edge carries on
 * under the keys, and a list that fills it pushes its own field off the top.
 * What does shrink is the visual viewport. `useVisualViewportInset()` follows
 * it and writes two properties on the element it is given, without a render:
 *
 *   --yj-sheet-inset    how far the visible area's bottom sits above the layout
 *                      viewport's: the keyboard, or 0
 *   --yj-sheet-visible  the visible area's height
 *
 * `sheetKeyboardClass` turns them into the popup's bottom margin, which lifts
 * it onto the keys (its safe-area padding may sit behind them: the keyboard
 * covers the home indicator too), and its max-height, `--yj-sheet-max-height`:
 * 85% of the screen or what is visible less a sliver, whichever is smaller.
 * So the field at the top of the sheet stays in view while it is typed in.
 * Android shrinks the visual viewport the same way; with
 * `interactive-widget=resizes-content` it shrinks the layout one too and the
 * inset is simply 0. A pinch-zoomed page says nothing about a keyboard, so
 * the sheet is left as it is then. */

const ZOOMED = 1.01

/**
 * A ref callback for a sheet's popup: keeps `--yj-sheet-inset` and
 * `--yj-sheet-visible` on it current with `window.visualViewport`, and
 * removes them (and its listeners) when the popup goes. A no-op without a
 * visual viewport (old browsers, the server, jsdom).
 */
function useVisualViewportInset<T extends HTMLElement = HTMLElement>() {
  return useCallback((node: T | null) => {
    const viewport = typeof window === 'undefined' ? null : window.visualViewport
    if (!node || !viewport) return
    const write = () => {
      const zoomed = viewport.scale > ZOOMED
      const covered = window.innerHeight - viewport.height - viewport.offsetTop
      // Sub-pixel differences between the two viewports are not a keyboard.
      const inset = zoomed || covered < 1 ? 0 : Math.round(covered)
      node.style.setProperty('--yj-sheet-inset', `${inset}px`)
      node.style.setProperty('--yj-sheet-visible', `${Math.round(zoomed ? window.innerHeight : viewport.height)}px`)
    }
    write()
    viewport.addEventListener('resize', write)
    viewport.addEventListener('scroll', write)
    return () => {
      viewport.removeEventListener('resize', write)
      viewport.removeEventListener('scroll', write)
      node.style.removeProperty('--yj-sheet-inset')
      node.style.removeProperty('--yj-sheet-visible')
    }
  }, [])
}

/** The popup classes that read `useVisualViewportInset()`: lifted above the keyboard and no taller than what is visible. */
const sheetKeyboardClass = cn(
  '[--yj-sheet-max-height:min(85dvh,calc(var(--yj-sheet-visible,100dvh)_-_0.75rem))] max-h-(--yj-sheet-max-height)',
  'mb-[max(0px,calc(var(--yj-sheet-inset,0px)_-_env(safe-area-inset-bottom)))]',
)

/* A search narrows the list at every keystroke. A bottom sheet that followed
 * its content would sink each time, taking the field the thumb is typing in
 * with it. So it keeps the tallest height it has had while open (within its
 * max-height); results that grow it, as async ones do, still can. */
function holdHeight(node: HTMLElement) {
  let held = 0
  const observer = new ResizeObserver(() => {
    const height = node.offsetHeight
    if (height <= held) return
    held = height
    node.style.minHeight = `min(${height}px, var(--yj-sheet-max-height, 85dvh))`
  })
  observer.observe(node)
  return () => {
    observer.disconnect()
    node.style.removeProperty('min-height')
  }
}

/**
 * Everything a sheet that holds a text field (Combobox, Command) needs. Put
 * `ref` and `initialFocus` on the Popup and `sheetKeyboardClass` in its
 * classes. The popup follows the on-screen keyboard and holds its height
 * while a search narrows it (`holdHeight: false` for a sheet with a fixed
 * height). Opened by a touch, focus goes to the sheet, not the field:
 * focusing the field would raise the keyboard over the list before anyone
 * has seen it; a tap on the field raises it. Opened from a keyboard or a
 * mouse, the field takes focus as it does in the popover. `focusField`
 * decides for every open instead: true for a sheet opened to type in (a
 * search button), false for one opened to browse.
 */
function useKeyboardSheet({ holdHeight: hold = true, focusField }: { holdHeight?: boolean; focusField?: boolean } = {}) {
  const device = useDevice()
  const popup = useRef<HTMLElement | null>(null)
  const inset = useVisualViewportInset()
  const detach = useRef<(() => void) | undefined>(undefined)
  // A ref callback's cleanup, kept for a caller that forwards the ref and calls it with null instead.
  const ref = useCallback(
    (node: HTMLElement | null) => {
      detach.current?.()
      detach.current = undefined
      popup.current = node
      if (!node) return
      const release = inset(node)
      const unhold = hold && typeof ResizeObserver !== 'undefined' ? holdHeight(node) : undefined
      const done = () => {
        release?.()
        unhold?.()
        if (popup.current === node) popup.current = null
        if (detach.current === done) detach.current = undefined
      }
      detach.current = done
      return done
    },
    [inset, hold],
  )
  const initialFocus = useCallback(
    (openType: string): HTMLElement | true => {
      const keys = openType === 'keyboard' || openType === 'mouse'
      const finger = openType === 'touch' || openType === 'pen' || (!keys && device === 'touch')
      const field = focusField ?? !finger
      return !field && popup.current ? popup.current : true
    },
    [device, focusField],
  )
  return { ref, initialFocus }
}

/* iOS raises the on-screen keyboard only for a focus that happens inside
 * the tap that asked for it, and a sheet's field mounts (and is focused by
 * Base UI) a moment after that tap. Focusing a hidden field during the tap
 * raises the keyboard at once, and iOS keeps it up when focus then moves to
 * the real field. Other platforms raise it for the later focus anyway, so
 * this only acts on iOS and iPadOS, where tapping a button doesn't focus it
 * either (so nothing that focus would have returned to is lost). */
function isIOS() {
  if (typeof navigator === 'undefined') return false
  return /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent))
}

/**
 * Call in the tap handler that opens a sheet meant for typing (a search
 * button opening a CommandPalette with `autoFocusField`), before the state
 * change: on iOS it holds the keyboard up until the sheet's field takes
 * focus. It removes its hidden field at the next focus anywhere, or after a
 * moment if none comes. Does nothing elsewhere.
 */
function primeKeyboard() {
  if (typeof document === 'undefined' || !isIOS()) return
  const proxy = document.createElement('input')
  proxy.setAttribute('aria-hidden', 'true')
  proxy.tabIndex = -1
  // 16px, or iOS zooms the page to it.
  proxy.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;font-size:16px;pointer-events:none'
  document.body.appendChild(proxy)
  proxy.focus({ preventScroll: true })
  const remove = () => {
    document.removeEventListener('focusin', onFocus, true)
    clearTimeout(timer)
    proxy.remove()
  }
  const onFocus = (event: FocusEvent) => event.target !== proxy && remove()
  document.addEventListener('focusin', onFocus, true)
  const timer = setTimeout(remove, 1000) // youj-allow: a safety net for a sheet that never opened, not motion
}

/** Whether a dismissal's Escape came from the sheet being pulled down (SheetLayer sends it to the popup), not from a key. */
function isSheetPull(event: Event | undefined) {
  return (
    !!event &&
    event.type === 'keydown' &&
    !event.isTrusted &&
    event.target instanceof Element &&
    event.target.hasAttribute('data-sheet-popup')
  )
}

export { isSheetPull, primeKeyboard, sheetKeyboardClass, useKeyboardSheet, useVisualViewportInset }
