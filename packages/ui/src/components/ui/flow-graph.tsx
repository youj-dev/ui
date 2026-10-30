'use client'

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ComponentProps, type FocusEvent, type KeyboardEvent, type PointerEvent } from 'react'
import { useInView } from 'motion/react'
import { useSoundCue } from '@youj/core'
import { MaximizeIcon, MinusIcon, PlusIcon } from '@youj/icons'
import { flowGraphLabels, useComponentLabels } from '@youj/core/labels'
import { useYouj, useLocale, useDirection } from '@youj/core/lib/youj/provider'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn, listFormat, numberFormat } from '../../lib/utils'
import { Button } from './button'

/* A run, a pipeline or any other directed graph of steps, laid out on its own
 * in layers that read in the flow direction (left to right, right to left
 * under RTL, top to bottom when narrow). Steps are mono cards on a dot grid,
 * joined port to port by curves; each shows its state: queued, running (a
 * soft pulse, with dashes flowing along the edges into it), succeeded,
 * failed, retried or skipped (dashed, like its edges). Pick a step to open it
 * (`value`); the app shows its detail in the region named by `controls`.
 * - Pan by dragging the canvas or with the wheel once zoomed in; zoom with
 *   Ctrl or ⌘ and the wheel (or a pinch), the corner buttons, or + and −;
 *   0 fits the whole graph again. The view follows resizes until you move it.
 * - Keyboard: the steps are one tab stop. Arrows in the flow direction follow
 *   the edges to the next or previous step (the nearest one, or back the way
 *   you came), the cross arrows move within a layer, Home and End go to the
 *   first and last step, Enter opens one and Escape closes it.
 * - Motion: zoom and fit glide on the slow token and can be caught mid-way;
 *   drag and wheel follow the pointer, never eased.
 * - Reduced motion: no pulse and no flowing dashes (a running edge stays
 *   dashed in the accent); the view moves in place. */

type FlowStatus = 'queued' | 'running' | 'ok' | 'error' | 'retried' | 'skipped'
type FlowOrientation = 'horizontal' | 'vertical'

interface FlowNode {
  id: string
  /** The step's name, set in mono: "git.log". */
  label: string
  /** What kind of step, over the name's figure: "tool", "llm". */
  kind?: string
  status: FlowStatus
  /** One figure beside the kind, already formatted: "1.24 s". It's spoken after the state. */
  meta?: string
  /** How many times the step ran; shown on a retried step. */
  attempts?: number
}

interface FlowEdge {
  from: string
  to: string
}

interface FlowGraphProps extends Omit<ComponentProps<'div'>, 'children' | 'defaultValue' | 'onChange'> {
  nodes: readonly FlowNode[]
  edges: readonly FlowEdge[]
  /** The open step's id (controlled); `null` for none. */
  value?: string | null
  defaultValue?: string | null
  onValueChange?: (id: string | null) => void
  /** The id of the region an open step's detail shows in, for `aria-controls`. */
  controls?: string
  /** Default `auto`: horizontal, and vertical when the canvas is narrower than 34rem. */
  orientation?: FlowOrientation | 'auto'
  /** A small overview of the whole graph while zoomed in. Default true. */
  minimap?: boolean
  /** The graph's accessible name. Default: the labels' "Flow graph". */
  label?: string
  /** Default: the YoujProvider locale. */
  locale?: string
  /** With sound on, opening a step plays `select` and closing it `close`. Default true. */
  sound?: boolean
  /** The canvas height in pixels. Default `auto`: the graph's own height at the fitted zoom, from 200 to 640. */
  height?: number | 'auto'
  /** The least the view zooms out to fit, so step names stay legible; a wider graph pans instead. Default 0.85. */
  fitFloor?: number
}

// ── Layout ───────────────────────────────────────────────────────────────

interface FlowLayoutNode {
  id: string
  layer: number
  index: number
  x: number
  y: number
  width: number
  height: number
}

interface FlowLayout {
  nodes: Map<string, FlowLayoutNode>
  /** The steps in each layer, in order across the flow. */
  layers: string[][]
  parents: Map<string, string[]>
  children: Map<string, string[]>
  /** For an edge that crosses layers (`from>to`), the lane it takes through each. */
  routes: Map<string, FlowLayoutNode[]>
  width: number
  height: number
}

/** A step's height, its narrowest and widest, and the gaps between layers (main) and within one (cross), per orientation. */
const SIZE = {
  horizontal: { h: 56, min: 152, max: 264, main: 48, cross: 14 },
  vertical: { h: 54, min: 136, max: 216, main: 44, cross: 12 },
} as const

/** How much room a long edge's lane takes across the flow. */
const LANE = 16

/** A mono character's advance at the name's size (13px) and the second line's (11px), and a label capital's, tracked. */
const ADVANCE = { name: 7.8, meta: 6.6, label: 7.95 }

/**
 * How wide a step's card is drawn to fit its name and its second line
 * (kind · meta ×attempts) without truncating, both being mono: estimated
 * from the characters, so it's known before layout and on the server.
 */
function nodeWidth(n: Partial<FlowNode>, orientation: FlowOrientation) {
  const { min, max } = SIZE[orientation]
  const name = (n.label?.length ?? 0) * ADVANCE.name
  const retries = n.status === 'retried' && n.attempts !== undefined && n.attempts > 1 ? 10 + (String(n.attempts).length + 1) * ADVANCE.meta : 0
  const second = (n.kind ? n.kind.length * ADVANCE.label + (n.meta ? 16 : 0) : 0) + (n.meta?.length ?? 0) * ADVANCE.meta + retries
  // Padding (12 a side), the status dot and its gap (16), and a little air.
  return Math.min(max, Math.max(min, Math.ceil((Math.max(name, second) + 48) / 8) * 8))
}

/** The closest non-decreasing sequence to `values` (pool adjacent violators). */
function isotonic(values: number[]) {
  const blocks: { sum: number; n: number }[] = []
  for (const v of values) {
    blocks.push({ sum: v, n: 1 })
    while (blocks.length > 1 && blocks.at(-2)!.sum / blocks.at(-2)!.n > blocks.at(-1)!.sum / blocks.at(-1)!.n) {
      const last = blocks.pop()!
      blocks.at(-1)!.sum += last.sum
      blocks.at(-1)!.n += last.n
    }
  }
  return blocks.flatMap((b) => Array<number>(b.n).fill(b.sum / b.n))
}

/**
 * Lays a directed graph out in layers along the flow: each step one layer
 * past the furthest step it waits on (a cycle's closing edge is left out),
 * steps ordered within a layer to keep edges from crossing, and placed as
 * close as they can sit to the steps they join. Positions are top-left
 * corners in pixels, left to right; mirror them for RTL.
 */
function layoutFlowGraph(nodes: readonly (Pick<FlowNode, 'id'> & Partial<FlowNode>)[], edges: readonly FlowEdge[], orientation: FlowOrientation = 'horizontal'): FlowLayout {
  const { h, main, cross } = SIZE[orientation]
  const widths = new Map(nodes.map((n) => [n.id, nodeWidth(n, orientation)]))
  const horizontal = orientation === 'horizontal'
  const ids = nodes.map((n) => n.id)
  const known = new Set(ids)
  const out = new Map(ids.map((id) => [id, [] as string[]]))
  for (const e of edges) if (known.has(e.from) && known.has(e.to) && e.from !== e.to && !out.get(e.from)!.includes(e.to)) out.get(e.from)!.push(e.to)

  // Break cycles: an edge back to a step still being visited closes one.
  const seen = new Map<string, 1 | 2>()
  const back = new Set<string>()
  const visit = (id: string) => {
    seen.set(id, 1)
    for (const to of out.get(id)!) {
      if (seen.get(to) === 1) back.add(`${id}>${to}`)
      else if (!seen.has(to)) visit(to)
    }
    seen.set(id, 2)
  }
  for (const id of ids) if (!seen.has(id)) visit(id)
  const parents = new Map(ids.map((id) => [id, [] as string[]]))
  const children = new Map(ids.map((id) => [id, [] as string[]]))
  for (const [from, list] of out)
    for (const to of list)
      if (!back.has(`${from}>${to}`)) {
        children.get(from)!.push(to)
        parents.get(to)!.push(from)
      }

  // Longest-path layers, in topological order; a source then moves up to sit just before its first child.
  const waiting = new Map(ids.map((id) => [id, parents.get(id)!.length]))
  const queue = ids.filter((id) => waiting.get(id) === 0)
  const order: string[] = []
  while (queue.length) {
    const id = queue.shift()!
    order.push(id)
    for (const c of children.get(id)!) {
      waiting.set(c, waiting.get(c)! - 1)
      if (waiting.get(c) === 0) queue.push(c)
    }
  }
  const layer = new Map(ids.map((id) => [id, 0]))
  for (const id of order) for (const c of children.get(id)!) layer.set(c, Math.max(layer.get(c)!, layer.get(id)! + 1))
  for (const id of order) if (!parents.get(id)!.length && children.get(id)!.length) layer.set(id, Math.min(...children.get(id)!.map((c) => layer.get(c)!)) - 1)
  // A long edge passes through a lane in each layer it crosses: the lanes are ordered and placed
  // like steps, so the edge never runs under one.
  const vParents = new Map([...parents].map(([id, list]) => [id, [...list]]))
  const vChildren = new Map([...children].map(([id, list]) => [id, [...list]]))
  const lanes = new Map<string, string[]>()
  for (const [from, list] of children)
    for (const to of list) {
      const span = layer.get(to)! - layer.get(from)!
      if (span < 2) continue
      const chain = Array.from({ length: span - 1 }, (_, i) => `\u0000${from}>${to}>${i}`)
      lanes.set(`${from}>${to}`, chain)
      vChildren.set(from, vChildren.get(from)!.map((c) => (c === to ? chain[0]! : c)))
      vParents.set(to, vParents.get(to)!.map((p) => (p === from ? chain.at(-1)! : p)))
      chain.forEach((lane, i) => {
        layer.set(lane, layer.get(from)! + 1 + i)
        vParents.set(lane, [chain[i - 1] ?? from])
        vChildren.set(lane, [chain[i + 1] ?? to])
      })
    }
  const all = [...ids, ...[...lanes.values()].flat()]
  const depth = ids.length ? Math.max(...layer.values()) + 1 : 0
  const layers: string[][] = Array.from({ length: depth }, () => [])
  for (const id of all) layers[layer.get(id)!]!.push(id)

  // Order within layers by the barycentre of the neighbors' places, sweeping down then up.
  const rank = new Map<string, number>()
  const rerank = (l: string[]) => l.forEach((id, i) => rank.set(id, (i + 0.5) / l.length))
  layers.forEach(rerank)
  const bary = (id: string, near: string[]) => (near.length ? near.reduce((s, n) => s + rank.get(n)!, 0) / near.length : rank.get(id)!)
  for (let pass = 0; pass < 4; pass++) {
    const down = pass % 2 === 0
    for (const l of down ? layers.slice(1) : layers.slice(0, -1).reverse()) {
      const key = new Map(l.map((id) => [id, bary(id, (down ? vParents : vChildren).get(id)!)]))
      l.sort((a, b) => key.get(a)! - key.get(b)!)
      rerank(l)
    }
  }

  // Across the flow: each step as near the mean of its neighbors as the spacing allows. A step
  // takes its height across a column, or its own width across a row; a lane takes a narrow strip.
  const extent = (id: string) => (widths.has(id) ? (horizontal ? h : widths.get(id)!) : LANE)
  const at = new Map<string, number>()
  const offsets = (l: string[]) => l.reduce<number[]>((acc, id, i) => [...acc, i ? acc[i - 1]! + (extent(l[i - 1]!) + extent(id)) / 2 + cross : 0], [])
  layers.forEach((l) => {
    const off = offsets(l)
    l.forEach((id, i) => at.set(id, off[i]! - (off.at(-1) ?? 0) / 2))
  })
  const mean = (near: string[]) => (near.length ? near.reduce((s, n) => s + at.get(n)!, 0) / near.length : null)
  const place = (l: string[], want: (id: string) => number | null) => {
    const off = offsets(l)
    const z = isotonic(l.map((id, i) => (want(id) ?? at.get(id)!) - off[i]!))
    l.forEach((id, i) => at.set(id, z[i]! + off[i]!))
  }
  for (let pass = 0; pass < 3; pass++) {
    for (const l of layers.slice(1)) place(l, (id) => mean(vParents.get(id)!))
    for (const l of layers.slice(0, -1).reverse()) place(l, (id) => mean([...vParents.get(id)!, ...vChildren.get(id)!]))
  }

  const min = all.length ? Math.min(...all.map((id) => at.get(id)! - extent(id) / 2)) : 0
  const max = all.length ? Math.max(...all.map((id) => at.get(id)! + extent(id) / 2)) : 0
  const columns = layers.map((l) => (horizontal ? Math.max(SIZE[orientation].min, ...l.filter((id) => widths.has(id)).map((id) => widths.get(id)!)) : h))
  const starts = columns.map((_, i) => columns.slice(0, i).reduce((sum, c) => sum + c + main, 0))
  const box = (id: string, li: number, index: number): FlowLayoutNode => {
    const m = starts[li]!
    const c = Math.round(at.get(id)! - extent(id) / 2 - min)
    return { id, layer: li, index, x: horizontal ? m : c, y: horizontal ? c : m, width: horizontal ? columns[li]! : extent(id), height: horizontal ? extent(id) : h }
  }
  const placed = new Map<string, FlowLayoutNode>()
  const real = layers.map((l) => l.filter((id) => known.has(id)))
  real.forEach((l, li) => l.forEach((id, index) => placed.set(id, box(id, li, index))))
  const routes = new Map([...lanes].map(([edge, chain]) => [edge, chain.map((lane) => box(lane, layer.get(lane)!, -1))]))
  const extentMain = depth ? starts[depth - 1]! + columns[depth - 1]! : 0
  const extentCross = all.length ? Math.round(max - min) : 0
  return { nodes: placed, layers: real, parents, children, routes, width: horizontal ? extentMain : extentCross, height: horizontal ? extentCross : extentMain }
}

/**
 * A curve from a step's out port to the next one's in port, in the flow
 * direction, through the lanes of the layers a long edge crosses.
 */
function edgePath(a: FlowLayoutNode, b: FlowLayoutNode, via: readonly FlowLayoutNode[], orientation: FlowOrientation, mirror: (x: number) => number) {
  const boxes = [a, ...via, b]
  const horizontal = orientation === 'horizontal'
  const outOf = (n: FlowLayoutNode) => (horizontal ? [mirror(n.x + n.width), n.y + n.height / 2] : [mirror(n.x + n.width / 2), n.y + n.height])
  const into = (n: FlowLayoutNode) => (horizontal ? [mirror(n.x), n.y + n.height / 2] : [mirror(n.x + n.width / 2), n.y])
  let d = ''
  boxes.slice(1).forEach((to, i) => {
    const [sx, sy] = outOf(boxes[i]!) as [number, number]
    const [tx, ty] = into(to) as [number, number]
    const bend = horizontal ? (tx - sx) / 2 : (ty - sy) / 2
    d += `${i ? 'L' : 'M'}${sx} ${sy}` + (horizontal ? `C${sx + bend} ${sy} ${tx - bend} ${ty} ${tx} ${ty}` : `C${sx} ${sy + bend} ${tx} ${ty - bend} ${tx} ${ty}`)
  })
  return d
}

// ── View ─────────────────────────────────────────────────────────────────

interface View {
  x: number
  y: number
  k: number
}

const PAD = 24
/** The strip along the canvas's foot kept for the zoom controls and the minimap. */
const BAND = 44
/** The default floor of the fitted zoom, where a step's name is still about 11px. */
const FIT_FLOOR = 0.85
const MIN_ZOOM = 0.25
const MAX_ZOOM = 2
const ZOOM_STEP = 1.25
const DOT = 20
const clampZoom = (k: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, k))

/**
 * The graph centered, no larger than life and no smaller than `floor`, so its
 * text stays legible; a graph that still overflows opens at the start of
 * its flow, with the rest a pan away.
 */
const fitView = (vw: number, vh: number, W: number, H: number, floor: number, rtl: boolean): View => {
  const room = vh - BAND
  const k = clampZoom(Math.max(floor, Math.min((vw - PAD * 2) / Math.max(1, W), (room - PAD * 2) / Math.max(1, H), 1)))
  const [sw, sh] = [W * k, H * k]
  return {
    k,
    x: sw + PAD * 2 <= vw ? (vw - sw) / 2 : rtl ? vw - sw - PAD : PAD,
    y: sh + PAD * 2 <= room ? (room - sh) / 2 : PAD,
  }
}

/** The canvas height that holds the graph at `k`, above the band for the corner controls. */
const autoHeight = (H: number, k: number) => Math.round(Math.min(640, Math.max(200, H * k + PAD * 2 + BAND)))

/** An axis that fits stays centered; one that overflows pans only as far as its edges. */
const clampView = (v: View, vw: number, vh: number, W: number, H: number): View => {
  const axis = (pos: number, view: number, size: number) => (size + PAD * 2 <= view ? (view - size) / 2 : Math.min(PAD, Math.max(view - size - PAD, pos)))
  return { k: v.k, x: axis(v.x, vw, W * v.k), y: axis(v.y, vh - BAND, H * v.k) }
}

const zoomAt = (v: View, k: number, px: number, py: number): View => {
  const next = clampZoom(k)
  return { k: next, x: px - ((px - v.x) / v.k) * next, y: py - ((py - v.y) / v.k) * next }
}

const STATUS_WORD = {
  queued: 'flowQueued',
  running: 'flowRunning',
  ok: 'flowSucceeded',
  error: 'flowFailed',
  retried: 'flowRetried',
  skipped: 'flowSkipped',
} as const

/** How an edge is drawn, from the states at its ends. */
function edgeState(from: FlowStatus, to: FlowStatus) {
  if (from === 'skipped' || to === 'skipped') return 'skipped'
  if (to === 'running') return 'running'
  if (to === 'error') return 'error'
  if (to === 'queued') return 'pending'
  return 'done'
}

/** Whether focus arrived from the keyboard (older engines don't know the selector). */
const keyboardFocus = (el: Element) => {
  try {
    return el.matches(':focus-visible')
  } catch {
    return false
  }
}

/** A token's own curve, as a Web Animation takes it. */
const loopEase = (k: ReturnType<typeof useYouj>, token: 'standard' | 'exit') => `cubic-bezier(${k.ease(token).join(',')})` // youj-allow: the token's own curve, for a Web Animation

function FlowEdgePath({ d, state, active, live }: { d: string; state: string; active: boolean; live: boolean }) {
  const k = useYouj()
  const ref = useRef<SVGPathElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || state !== 'running' || !live || typeof el.animate !== 'function') return
    // The running edge's dashes flow toward the step (stroke-dashoffset, as SVG flow lines are drawn).
    const run = el.animate([{ strokeDashoffset: 0 }, { strokeDashoffset: -12 }], { duration: k.ms('slow') * 2, iterations: Infinity })
    return () => run.cancel()
  }, [state, live, k])
  return (
    <path
      ref={ref}
      d={d}
      data-slot="flow-graph-edge"
      data-state={state}
      data-active={active || undefined}
      fill="none"
      strokeLinecap="round"
      strokeWidth={active || state === 'running' ? 1.75 : 1.25}
      className={cn(
        'transition-[stroke,stroke-width,opacity] yj-duration-fast ease-standard',
        state === 'running' && 'stroke-accent [stroke-dasharray:5_7]',
        state === 'skipped' && 'stroke-fg-subtle [stroke-dasharray:3_5]',
        state === 'error' && 'stroke-danger-line',
        state === 'pending' && 'stroke-line-strong',
        state === 'done' && 'stroke-line-strong',
        active && state !== 'running' && 'stroke-fg',
      )}
    />
  )
}

/** The attempts as the node shows them (×2): a language with a dual form says "twice" without the digit, so it gets one. */
const attemptsText = (words: string, count: number) => (words.includes(String(count)) ? words : `×${count} ${words}`)

interface FlowNodeViewProps {
  node: FlowNode
  box: FlowLayoutNode
  left: number
  orientation: FlowOrientation
  rtl: boolean
  open: boolean
  tabbable: boolean
  live: boolean
  name: string
  describedBy: string
  controls?: string
  onOpen: () => void
  onFocus: (e: FocusEvent<HTMLButtonElement>) => void
  onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => void
  buttonRef: (el: HTMLButtonElement | null) => void
  onHover: (hovered: boolean) => void
}

function FlowNodeView({ node, box, left, orientation, rtl, open, tabbable, live, name, describedBy, controls, onOpen, onFocus, onKeyDown, buttonRef, onHover }: FlowNodeViewProps) {
  const k = useYouj()
  const halo = useRef<HTMLSpanElement>(null)
  const ping = useRef<HTMLSpanElement>(null)
  const running = node.status === 'running'
  useEffect(() => {
    if (!running || !live || typeof halo.current?.animate !== 'function') return
    const duration = k.ms('deliberate') * 2.4
    const easing = loopEase(k, 'standard')
    const runs = [
      halo.current?.animate([{ opacity: 0 }, { opacity: 0.9 }, { opacity: 0 }], { duration, iterations: Infinity, easing }),
      ping.current?.animate([{ opacity: 0.7, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(2.6)' }], { duration, iterations: Infinity, easing: loopEase(k, 'exit') }),
    ]
    return () => runs.forEach((r) => r?.cancel())
  }, [running, live, k])

  // The ports sit where the edges meet the card: across the flow's ends.
  // youj-allow: physical side, the ports are chosen per direction here
  const inSide = orientation === 'vertical' ? 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2' : cn('top-1/2 -translate-y-1/2', rtl ? 'right-0 translate-x-1/2' : 'left-0 -translate-x-1/2')
  // youj-allow: physical side, the ports are chosen per direction here
  const outSide = orientation === 'vertical' ? 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2' : cn('top-1/2 -translate-y-1/2', rtl ? 'left-0 -translate-x-1/2' : 'right-0 translate-x-1/2')

  return (
    <li className="absolute" style={{ left, top: box.y, width: box.width, height: box.height }}>
      <button
        ref={buttonRef}
        type="button"
        data-slot="flow-graph-node"
        data-status={node.status}
        data-open={open || undefined}
        aria-label={name}
        aria-describedby={describedBy}
        aria-expanded={open}
        aria-controls={open ? controls : undefined}
        tabIndex={tabbable ? 0 : -1}
        onClick={onOpen}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        onPointerEnter={() => onHover(true)}
        onPointerLeave={() => onHover(false)}
        className={cn(
          'group/node relative own:flex size-full flex-col justify-center gap-1 own:rounded-[min(var(--radius-lg),0.625rem)] border own:bg-surface own:px-3 own:text-start own:shadow-xs-soft outline-none focus-ring',
          'transition-[background-color,border-color,box-shadow,opacity] yj-duration-fast ease-standard own:hover:bg-[color-mix(in_oklab,var(--color-fg)_5%,var(--color-surface))]',
          node.status === 'skipped' ? 'border-dashed border-line-strong own:bg-transparent opacity-75 own:shadow-none' : 'border-line',
          node.status === 'error' && 'border-danger-line',
          running && 'border-accent-line',
          open && 'own:bg-[color-mix(in_oklab,var(--color-fg)_9%,var(--color-surface))] own:shadow-md own:ring-1 ring-line-strong',
        )}
      >
        {running && <span ref={halo} aria-hidden data-slot="flow-graph-pulse" className="pointer-events-none absolute -inset-[3px] own:rounded-[calc(min(var(--radius-lg),0.625rem)+3px)] own:ring-2 ring-accent-line own:reduced:hidden" style={{ opacity: live ? 0 : 1 }} />}
        <span aria-hidden data-slot="flow-graph-port" data-side="in" className={cn('absolute size-2 own:rounded-full border border-line-strong own:bg-surface', inSide)} />
        <span aria-hidden data-slot="flow-graph-port" data-side="out" className={cn('absolute size-2 own:rounded-full own:bg-line-strong', outSide, node.status === 'queued' && 'own:bg-well', running && 'own:bg-accent')} />
        <span className="own:flex min-w-0 items-center gap-2">
          <span aria-hidden data-slot="flow-graph-node-status" className="relative own:grid size-2 shrink-0 place-items-center">
            {running && <span ref={ping} className="absolute inset-0 rounded-full bg-accent opacity-0 own:reduced:hidden" />}
            <span
              className={cn(
                'size-2 rounded-full',
                node.status === 'queued' && 'border-[1.5px] border-fg-subtle',
                running && 'bg-accent',
                node.status === 'ok' && 'bg-success',
                node.status === 'retried' && 'bg-warning',
                node.status === 'error' && 'bg-danger',
                node.status === 'skipped' && 'h-[1.5px] rounded-none bg-fg-subtle',
              )}
            />
          </span>
          <span data-slot="flow-graph-node-name" dir="ltr" className={cn('min-w-0 truncate own:font-mono own:text-ui own:leading-tight', node.status === 'queued' || node.status === 'skipped' ? 'own:text-fg-muted' : 'own:text-fg')}>
            {node.label}
          </span>
        </span>{' '}
        <span className="own:flex min-w-0 items-center gap-1.5 ps-4 own:text-ui-xs own:leading-none own:text-fg-muted">
          {node.kind && (
            <span data-slot="flow-graph-node-kind" className="shrink-0 own:font-(family-name:--yj-label-font) own:tracking-(--yj-label-tracking) own:[text-transform:var(--yj-label-case)]">
              {node.kind}
            </span>
          )}
          {node.kind && node.meta && <span aria-hidden className="own:text-fg-subtle">·</span>}
          {node.meta && (
            <span data-slot="flow-graph-node-meta" dir="auto" className={cn('min-w-0 truncate own:font-mono own:tabular-nums', node.status === 'error' && 'own:text-danger-text')}>
              {node.meta}
            </span>
          )}
          {node.status === 'retried' && node.attempts !== undefined && node.attempts > 1 && (
            <span data-slot="flow-graph-node-attempts" dir="ltr" className="own:ms-auto shrink-0 own:font-mono own:text-warning-text own:tabular-nums">
              ×{node.attempts}
            </span>
          )}
        </span>
      </button>
    </li>
  )
}

function FlowGraph({
  nodes,
  edges,
  value,
  defaultValue = null,
  onValueChange,
  controls,
  orientation: orientationProp = 'auto',
  minimap = true,
  label,
  locale: localeProp,
  sound = true,
  height = 'auto',
  fitFloor = FIT_FLOOR,
  className,
  style,
  ...props
}: FlowGraphProps) {
  const k = useYouj()
  const labels = useComponentLabels(flowGraphLabels)
  const locale = useLocale(localeProp)
  const cue = useSoundCue()
  const rtl = useDirection() === 'rtl'
  const hintId = useId()
  const baseId = useId()
  const viewportRef = useRef<HTMLDivElement>(null)
  const worldRef = useRef<HTMLDivElement>(null)
  const buttons = useRef(new Map<string, HTMLButtonElement>())
  const inView = useInView(viewportRef, { amount: 0.1 })
  const live = inView && !k.reduced
  const [open, setOpen] = useControllableState(value, defaultValue)
  const [focused, setFocused] = useState<string | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)
  const [view, setView] = useState<View>({ x: 0, y: 0, k: 1 })
  const [smooth, setSmooth] = useState(false)
  const [dragging, setDragging] = useState(false)
  const fitted = useRef(true)
  const cameFrom = useRef<{ to: string; from: string } | null>(null)

  const orientation: FlowOrientation = orientationProp === 'auto' ? (size && size.w < 544 ? 'vertical' : 'horizontal') : orientationProp
  const shape = `${orientation}|${nodes.map((n) => n.id).join(',')}|${edges.map((e) => `${e.from}>${e.to}`).join(',')}`
  // biome-ignore lint/correctness/useExhaustiveDependencies: the layout depends only on the graph's shape, not on the steps' states.
  const layout = useMemo(() => layoutFlowGraph(nodes, edges, orientation), [shape]) // eslint-disable-line react-hooks/exhaustive-deps -- the layout depends only on the graph's shape, not on the steps' states.
  const mirror = (x: number) => (rtl ? layout.width - x : x)
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes])

  // Measure the viewport; the view keeps fitting until someone pans or zooms.
  useLayoutEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const measure = () => {
      const box = el.getBoundingClientRect()
      if (box.width > 0 && box.height > 0) setSize((s) => (s && s.w === box.width && s.h === box.height ? s : { w: box.width, h: box.height }))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  useLayoutEffect(() => {
    if (!size) return
    setView((v) => (fitted.current ? fitView(size.w, size.h, layout.width, layout.height, fitFloor, rtl) : clampView(v, size.w, size.h, layout.width, layout.height)))
  }, [size, layout, fitFloor, rtl])

  /** Where the view is right now, mid-glide included, so a new gesture picks up from there. */
  const current = (): View => {
    const el = worldRef.current
    if (!smooth || !el || typeof DOMMatrixReadOnly === 'undefined') return view
    const t = getComputedStyle(el).transform
    if (!t || t === 'none') return view
    const m = new DOMMatrixReadOnly(t)
    return { x: m.e, y: m.f, k: m.a }
  }
  const move = (next: View, glide: boolean) => {
    if (!size) return
    fitted.current = false
    setSmooth(glide)
    setView(clampView(next, size.w, size.h, layout.width, layout.height))
  }
  const fit = () => {
    if (!size) return
    fitted.current = true
    setSmooth(true)
    setView(fitView(size.w, size.h, layout.width, layout.height, fitFloor, rtl))
  }
  const zoomBy = (factor: number, point?: { x: number; y: number }) => {
    if (!size) return
    const v = current()
    move(zoomAt(v, v.k * factor, point?.x ?? size.w / 2, point?.y ?? size.h / 2), true)
  }

  // Wheel: Ctrl/⌘ (or a pinch) zooms at the pointer; a plain wheel pans while there's room, then lets the page scroll.
  useEffect(() => {
    const el = viewportRef.current
    if (!el || !size) return
    const onWheel = (e: globalThis.WheelEvent) => {
      const box = el.getBoundingClientRect()
      const v = current()
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        move(zoomAt(v, v.k * Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0025)), e.clientX - box.left, e.clientY - box.top), false)
        return
      }
      const dx = e.shiftKey && !e.deltaX ? e.deltaY : e.deltaX
      const dy = e.shiftKey && !e.deltaX ? 0 : e.deltaY
      const next = clampView({ ...v, x: v.x - dx, y: v.y - dy }, size.w, size.h, layout.width, layout.height)
      if (Math.abs(next.x - v.x) < 0.5 && Math.abs(next.y - v.y) < 0.5) return
      e.preventDefault()
      move(next, false)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  })

  // Drag the canvas to pan (mouse and pen in both axes; a finger only across, so the page still scrolls).
  const drag = useRef<{ id: number; x: number; y: number; view: View; touch: boolean } | null>(null)
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest('button, [data-slot=flow-graph-minimap]')) return
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, view: current(), touch: e.pointerType === 'touch' }
    e.currentTarget.setPointerCapture?.(e.pointerId)
    setDragging(true)
  }
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    move({ ...d.view, x: d.view.x + e.clientX - d.x, y: d.view.y + (d.touch ? 0 : e.clientY - d.y) }, false)
  }
  const endDrag = () => {
    drag.current = null
    setDragging(false)
  }

  /** Brings a step into view, gliding, when it sits outside the canvas. */
  const reveal = (id: string) => {
    const box = layout.nodes.get(id)
    if (!box || !size) return
    const v = current()
    const x0 = v.x + mirror(rtl ? box.x + box.width : box.x) * v.k
    const y0 = v.y + box.y * v.k
    const [w, h] = [box.width * v.k, box.height * v.k]
    const m = 12
    if (x0 >= m && y0 >= m && x0 + w <= size.w - m && y0 + h <= size.h - m) return
    move({ ...v, x: size.w / 2 - (x0 - v.x + w / 2), y: size.h / 2 - (y0 - v.y + h / 2) }, true)
  }

  const go = (id: string | undefined, from?: string) => {
    if (!id) return
    if (from) cameFrom.current = { to: id, from }
    buttons.current.get(id)?.focus({ preventScroll: true })
    reveal(id)
  }

  const toggle = (id: string) => {
    const next = open === id ? null : id
    setOpen(next)
    onValueChange?.(next)
    if (sound) cue(next ? 'select' : 'close')
  }

  const onNodeKeyDown = (id: string) => (e: KeyboardEvent<HTMLButtonElement>) => {
    const box = layout.nodes.get(id)!
    const cross = (n: string) => {
      const b = layout.nodes.get(n)!
      return orientation === 'horizontal' ? b.y : b.x
    }
    const nearest = (list: string[]) => [...list].sort((a, b) => Math.abs(cross(a) - cross(box.id)) - Math.abs(cross(b) - cross(box.id)))[0]
    const forward = orientation === 'horizontal' ? (rtl ? 'ArrowLeft' : 'ArrowRight') : 'ArrowDown'
    const backward = orientation === 'horizontal' ? (rtl ? 'ArrowRight' : 'ArrowLeft') : 'ArrowUp'
    const [prev, next] = orientation === 'horizontal' ? ['ArrowUp', 'ArrowDown'] : rtl ? ['ArrowRight', 'ArrowLeft'] : ['ArrowLeft', 'ArrowRight']
    const siblings = layout.layers[box.layer]!
    const flat = layout.layers.flat()
    if (e.key === forward) go(nearest(layout.children.get(id)!), id)
    else if (e.key === backward) {
      const back = cameFrom.current?.to === id && layout.parents.get(id)!.includes(cameFrom.current.from) ? cameFrom.current.from : nearest(layout.parents.get(id)!)
      go(back)
    } else if (e.key === prev) go(siblings[box.index - 1])
    else if (e.key === next) go(siblings[box.index + 1])
    else if (e.key === 'Home') go(flat[0])
    else if (e.key === 'End') go(flat.at(-1))
    else if (e.key === 'Escape' && open) {
      setOpen(null)
      onValueChange?.(null)
      if (sound) cue('close')
    } else return
    e.preventDefault()
  }

  const onViewportKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return
    if (e.key === '+' || e.key === '=') zoomBy(ZOOM_STEP)
    else if (e.key === '-' || e.key === '_') zoomBy(1 / ZOOM_STEP)
    else if (e.key === '0') fit()
    else return
    e.preventDefault()
  }

  const fitK = clampZoom(Math.max(fitFloor, Math.min(1, size ? (size.w - PAD * 2) / Math.max(1, layout.width) : 1)))
  const list = listFormat(locale, { type: 'conjunction' })
  const names = (ids: string[]) => list.format(ids.map((i) => byId.get(i)?.label ?? i))
  const first = layout.layers.flat()[0]
  const tabbable = (focused && byId.has(focused) ? focused : null) ?? (open && byId.has(open) ? open : null) ?? nodes.find((n) => n.status === 'running')?.id ?? first
  const lit = open ?? hovered ?? focused
  const glide = smooth && 'yj-duration-slow ease-standard'
  const dot = DOT * view.k * (view.k < 0.5 ? 2 : 1)
  const overflowing = !!size && (layout.width * view.k + PAD * 2 > size.w + 1 || layout.height * view.k + PAD * 2 > size.h - BAND + 1)

  return (
    <div
      data-slot="flow-graph"
      data-orientation={orientation}
      data-reduced-motion={k.reduced || undefined}
      className={cn('relative w-full min-w-0', className)}
      style={{ height: height === 'auto' ? autoHeight(layout.height, fitK) : height, ...style }}
      {...props}
    >
      <div
        ref={viewportRef}
        role="group"
        aria-label={label ?? labels.flowGraph}
        aria-describedby={hintId}
        data-slot="flow-graph-viewport"
        data-dragging={dragging || undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={onViewportKeyDown}
        className={cn(
          'relative size-full touch-pan-y overflow-hidden own:rounded-[min(var(--radius-xl),1rem)] border border-line own:bg-(--flow-canvas) select-none [--flow-canvas:color-mix(in_oklab,var(--color-fg)_2.5%,var(--color-surface))]',
          'cursor-grab data-dragging:cursor-grabbing',
          glide && 'transition-[background-position,background-size]',
          glide,
        )}
        style={{
          backgroundImage: 'radial-gradient(circle, color-mix(in oklab, var(--color-fg) 16%, transparent) 1px, transparent 1.5px)',
          backgroundSize: `${dot}px ${dot}px`,
          backgroundPosition: `${view.x - dot / 2}px ${view.y - dot / 2}px`,
        }}
      >
        <div
          ref={worldRef}
          data-slot="flow-graph-world"
          // youj-allow: physical side, the canvas is placed in px from its physical origin
          className={cn('absolute top-0 left-0 origin-top-left', glide && 'transition-transform', glide, !size && 'invisible')}
          style={{ width: layout.width, height: layout.height, transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})` }}
          onTransitionEnd={(e) => e.target === e.currentTarget && setSmooth(false)}
        >
          <svg aria-hidden data-slot="flow-graph-edges" width={layout.width} height={layout.height} className="absolute inset-0 overflow-visible">
            {nodes.flatMap((n) =>
              (layout.children.get(n.id) ?? []).map((to) => {
                const a = layout.nodes.get(n.id)!
                const b = layout.nodes.get(to)!
                const target = byId.get(to)!
                return <FlowEdgePath key={`${n.id}>${to}`} d={edgePath(a, b, layout.routes.get(`${n.id}>${to}`) ?? [], orientation, mirror)} state={edgeState(n.status, target.status)} active={lit === n.id || lit === to} live={live} />
              }),
            )}
          </svg>
          <ul data-slot="flow-graph-nodes" className="absolute inset-0">
            {layout.layers.flat().map((id) => {
              const node = byId.get(id)!
              const box = layout.nodes.get(id)!
              const word = labels[STATUS_WORD[node.status]]
              const descId = `${baseId}-${id}`
              return (
                <FlowNodeView
                  key={id}
                  node={node}
                  box={box}
                  left={rtl ? layout.width - box.x - box.width : box.x}
                  orientation={orientation}
                  rtl={rtl}
                  open={open === id}
                  tabbable={tabbable === id}
                  live={live}
                  // What the step shows (label, kind, meta, attempts) in reading order, then its state.
                  name={labels.flowGraphNode(
                    [node.label, node.kind, node.meta, node.status === 'retried' && node.attempts !== undefined && node.attempts > 1 ? attemptsText(labels.flowGraphAttempts(node.attempts), node.attempts) : undefined]
                      .filter(Boolean)
                      .join(', '),
                    word,
                  )}
                  describedBy={descId}
                  controls={controls}
                  onOpen={() => toggle(id)}
                  onFocus={(e) => {
                    setFocused(id)
                    if (keyboardFocus(e.currentTarget)) reveal(id)
                  }}
                  onKeyDown={onNodeKeyDown(id)}
                  onHover={(on) => setHovered((h) => (on ? id : h === id ? null : h))}
                  buttonRef={(el) => {
                    if (el) buttons.current.set(id, el)
                    else buttons.current.delete(id)
                  }}
                />
              )
            })}
          </ul>
          <div className="sr-only">
            {layout.layers.flat().map((id) => {
              const after = layout.parents.get(id)!
              const then = layout.children.get(id)!
              const node = byId.get(id)!
              const parts = [
                node.attempts !== undefined && node.attempts > 1 ? labels.flowGraphAttempts(node.attempts) : null,
                after.length ? labels.flowGraphAfter(names(after)) : null,
                then.length ? labels.flowGraphThen(names(then)) : null,
              ].filter(Boolean)
              return (
                <span key={id} id={`${baseId}-${id}`}>
                  {parts.join('. ')}
                </span>
              )
            })}
          </div>
        </div>

        {/* A soft edge where the graph runs on past the canvas: there's more a pan away. */}
        {size && view.x < PAD - 1 && <span /* youj-allow: physical side, the pan view is physical */ aria-hidden data-slot="flow-graph-fade" data-side="left" className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-linear-to-r from-(--flow-canvas) to-transparent" />}
        {size && view.x + layout.width * view.k > size.w - PAD + 1 && (
          <span /* youj-allow: physical side, the pan view is physical */ aria-hidden data-slot="flow-graph-fade" data-side="right" className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-linear-to-l from-(--flow-canvas) to-transparent" />
        )}
        {minimap && overflowing && size && size.w >= 480 && <FlowMinimap layout={layout} nodes={byId} view={view} size={size} mirror={mirror} orientation={orientation} onCenter={(x, y) => move({ ...view, x: size.w / 2 - x * view.k, y: size.h / 2 - y * view.k }, true)} />}

        <div data-slot="flow-graph-controls" className="absolute end-2.5 bottom-2.5 own:flex items-center gap-0.5 rounded-xl border border-line bg-overlay/90 youj-allow-glass own:p-0.5 shadow-sm-soft backdrop-blur-sm">
          <Button variant="ghost" size="icon-xs" aria-label={labels.zoomOut} disabled={view.k <= MIN_ZOOM + 0.001} onClick={() => zoomBy(1 / ZOOM_STEP)}>
            <MinusIcon size={14} />
          </Button>
          <span data-slot="flow-graph-zoom" aria-hidden className="w-10 own:text-center own:font-mono own:text-ui-xs own:text-fg-muted own:tabular-nums">
            {numberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(view.k)}
          </span>
          <Button variant="ghost" size="icon-xs" aria-label={labels.zoomIn} disabled={view.k >= MAX_ZOOM - 0.001} onClick={() => zoomBy(ZOOM_STEP)}>
            <PlusIcon size={14} />
          </Button>
          <span aria-hidden className="own:mx-0.5 h-4 w-px bg-line" />
          <Button variant="ghost" size="icon-xs" aria-label={labels.zoomToFit} onClick={fit}>
            <MaximizeIcon size={14} />
          </Button>
        </div>
      </div>
      <p id={hintId} className="sr-only">
        {labels.flowGraphHint}
      </p>
    </div>
  )
}

interface FlowMinimapProps {
  layout: FlowLayout
  nodes: Map<string, FlowNode>
  view: View
  size: { w: number; h: number }
  mirror: (x: number) => number
  orientation: FlowOrientation
  onCenter: (x: number, y: number) => void
}

/** The whole graph in miniature, with the part in view outlined; a click centers the view there. */
function FlowMinimap({ layout, nodes, view, size, mirror, onCenter }: FlowMinimapProps) {
  const W = 112
  const scale = W / Math.max(1, layout.width)
  const H = Math.min(56, Math.max(24, layout.height * scale))
  const s = Math.min(scale, H / Math.max(1, layout.height))
  const ox = (W - layout.width * s) / 2
  const oy = (H - layout.height * s) / 2
  const vx = (-view.x / view.k) * s + ox
  const vy = (-view.y / view.k) * s + oy
  return (
    <svg
      aria-hidden
      data-slot="flow-graph-minimap"
      width={W}
      height={H}
      className="absolute start-2.5 bottom-2.5 cursor-pointer own:rounded-lg border border-line own:bg-overlay/90 youj-allow-glass own:shadow-sm-soft backdrop-blur-sm"
      onPointerDown={(e) => {
        const box = e.currentTarget.getBoundingClientRect()
        onCenter((e.clientX - box.left - ox) / s, (e.clientY - box.top - oy) / s)
      }}
    >
      {[...layout.nodes.values()].map((b) => {
        const status = nodes.get(b.id)?.status
        return (
          <rect
            key={b.id}
            x={ox + Math.min(mirror(b.x), mirror(b.x + b.width)) * s}
            y={oy + b.y * s}
            width={b.width * s}
            height={b.height * s}
            rx={1.5}
            className={cn(
              'fill-line-strong',
              status === 'running' && 'fill-accent',
              status === 'error' && 'fill-danger',
              status === 'skipped' && 'fill-well',
            )}
          />
        )
      })}
      <rect x={vx} y={vy} width={(size.w / view.k) * s} height={(size.h / view.k) * s} rx={2} className="fill-band stroke-fg-subtle" strokeWidth={1} />
    </svg>
  )
}

export { FlowGraph, layoutFlowGraph, type FlowEdge, type FlowGraphProps, type FlowLayout, type FlowLayoutNode, type FlowNode, type FlowOrientation, type FlowStatus }
