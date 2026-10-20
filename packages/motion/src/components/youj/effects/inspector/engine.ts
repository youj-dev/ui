import { pen } from '../entrance/draw'
import { drawn, handoff } from '../entrance/pieces'
import type { Box, Part } from '../entrance/read'
import { entrance, spread, type EntranceOptions, type EntranceRun } from '../entrance/run'

/* Inspector: the demo appears first as the browser's box model, the way a devtools overlay shows it. Part by part, in
 * build order, each box lays down its margin, padding and content in three soft tints with a crisp edge, while a
 * hover highlight runs through the tree ahead of them: the full-strength box model with a mono size tag
 * (`div.stat 72 × 40`, `p 14/20`) and the element's path in a breadcrumb under the demo. Then each piece hands off to
 * the real part, the frame first. A look on the shared entrance runtime (../entrance/run.ts).
 *
 * The settled overlays are drawn once per piece on that piece's own canvas (../entrance/pieces.ts), so a hand-off is a
 * single opacity animation; the hover is one canvas redrawn only while it moves. */

export interface InspectorOptions extends EntranceOptions {
  /** Each stage's share of the run: the box models drawn in with the hover running through them, then the hand-off to
   *  the real parts. Default `{ inspect: 60, handoff: 40 }`. */
  phases?: { inspect?: number; handoff?: number }
}

const M = 28

type Quad = [number, number, number, number]
const r0 = Math.round
const grow = (b: Box, [t, r, bt, l]: Quad): Box => ({ x: b.x - l, y: b.y - t, w: b.w + l + r, h: b.h + t + bt })
const shrink = (b: Box, [t, r, bt, l]: Quad): Box => ({ x: b.x + l, y: b.y + t, w: Math.max(0, b.w - l - r), h: Math.max(0, b.h - t - bt) })
const mix = (a: Box, b: Box, q: number): Box => ({ x: a.x + (b.x - a.x) * q, y: a.y + (b.y - a.y) * q, w: a.w + (b.w - a.w) * q, h: a.h + (b.h - a.h) * q })

interface Model {
  /** A box that holds others is drawn by its edges and bands alone; only a leaf's content is tinted at rest, so nested
   *  tints never pile up into a muddy block. */
  leaf: boolean
  /** margin, border and content boxes */
  margin: Box
  border: Box
  content: Box
  tag: string
  path: string[]
}

export function inspector(node: HTMLElement, options: InspectorOptions = {}): EntranceRun {
  return entrance(node, options, {
    name: 'inspector',
    margin: M,
    phases: { inspect: 60, handoff: 40 },
    // about 3 s for a card, 5 s for a screen
    length: (plan) => Math.min(10, Math.max(4, 2.5 + Math.sqrt(plan.w * plan.h) / 160 + plan.parts.length / 50)),
    play(run) {
      const { plan, W, H, rtl, span, ms, X, Y, dpr, lw, ts, root } = run
      // content in the theme's info ink, padding in whichever of success and warning sits farther from it (an amber
      // accent makes info amber), the margin hatched in a neutral, as a box's outside
      const content = run.color('var(--color-info)')
      const success = run.color('var(--color-success)')
      const warning = run.color('var(--color-warning)')
      const padding = apart(hueOf(content), hueOf(success)) >= apart(hueOf(content), hueOf(warning)) ? success : warning
      const ink = run.color('var(--color-fg)')
      const muted = run.color('var(--color-fg-muted)')
      const paper = run.color('var(--color-canvas)')
      const { pattern } = pen(run)
      // the hover's canvas; it moves on top of the pieces' once they're made
      const hc = run.canvas()
      const margin =
        pattern(hc, 6, (t, n) => {
          t.strokeStyle = muted
          t.lineWidth = Math.max(1, dpr * 0.75)
          t.beginPath()
          t.moveTo(-1, n + 1)
          t.lineTo(n + 1, -1)
          t.stroke()
        }) ?? muted
      const probe = document.createElement('i')
      probe.style.fontFamily = 'var(--font-mono)'
      root.append(probe)
      const mono = getComputedStyle(probe).fontFamily
      probe.remove()

      // ── Every box's model, read now, before the clock: margins (what the plan doesn't keep), padding, its tag ──
      const px = (v: string) => Math.max(0, Math.min(M, Number.parseFloat(v) || 0))
      const nameOf = (el: Element) => {
        const slot = el.getAttribute('data-slot')
        return el.localName + (slot ? `.${slot}` : el.id ? `#${el.id}` : '')
      }
      const pathOf = (el: Element) => {
        const out: string[] = []
        for (let a: Element | null = el; a && out.length < 6; a = a === node ? null : a.parentElement) out.unshift(nameOf(a))
        return out
      }
      const modelOf = (el: Element, border: Box, pad: Quad, tag: string, leaf: boolean): Model => {
        const cs = getComputedStyle(el)
        const bw = [cs.borderTopWidth, cs.borderRightWidth, cs.borderBottomWidth, cs.borderLeftWidth].map(px) as Quad
        return {
          leaf,
          margin: grow(border, [cs.marginTop, cs.marginRight, cs.marginBottom, cs.marginLeft].map(px) as Quad),
          border,
          content: shrink(shrink(border, bw), pad),
          tag,
          path: pathOf(el),
        }
      }
      const models = new Map<Part, Model>()
      for (const p of plan.parts) {
        const box = p.kind === 'text' && p.at ? p.at : p
        const tag = p.kind === 'text' && p.type ? `${nameOf(p.el)} ${r0(p.type.fs)}/${r0(p.type.lh)}` : `${nameOf(p.el)} ${r0(p.w)} × ${r0(p.h)}`
        models.set(p, modelOf(p.el, box, p.style.pad, tag, !/^(surface|row)$/.test(p.kind)))
      }
      const frame = modelOf(node, { x: 0, y: 0, w: W, h: H }, plan.style.pad, `${nameOf(node)} ${r0(W)} × ${r0(H)}`, false)

      // ── Drawing a box model: the margin, padding and content bands in their tints, each edge 1px on whole pixels ──
      const rect = (ctx: CanvasRenderingContext2D, b: Box) => ctx.rect(X(b.x), Y(b.y), X(b.x + b.w) - X(b.x), Y(b.y + b.h) - Y(b.y))
      const band = (ctx: CanvasRenderingContext2D, outer: Box, inner: Box, style: string | CanvasPattern, alpha: number) => {
        ctx.beginPath()
        rect(ctx, outer)
        rect(ctx, inner)
        ctx.fillStyle = style
        ctx.globalAlpha = alpha
        ctx.fill('evenodd')
      }
      const edge = (ctx: CanvasRenderingContext2D, b: Box, style: string, alpha: number) => {
        const x0 = X(b.x)
        const y0 = Y(b.y)
        const x1 = Math.max(x0 + lw, X(b.x + b.w))
        const y1 = Math.max(y0 + lw, Y(b.y + b.h))
        ctx.globalAlpha = alpha
        ctx.fillStyle = style
        ctx.fillRect(x0, y0, x1 - x0, lw)
        ctx.fillRect(x0, y1 - lw, x1 - x0, lw)
        ctx.fillRect(x0, y0, lw, y1 - y0)
        ctx.fillRect(x1 - lw, y0, lw, y1 - y0)
      }
      /** `s` 0 to 1: a settled box (soft) to the hovered one (full strength). */
      const paintModel = (ctx: CanvasRenderingContext2D, m: Model, s: number) => {
        band(ctx, m.margin, m.border, margin, 0.3 + 0.4 * s)
        band(ctx, m.border, m.content, padding, 0.07 + 0.25 * s)
        ctx.beginPath()
        rect(ctx, m.content)
        ctx.fillStyle = content
        ctx.globalAlpha = (m.leaf ? 0.07 : 0) + 0.28 * s
        ctx.fill()
        if (s) {
          edge(ctx, m.margin, muted, 0.6)
          edge(ctx, m.content, content, 0.9)
        }
        edge(ctx, m.border, content, 0.4 + 0.55 * s)
        ctx.globalAlpha = 1
      }

      // ── Inspect: every box lays down its model in build order, from its reading corner ──
      const all = drawn(run, M, M)
      const piece = new Map<Part, (typeof all)[number]>()
      for (const pc of all) for (const p of pc.parts) piece.set(p, pc)
      const [i0, i1] = span.inspect
      const lead = Math.min(ms('slow'), (i1 - i0) * 0.2)
      const drawIn = (ctx: CanvasRenderingContext2D | null, m: Model, t: number, d: number) => {
        // a model wipes in across its margin box in the reading direction, a slice a frame, painted once off screen
        const b = m.margin
        const x0 = X(b.x) - 1
        const x1 = X(b.x + b.w) + 1
        let at = rtl ? x1 : x0
        let off: HTMLCanvasElement | undefined
        run.mark(
          ctx,
          t,
          d,
          (c, q) => {
            const to = r0(rtl ? x1 - (x1 - x0) * q : x0 + (x1 - x0) * q)
            const lo = Math.min(at, to)
            const hi = Math.max(at, to)
            if (hi <= lo) return
            if (!off) {
              off = document.createElement('canvas')
              off.width = Math.max(1, X(b.x + b.w) - X(b.x) + 2)
              off.height = Math.max(1, Y(b.y + b.h) - Y(b.y) + 2)
              const o = off.getContext('2d')
              if (o) {
                o.translate(1 - X(b.x), 1 - Y(b.y))
                paintModel(o, m, 0)
              }
            }
            c.drawImage(off, lo - x0, 0, hi - lo, off.height, lo, Y(b.y) - 1, hi - lo, off.height)
            at = to
            if (q >= 1) off = undefined
          },
          'standard',
        )
      }
      drawIn(all[0]!.ctx, frame, i0, lead * 2)
      const order = plan.parts
      const times = new Map<Part, number>()
      spread(order, [i0 + lead, i1], (p, t, d) => {
        times.set(p, t)
        drawIn(piece.get(p)?.ctx ?? null, models.get(p)!, t, Math.max(d, ms('base')))
      })

      // ── The hover: it runs through the tree ahead of the drawing, resting long enough on a part to read its tag ──
      if (hc) root.append(hc.canvas)
      const stops: { t: number; m: Model }[] = [{ t: i0, m: frame }]
      const worth = order.filter((p) => !p.quiet && p.w >= 12 && p.h >= 10)
      // the hover rests on a part a little longer than a base beat, so its tag can be read
      const count = Math.max(1, Math.min(worth.length, Math.floor((i1 - i0 - lead) / (ms('base') * 1.2))))
      // evenly in time, each on the part being drawn then, so the hover keeps pace with the drawing to its end
      let w = 0
      for (let k = 0; k < count; k++) {
        const at = i0 + lead + ((k + 0.5) * (i1 - i0 - lead)) / count
        while (w + 1 < worth.length && times.get(worth[w + 1]!)! <= at) w++
        const p = worth[w]!
        if (stops[stops.length - 1]!.m !== models.get(p)) stops.push({ t: Math.max(at, times.get(p)!), m: models.get(p)! })
      }
      const glide = run.ease('standard')
      const move = Math.min(ms('fast'), (i1 - i0) / (count + 1) / 2)
      const font = (sz: number, weight = 400) => `${weight} ${sz * ts * dpr}px ${mono}`
      let last = ''
      run.frame((t) => {
        if (!hc || t > i1) return
        let i = 0
        while (i + 1 < stops.length && stops[i + 1]!.t <= t) i++
        const s = stops[i]!
        const from = stops[Math.max(0, i - 1)]!.m
        const q = i ? glide(Math.min(1, (t - s.t) / move)) : 1
        const key = `${i} ${q}`
        if (key === last) return
        last = key
        hc.clearRect(0, 0, hc.canvas.width, hc.canvas.height)
        // the tag and path change halfway across, as the hover passes from one box to the next
        hover(hc, { ...(q < 0.5 ? from : s.m), margin: mix(from.margin, s.m.margin, q), border: mix(from.border, s.m.border, q), content: mix(from.content, s.m.content, q) })
      })
      // the hover leaves as the hand-off starts
      if (hc) run.animate(hc.canvas, [{ opacity: 1 }, { opacity: 0 }], { delay: i1, duration: ms('fast'), easing: run.bezier('exit'), fill: 'forwards' })

      /** The hover: the box model at full strength, its tag on a plate above it (below when there's no room), and the
       *  element's path under the demo, the element itself in ink. */
      function hover(ctx: CanvasRenderingContext2D, m: Model) {
        paintModel(ctx, m, 1)
        const [name, ...rest] = m.tag.split(' ')
        const dims = rest.join(' ')
        ctx.textBaseline = 'middle'
        ctx.textAlign = 'left'
        ctx.font = font(10, 600)
        const nw = ctx.measureText(name!).width
        ctx.font = font(10)
        const dw = ctx.measureText(dims).width
        const gap = r0(6 * ts * dpr)
        const pad = r0(5 * ts * dpr)
        const h = r0(16 * ts * dpr)
        const w = r0(nw + gap + dw + pad * 2)
        let top = Y(m.margin.y) - h - r0(3 * dpr)
        if (top < r0(2 * dpr)) top = Y(m.margin.y + m.margin.h) + r0(3 * dpr)
        const left = Math.max(r0(2 * dpr), Math.min(X(W + M) - w - r0(2 * dpr), rtl ? X(m.border.x + m.border.w) - w : X(m.border.x)))
        ctx.fillStyle = ink
        ctx.beginPath()
        ctx.roundRect(left, top, w, h, 3 * dpr)
        ctx.fill()
        const mid = top + h / 2 + r0(0.5 * dpr)
        ctx.fillStyle = paper
        ctx.font = font(10, 600)
        ctx.fillText(name!, left + pad, mid)
        ctx.font = font(10)
        ctx.globalAlpha = 0.7
        ctx.fillText(dims, left + pad + nw + gap, mid)
        // the path reads left to right in any language: it's code
        const y = Y(H + M / 2)
        const sep = '  ›  '
        const widths = m.path.map((s) => ctx.measureText(s).width)
        const sw = ctx.measureText(sep).width
        let x = rtl ? X(W) - widths.reduce((a, b) => a + b + sw, -sw) : X(0)
        m.path.forEach((s, i) => {
          const self = i === m.path.length - 1
          ctx.globalAlpha = 1
          ctx.fillStyle = self ? ink : muted
          ctx.fillText(s, x, y)
          x += widths[i]!
          if (self) return
          ctx.globalAlpha = 0.5
          ctx.fillText(sep, x, y)
          x += sw
        })
        ctx.globalAlpha = 1
      }

      // ── Hand-off: the frame first, then each piece in build order; the real part fades in under its model ──
      spread(all, span.handoff, (pc, t, d) => handoff(run, pc, t, d))
      for (const el of plan.floating)
        run.later(span.handoff[0], () =>
          run.animate(el, [{ opacity: 0 }, { opacity: 1 }], { delay: span.handoff[0], duration: ms('slow'), easing: run.bezier('enter') }),
        )
    },
  })
}

/** A colour's hue in degrees, read through a 1px canvas (any CSS colour the overlay resolved). */
function hueOf(color: string) {
  const c = document.createElement('canvas')
  c.width = c.height = 1
  const ctx = c.getContext('2d', { willReadFrequently: true })
  if (!ctx) return 0
  ctx.fillStyle = color
  ctx.fillRect(0, 0, 1, 1)
  const [r = 0, g = 0, b = 0] = ctx.getImageData(0, 0, 1, 1).data
  return (Math.atan2(Math.sqrt(3) * (g - b), 2 * r - g - b) * 180) / Math.PI
}
const apart = (a: number, b: number) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b))
