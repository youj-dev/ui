import type { MotionPersonality } from '@youj/core/lib/youj/tokens'
import { pen } from '../entrance/draw'
import { pieces } from '../entrance/pieces'
import type { Box, Part } from '../entrance/read'
import { entrance, type EntranceRun } from '../entrance/run'

/* Trace: a thin signal runs the layout like a circuit and lights the UI up as it reaches it. It comes in from beside
 * the frame and runs both ways round the frame's border, then spreads down the layout tree: from each box along its
 * edge, across the gutter above what it holds and down a short connector into each region, round that region's
 * border, and on to every piece, all branches at once. A piece lights as the signal reaches it: a brief glow on its
 * edge, then the real piece; a panel fills in as its border is traced. The path stays etched faintly until the settle.
 * A look on the shared entrance runtime (../entrance/run.ts).
 *
 * Borders are traced on the boxes' own edges, rounded corners included. The signal's heads are small elements moved
 * by Web Animations (keyframes at each corner, and along each arc); the etched path is drawn on one canvas, only
 * what's new each frame. The demo is held by its inline opacity while it waits and faded in by Web Animations. */

export interface TraceOptions {
  /** The whole run in ms, before `speed`. Default: from the demo's size and part count, about 2 s for a card, about 3.5 s for a small screen. */
  duration?: number
  /** Multiplies the pace: 2 plays twice as fast. Default 1. */
  speed?: number
  /** Each stage's share of the run, as weights (normalized, so they never change the total; a stage left out keeps
   * its default, and 0 skips it). Default `{ enter: 14, spread: 74, settle: 12 }`. */
  phases?: TracePhases
  /** The signal in the theme's accent instead of its foreground. Default false. */
  accent?: boolean
  /** Aborting cancels the run. */
  signal?: AbortSignal
  /** Skip the entrance. Default: the provider's `--yj-motion` on the demo, else the OS setting. */
  reduced?: boolean
  /** The motion personality its timing and curves come from. Default: the demo's `data-yj-motion`, else precise. */
  personality?: MotionPersonality
  /** Holds the run at its start until `seek` moves it, instead of playing it on animation frames: for a clock of your
   *  own (a video rendered frame by frame, a scrubber). Default false. */
  paused?: boolean
}

export interface TracePhases {
  /** The signal comes in from beside the frame and runs round its border; the frame fills in. */
  enter?: number
  /** It spreads through the regions to every piece, lighting each as it arrives. */
  spread?: number
  /** The etched path fades and anything floating (an open popover) fades in. */
  settle?: number
}

export type TraceRun = EntranceRun

const M = 24
/** How far beside the frame the signal comes in from. */
const LEAD = 18
/** How far above a box its connector crosses over (at most half the gap above it), px. */
const GUTTER = 8
/** The etched path's strength. */
const ETCH = 0.42

const CSS = `
.yj-trace{--yj-tr-c:var(--color-fg)}
.yj-tr-accent{--yj-tr-c:var(--color-accent)}
.yj-tr-t{opacity:${ETCH}}
.yj-tr-h{left:0;top:0;width:0;height:0;opacity:0}
.yj-tr-h::before{content:'';position:absolute;right:0;top:-.5px;width:14px;height:1px;background:linear-gradient(to right,transparent,var(--yj-tr-c))}
.yj-tr-h::after{content:'';position:absolute;left:-1.5px;top:-1.5px;width:3px;height:3px;border-radius:50%;background:var(--yj-tr-c);
box-shadow:0 0 5px 1px color-mix(in oklab,var(--yj-tr-c) 70%,transparent)}
.yj-tr-g{opacity:0;box-shadow:0 0 0 1px color-mix(in oklab,var(--yj-tr-c) 75%,transparent),0 0 7px color-mix(in oklab,var(--yj-tr-c) 30%,transparent)}
`

type Pt = [number, number]
/** A straight run between pixel columns/rows, or a quarter of a rounded corner (angles in radians, y down). */
type Seg = { a: Pt; b: Pt } | { c: Pt; r: number; a0: number; a1: number }
interface Node {
  box: Box
  /** Its corners' radius, px. */
  r: number
  /** What appears when the signal reaches it: a panel (filled in as its border is traced) or a piece (lit). */
  el?: Element
  piece?: Part
  parent?: Node
  /** How far the signal runs to reach it, px. */
  dist: number
}

const area = (b: Box) => b.w * b.h
const holds = (a: Box, b: Box) =>
  area(a) > area(b) * 1.01 && b.x >= a.x - 1 && b.y >= a.y - 1 && b.x + b.w <= a.x + a.w + 1 && b.y + b.h <= a.y + a.h + 1
const same = (a: Box, b: Box) => Math.abs(a.x - b.x) < 1.5 && Math.abs(a.y - b.y) < 1.5 && Math.abs(a.w - b.w) < 1.5 && Math.abs(a.h - b.h) < 1.5
const lengthOf = (s: Seg) => ('c' in s ? Math.abs(s.a1 - s.a0) * s.r : Math.abs(s.b[0] - s.a[0]) + Math.abs(s.b[1] - s.a[1]))
const total = (path: Seg[]) => path.reduce((n, s) => n + lengthOf(s), 0)
const line = (a: Pt, b: Pt): Seg[] => (a[0] === b[0] && a[1] === b[1] ? [] : [{ a, b }])
const arc = (c: Pt, r: number, a0: number, a1: number): Seg[] => (r > 0 ? [{ c, r, a0, a1 }] : [])
/** Where a segment is at `f` (0–1), and which way it's heading there, in degrees. */
function along(s: Seg, f: number): [number, number, number] {
  if ('c' in s) {
    const a = s.a0 + (s.a1 - s.a0) * f
    return [s.c[0] + s.r * Math.cos(a), s.c[1] + s.r * Math.sin(a), ((a + (Math.sign(s.a1 - s.a0) * Math.PI) / 2) * 180) / Math.PI]
  }
  const [x1, y1] = s.a
  const [x2, y2] = s.b
  return [x1 + (x2 - x1) * f, y1 + (y2 - y1) * f, (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI]
}
/** The part of a path from `from` to `to` px along it. */
function slice(path: Seg[], from: number, to: number) {
  const out: Seg[] = []
  let at = 0
  for (const s of path) {
    const n = lengthOf(s)
    const lo = Math.max(from, at)
    const hi = Math.min(to, at + n)
    if (hi > lo) {
      const f0 = (lo - at) / n
      const f1 = (hi - at) / n
      if ('c' in s) out.push({ ...s, a0: s.a0 + (s.a1 - s.a0) * f0, a1: s.a0 + (s.a1 - s.a0) * f1 })
      else {
        const [x0, y0] = along(s, f0)
        const [x1, y1] = along(s, f1)
        out.push({ a: [Math.round(x0), Math.round(y0)], b: [Math.round(x1), Math.round(y1)] })
      }
    }
    at += n
  }
  return out
}
const reverse = (path: Seg[]) => [...path].reverse().map((s): Seg => ('c' in s ? { ...s, a0: s.a1, a1: s.a0 } : { a: s.b, b: s.a }))

export function trace(node: HTMLElement, options: TraceOptions = {}): TraceRun {
  return entrance(node, options, {
    name: 'trace',
    css: CSS,
    margin: M,
    phases: { enter: 14, spread: 74, settle: 12 },
    // about 2 s for a card, 3.5 s for a small screen
    length: (plan) => Math.min(9, Math.max(3, 1.4 + Math.sqrt(plan.w * plan.h) / 220 + plan.parts.length / 50)),
    play(run) {
      const { plan, W, rtl, span, ms, root, T, dpr, lw } = run
      const { rule } = pen(run)
      const standard = run.bezier('standard')
      if (options.accent) root.classList.add('yj-tr-accent')
      const ctx = run.canvas('yj-tr-t')
      const ink = run.color(options.accent ? 'var(--color-accent)' : 'var(--color-fg)')

      // ── The tree: the frame, the regions and panels inside it (each in the smallest that holds it), the pieces ──
      const { pieces: list, shells } = pieces(plan, node)
      const radius = (b: Box, r: number) => Math.round(Math.max(0, Math.min(r, b.w / 2 - 1, b.h / 2 - 1)))
      const frame: Node = { box: plan, r: radius(plan, plan.style.radius), dist: 0 }
      const boxes: Node[] = plan.regions.map((b) => ({ box: b, r: radius(b, b.style.radius), dist: 0 }))
      for (const s of shells) {
        if (s.kind === 'text' || s.kind === 'divider') continue
        const twin = boxes.find((b) => same(b.box, s))
        if (twin) twin.el = s.el
        else boxes.push({ box: s, r: radius(s, s.style.radius), el: s.el, dist: 0 })
      }
      const home = (b: Box) => boxes.filter((c) => c.box !== b && holds(c.box, b)).sort((p, q) => area(p.box) - area(q.box))[0] ?? frame
      for (const b of boxes) b.parent = home(b.box)
      const leaves: Node[] = list.map((p) => ({
        box: p,
        r: p.round ? radius(p, p.w) : radius(p, p.style.radius),
        el: p.el,
        piece: p,
        parent: home(p),
        dist: 0,
      }))

      // ── Paths, laid out left to right and mirrored for right to left: every box is entered at the start of its top edge ──
      const flip = (b: Box): Box => (rtl ? { ...b, x: W - b.x - b.w } : b)
      const mx = (x: number) => (rtl ? W - 1 - x : x)
      const mirror = (path: Seg[]): Seg[] =>
        rtl
          ? path.map((s) =>
              'c' in s
                ? { ...s, c: [mx(s.c[0]), s.c[1]], a0: Math.PI - s.a0, a1: Math.PI - s.a1 }
                : { a: [mx(s.a[0]), s.a[1]], b: [mx(s.b[0]), s.b[1]] },
            )
          : path
      const edges = (n: Node) => {
        const b = flip(n.box)
        const l = Math.round(b.x)
        const t = Math.round(b.y)
        return { l, t, R: Math.round(b.x + b.w) - 1, B: Math.round(b.y + b.h) - 1, r: n.r }
      }
      /** A box's border, clockwise from the start of its top edge (left to right). */
      const border = (n: Node): Seg[] => {
        const { l, t, R, B, r } = edges(n)
        const q = Math.PI / 2
        return [
          ...line([l + r, t], [R - r, t]),
          ...arc([R - r, t + r], r, -q, 0),
          ...line([R, t + r], [R, B - r]),
          ...arc([R - r, B - r], r, 0, q),
          ...line([R - r, B], [l + r, B]),
          ...arc([l + r, B - r], r, q, 2 * q),
          ...line([l, B - r], [l, t + r]),
          ...arc([l + r, t + r], r, 2 * q, 3 * q),
        ]
      }
      /** Both ways round a box's border from where it's entered, meeting halfway. */
      const around = (n: Node): Seg[][] => {
        const path = border(n)
        const L = total(path)
        return [mirror(slice(path, 0, L / 2)), mirror(reverse(slice(path, L / 2, L)))]
      }
      /** From where a box is entered to where one inside it is: along its top edge for what sits on that edge, else
       *  round its corner and down its side to the gutter just above, across it, and down a short connector. */
      const route = (from: Node, to: Node): Seg[] => {
        const p = edges(from)
        const c = edges(to)
        const x = c.l + c.r
        if (c.t - p.t <= GUTTER * 2) {
          const x1 = Math.max(p.l + p.r, x)
          return mirror([...line([p.l + p.r, p.t], [x1, p.t]), ...line([x1, p.t], [x1, c.t]), ...line([x1, c.t], [x, c.t])])
        }
        const y = Math.max(p.t + p.r, Math.min(p.B - p.r, c.t - Math.min(GUTTER, Math.floor((c.t - p.t) / 2))))
        return mirror([
          ...arc([p.l + p.r, p.t + p.r], p.r, -Math.PI / 2, -Math.PI),
          ...line([p.l, p.t + p.r], [p.l, y]),
          ...line([p.l, y], [x, y]),
          ...line([x, y], [x, c.t]),
        ])
      }
      const depth = (n: Node): number => (n.parent ? (n.dist = depth(n.parent) + total(route(n.parent, n))) : 0)
      for (const n of [...boxes, ...leaves]) depth(n)

      // ── Time: the frame's trace fills the enter stage; the spread runs at one speed, so the farthest piece lights last ──
      const [e0, e1] = span.enter
      const [s0, s1] = span.spread
      const light = ms('base')
      const far = Math.max(1, ...leaves.map((n) => n.dist), ...boxes.map((n) => n.dist + total(border(n)) / 2))
      const v = far / Math.max(1, s1 - s0 - light)
      const at = (n: Node) => s0 + n.dist / v

      /** A canvas mark for one segment: a rule for a straight run (crisp on the pixels), an arc stroked a slice at a time. */
      const stroke = (s: Seg) => {
        if (!('c' in s)) return rule(s.a[0], s.a[1], s.b[0], s.b[1])
        let from = s.a0
        return (c: CanvasRenderingContext2D, q: number) => {
          const to = s.a0 + (s.a1 - s.a0) * q
          c.beginPath()
          c.arc((s.c[0] + 0.5 + run.offX) * dpr, (s.c[1] + 0.5 + run.offY) * dpr, s.r * dpr, from, to, s.a1 < s.a0)
          c.stroke()
          from = to
        }
      }
      // inside a demo that clips (rounded corners), what's traced is clipped the same way; the lead comes in from outside
      const clips = getComputedStyle(node).overflow !== 'visible'
      const etch = (s: Seg, inside: boolean) => {
        const draw = stroke(s)
        if (!clips || !inside) return draw
        return (c: CanvasRenderingContext2D, q: number) => {
          c.save()
          c.beginPath()
          c.roundRect(run.offX * dpr, run.offY * dpr, W * dpr, plan.h * dpr, frame.r * dpr)
          c.clip()
          draw(c, q)
          c.restore()
        }
      }
      if (ctx) {
        ctx.fillStyle = ctx.strokeStyle = ink
        ctx.lineWidth = lw
      }
      /** The signal along a path from `t` at `speed` px/ms: a head that runs it and the path etched behind it. */
      const signal = (path: Seg[], t: number, speed: number, inside = true) => {
        const L = total(path)
        if (L < 1) return
        const frames: Keyframe[] = []
        const key = (s: Seg, f: number, sofar: number) => {
          const [x, y, deg] = along(s, f)
          // float sums can land a hair behind the previous keyframe; offsets must never decrease
          frames.push({
            offset: Math.max(frames.length ? (frames[frames.length - 1]!.offset as number) : 0, Math.min(1, sofar / L)),
            transform: `translate(${(run.offX + x + 0.5).toFixed(2)}px,${(run.offY + y + 0.5).toFixed(2)}px) rotate(${deg.toFixed(1)}deg)`,
          })
        }
        let sofar = 0
        for (const s of path) {
          const n = lengthOf(s)
          if (ctx) run.mark(ctx, t + sofar / speed, n / speed, etch(s, inside), 'linear')
          // the head turns at a square corner in one step (two keyframes at one offset) and follows an arc in a few
          const steps = 'c' in s ? Math.max(2, Math.ceil(n / 3)) : 1
          for (let i = 0; i <= steps; i++) key(s, i / steps, sofar + (n * i) / steps)
          sofar += n
        }
        run.later(t, () => {
          const head = document.createElement('i')
          head.className = 'yj-en-l yj-tr-h'
          root.append(head)
          run.animate(head, frames, { delay: t, duration: L / speed, easing: 'linear' })
          run.animate(head, [{ opacity: 0 }, { opacity: 1, offset: Math.min(0.2, 40 / L) }, { opacity: 1, offset: 0.85 }, { opacity: 0 }], {
            delay: t,
            duration: L / speed,
            easing: 'linear',
          })
        })
      }
      /** An element appears as the signal reaches it: held until then, then a fade that replaces the hold. */
      const appear = (el: Element, t: number, d: number) => {
        run.hold(el)
        run.later(t, () => {
          run.animate(el, [{ opacity: 0 }, { opacity: 1 }], { delay: t, duration: d, easing: standard })
          run.release(el)
        })
      }

      // ── Enter: in from beside the frame along its top edge, then both ways round its border; the frame fills in behind ──
      const f = edges(frame)
      const lead = mirror(line([f.l - LEAD, f.t], [f.l + f.r, f.t]))
      const enterSpeed = (total(lead) + total(border(frame)) / 2) / Math.max(1, e1 - e0)
      signal(lead, e0, enterSpeed, false)
      const inAt = e0 + total(lead) / enterSpeed
      for (const way of around(frame)) signal(way, inAt, enterSpeed)
      run.animate(node, [{ opacity: 0 }, { opacity: 1 }], { delay: inAt, duration: Math.max(1, e1 - inAt), easing: standard })

      // ── Spread: down the tree, every branch at once; a panel fills in as its border is traced, a piece lights ──
      for (const n of [...boxes, ...leaves]) signal(route(n.parent!, n), s0 + n.parent!.dist / v, v)
      for (const b of boxes) {
        for (const way of around(b)) signal(way, at(b), v)
        if (b.el) appear(b.el, at(b), Math.max(ms('slow'), total(border(b)) / 2 / v))
      }
      for (const n of leaves) {
        const p = n.piece!
        const t = at(n)
        appear(p.el, t + ms('instant') * 0.5, light)
        // type glows round its words with a little air; a box glows on its own edge
        const pad = p.kind === 'text' ? 3 : 0
        run.later(t, () => {
          const glow = document.createElement('i')
          glow.className = 'yj-en-l yj-tr-g'
          glow.style.cssText = `left:${(run.offX + p.x - pad).toFixed(2)}px;top:${(run.offY + p.y - pad / 2).toFixed(2)}px;width:${(p.w + 2 * pad).toFixed(2)}px;height:${(p.h + pad).toFixed(2)}px;border-radius:${pad ? 4 : n.r}px`
          root.append(glow)
          run.animate(glow, [{ opacity: 0 }, { opacity: 1, offset: 0.15 }, { opacity: 0 }], { delay: t, duration: ms('slow'), easing: 'linear' })
        })
      }

      // ── Settle: the etched path fades; what floats (an open popover) fades in ──
      const [c0] = span.settle
      if (ctx)
        run.animate(ctx.canvas, [{ opacity: ETCH }, { opacity: 0 }], {
          delay: c0,
          duration: Math.max(1, T - c0),
          easing: run.bezier('exit'),
          fill: 'forwards',
        })
      for (const el of plan.floating)
        run.animate(el, [{ opacity: 0 }, { opacity: 1 }], { delay: c0, duration: ms('slow'), easing: run.bezier('enter') })
    },
  })
}
