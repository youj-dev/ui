'use client'

import { useLayoutEffect, useRef, type PointerEvent } from 'react'

/* The ink that SignaturePad and Whiteboard draw with. Pointer input comes in
 * through `useStrokeInput`: every coalesced sample the browser batched into
 * one move (a pen reports several per frame), with the pen's own pressure, or
 * for a mouse or a finger a pressure simulated from speed (fast is thin,
 * slow is full). `strokePath` turns the samples into one filled SVG path of
 * varying width: the samples are eased toward (streamlined) to iron out
 * jitter, each point is pushed out to both sides by its radius, round caps
 * close the ends and the outline is drawn as quadratic curves through the
 * midpoints of its corners, so it reads as a brush and not a polyline. */

/** One sample of a stroke: x and y in the caller's units, and the pressure, 0 to 1. */
export type StrokePoint = [x: number, y: number, pressure: number]

export interface StrokeOptions {
  /** The line's width at full pressure, in the points' units. */
  size: number
  /** How much pressure changes the width: 0 keeps it constant, 1 thins it to nothing at no pressure. Default 0.6. */
  thinning?: number
  /** How far each point eases toward its sample, 0 (not at all) to 1: more irons out more jitter and rounds more. Default 0.4. */
  streamline?: number
}

type Vec = [number, number]

const dist = (a: readonly number[], b: readonly number[]) => Math.hypot(a[0]! - b[0]!, a[1]! - b[1]!)
const round = (n: number) => Math.round(n * 100) / 100

/** A circle as a polygon, for a stroke that never moved. */
function dot([x, y]: Vec, r: number, steps = 16): Vec[] {
  return Array.from({ length: steps }, (_, i) => {
    const a = (i / steps) * Math.PI * 2
    return [x + Math.cos(a) * r, y + Math.sin(a) * r]
  })
}

/** Points on half a circle round `c`, from angle `from` turning clockwise by π, ends excluded. */
function cap(c: Vec, r: number, from: number, steps = 8): Vec[] {
  return Array.from({ length: steps - 1 }, (_, i) => {
    const a = from - (Math.PI * (i + 1)) / steps
    return [c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r]
  })
}

/** The outline of a stroke of varying width, as a closed polygon. */
export function strokeOutline(points: readonly StrokePoint[], { size, thinning = 0.6, streamline = 0.4 }: StrokeOptions): Vec[] {
  if (!points.length) return []
  const gap = size * 0.12
  const t = 1 - Math.min(0.95, Math.max(0, streamline))
  // Ease each point toward its sample and drop the ones that barely moved.
  const eased: StrokePoint[] = [points[0]!]
  for (let i = 1; i < points.length; i++) {
    const prev = eased.at(-1)!
    const p = points[i]!
    const next: StrokePoint = [prev[0] + (p[0] - prev[0]) * t, prev[1] + (p[1] - prev[1]) * t, p[2]]
    if (dist(prev, next) >= gap) eased.push(next)
  }
  // The line ends where the pen lifted, not where the easing had reached.
  const last = points.at(-1)!
  if (eased.length > 1 && dist(eased.at(-1)!, last) >= gap / 2) eased.push(last)

  // Pressure is smoothed too, so the width swells and thins rather than steps.
  let pressure = eased[0]![2]
  const radii = eased.map((p) => {
    pressure += (p[2] - pressure) * 0.35
    return (size / 2) * (1 - thinning * (1 - Math.min(1, Math.max(0, pressure))))
  })
  if (eased.length < 2) return dot([eased[0]![0], eased[0]![1]], Math.max(radii[0]!, size * 0.2))

  // A short taper at both ends, over about two widths of line.
  const lengths = [0]
  for (let i = 1; i < eased.length; i++) lengths.push(lengths[i - 1]! + dist(eased[i]!, eased[i - 1]!))
  const total = lengths.at(-1)!
  const taper = Math.min(size * 2, total / 3)
  for (let i = 0; i < eased.length; i++) {
    const edge = Math.min(lengths[i]!, total - lengths[i]!)
    if (taper > 0 && edge < taper) radii[i]! *= 0.55 + 0.45 * (edge / taper)
  }

  const left: Vec[] = []
  const right: Vec[] = []
  const normals: number[] = []
  for (let i = 0; i < eased.length; i++) {
    const a = eased[Math.min(i + 1, eased.length - 1)]!
    const b = eased[Math.max(i - 1, 0)]!
    const dx = a[0] - b[0]
    const dy = a[1] - b[1]
    const len = Math.hypot(dx, dy) || 1
    const n: Vec = [-dy / len, dx / len]
    const r = radii[i]!
    const p = eased[i]!
    left.push([p[0] + n[0] * r, p[1] + n[1] * r])
    right.push([p[0] - n[0] * r, p[1] - n[1] * r])
    normals.push(Math.atan2(n[1], n[0]))
  }
  const end = eased.at(-1)!
  const start = eased[0]!
  return [
    ...left,
    ...cap([end[0], end[1]], radii.at(-1)!, normals.at(-1)!),
    ...right.reverse(),
    ...cap([start[0], start[1]], radii[0]!, normals[0]! + Math.PI),
  ]
}

/** A closed polygon as a smooth SVG path: quadratic curves through the midpoints of its sides. */
export function outlinePath(outline: readonly Vec[]): string {
  const n = outline.length
  if (n < 3) return ''
  const mid = (a: Vec, b: Vec) => `${round((a[0] + b[0]) / 2)},${round((a[1] + b[1]) / 2)}`
  let d = `M${mid(outline[n - 1]!, outline[0]!)}`
  for (let i = 0; i < n; i++) {
    const p = outline[i]!
    d += `Q${round(p[0])},${round(p[1])} ${mid(p, outline[(i + 1) % n]!)}`
  }
  return `${d}Z`
}

/** A stroke's filled SVG path. */
export function strokePath(points: readonly StrokePoint[], options: StrokeOptions): string {
  return outlinePath(strokeOutline(points, options))
}

interface Sample {
  x: number
  y: number
  pressure: number
  t: number
}

/** The samples of one pointer event: those the browser coalesced into it, or the event itself. */
export function pointerSamples(e: PointerEvent): Sample[] {
  const native = e.nativeEvent as globalThis.PointerEvent | undefined
  const coalesced = typeof native?.getCoalescedEvents === 'function' ? native.getCoalescedEvents() : []
  const list = coalesced.length ? coalesced : [native ?? e]
  return list.map((s) => ({ x: s.clientX, y: s.clientY, pressure: s.pressure, t: s.timeStamp }))
}

interface StrokeInputOptions {
  /** False ignores pointers. Default true. */
  enabled?: boolean
  /** Maps a position on screen into the stroke's units; read during the drag, so it may measure the element. */
  toPoint: (clientX: number, clientY: number) => [number, number]
  onStart: (point: StrokePoint) => void
  /** New samples, in order, already in the stroke's units. */
  onExtend: (points: StrokePoint[]) => void
  /** The pointer lifted (`canceled` false) or the stroke was abandoned. */
  onEnd: (canceled: boolean) => void
}

/** Speed (px/ms) at which a simulated stroke is at its thinnest. */
const FAST = 2.4

/**
 * Pointer handlers that capture one stroke at a time: spread `handlers` on
 * the drawing surface (which wants `touch-action: none`). `cancel()` drops the
 * stroke in progress, as a second finger starting a pinch does.
 */
export function useStrokeInput({ enabled = true, toPoint, onStart, onExtend, onEnd }: StrokeInputOptions) {
  const active = useRef<{ id: number; pen: boolean; last: Sample; pressure: number } | null>(null)
  const callbacks = useRef({ toPoint, onExtend, onEnd })
  useLayoutEffect(() => {
    callbacks.current = { toPoint, onExtend, onEnd }
  })

  const pressureOf = (sample: Sample) => {
    const stroke = active.current!
    if (stroke.pen && sample.pressure > 0) return sample.pressure
    const dt = Math.max(1, sample.t - stroke.last.t)
    const speed = Math.hypot(sample.x - stroke.last.x, sample.y - stroke.last.y) / dt
    const target = Math.max(0.2, 1 - speed / FAST)
    stroke.pressure += (target - stroke.pressure) * 0.3
    return Math.round(stroke.pressure * 100) / 100
  }

  const finish = (canceled: boolean) => {
    if (!active.current) return
    active.current = null
    callbacks.current.onEnd(canceled)
  }

  const handlers = {
    onPointerDown(e: PointerEvent<Element>) {
      if (!enabled || active.current || (e.pointerType === 'mouse' && e.button !== 0)) return
      e.preventDefault()
      e.currentTarget.setPointerCapture?.(e.pointerId)
      const sample = { x: e.clientX, y: e.clientY, pressure: e.pressure, t: e.timeStamp }
      const pen = e.pointerType === 'pen'
      active.current = { id: e.pointerId, pen, last: sample, pressure: 0.55 }
      const [x, y] = toPoint(e.clientX, e.clientY)
      onStart([x, y, pen && e.pressure > 0 ? e.pressure : 0.55])
    },
    onPointerMove(e: PointerEvent<Element>) {
      if (active.current?.id !== e.pointerId) return
      const points = pointerSamples(e).map((sample): StrokePoint => {
        const pressure = pressureOf(sample)
        active.current!.last = sample
        const [x, y] = callbacks.current.toPoint(sample.x, sample.y)
        return [x, y, pressure]
      })
      callbacks.current.onExtend(points)
    },
    onPointerUp(e: PointerEvent<Element>) {
      if (active.current?.id === e.pointerId) finish(false)
    },
    onPointerCancel(e: PointerEvent<Element>) {
      if (active.current?.id === e.pointerId) finish(true)
    },
  }

  return { handlers, cancel: () => finish(true), isDrawing: () => active.current !== null }
}
