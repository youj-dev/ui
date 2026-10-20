'use client'

import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type RefObject } from 'react'
import { m, useTransform } from 'motion/react'
import { MotionFeatures } from '@youj/core'
import { cn } from '../../../lib/utils'
import type { ImageEditorCopy, ImageEditorEdit, ImageEditorPoint } from './data'
import { clamp, clampCenter, coverScale, place, placement, toFrame, toImage, transformOf, type Size } from './geometry'
import { Corners, Grid } from './frame-marks'
import { livePlacement, type Live } from './use-live'

/* The stage: the photo under a fixed frame, everything outside the frame
 * dimmed. Drag to move it (it follows the pointer 1:1, gives with
 * resistance past an edge and springs back on release), pinch or scroll to
 * zoom about the pointer, and drag the focal point onto what matters most.
 * A thirds grid shows while it moves, a finer one while it's straightened.
 * As a group it takes keys too: arrows move it (Shift for larger steps), +
 * and − zoom, [ and ] straighten, R turns it, H and V flip it, 0 resets; the
 * focal point is a control of its own with its position read out. */

const MAX_ZOOM = 8

interface StageProps {
  live: Live
  natural: Size
  /** The frame as committed (the live one may be mid-morph). */
  frame: Size
  src: string
  edit: ImageEditorEdit
  round: boolean
  focal: boolean
  straightening: boolean
  copy: ImageEditorCopy
  imageRef: RefObject<HTMLImageElement | null>
  /** Drawn on a canvas at Save, so a picture from another origin loads with CORS. */
  crossOrigin?: 'anonymous' | 'use-credentials'
  onCommit: (change: Partial<ImageEditorEdit>) => void
  onTurn: (quarters: number) => void
  onFlip: (axis: 'x' | 'y') => void
  onReset: () => void
}

export function Stage({
  live,
  natural,
  frame,
  src,
  edit,
  round,
  focal,
  straightening,
  copy,
  imageRef,
  crossOrigin,
  onCommit,
  onTurn,
  onFlip,
  onReset,
}: StageProps) {
  const stage = useRef<HTMLDivElement>(null)
  const keysId = useId()
  const focalKeysId = useId()
  const [moving, setMoving] = useState(false)
  const image = useTransform(() => transformOf(livePlacement(live, natural).p))
  const frameStyle = { width: live.frameW, height: live.frameH }
  // The focal point on screen, kept inside the frame.
  const focalX = useTransform(() => {
    const { p, frame } = livePlacement(live, natural)
    return clamp(toFrame({ x: live.focalX.get(), y: live.focalY.get() }, natural, p).x, -frame.width / 2, frame.width / 2)
  })
  const focalY = useTransform(() => {
    const { p, frame } = livePlacement(live, natural)
    return clamp(toFrame({ x: live.focalX.get(), y: live.focalY.get() }, natural, p).y, -frame.height / 2, frame.height / 2)
  })

  /** The center the edit would have after the image moves by (dx, dy) and zooms from where a gesture began. */
  const moved = (start: { center: ImageEditorPoint }, dx: number, dy: number, zoom: number, give: boolean) => {
    const { p, frame } = livePlacement(live, natural)
    const scale = coverScale(frame, natural, p.angle) * zoom
    const from = placement(start.center, p.angle, scale, p.flipX, p.flipY, natural)
    return clampCenter(toImage({ x: -dx, y: -dy }, natural, from), natural, frame, p.angle, scale, give)
  }

  // Pointers: one moves the image, two pinch.
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const gesture = useRef<{ x: number; y: number; distance: number; center: ImageEditorPoint; zoom: number } | null>(null)
  const begin = () => {
    const points = [...pointers.current.values()]
    const x = points.reduce((sum, pt) => sum + pt.x, 0) / points.length
    const y = points.reduce((sum, pt) => sum + pt.y, 0) / points.length
    const distance = points.length > 1 ? Math.hypot(points[0]!.x - points[1]!.x, points[0]!.y - points[1]!.y) : 0
    gesture.current = { x, y, distance, center: { x: live.cx.get(), y: live.cy.get() }, zoom: live.zoom.get() }
  }
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 && event.pointerType === 'mouse') return
    event.currentTarget.setPointerCapture(event.pointerId)
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    live.hold(true)
    begin()
    setMoving(true)
  }
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const g = gesture.current
    if (!g || !pointers.current.has(event.pointerId)) return
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    const points = [...pointers.current.values()]
    const x = points.reduce((sum, pt) => sum + pt.x, 0) / points.length
    const y = points.reduce((sum, pt) => sum + pt.y, 0) / points.length
    const zoom =
      points.length > 1 && g.distance > 0
        ? clamp(g.zoom * (Math.hypot(points[0]!.x - points[1]!.x, points[0]!.y - points[1]!.y) / g.distance), 1, MAX_ZOOM)
        : g.zoom
    const center = moved(g, x - g.x, y - g.y, zoom, true)
    live.zoom.jump(zoom)
    live.cx.jump(center.x)
    live.cy.jump(center.y)
  }
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.delete(event.pointerId)) return
    if (pointers.current.size > 0) return begin()
    gesture.current = null
    live.hold(false)
    setMoving(false)
    const { p, frame } = livePlacement(live, natural)
    const zoom = live.zoom.get()
    onCommit({ zoom, center: clampCenter({ x: live.cx.get(), y: live.cy.get() }, natural, frame, p.angle, p.scale) })
  }

  // The wheel zooms about the pointer; it needs a listener that isn't passive to keep the page still.
  const wheel = useRef<(event: WheelEvent) => void>(() => {})
  useLayoutEffect(() => {
    wheel.current = (event) => {
      event.preventDefault()
      const rect = stage.current!.getBoundingClientRect()
      const { p, frame } = livePlacement(live, natural)
      const zoom = clamp(edit.zoom * Math.exp(-event.deltaY * 0.0015), 1, MAX_ZOOM)
      const under = toImage({ x: event.clientX - rect.left - rect.width / 2, y: event.clientY - rect.top - rect.height / 2 }, natural, p)
      const ratio = edit.zoom / zoom
      const center = { x: under.x + (edit.center.x - under.x) * ratio, y: under.y + (edit.center.y - under.y) * ratio }
      onCommit({ zoom, center: clampCenter(center, natural, frame, p.angle, coverScale(frame, natural, p.angle) * zoom) })
    }
  })
  useEffect(() => {
    const el = stage.current
    if (!el) return
    const onWheel = (event: WheelEvent) => wheel.current(event)
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return
    const { p, frame } = livePlacement(live, natural)
    const step = event.shiftKey ? 32 : 8
    const nudge = (dx: number, dy: number) =>
      onCommit({ center: clampCenter(toImage({ x: -dx, y: -dy }, natural, p), natural, frame, p.angle, p.scale) })
    const zoomTo = (zoom: number) => {
      const z = clamp(zoom, 1, MAX_ZOOM)
      onCommit({ zoom: z, center: clampCenter(edit.center, natural, frame, p.angle, coverScale(frame, natural, p.angle) * z) })
    }
    const key = event.key
    if (key === 'ArrowLeft') nudge(-step, 0)
    else if (key === 'ArrowRight') nudge(step, 0)
    else if (key === 'ArrowUp') nudge(0, -step)
    else if (key === 'ArrowDown') nudge(0, step)
    else if (key === '+' || key === '=') zoomTo(edit.zoom * 1.1)
    else if (key === '-' || key === '_') zoomTo(edit.zoom / 1.1)
    else if (key === '[' || key === ']') onCommit({ rotation: edit.rotation + (key === ']' ? 1 : -1) * (event.shiftKey ? 5 : 0.5) })
    else if (key === 'r' || key === 'R') onTurn(event.shiftKey ? -1 : 1)
    else if (key === 'h' || key === 'H') onFlip('x')
    else if (key === 'v' || key === 'V') onFlip('y')
    else if (key === '0') onReset()
    else return
    event.preventDefault()
  }

  // The focal point: dragged or moved with arrows, always inside the frame.
  const placeFocal = (screen: ImageEditorPoint) => {
    const { p, frame } = livePlacement(live, natural)
    const inside = { x: clamp(screen.x, -frame.width / 2, frame.width / 2), y: clamp(screen.y, -frame.height / 2, frame.height / 2) }
    return toImage(inside, natural, p)
  }
  const onFocalDown = (event: PointerEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    live.hold(true)
  }
  const onFocalMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
    const rect = stage.current!.getBoundingClientRect()
    const point = placeFocal({ x: event.clientX - rect.left - rect.width / 2, y: event.clientY - rect.top - rect.height / 2 })
    live.focalX.jump(point.x)
    live.focalY.jump(point.y)
  }
  const onFocalUp = (event: PointerEvent<HTMLButtonElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
    event.currentTarget.releasePointerCapture(event.pointerId)
    live.hold(false)
    onCommit({ focal: { x: live.focalX.get(), y: live.focalY.get() } })
  }
  const onFocalKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    const { frame } = livePlacement(live, natural)
    const step = (event.shiftKey ? 0.1 : 0.01) * Math.min(frame.width, frame.height)
    const delta = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[event.key]
    if (!delta) return
    event.preventDefault()
    onCommit({ focal: placeFocal({ x: focalX.get() + delta[0]!, y: focalY.get() + delta[1]! }) })
  }
  // Where the focal point lands in the saved image, read out with the handle.
  const at = toFrame(edit.focal, natural, place(edit, natural, frame))
  const focalOut = { x: Math.round(clamp(at.x / frame.width + 0.5, 0, 1) * 100), y: Math.round(clamp(at.y / frame.height + 0.5, 0, 1) * 100) }

  return (
    <MotionFeatures>
      <div
        ref={stage}
        role="group"
        tabIndex={0}
        aria-roledescription={copy.stageRole}
        aria-label={copy.stage}
        aria-describedby={keysId}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        className={cn('relative h-full w-full touch-none overflow-hidden select-none focus-ring', moving ? 'cursor-grabbing' : 'cursor-grab')}
      >
        <span id={keysId} className="sr-only">
          {copy.stageKeys}
        </span>
        <m.img
          ref={imageRef}
          src={src}
          crossOrigin={crossOrigin}
          alt=""
          draggable={false}
          className="pointer-events-none absolute top-1/2 left-1/2 max-w-none"
          style={{ width: natural.width, height: natural.height, transform: image }}
        />
        <m.div
          aria-hidden
          className={cn(
            'pointer-events-none absolute top-1/2 left-1/2 border border-[color-mix(in_oklab,white_80%,transparent)] shadow-[0_0_0_100vmax_color-mix(in_oklab,var(--color-shadow)_58%,transparent)]',
            round && 'rounded-full',
          )}
          style={{ ...frameStyle, x: '-50%', y: '-50%' }}
        >
          <Grid lines={3} className={moving ? 'opacity-100' : 'opacity-0'} />
          <Grid lines={8} className={straightening ? 'opacity-100' : 'opacity-0'} />
          {!round && <Corners />}
        </m.div>
        {focal && (
          <m.div className="absolute top-1/2 left-1/2 size-0" style={{ x: focalX, y: focalY }}>
            <button
              type="button"
              aria-label={copy.focal}
              aria-describedby={focalKeysId}
              onPointerDown={onFocalDown}
              onPointerMove={onFocalMove}
              onPointerUp={onFocalUp}
              onPointerCancel={onFocalUp}
              onKeyDown={onFocalKey}
              className="group/focal absolute grid size-8 -translate-x-1/2 -translate-y-1/2 cursor-move place-items-center rounded-full focus-ring"
            >
              <span className="grid size-6 place-items-center rounded-full border-2 border-[white] bg-[color-mix(in_oklab,var(--color-shadow)_24%,transparent)] shadow-[0_1px_4px_color-mix(in_oklab,var(--color-shadow)_50%,transparent)] transition-transform yj-duration-fast ease-standard group-hover/focal:scale-110">
                <span className="size-1.5 rounded-full bg-[white]" />
              </span>
              <span id={focalKeysId} className="sr-only">
                {`${copy.focalAt(focalOut.x, focalOut.y)}. ${copy.focalKeys}`}
              </span>
            </button>
          </m.div>
        )}
      </div>
    </MotionFeatures>
  )
}
