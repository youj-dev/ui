import type { Box, Part, Plan } from './read'
import type { Run } from './run'

/** The parts a look brings in one at a time, in build order, and the shells that hold them. A piece is the outermost
 *  part of its branch that is small enough to read as one (at most `share` of the demo: a field, a stat card, a row)
 *  or has no parts inside it (a large chart, an image); what's inside a piece comes with it. The parts left over are
 *  shells: the panels and cards too big to be a piece, which hold pieces. Unlike `units` (./read.ts), nothing is left
 *  to a wipe, so a look can bring in every part of the demo. */
export function pieces(plan: Plan, node: Element, share = 0.08) {
  const limit = plan.w * plan.h * share
  // every element that holds a part: a part that isn't one of them is a leaf
  const holds = new Set<Element>()
  for (const p of plan.parts) for (let a = p.el.parentElement; a && a !== node && !holds.has(a); a = a.parentElement) holds.add(a)
  const chosen = new Set<Element>()
  for (const p of plan.parts) {
    // text that holds parts (a label around its field) comes as one piece: its words would otherwise show early
    if (chosen.has(p.el) || (p.w * p.h > limit && holds.has(p.el) && p.kind !== 'text')) continue
    let inside = false
    for (let a = p.el.parentElement; a && a !== node && !inside; a = a.parentElement) inside = chosen.has(a)
    if (inside) continue
    for (const u of [...chosen]) if (p.el.contains(u)) chosen.delete(u)
    chosen.add(p.el)
  }
  const list: Part[] = []
  const shells: Part[] = []
  const seen = new Set<Element>()
  for (const p of plan.parts) {
    if (seen.has(p.el)) continue
    seen.add(p.el)
    if (chosen.has(p.el)) list.push(p)
    else if (![...chosen].some((u) => u.contains(p.el))) shells.push(p)
  }
  /** Every part drawn as part of a piece (its own, and those inside it), largest first. */
  const within = (piece: Part) => plan.parts.filter((q) => piece.el.contains(q.el)).sort((a, b) => b.w * b.h - a.w * a.h)
  return { pieces: list, shells, within }
}

/* For looks that draw every part over the demo and then hand each piece to the real part (Inspector, Render passes):
 * each piece draws on a canvas of its own, so its hand-off is one opacity animation on that canvas, with no redraw,
 * and a piece's drawing goes without touching its neighbours'. */

export interface Drawn {
  /** What arrives: the demo for the first piece, then each unit's element. */
  el: Element
  /** The parts drawn on its canvas, in build order. */
  parts: Part[]
  /** Its canvas, drawn on in the run's coordinates (`X`, `Y`, the pen); null without canvas support. */
  ctx: CanvasRenderingContext2D | null
}

/** The demo's pieces (`pieces` above) as drawings, in build order: first the demo itself, with its shells (the boxes
 *  too big to be a piece) and its own paint, then each piece with everything inside it, each on a canvas just over its
 *  extent, and each held hidden until its hand-off. `margin` is the look's; `reach` (CSS px) is how far a drawing may
 *  run past its parts (a label above it, a margin band). */
export function drawn(run: Run<string>, margin: number, reach: number): Drawn[] {
  const { node, plan, X, Y, dpr, root } = run
  const list = pieces(plan, node).pieces
  const own = new Map<Element, Part[]>(list.map((u) => [u.el, []]))
  const first: Part[] = []
  for (const p of plan.parts) {
    let home: Element | undefined
    for (let el: Element | null = p.el; el && el !== node && !home; el = el.parentElement) if (own.has(el)) home = el
    ;(home ? own.get(home)! : first).push(p)
  }
  const maxX = Math.round((run.W + 2 * margin) * dpr)
  const maxY = Math.round((run.H + 2 * margin) * dpr)
  const canvas = (b: Box) => {
    const x0 = Math.max(0, X(b.x - reach) - 1)
    const y0 = Math.max(0, Y(b.y - reach) - 1)
    const x1 = Math.min(maxX, X(b.x + b.w + reach) + 1)
    const y1 = Math.min(maxY, Y(b.y + b.h + reach) + 1)
    if (x1 <= x0 || y1 <= y0) return null
    const c = document.createElement('canvas')
    c.className = 'yj-en-l'
    c.dir = 'ltr'
    c.width = x1 - x0
    c.height = y1 - y0
    c.style.cssText = `left:${x0 / dpr}px;top:${y0 / dpr}px;width:${c.width / dpr}px;height:${c.height / dpr}px`
    const ctx = c.getContext('2d')
    if (!ctx) return null
    // drawn in the overlay's device pixels, like a full-size canvas
    ctx.translate(-x0, -y0)
    ctx.clearRect(x0, y0, 1, 1)
    root.append(c)
    return ctx
  }
  run.hold(node)
  const out: Drawn[] = [{ el: node, parts: first, ctx: run.canvas() }]
  for (const u of list) {
    const parts = own.get(u.el)!
    // a text's own box can be wider than its lines
    const boxes = parts.map((p) => p.at ?? p)
    const x = Math.min(...boxes.map((b) => b.x))
    const y = Math.min(...boxes.map((b) => b.y))
    const w = Math.max(...boxes.map((b) => b.x + b.w)) - x
    const h = Math.max(...boxes.map((b) => b.y + b.h)) - y
    run.hold(u.el)
    out.push({ el: u.el, parts, ctx: canvas({ x, y, w, h }) })
  }
  return out
}

/** Hands a piece to the real part at `t` over `d`: the part fades in under its drawing, then the drawing fades off it,
 *  so the two never dim each other halfway. */
export function handoff(run: Run<string>, piece: Drawn, t: number, d: number) {
  run.later(t, () => {
    run.animate(piece.el, [{ opacity: 0 }, { opacity: 1 }], { delay: t, duration: d * 0.6, easing: run.bezier('enter') })
    run.release(piece.el)
    if (piece.ctx)
      run.animate(piece.ctx.canvas, [{ opacity: 1 }, { opacity: 0 }], {
        delay: t + d * 0.3,
        duration: d * 0.7,
        easing: run.bezier('standard'),
        fill: 'forwards',
      })
  })
}
