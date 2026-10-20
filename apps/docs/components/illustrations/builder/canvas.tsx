'use client'

import { useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent, type Ref } from 'react'
import { axisStep, boxFaces, hiddenEdges, project, sceneViewBox, toPoints } from '@youj/illustrations/components/youj/graphics/iso'
import { cn } from '@/lib/cn'
import { boundsOf, CEILING, clampPart, FLOOR, isRound, restingZ, round2, snap, type Bounds, type BuilderScene, type Part } from '@youj/illustrations/builder'
import { BuiltScene } from '@youj/illustrations/builder'

/* The canvas: the scene drawn by the kit, between a floor grid under it and
 * an overlay over it that outlines the selection and carries its handles,
 * all on one viewBox (the illustrations' shared volume), so a grid point is
 * the same pixel in all three layers.
 *
 * - Select: a click picks the part under the pointer (the kit's own faces
 *   are the hit area), Shift adds or removes one, a click on the floor
 *   clears the selection.
 * - Move: drag a part along the floor, or with Alt/Option up and down, in
 *   half units. While it moves nothing renders: the parts' own groups and
 *   the outline are translated by the projection of the snapped delta (an
 *   isometric move is exactly a translation on screen), gliding between
 *   steps on the fast token; the drop commits once.
 * - Resize: the squares on a part's faces pull that face along its axis; the
 *   ring above it raises or lowers it. A resize redraws only that part.
 * - A part dragged from the palette shows where it will land (on whatever is
 *   under it) before it's dropped.
 * Reduced motion: the glide between steps is instant. */

export const UNIT = 22
export const VIEW = sceneViewBox([FLOOR, FLOOR, CEILING], UNIT, 10)
const ASPECT = VIEW.width / VIEW.height
const COS = Math.cos(Math.PI / 6)
const SIN = Math.sin(Math.PI / 6)
/** A press that travels less than this (CSS px) is a click, not a drag. */
const THRESHOLD = 3

type Axis = 'x' | 'y' | 'z'
type HandleKind = 'w' | 'd' | 'h' | 'r' | 'lift'

interface Handle {
  kind: HandleKind
  axis: Axis
  at: readonly [number, number, number]
  label: string
}

/** A part's handles: a square on each face it can be pulled by, and a ring above it for its height off the floor. */
function handlesOf(part: Part): Handle[] {
  const { x, y, z, w, d, h } = boundsOf(part)
  const top = [x + w / 2, y + d / 2, z + h] as const
  const out: Handle[] = isRound(part)
    ? [{ kind: 'r', axis: 'x', at: [x + w, y + d / 2, z + h / 2], label: 'Radius' }]
    : [
        { kind: 'w', axis: 'x', at: [x + w, y + d / 2, z + h / 2], label: 'Width (x)' },
        { kind: 'd', axis: 'y', at: [x + w / 2, y + d, z + h / 2], label: 'Depth (y)' },
      ]
  out.push({ kind: 'h', axis: 'z', at: top, label: 'Height' }, { kind: 'lift', axis: 'z', at: top, label: 'Raise or lower (z)' })
  return out
}

/** A part resized by a handle pulled `delta` grid units along its axis, snapped and kept in range. */
function resized(part: Part, kind: HandleKind, delta: number): Part {
  if (kind === 'r' && isRound(part)) return clampPart({ ...part, r: snap(part.r + delta / 2, 0.25) }, part)
  if (kind === 'h') return clampPart({ ...part, h: Math.max(0, snap(part.h + delta)) }, part)
  if (kind === 'w' && !isRound(part)) return clampPart({ ...part, w: snap(part.w + delta) }, part)
  if (kind === 'd' && !isRound(part)) return clampPart({ ...part, d: snap(part.d + delta) }, part)
  return part
}

/** Where a pointer is in the drawing's user units. */
function toUser(el: HTMLElement, clientX: number, clientY: number): [number, number] {
  const r = el.getBoundingClientRect()
  return [VIEW.x + ((clientX - r.left) / r.width) * VIEW.width, VIEW.y + ((clientY - r.top) / r.height) * VIEW.height]
}

/** The grid point under a screen point on the level plane at height z. */
function toGrid([ux, uy]: readonly [number, number], z: number): [number, number] {
  const a = ux / (COS * UNIT)
  const b = (uy / UNIT + z) / SIN
  return [(a + b) / 2, (b - a) / 2]
}

/** A screen delta as a grid delta on a level plane. */
function planeDelta(dx: number, dy: number): [number, number] {
  const a = dx / (COS * UNIT)
  const b = dy / (SIN * UNIT)
  return [(a + b) / 2, (b - a) / 2]
}

/** How far a screen delta reaches along an axis, in grid units. */
function axisDelta(axis: Axis, dx: number, dy: number) {
  const [sx, sy] = axisStep(axis, UNIT)
  return (dx * sx + dy * sy) / (sx * sx + sy * sy)
}

const sameBounds = (a: Bounds, b: Bounds) => a.x === b.x && a.y === b.y && a.z === b.z && a.w === b.w && a.d === b.d && a.h === b.h

const GLIDE = 'transform calc(var(--yj-duration-fast) * var(--yj-motion, 1)) var(--ease-standard)'
const translate = (dx: number, dy: number, dz: number) => {
  const [sx, sy] = project(dx, dy, dz, UNIT)
  return `translate(${sx}px, ${sy}px)`
}

type Drag =
  | {
      kind: 'move'
      pointer: number
      start: [number, number]
      startClient: [number, number]
      ids: string[]
      primary: Bounds
      vertical: boolean
      moved: boolean
      delta: [number, number, number]
      range: { x: [number, number]; y: [number, number]; z: [number, number] }
      els: (SVGGElement | HTMLElement)[]
    }
  | { kind: 'resize'; pointer: number; start: [number, number]; part: Part; handle: Handle; next: Part | null }

export interface CanvasHandle {
  /** A part dragged in from the palette, over the canvas at a client point: where it would land, or null off the canvas. */
  dragOver: (clientX: number, clientY: number, part: Part | null) => Part | null
}

export interface CanvasProps {
  scene: BuilderScene
  selected: readonly string[]
  names: ReadonlyMap<string, string>
  onSelect: (ids: string[]) => void
  onMove: (ids: string[], dx: number, dy: number, dz: number) => void
  onResize: (part: Part) => void
  onKeyDown: (event: ReactKeyboardEvent<HTMLDivElement>) => void
  /** The id of the text that says how to use the canvas from the keyboard. */
  describedBy: string
  ref?: Ref<CanvasHandle>
}

export function Canvas({ scene, selected, names, onSelect, onMove, onResize, onKeyDown, describedBy, ref }: CanvasProps) {
  const box = useRef<HTMLDivElement>(null)
  const selection = useRef<SVGGElement>(null)
  const readout = useRef<HTMLSpanElement>(null)
  const drag = useRef<Drag | null>(null)
  const held = useRef<(SVGGElement | HTMLElement)[]>([])
  const [draft, setDraft] = useState<Part | null>(null)
  const [hover, setHover] = useState<string | null>(null)
  const [ghost, setGhost] = useState<Part | null>(null)
  const [grabbing, setGrabbing] = useState(false)
  // User units per CSS px: handles and hit areas keep their size at any scale.
  const [upx, setUpx] = useState(1)

  useLayoutEffect(() => {
    const el = box.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const measure = () => el.clientWidth && setUpx(VIEW.width / el.clientWidth)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // A committed move lands in the scene: the translation comes off in the same frame, without gliding back.
  useLayoutEffect(() => {
    for (const el of held.current) {
      el.style.transition = 'none'
      el.style.transform = ''
    }
    held.current = []
  }, [scene])

  const shown = draft ? { ...scene, parts: scene.parts.map((p) => (p.id === draft.id ? draft : p)) } : scene
  const byId = new Map(shown.parts.map((p) => [p.id, p]))
  const single = selected.length === 1 ? byId.get(selected[0]!) : undefined

  const describe = useCallback(
    (ids: readonly string[], parts: ReadonlyMap<string, Part>, delta: readonly [number, number, number] = [0, 0, 0]) => {
      if (!ids.length) return `${scene.parts.length} ${scene.parts.length === 1 ? 'part' : 'parts'}`
      if (ids.length > 1) return `${ids.length} parts selected`
      const part = parts.get(ids[0]!)
      if (!part) return ''
      const b = boundsOf(part)
      const size = isRound(part) ? `r ${part.r} · h ${part.h}` : `${b.w} × ${b.d} × ${part.h}`
      return `${names.get(part.id) ?? ''} · x ${round2(part.x + delta[0])} y ${round2(part.y + delta[1])} z ${round2(part.z + delta[2])} · ${size}`
    },
    [names, scene.parts.length],
  )

  useImperativeHandle(
    ref,
    () => ({
      dragOver(clientX, clientY, part) {
        const el = box.current
        if (!el || !part) {
          setGhost(null)
          return null
        }
        const r = el.getBoundingClientRect()
        if (clientX < r.left || clientX > r.right || clientY < r.top || clientY > r.bottom) {
          setGhost(null)
          return null
        }
        // The point under the pointer on the floor the part would stand on, as the middle of its footprint.
        const b = boundsOf(part)
        const [gx, gy] = toGrid(toUser(el, clientX, clientY), scene.base === 'plinth' || scene.base === 'turntable' ? 0.5 : 0)
        const placed = clampPart({ ...part, x: snap(gx - b.w / 2), y: snap(gy - b.d / 2) })
        const landed = clampPart({ ...placed, z: restingZ(scene, boundsOf(placed)) })
        setGhost((g) => (g && sameBounds(boundsOf(g), boundsOf(landed)) ? g : landed))
        return landed
      },
    }),
    [scene],
  )

  const partEls = (ids: readonly string[]) => {
    const el = box.current
    if (!el) return []
    // Ids are [a-z0-9-], safe in a selector as they are.
    return ids.flatMap((id) => [...el.querySelectorAll<SVGGElement>(`[data-part="${id}"]`)])
  }

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !box.current) return
    const target = e.target as Element
    const start = toUser(box.current, e.clientX, e.clientY)
    const handle = target.closest<SVGElement>('[data-handle]')?.dataset.handle as HandleKind | undefined
    if (handle && single) {
      e.preventDefault()
      e.currentTarget.setPointerCapture(e.pointerId)
      const h = handlesOf(single).find((x) => x.kind === handle)!
      if (handle === 'lift') startMove(e, [single.id], start, true)
      else drag.current = { kind: 'resize', pointer: e.pointerId, start, part: single, handle: h, next: null }
      setGrabbing(true)
      return
    }
    const id = target.closest<SVGGElement>('[data-part]')?.dataset.part
    if (!id) {
      if (!e.shiftKey) onSelect([])
      return
    }
    let ids = selected.includes(id) ? [...selected] : [id]
    if (e.shiftKey) {
      ids = selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]
      onSelect(ids)
      if (!ids.includes(id)) return
    } else if (!selected.includes(id)) onSelect(ids)
    e.currentTarget.setPointerCapture(e.pointerId)
    startMove(e, ids, start, e.altKey)
  }

  const startMove = (e: ReactPointerEvent, ids: string[], start: [number, number], vertical: boolean) => {
    const parts = ids.map((id) => byId.get(id)!).filter(Boolean)
    const boxes = parts.map(boundsOf)
    const primary = boundsOf(byId.get(ids.at(-1)!) ?? parts[0]!)
    const lo = (k: 'x' | 'y' | 'z') => Math.min(...boxes.map((b) => b[k]))
    const range = {
      x: [-lo('x'), FLOOR - Math.max(...boxes.map((b) => b.x + b.w))] as [number, number],
      y: [-lo('y'), FLOOR - Math.max(...boxes.map((b) => b.y + b.d))] as [number, number],
      z: [-lo('z'), CEILING - Math.max(...boxes.map((b) => b.z + b.h))] as [number, number],
    }
    drag.current = { kind: 'move', pointer: e.pointerId, start, startClient: [e.clientX, e.clientY], ids, primary, vertical, moved: false, delta: [0, 0, 0], range, els: [] }
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current
    const el = box.current
    if (!el) return
    if (!d) {
      const id = (e.target as Element).closest<SVGGElement>('[data-part]')?.dataset.part ?? null
      if (id !== hover) setHover(id)
      return
    }
    if (e.pointerId !== d.pointer) return
    const [ux, uy] = toUser(el, e.clientX, e.clientY)
    const [dx, dy] = [ux - d.start[0], uy - d.start[1]]
    if (d.kind === 'resize') {
      const next = resized(d.part, d.handle.kind, axisDelta(d.handle.axis, dx, dy))
      if (d.next && sameBounds(boundsOf(d.next), boundsOf(next))) return
      d.next = next
      setDraft(next)
      if (readout.current) readout.current.textContent = describe([next.id], new Map([[next.id, next]]))
      return
    }
    if (!d.moved) {
      if (Math.hypot(e.clientX - d.startClient[0], e.clientY - d.startClient[1]) < THRESHOLD) return
      d.moved = true
      d.els = [...partEls(d.ids), ...(selection.current ? [selection.current] : [])]
      for (const node of d.els) node.style.transition = GLIDE
      setGrabbing(true)
      setHover(null)
    }
    const clamp = (v: number, [lo, hi]: [number, number]) => Math.min(hi, Math.max(lo, v))
    const p = d.primary
    let delta: [number, number, number]
    if (d.vertical) {
      delta = [0, 0, clamp(round2(snap(p.z + axisDelta('z', dx, dy)) - p.z), d.range.z)]
    } else {
      const [gx, gy] = planeDelta(dx, dy)
      delta = [clamp(round2(snap(p.x + gx) - p.x), d.range.x), clamp(round2(snap(p.y + gy) - p.y), d.range.y), 0]
    }
    if (delta.every((v, i) => v === d.delta[i])) return
    d.delta = delta
    const t = translate(...delta)
    for (const node of d.els) node.style.transform = t
    if (readout.current) readout.current.textContent = describe(d.ids, byId, delta)
  }

  const finish = (e: ReactPointerEvent<HTMLDivElement>, cancel = false) => {
    const d = drag.current
    if (!d || e.pointerId !== d.pointer) return
    drag.current = null
    setGrabbing(false)
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
    if (d.kind === 'resize') {
      setDraft(null)
      if (d.next && !cancel) onResize(d.next)
      return
    }
    if (!d.moved) return
    const [dx, dy, dz] = d.delta
    if (cancel || (!dx && !dy && !dz)) {
      for (const node of d.els) {
        node.style.transition = 'none'
        node.style.transform = ''
      }
      return
    }
    // Held until the scene they move to renders, then released in the same frame.
    held.current = d.els
    onMove(d.ids, dx, dy, dz)
  }

  // Escape drops a drag where it started.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !drag.current) return
      e.stopPropagation()
      const d = drag.current
      drag.current = null
      setGrabbing(false)
      setDraft(null)
      if (d.kind === 'move')
        for (const node of d.els) {
          node.style.transition = 'none'
          node.style.transform = ''
        }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])

  const status = describe(selected, byId)

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        role="application"
        aria-roledescription="canvas"
        aria-label={`${scene.name}: the canvas`}
        aria-describedby={describedBy}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(e) => finish(e)}
        onPointerCancel={(e) => finish(e, true)}
        onPointerLeave={() => !drag.current && setHover(null)}
        className={cn(
          'relative grid min-h-0 flex-1 touch-none place-items-center overflow-hidden rounded-xl outline-none [container-type:size] focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset',
          grabbing ? 'cursor-grabbing' : hover ? 'cursor-grab' : 'cursor-default',
        )}
      >
        <div ref={box} className="relative" style={{ width: `min(100cqw, calc(100cqh * ${ASPECT}))`, aspectRatio: `${VIEW.width} / ${VIEW.height}` }}>
          <svg aria-hidden viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.width} ${VIEW.height}`} className="pointer-events-none absolute inset-0 size-full overflow-visible">
            <FloorGrid />
          </svg>
          {/* Positioned, so it paints over the grid before it (a static box would paint under an absolute one, whatever the order). */}
          <div className="relative">
            <BuiltScene scene={shown} annotate assemble={false} float={false} explode={0} unit={UNIT} grow />
          </div>
          <svg aria-hidden viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.width} ${VIEW.height}`} className="pointer-events-none absolute inset-0 size-full overflow-visible">
            {ghost && <Outline bounds={boundsOf(ghost)} tone="ghost" />}
            {hover && !selected.includes(hover) && byId.get(hover) && <Outline bounds={boundsOf(byId.get(hover)!)} tone="hover" />}
            <g ref={selection}>
              {selected.map((id) => {
                const part = byId.get(id)
                return part ? <Selected key={id} part={part} scene={shown} exclude={selected} /> : null
              })}
              {single && !grabbing && <Handles part={single} upx={upx} />}
            </g>
          </svg>
        </div>
      </div>
      <p className="flex h-8 shrink-0 items-center gap-2 px-1 type-label text-fg-subtle tabular-nums">
        <span ref={readout} className="truncate">
          {status}
        </span>
      </p>
    </div>
  )
}

const HAIR = { vectorEffect: 'non-scaling-stroke', strokeLinejoin: 'round', strokeLinecap: 'round' } as const
const ACCENT = 'var(--color-accent)'

/** The floor, framed: its grid at z = 0 and the volume every scene fills, dashed. */
function FloorGrid() {
  const line = (a: readonly [number, number, number], b: readonly [number, number, number]) => {
    const [p, q] = [project(...a, UNIT), project(...b, UNIT)]
    return `M${p[0]},${p[1]} L${q[0]},${q[1]}`
  }
  const grid: string[] = []
  for (let i = 0; i <= FLOOR; i++) grid.push(line([i, 0, 0], [i, FLOOR, 0]), line([0, i, 0], [FLOOR, i, 0]))
  const frame = [
    line([0, 0, 0], [0, 0, CEILING]),
    line([FLOOR, 0, 0], [FLOOR, 0, CEILING]),
    line([0, FLOOR, 0], [0, FLOOR, CEILING]),
    line([0, 0, CEILING], [FLOOR, 0, CEILING]),
    line([0, 0, CEILING], [0, FLOOR, CEILING]),
  ]
  return (
    <g>
      <path d={grid.join(' ')} style={{ ...HAIR, fill: 'none', strokeWidth: 1, stroke: 'color-mix(in oklab, var(--color-fg) 9%, transparent)' }} />
      <path d={frame.join(' ')} style={{ ...HAIR, fill: 'none', strokeWidth: 1, strokeDasharray: '2 4', stroke: 'color-mix(in oklab, var(--color-fg) 16%, transparent)' }} />
    </g>
  )
}

/** A box's outline: its three faces' edges, and for a selection its hidden edges dashed. */
function Outline({ bounds, tone }: { bounds: Bounds; tone: 'selected' | 'hover' | 'ghost' }) {
  const faces = boxFaces(bounds, UNIT)
  const stroke = tone === 'hover' ? 'color-mix(in oklab, var(--color-fg) 42%, transparent)' : ACCENT
  const face = { ...HAIR, fill: tone === 'ghost' ? 'color-mix(in oklab, var(--color-accent) 10%, transparent)' : 'none', stroke, strokeWidth: tone === 'selected' ? 1.5 : 1, strokeDasharray: tone === 'ghost' ? '3 3' : undefined }
  return (
    <g>
      {tone !== 'hover' &&
        hiddenEdges(bounds, UNIT).map(([a, b], i) => <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} style={{ ...HAIR, stroke, strokeWidth: 1, strokeDasharray: '2 3', opacity: 0.5 }} />)}
      <polygon points={toPoints(faces.left)} style={face} />
      <polygon points={toPoints(faces.right)} style={face} />
      <polygon points={toPoints(faces.top)} style={face} />
    </g>
  )
}

/** A selected part: its outline, and when it's off the surface under it, its footprint there and a drop line to it. */
function Selected({ part, scene, exclude }: { part: Part; scene: BuilderScene; exclude: readonly string[] }) {
  const b = boundsOf(part)
  const below = restingZ(scene, b, exclude)
  const lifted = b.z > below + 0.001
  const foot = { ...b, z: below, h: 0 }
  const [p, q] = [project(b.x + b.w, b.y + b.d, b.z, UNIT), project(b.x + b.w, b.y + b.d, below, UNIT)]
  return (
    <g>
      {lifted && (
        <>
          <polygon points={toPoints(boxFaces(foot, UNIT).top)} style={{ ...HAIR, fill: 'color-mix(in oklab, var(--color-accent) 8%, transparent)', stroke: ACCENT, strokeWidth: 1, strokeDasharray: '2 3', opacity: 0.7 }} />
          <line x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} style={{ ...HAIR, stroke: ACCENT, strokeWidth: 1, strokeDasharray: '2 3', opacity: 0.7 }} />
        </>
      )}
      <Outline bounds={b} tone="selected" />
    </g>
  )
}

const CURSOR: Record<HandleKind, string> = { w: 'nwse-resize', d: 'nesw-resize', r: 'nwse-resize', h: 'ns-resize', lift: 'ns-resize' }

/** The selected part's handles: squares that pull a face, a ring above it on a stem that lifts it. */
function Handles({ part, upx }: { part: Part; upx: number }) {
  return (
    <g>
      {handlesOf(part).map((handle) => {
        const [cx, cy0] = project(...handle.at, UNIT)
        const lift = handle.kind === 'lift'
        const cy = lift ? cy0 - 26 * upx : cy0
        const s = 7 * upx
        return (
          <g key={handle.kind} data-handle={handle.kind} style={{ pointerEvents: 'all', cursor: CURSOR[handle.kind] }}>
            <title>{handle.label}</title>
            {lift && <line x1={cx} y1={cy0} x2={cx} y2={cy + 5 * upx} style={{ ...HAIR, stroke: ACCENT, strokeWidth: 1 }} />}
            <circle cx={cx} cy={cy} r={11 * upx} style={{ fill: 'transparent' }} />
            {lift ? (
              <>
                <circle cx={cx} cy={cy} r={7 * upx} style={{ fill: 'var(--color-canvas)' }} />
                <circle cx={cx} cy={cy} r={4.75 * upx} style={{ ...HAIR, fill: 'var(--color-canvas)', stroke: ACCENT, strokeWidth: 1.5 }} />
              </>
            ) : (
              <>
                <rect x={cx - s / 2 - 1.5 * upx} y={cy - s / 2 - 1.5 * upx} width={s + 3 * upx} height={s + 3 * upx} rx={2.5 * upx} style={{ fill: 'var(--color-canvas)' }} />
                <rect x={cx - s / 2} y={cy - s / 2} width={s} height={s} rx={1.5 * upx} style={{ fill: ACCENT }} />
              </>
            )}
          </g>
        )
      })}
    </g>
  )
}
