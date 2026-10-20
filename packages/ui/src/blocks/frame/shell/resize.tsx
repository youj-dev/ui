'use client'

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react'
import { useSidebar } from '../../../components/ui/sidebar'
import { useControllableState } from '../../../hooks/use-controllable-state'
import { cn } from '../../../lib/utils'

/* A sidebar you can resize, as a window splitter (Linear's, VS Code's):
 * - Drag the inner edge: the width follows the pointer between `min` and
 *   `max`, with nothing easing behind it. Pull it well past the minimum and
 *   it folds to icons; pull a folded sidebar out and it opens again, in the
 *   same drag. A press that doesn't move folds or unfolds it, as the plain
 *   edge does.
 * - From the keyboard the edge is a separator: ← and → move it 16px (with
 *   Shift, 64px; on a sidebar at the right, as in right-to-left, the arrows
 *   still move the edge the way they point), Home and End take it to the
 *   limits, Enter folds and unfolds it. Pushed below the minimum, it folds.
 * - The width is the app's to keep (`width`, `onWidthChange`): it's reported
 *   when a drag ends and on each key, never mid-drag.
 * Below `md` the sidebar is a sheet and the edge isn't drawn. */

export interface FrameSidebarWidthProps {
  /** The expanded sidebar's width in px, to control it (from storage, say). */
  width?: number
  /** The width it starts at, when uncontrolled. Default: the sidebar's own. */
  defaultWidth?: number
  /** Called with the width (px) once a drag ends or a key moves the edge: keep it to restore the user's choice. */
  onWidthChange?: (width: number) => void
}

export const RESIZE_COPY = {
  /** The edge's name for assistive tech. */
  resize: 'Resize sidebar',
  /** The edge's value, read as the width. */
  resizeValue: (px: number) => `${px} pixels wide`,
  /** The edge's value while the sidebar is folded to icons. */
  resizeCollapsed: 'Collapsed to icons',
}

export type FrameResizeCopy = typeof RESIZE_COPY

const STEP = 16
const BIG_STEP = 64
/** How far past the minimum a drag goes before the sidebar folds, and how far out a folded one has to be pulled to open. */
const FOLD = 64

/**
 * The width a resizable sidebar is at, and its look while a drag is on:
 * spread `style` and `className` on the Sidebar, and render
 * `<FrameSidebarResize {...edge} />` inside it in place of SidebarRail.
 */
export function useFrameSidebarWidth({ width, defaultWidth, onWidthChange }: FrameSidebarWidthProps, { min = 200, max = 420 } = {}) {
  const [value, setValue] = useControllableState(width, defaultWidth)
  const [dragging, setDragging] = useState(false)
  const commit = (next: number) => {
    const clamped = Math.round(Math.min(max, Math.max(min, next)))
    setValue(clamped)
    onWidthChange?.(clamped)
  }
  return {
    style: (value === undefined ? {} : { '--sidebar-width': `${value}px` }) as CSSProperties,
    // While a drag is on, the width follows the pointer with nothing easing behind it.
    className: dragging ? 'transition-none' : undefined,
    edge: { width: value, min, max, onDrag: setDragging, onCommit: commit },
  }
}

interface FrameSidebarResizeProps {
  /** The width it's set to, once there is one (until then it's the sidebar's own, measured). */
  width: number | undefined
  min: number
  max: number
  onDrag: (dragging: boolean) => void
  onCommit: (width: number) => void
  copy?: Partial<FrameResizeCopy>
  className?: string
}

/** The sidebar's resizable inner edge. Render it inside a Sidebar with the `edge` from useFrameSidebarWidth. */
export function FrameSidebarResize({ width, min, max, onDrag, onCommit, copy: copyProp, className }: FrameSidebarResizeProps) {
  const copy = { ...RESIZE_COPY, ...copyProp }
  const { state, setOpen, isMobile } = useSidebar()
  const collapsed = state === 'collapsed'
  const ref = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; moved: boolean; live?: number; folded: boolean } | null>(null)
  // The width the sidebar is drawn at (its CSS default until it's resized), for the edge's value.
  const [drawn, setDrawn] = useState<number>()

  const container = () => ref.current?.closest<HTMLElement>('[data-slot=sidebar-container]') ?? null
  useEffect(() => {
    // On a phone there's no edge to measure for; back on a wide screen it's drawn again, and observed.
    const box = isMobile ? null : ref.current?.closest<HTMLElement>('[data-slot=sidebar-container]')
    if (!box || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => setDrawn(Math.round(box.getBoundingClientRect().width)))
    observer.observe(box)
    return () => observer.disconnect()
  }, [isMobile])

  const rtl = () => getComputedStyle(ref.current!).direction === 'rtl'
  const clamp = (px: number) => Math.round(Math.min(max, Math.max(min, px)))
  // The width it's at: the one it was set to, else the one it's drawn at.
  const current = () => width ?? Math.round(container()?.getBoundingClientRect().width ?? min)

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    // No text selection while dragging, and the edge keeps the pointer wherever it goes.
    event.preventDefault()
    event.currentTarget.setPointerCapture?.(event.pointerId)
    drag.current = { x: event.clientX, moved: false, folded: collapsed }
  }
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    const box = container()
    if (!d || !box) return
    if (!d.moved) {
      if (Math.abs(event.clientX - d.x) < 3) return
      d.moved = true
      onDrag(true)
    }
    // The pointer's distance from the sidebar's own start edge is the width it asks for.
    const rect = box.getBoundingClientRect()
    const asked = rtl() ? rect.right - event.clientX : event.clientX - rect.left
    if (!d.folded && asked < min - FOLD) {
      d.folded = true
      setOpen(false)
    } else if (d.folded && asked > FOLD) {
      d.folded = false
      setOpen(true)
    }
    if (d.folded) return
    d.live = clamp(asked)
    box.style.setProperty('--sidebar-width', `${d.live}px`)
  }
  const onPointerUp = () => {
    const d = drag.current
    drag.current = null
    if (!d) return
    // A press that didn't move is the plain edge's click: fold or unfold.
    if (!d.moved) return setOpen(collapsed)
    onDrag(false)
    if (d.live !== undefined && !d.folded) onCommit(d.live)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const arrow = { ArrowRight: 1, ArrowLeft: -1 }[event.key]
    if (event.key === 'Enter') setOpen(collapsed)
    else if (arrow !== undefined) {
      // The edge moves the way the arrow points: on a sidebar at the right (RTL), ← widens it.
      const by = arrow * (rtl() ? -1 : 1) * (event.shiftKey ? BIG_STEP : STEP)
      if (collapsed) {
        if (by > 0) setOpen(true)
      } else if (by < 0 && current() <= min) setOpen(false)
      else onCommit(current() + by)
    } else if (event.key === 'Home' || event.key === 'End') {
      if (collapsed) setOpen(true)
      onCommit(event.key === 'Home' ? min : max)
    } else return
    event.preventDefault()
  }

  if (isMobile) return null
  const at = width ?? drawn
  const shown = collapsed ? 0 : at
  return (
    // A focusable window splitter, which an <hr> can't be.
    <div
      ref={ref}
      role="separator"
      aria-orientation="vertical"
      aria-label={copy.resize}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={shown}
      aria-valuetext={collapsed ? copy.resizeCollapsed : at !== undefined ? copy.resizeValue(at) : undefined}
      tabIndex={0}
      data-slot="frame-sidebar-resize"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
      className={cn(
        // An 8px reach along the inside of the edge (the sidebar clips anything past it); the line is 2px on the edge
        // itself, drawn on hover, focus and while dragging.
        'absolute inset-y-0 end-0 z-20 hidden w-2 cursor-col-resize touch-none outline-none select-none md:block',
        'after:absolute after:inset-y-0 after:end-0 after:w-0.5 after:transition-colors after:yj-duration-fast',
        'hover:after:bg-fg-subtle focus-visible:after:bg-focus active:after:bg-accent',
        className,
      )}
    />
  )
}
