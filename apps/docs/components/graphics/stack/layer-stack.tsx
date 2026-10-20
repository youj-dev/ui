'use client'

import { Fragment, useEffect, useLayoutEffect, useRef, useState, type MouseEvent, type PointerEvent, type ReactNode, type RefObject } from 'react'
import { animate, cancelFrame, frame, motionValue, useMotionValue, useSpring, type MotionValue } from 'motion/react'
import { useYouj } from '@youj/core'
import { Collapse } from '@youj/motion'
import { cn } from '@/lib/cn'
import { footprint, lerp, planeZ, project, rigTransform, smoothstep, type Bleed, type Box, type StackFrame, type StackPose, type Vec2 } from './projection'

/* An exploded stack: planes that lie flat on one another (the thing,
 * assembled) and separate along their normal into a tipped, isometric view
 * (the thing, explained). Separation is one number, `explode`, driven from
 * outside (scroll, a control, a timer); everything else here follows it:
 *
 * - The rig tips and turns as it separates; each plane rises in proportion
 *   to its depth, so the top of the stack travels furthest (parallax by depth).
 * - Pulled apart, the planes breathe (a slow drift, phase-shifted by depth)
 *   and the stack leans toward a mouse pointer. Both fade in with the
 *   separation, so the assembled thing is perfectly flat and usable.
 * - Labels stand in a column beside the stack on hairline leader lines (a
 *   narrow stage keeps just their names). The leaders are
 *   computed with the same math as the planes' transforms (projection.ts),
 *   so they land exactly on their planes, frame by frame, without reading
 *   layout.
 * - While assembled, the working thing (`assembled`) replaces the planes:
 *   it's live, focusable and untransformed. The planes are pictures.
 *
 * Every frame writes transforms and opacities only, batched in Motion's
 * render step. The loop runs only while something moves: the separation
 * changes, the pointer springs settle, or the drift is on and the stage is in
 * view. Under reduced motion there's no drift and no tilt: the separation is
 * whatever the driver says, applied as it changes.
 *
 * With `raise`, pointing at a plane or its label lifts that plane a little
 * off the stack (a `snappy` spring) and marks its label; under reduced motion
 * only the label is marked.
 *
 * With `frames`, every plane gets a hairline plate while apart, drawn beside
 * it rather than inside it, so dimming the others never takes their outline:
 * the lit one's plate takes the accent. With `details` other than 'always',
 * the label column is an index of names and a label's details open (Collapse)
 * only while its layer is lit, or all of them with 'all'; a narrow stage
 * opens them in a panel under the stack. */

export interface StackLayer {
  id: string
  /** The label beside the plane, e.g. "Motion". */
  name: string
  /** A second, quieter line: what the layer contributes. */
  detail?: string
  /** Crisp detail under the label, drawn flat on the stage (charts, swatches): the planes stay pictures. Wide pose only. */
  legend?: ReactNode
  /** The plane, drawn at the stack's plane size. A picture: aria-hidden and inert. */
  content: ReactNode
  /** Where the leader line meets the plane, in plane px from its top-left. Default: the end edge, low down. */
  anchor?: Vec2
  /** A glass sheet under a sparse plane, so it still reads as a plane. Default: every plane but the first. */
  sheet?: boolean
  /** Moves this plane along the stack, in gaps (negative is down), while it's apart: a card passing through the others. */
  lift?: MotionValue<number>
  /** Leave it out of the label column (a plane that moves through the others would reshuffle it). Default true. */
  label?: boolean
  /** Keep the content in 3D, so parts of it can rise off the plane with translateZ (keep them free of overflow, opacity and filters, which flatten). Default false. */
  depth?: boolean
}

export type StackPoseName = 'wide' | 'narrow'

export const POSES: Record<StackPoseName, StackPose> = {
  wide: { tiltX: 58, tiltZ: -26, gap: 150, perspective: 2400 },
  narrow: { tiltX: 56, tiltZ: -18, gap: 96, perspective: 1800 },
}

/** Below this the stack counts as assembled and the working thing takes over. */
const FLAT = 0.004
/** The label column beside the stack: its width and its distance from the stack, wide and narrow. Narrow, it's as wide as the longest name with its number ("04 Illustrations"), so none runs off a phone's edge. */
const COLUMN = { wide: { w: 220, gap: 40 }, narrow: { w: 100, gap: 8 } }
/** Clear space between one label's block and the next, px. */
const LABEL_GAP_Y = 14
/** Breathing: amplitude along the normal (px), period (s), and a slow turn (deg). */
const DRIFT = { z: 4, period: 5.6, spin: 0.6, spinPeriod: 13 }
/** Pointer lean at full separation, degrees. */
const LEAN = { x: 6, y: 4 }
/** Room kept round the stack inside the stage, px, wide and narrow. */
const PADS = { wide: 24, narrow: 8 }
/** The wide layout (a full label column with legends) is used while it keeps the stack at least this big. */
const WIDE_MIN_SCALE = 0.72
/** How far `raise` lifts a pointed-at plane, in gaps. */
const RAISE = 0.14
/** A label's name line, and the classes it keeps as a toggle button. */
const NAME =
  'flex items-baseline gap-2 text-[13px] leading-[18px] font-medium tracking-[-0.01em] text-fg transition-colors yj-duration-fast ease-standard group-data-[pointed=false]/label:text-fg-muted'

export interface LayerStackProps {
  /** The planes, bottom to top. */
  layers: StackLayer[]
  /** Separation: 0 assembled, 1 fully apart. */
  explode: MotionValue<number>
  /** Plane size in px. With `assembled`, its measured box wins. */
  width: number
  height: number
  /** The working thing, shown instead of the planes while assembled. */
  assembled?: ReactNode
  /** Extra turn around the normal, degrees (a scroll orbit). */
  spin?: MotionValue<number>
  /** Where the assembled thing sits, px below its resting place (room for a hero's copy above it). It glides to center as it separates. */
  restY?: number
  /** Rest the assembled thing's top `restGap` px under this element's foot (copy pinned to the stage's top), measured with the stage. Overrides `restY`. */
  restUnder?: RefObject<HTMLElement | null>
  /** Classes for the working thing's holder: where the server's HTML puts it until the first measure. */
  workingClassName?: string
  /** With `restUnder`: the room between its foot and the assembled thing, px. Default 28. */
  restGap?: number
  /** Keep the assembled thing centered on its rest even when it's taller than the room below it, so the planes take over exactly where it was. Default false. */
  centerRest?: boolean
  /** Idle drift and pointer lean. Off when false, and always under reduced motion. Default true. */
  live?: boolean
  /** Wide: labels with their details and legends. Narrow: names only, in a slim column. Default: by stage width. */
  pose?: StackPoseName
  /** 'fill': the stage takes its parent's height. 'auto': it's as tall as the separated stack needs. Default 'auto'. */
  fit?: 'fill' | 'auto'
  /** With 'auto': the tallest the stage may be, px. Past it, the separated stack scales down to fit (a pinned scene that must fit the viewport). */
  maxHeight?: number
  /** With 'auto': where the assembled thing rests, at the top so it grows down into the room it has kept, or in the middle. Default 'top'. */
  restAt?: 'top' | 'center'
  /** How far plane content reaches past the plane, px, so the separated stack still fits: all round, or across, above and below (a stable value: it's a dependency of the measuring). Default 24. */
  bleed?: Bleed
  /** Distance between planes when apart, px, instead of the pose's: a tall stack of many planes wants a tighter one. */
  gap?: number
  /** Emphasize one layer; the others dim, and its label is marked. */
  lit?: string
  /** Called when the stack assembles or starts to separate. */
  onFlatChange?: (flat: boolean) => void
  /** Pointing at a plane or its label lifts it slightly and marks its label. Default false. */
  raise?: boolean
  /** With `raise`: called with the layer pointed at, or null once the pointer leaves the stage. */
  onPoint?: (id: string | null) => void
  /** With `raise`: a mouse still points by hovering, but a tap (touch or pen) on a plane or its label holds that layer lit until another is held, it's tapped again, or something else is tapped, and each label is a toggle button, so the keyboard can hold one too (Escape lets go). Default false. */
  hold?: boolean
  /** A hairline plate round every plane while apart, clear of the dimming, so each layer's extent reads however sparse it is. The lit one's takes the accent. Default false. */
  frames?: boolean
  /** The labels' details and legends. 'always': every one, fixed (wide pose only). 'lit': only the lit layer's, opening and closing with it, so the column reads as an index. 'all': every one, opened. With 'lit' and 'all' an auto-height narrow stage opens them in a panel under the stack. Default 'always'. */
  details?: 'always' | 'lit' | 'all'
  className?: string
}

/** The first descendant that has a box: providers and scopes render `display: contents` wrappers. */
function firstBox(el: Element | null | undefined): HTMLElement | null {
  let node = (el ?? null) as HTMLElement | null
  while (node && node.offsetWidth === 0 && node.firstElementChild) node = node.firstElementChild as HTMLElement
  return node
}

interface Geometry {
  stageW: number
  stageH: number
  planeW: number
  planeH: number
  pose: StackPose
  wide: boolean
  /** Scale at full separation, and the shift that centers the separated stack (and its labels). */
  scale: number
  shiftX: number
  shiftY: number
  labelX: number
  /** Where the assembled thing sits, px from the stage's center: at the top of an auto-height stage (unless it rests at the center), so it grows down into the room it has kept. */
  restY: number
  /** Each label's block height, for spacing the column. */
  labelH: number[]
  foot: Box
}

export function LayerStack({
  layers,
  explode,
  width,
  height,
  assembled,
  spin,
  restY = 0,
  restUnder,
  workingClassName,
  restGap = 28,
  centerRest = false,
  live = true,
  pose,
  fit = 'auto',
  maxHeight,
  restAt = 'top',
  bleed = 24,
  gap,
  lit,
  onFlatChange,
  raise = false,
  onPoint,
  hold = false,
  frames = false,
  details = 'always',
  className,
}: LayerStackProps) {
  const k = useYouj()
  const root = useRef<HTMLDivElement>(null)
  const working = useRef<HTMLDivElement>(null)
  const camera = useRef<HTMLDivElement>(null)
  const rig = useRef<HTMLDivElement>(null)
  const planes = useRef<(HTMLDivElement | null)[]>([])
  const shadows = useRef<(HTMLDivElement | null)[]>([])
  const plates = useRef<(HTMLDivElement | null)[]>([])
  const leaders = useRef<(SVGGElement | null)[]>([])
  const labels = useRef<(HTMLDivElement | null)[]>([])

  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)
  const leanX = useSpring(pointerX, k.spring('smooth'))
  const leanY = useSpring(pointerY, k.spring('smooth'))

  const ambient = live && !k.reduced
  const settings = useRef({ ambient, timeScale: k.timeScale, count: layers.length, onFlatChange })
  settings.current = { ambient, timeScale: k.timeScale, count: layers.length, onFlatChange }

  const geometry = useRef<Geometry | null>(null)
  // Apart, as React state: only a disclosing stage needs it (its narrow panel stays shut while assembled).
  const disclosing = details !== 'always'
  const [apart, setApart] = useState(false)
  // Only which pose is React state (legends show in the wide one); everything per frame is imperative.
  const [wideLabels, setWideLabels] = useState(false)
  const state = useRef({ flat: true, inView: true, scheduled: false, start: 0, e: '' })

  // The pointed-at plane: its label is marked, and it rides a spring of its own up off the stack. A mouse points by
  // hovering; with `hold`, a tap or the keyboard holds one lit until another is held or something else is tapped.
  const [hovered, setHovered] = useState<string | null>(null)
  const [held, setHeld] = useState<string | null>(null)
  const pointed = raise ? (hovered ?? held) : null
  const raised = useRef(new Map<string, MotionValue<number>>())
  const reported = useRef<string | null>(null)
  const report = useRef(onPoint)
  report.current = onPoint
  useEffect(() => {
    if (reported.current === pointed) return
    reported.current = pointed
    report.current?.(pointed)
    for (const layer of layers) {
      let value = raised.current.get(layer.id)
      if (!value) {
        value = motionValue(0)
        value.on('change', () => request.current())
        raised.current.set(layer.id, value)
      }
      const to = layer.id === pointed && !k.reduced ? RAISE : 0
      if (k.reduced) value.set(to)
      else animate(value, to, k.spring('snappy'))
    }
  }, [pointed, layers, k])

  // A tap anywhere but a plane or a label lets a held layer go.
  useEffect(() => {
    if (!hold || held === null) return
    const away = (event: globalThis.PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null
      if (target?.closest('[data-stack-hold]') && root.current?.contains(target)) return
      setHeld(null)
    }
    document.addEventListener('pointerdown', away, true)
    return () => document.removeEventListener('pointerdown', away, true)
  }, [hold, held])

  // Geometry: the stage and plane sizes, read on resize only, where the browser has just laid the page out (the
  // observer below): every read first, then the writes, so it never forces a layout of its own.
  const measure = useRef(() => {})
  measure.current = () => {
    const el = root.current
    if (!el) return
    const stageW = el.clientWidth
    const plane = firstBox(working.current?.firstElementChild)
    const planeW = plane?.offsetWidth || width
    const planeH = plane?.offsetHeight || height
    const labelH = labels.current.map((label) => label?.offsetHeight ?? 36)
    const readH = el.clientHeight
    const under = restUnder?.current
    const underH = under ? under.offsetHeight : 0
    // How big the separated stack can be beside a label column of either kind.
    const room = (name: StackPoseName) => {
      const p = { ...POSES[name], gap: gap ?? POSES[name].gap }
      const foot = footprint(p, layers.length, planeW, planeH, bleed)
      const column = COLUMN[name]
      const pad = PADS[name]
      return { p, foot, column, pad, scaleW: (stageW - pad * 2 - column.w - column.gap) / (foot.maxX - foot.minX) }
    }
    const wideRoom = room('wide')
    const wide = pose ? pose === 'wide' : wideRoom.scaleW >= WIDE_MIN_SCALE
    setWideLabels(wide)
    const { p, foot, column, pad, scaleW } = wide ? wideRoom : room('narrow')
    const footW = foot.maxX - foot.minX
    const footH = foot.maxY - foot.minY
    const labelRoom = column.w + column.gap
    let stageH = readH
    let scale: number
    if (fit === 'fill') {
      scale = Math.min(1, scaleW, (stageH - pad * 2) / footH)
    } else {
      scale = Math.min(1, scaleW, maxHeight === undefined ? 1 : (maxHeight - pad * 2) / footH)
      stageH = Math.max(planeH + pad * 2, footH * scale + pad * 2)
      el.style.height = `${Math.ceil(stageH)}px`
    }
    // Under a pinned copy, the thing's top sits a little below it; it's placed by its center (centerRest), so where it's
    // taller than the room left it runs past the stage's foot rather than sitting lower than its planes.
    const rest = under ? Math.max(0, underH + restGap - stageH / 2 + planeH / 2) : restY
    const blockW = footW * scale + labelRoom
    const blockLeft = (stageW - blockW) / 2 - stageW / 2
    geometry.current = {
      stageW,
      stageH,
      planeW,
      planeH,
      pose: p,
      wide,
      scale,
      shiftX: blockLeft - foot.minX * scale,
      shiftY: -((foot.minY + foot.maxY) / 2) * scale,
      labelX: blockLeft + footW * scale + column.gap,
      restY: (fit === 'auto' && restAt === 'top' ? pad + planeH / 2 - stageH / 2 : 0) + rest,
      labelH,
      foot,
    }
    camera.current?.style.setProperty('perspective', `${p.perspective}px`)
    const shift = geometry.current.restY * 2
    working.current?.style.setProperty('padding-top', `${Math.max(0, shift)}px`)
    working.current?.style.setProperty('align-content', centerRest ? 'center' : '')
    working.current?.style.setProperty('padding-bottom', `${Math.max(0, -shift)}px`)
    rig.current?.style.setProperty('width', `${planeW}px`)
    rig.current?.style.setProperty('height', `${planeH}px`)
  }

  const paint = useRef((_: unknown) => {})
  const request = useRef(() => {
    if (state.current.scheduled) return
    state.current.scheduled = true
    frame.render(paint.current)
  })

  paint.current = () => {
    state.current.scheduled = false
    const g = geometry.current
    const r = rig.current
    if (!g || !r) return
    const { ambient, timeScale, count } = settings.current
    const e = explode.get()

    // Assembled: the working thing, flat and live; the planes stand by.
    const flat = e < FLAT
    if (flat !== state.current.flat) {
      state.current.flat = flat
      r.style.visibility = flat ? '' : 'visible'
      if (working.current) {
        working.current.style.visibility = flat ? 'visible' : 'hidden'
        working.current.inert = !flat
      }
      settings.current.onFlatChange?.(flat)
      if (disclosing) setApart(!flat)
    }

    const drifting = ambient && state.current.inView && !flat
    const now = performance.now()
    if (!state.current.start) state.current.start = now
    const t = (now - state.current.start) / 1000 / timeScale
    const presence = smoothstep(0, 0.6, e)
    const breathe = drifting ? presence : 0

    const f: StackFrame = {
      e,
      pointerX: ambient ? leanX.get() * LEAN.x * presence : 0,
      pointerY: ambient ? -leanY.get() * LEAN.y * presence : 0,
      spin: (spin?.get() ?? 0) * presence + breathe * DRIFT.spin * Math.sin((t / DRIFT.spinPeriod) * Math.PI * 2),
      scale: lerp(1, g.scale, Math.min(1, e)),
      shiftX: lerp(0, g.shiftX, Math.min(1, e)),
      shiftY: lerp(g.restY, g.shiftY, Math.min(1, e)),
    }
    r.style.transform = flat ? 'none' : rigTransform(g.pose, f)
    // --e inherits into every plane: written only when it moves (the drift and the tour repaint every frame at 1).
    const eNow = Math.max(0, Math.min(1, e)).toFixed(3)
    if (eNow !== state.current.e) {
      state.current.e = eNow
      r.style.setProperty('--e', eNow)
    }

    const anchors: { x: number; y: number }[] = []
    for (let i = 0; i < count; i++) {
      const layer = layers[i]
      const lift = ((layer?.lift?.get() ?? 0) + (layer ? (raised.current.get(layer.id)?.get() ?? 0) : 0)) * g.pose.gap * e
      const z = planeZ(i, count, g.pose, e) + lift + breathe * DRIFT.z * Math.sin((t / DRIFT.period) * Math.PI * 2 + i * 1.1)
      const plane = planes.current[i]
      const lifted = flat ? 'none' : `translate3d(0, 0, ${z.toFixed(2)}px)`
      if (plane) plane.style.transform = lifted
      const plate = plates.current[i]
      if (plate) plate.style.transform = lifted
      // A plane's shadow falls on the one below, a little down and to the end.
      const shadow = shadows.current[i]
      if (shadow) {
        const drop = g.pose.gap * e
        shadow.style.transform = `translate3d(${(drop * 0.1).toFixed(2)}px, ${(drop * 0.16).toFixed(2)}px, ${(-drop + 1).toFixed(2)}px)`
        shadow.style.opacity = String(presence * 0.55)
      }
      const [ax, ay] = layers[i]?.anchor ?? [g.planeW, g.planeH * 0.78]
      const [sx, sy] = project(g.pose, f, [ax - g.planeW / 2, ay - g.planeH / 2, z])
      anchors.push({ x: g.stageW / 2 + sx, y: g.stageH / 2 + sy })
    }
    placeLabels(g, anchors, smoothstep(0.55, 0.92, e))

    const settling = Math.abs(leanX.getVelocity()) > 0.001 || Math.abs(leanY.getVelocity()) > 0.001
    if (drifting || settling) request.current()
  }

  // Labels: a column beside the stack, top plane first, each clear of the block above it.
  function placeLabels(g: Geometry, anchors: { x: number; y: number }[], shown: number) {
    const ys = anchors.map((a) => a.y)
    const order = anchors
      .map((_, i) => i)
      .filter((i) => layers[i]?.label !== false)
      .sort((a, b) => ys[a]! - ys[b]!)
    let floor = -Infinity
    for (const i of order) {
      ys[i] = Math.max(ys[i]!, floor)
      floor = ys[i]! + (g.labelH[i] ?? 36) + LABEL_GAP_Y
    }
    anchors.forEach((a, i) => {
      if (layers[i]?.label === false) return
      const label = labels.current[i]
      const leader = leaders.current[i]
      const x = g.stageW / 2 + g.labelX
      const y = ys[i]!
      if (label) {
        label.style.transform = `translate3d(${x.toFixed(1)}px, ${(y - 9).toFixed(1)}px, 0)`
        label.style.opacity = String(shown)
        // Holding, the labels are buttons: out of the tab order while the column isn't there to see.
        if (hold) label.style.visibility = shown > 0.01 ? 'visible' : 'hidden'
      }
      if (leader) {
        leader.style.opacity = String(shown)
        const line = leader.firstElementChild as SVGLineElement | null
        const dot = leader.lastElementChild as SVGCircleElement | null
        line?.setAttribute('x1', a.x.toFixed(1))
        line?.setAttribute('y1', a.y.toFixed(1))
        line?.setAttribute('x2', (x - (g.wide ? 10 : 6)).toFixed(1))
        line?.setAttribute('y2', y.toFixed(1))
        dot?.setAttribute('cx', a.x.toFixed(1))
        dot?.setAttribute('cy', a.y.toFixed(1))
      }
    })
  }

  // Measure before the first paint, and again whenever the stage or the working thing resizes: in the observer's
  // callback, which runs after the browser's layout and before its paint, so the reads cost nothing. Observing afresh
  // delivers a first callback, so a change of props re-measures in the same frame.
  useLayoutEffect(() => {
    const el = root.current
    if (!el) return
    const observer = new ResizeObserver(() => {
      measure.current()
      paint.current(undefined)
    })
    observer.observe(el)
    // The working thing's box, under any display: contents scopes: watched without asking which it is (that's a read).
    let depth = 0
    for (let node = working.current?.firstElementChild; node && depth < 3; node = node.firstElementChild, depth++) observer.observe(node)
    // Labels grow when their legends appear: the column re-spaces.
    for (const label of labels.current) if (label) observer.observe(label)
    const under = restUnder?.current
    if (under) observer.observe(under)
    return () => observer.disconnect()
  }, [layers.length, width, height, pose, fit, maxHeight, restAt, bleed, gap, restY, restUnder, restGap])

  // Repaint whenever an input moves; drift keeps itself going while it's on.
  const lifts = layers.map((layer) => layer.lift)
  useEffect(() => {
    const run = () => request.current()
    const subs = [
      explode.on('change', run),
      leanX.on('change', run),
      leanY.on('change', run),
      ...(spin ? [spin.on('change', run)] : []),
      ...lifts.flatMap((lift) => (lift ? [lift.on('change', run)] : [])),
    ]
    run()
    return () => {
      subs.forEach((off) => off())
      cancelFrame(paint.current)
      state.current.scheduled = false
    }
  }, [explode, leanX, leanY, spin, ...lifts])

  // Drift only while the stage is on screen.
  useEffect(() => {
    const el = root.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([entry]) => {
      state.current.inView = entry?.isIntersecting ?? true
      request.current()
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    request.current()
  }, [ambient, k.timeScale])

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!ambient || event.pointerType !== 'mouse' || !root.current) return
    const r = root.current.getBoundingClientRect()
    pointerX.set((event.clientX - r.left) / r.width - 0.5)
    pointerY.set((event.clientY - r.top) / r.height - 0.5)
  }
  const onPointerLeave = () => {
    pointerX.set(0)
    pointerY.set(0)
    setHovered(null)
  }
  // The last pointer pressed on the stage. With `hold`, a mouse points by hovering, so its clicks hold nothing.
  const pressedWith = useRef('')
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    pressedWith.current = event.pointerType
  }
  // A plane or label that's pointed at stays raised until another one is, or the pointer leaves the stage: a plane
  // rising out from under the pointer mustn't drop back. With `hold`, only a mouse points by hovering.
  const enter = (id: string) => (event: PointerEvent<HTMLElement>) => {
    if (!hold || event.pointerType === 'mouse') setHovered(id)
  }
  // A tap, or a key on a label's button (a click with no detail), holds the layer, or lets it go if it was held.
  const tap = (id: string) => (event: MouseEvent<HTMLElement>) => {
    if (event.detail !== 0 && pressedWith.current === 'mouse') return
    setHeld((current) => (current === id ? null : id))
  }
  const pointable = (id: string) => (raise ? { onPointerEnter: enter(id), ...(hold && { onClick: tap(id), 'data-stack-hold': '' }) } : {})
  // The layer whose label is marked (and, disclosing, whose details are open): the one pointed at, else the lit one.
  const marked = (id: string) => (raise && pointed !== null ? pointed === id : lit === id)
  const opens = (id: string) => details === 'all' || marked(id)
  const panel = disclosing && !wideLabels && fit === 'auto'

  const stage = (
    <div
      ref={root}
      className={cn('relative isolate w-full', fit === 'fill' && 'h-full', className)}
      style={fit === 'auto' ? { height: height + PADS.wide * 2 } : undefined}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onPointerDown={hold ? onPointerDown : undefined}
    >
      {/* The planes: a tipped rig in the stage's perspective. */}
      <div
        ref={camera}
        aria-hidden
        className="pointer-events-none absolute inset-0 grid place-items-center [perspective-origin:50%_50%]"
        style={{ perspective: POSES.wide.perspective }}
      >
        {/* Sized and shown imperatively (measure, paint): React never writes its style. */}
        <div ref={rig} className="invisible relative [transform-style:preserve-3d]">
          {layers.map((layer, i) => (
            <Fragment key={layer.id}>
            {frames && (
              // Beside its plane, not in it, so the plane's dimming leaves it be; first, so the plane draws over its fill.
              <div
                ref={(node) => {
                  plates.current[i] = node
                }}
                data-stack-frame={layer.id}
                data-lit={lit === undefined ? undefined : lit === layer.id}
                className={cn(
                  'absolute -inset-4 rounded-[26px] border border-line-strong opacity-(--e) transition-[border-color,background-color,box-shadow] yj-duration-base ease-standard',
                  'bg-band shadow-[inset_0_1px_0_var(--color-surface)] dark:bg-band dark:shadow-[inset_0_1px_0_color-mix(in_oklab,var(--color-fg)_13%,transparent)]',
                  'data-[lit=false]:border-line-strong data-[lit=false]:bg-transparent dark:data-[lit=false]:bg-transparent',
                  // Lit: an accent edge, a soft glow off it, and a tint just past the plain fill (the planes below show through it).
                  'data-[lit=true]:border-accent data-[lit=true]:bg-accent-subtle dark:data-[lit=true]:bg-accent-subtle',
                  'data-[lit=true]:shadow-stack-lit dark:data-[lit=true]:shadow-stack-lit',
                )}
              />
            )}
            <div
              ref={(node) => {
                planes.current[i] = node
              }}
              data-stack-layer={layer.id}
              data-lit={lit === undefined ? undefined : lit === layer.id}
              className={cn(
                'absolute inset-0 transition-opacity yj-duration-base ease-standard [transform-style:preserve-3d] data-[lit=false]:opacity-25',
                raise && 'pointer-events-auto',
                // Framed, a plane's content can answer its own lighting (group-data-[lit=true]/plane).
                frames && 'group/plane',
              )}
              {...pointable(layer.id)}
            >
              {i > 0 && (
                <div
                  ref={(node) => {
                    shadows.current[i] = node
                  }}
                  className="absolute -inset-3 rounded-[28px] bg-well opacity-0 blur-xl dark:bg-canvas"
                />
              )}
              {(layer.sheet ?? i > 0) && (
                // Frosted just enough to haze the planes below it: depth without a backdrop filter.
                <div
                  className={cn(
                    'absolute -inset-4 rounded-[26px] border bg-band opacity-(--e) shadow-[inset_0_1px_0_color-mix(in_oklab,var(--color-surface)_70%,transparent)]',
                    // Framed, the plate beside it draws the edge.
                    frames ? 'border-transparent' : 'border-line-strong',
                  )}
                />
              )}
              <div inert className={cn('relative size-full', layer.depth && '[transform-style:preserve-3d]')}>
                {layer.content}
              </div>
            </div>
            </Fragment>
          ))}
        </div>
      </div>

      {/* The working thing, flat and live while assembled. */}
      {assembled && (
        // Its resting place is set with the geometry (measure): React never writes its style.
        <div ref={working} className={cn('absolute inset-0 grid place-items-center px-4', workingClassName)}>
          {assembled}
        </div>
      )}

      {/* Labels, on the stage itself so they stay crisp, never tipped. Holding, they're a group of toggle buttons (Escape lets go). */}
      <div
        aria-hidden={hold ? undefined : true}
        role={hold ? 'group' : undefined}
        aria-label={hold ? 'Layers' : undefined}
        onKeyDown={hold ? (event) => event.key === 'Escape' && setHeld(null) : undefined}
        className="pointer-events-none absolute inset-0 overflow-visible"
      >
        <svg aria-hidden={hold || undefined} className="absolute inset-0 size-full overflow-visible">
          {layers.map((layer, i) =>
            layer.label === false ? null : (
              <g
                key={layer.id}
                ref={(node) => {
                  leaders.current[i] = node
                }}
                opacity={0}
              >
                <line className="stroke-line-strong" strokeWidth={1} vectorEffect="non-scaling-stroke" />
                <circle
                  r={3}
                  className={cn('fill-canvas transition-colors yj-duration-fast ease-standard', pointed === layer.id ? 'stroke-accent' : 'stroke-fg-muted')}
                  strokeWidth={1.25}
                />
              </g>
            ),
          )}
        </svg>
        {/* Holding, top plane first, so the tab order runs down the column as it reads. */}
        {(hold ? [...layers.keys()].reverse() : [...layers.keys()]).map((i) => {
          const layer = layers[i]!
          if (layer.label === false) return null
          // A tick, not an index: the column's order is the stack's, so a number would only repeat it.
          const number = (
            <span aria-hidden className="inline-flex w-[18px] shrink-0 items-center self-center">
              <span className="h-px w-3 bg-line-strong transition-colors yj-duration-fast ease-standard group-data-[pointed=true]/label:bg-accent" />
            </span>
          )
          return (
            <div
              key={layer.id}
              ref={(node) => {
                labels.current[i] = node
              }}
              data-pointed={raise && pointed !== null ? pointed === layer.id : lit !== undefined ? lit === layer.id : undefined}
              className={cn('group/label absolute top-0 left-0 w-max opacity-0', raise && 'pointer-events-auto', hold && 'invisible')}
              style={{ maxWidth: COLUMN[wideLabels ? 'wide' : 'narrow'].w }}
              {...pointable(layer.id)}
            >
              {hold ? (
                // Its hit area reaches past the text (24px and more), short of the next label's.
                <button
                  type="button"
                  aria-pressed={held === layer.id}
                  className={cn(NAME, 'relative rounded-[3px] text-start outline-offset-4 before:absolute before:-inset-x-2 before:-inset-y-1.5')}
                >
                  {number}
                  {layer.name}
                  {/* "Sound layer", not a second "Sound" beside the site menu's. */}{' '}
                  <span className="sr-only">layer</span>
                </button>
              ) : (
                <p className={NAME}>
                  {number}
                  {layer.name}
                </p>
              )}
              {details === 'always' ? (
                <>
                  {layer.detail && wideLabels && (
                    <p aria-hidden={hold || undefined} className="ms-[26px] font-sans text-[10.5px] leading-4 text-fg-muted">
                      {layer.detail}
                    </p>
                  )}
                  {layer.legend && wideLabels && (
                    <div aria-hidden={hold || undefined} className="ms-[26px] mt-2.5">
                      {layer.legend}
                    </div>
                  )}
                </>
              ) : (
                wideLabels &&
                (layer.detail || layer.legend) && (
                  <Collapse open={opens(layer.id)} aria-hidden={hold || undefined}>
                    <Details layer={layer} />
                  </Collapse>
                )
              )}
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <>
      {stage}
      {panel && (
        // A narrow stage has no room beside the stack: the open details stack up under it, top plane first, like the column.
        <div aria-hidden className="mx-auto w-full max-w-[22rem] px-4">
          {[...layers]
            .reverse()
            .filter((layer) => layer.label !== false && (layer.detail || layer.legend))
            .map((layer) => (
              <Collapse key={layer.id} open={apart && opens(layer.id)}>
                <div className="pt-3 pb-1">
                  <p className="flex items-baseline gap-2 text-[13px] leading-[18px] font-medium tracking-[-0.01em] text-fg">
                    {layer.name}
                  </p>
                  <Details layer={layer} />
                </div>
              </Collapse>
            ))}
        </div>
      )}
    </>
  )
}

/** A label's detail line and legend, as they open under its name. Padding, not margins, so Collapse measures all of it. */
function Details({ layer }: { layer: StackLayer }) {
  return (
    <div className="ms-[26px] pb-1">
      {layer.detail && <p className="font-sans text-[10.5px] leading-4 text-fg-muted">{layer.detail}</p>}
      {layer.legend && <div className="pt-2.5">{layer.legend}</div>}
    </div>
  )
}
