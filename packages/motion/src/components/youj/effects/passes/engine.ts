import { renderPassesLabels } from '@youj/core/labels'
import { pen } from '../entrance/draw'
import { reader } from '../entrance/facts'
import { drawn, handoff, type Drawn } from '../entrance/pieces'
import type { Box, Part } from '../entrance/read'
import { entrance, spread, type Draw, type EntranceOptions, type EntranceRun } from '../entrance/run'

/* Render passes: the browser's pipeline played as theatre, three passes, each sweeping through the parts in build
 * order with its name and count over the demo (`layout 12/54`). Layout: every part as a 1px box in the info ink, with
 * its size. Paint: each box takes a flat grey and its text and icons set in grey, square, with no shadow or radius,
 * over its own layout box (a box with a fill covers what's inside it, as paint does, and its children paint again on
 * top). Composite: piece by piece, the real part, with its colour, radii, shadows and images, takes over. A look on
 * the shared entrance runtime (../entrance/run.ts).
 *
 * Each piece draws on its own canvas (../entrance/pieces.ts), so compositing it is one opacity animation. */

export type RenderPassesLabels = typeof renderPassesLabels

export interface RenderPassesOptions extends EntranceOptions {
  /** Each pass's share of the run. Default `{ layout: 30, paint: 30, composite: 40 }`. */
  phases?: { layout?: number; paint?: number; composite?: number }
  /** The passes' names. Default: Youj's English (translate through YoujProvider `labels`). */
  labels?: Partial<RenderPassesLabels>
}

const M = 28
type Pass = 'layout' | 'paint' | 'composite'

const CSS = `
.yj-rp-pass{top:6px;display:flex;gap:14px;font:500 10px/14px var(--font-mono);font-variant-numeric:tabular-nums;color:var(--color-fg-subtle);white-space:pre}
.yj-rp-pass b{font-weight:500}
.yj-rp-pass .yj-rp-on{color:var(--color-fg)}
.yj-rp-pass i{font-style:normal;display:inline-block;width:6px;height:6px;margin-inline-end:6px;border-radius:1px;border:1px solid currentColor;vertical-align:0}
.yj-rp-pass .yj-rp-on i,.yj-rp-pass .yj-rp-done i{background:currentColor}
`

const r0 = Math.round

export function renderPasses(node: HTMLElement, options: RenderPassesOptions = {}): EntranceRun {
  const L: RenderPassesLabels = { ...renderPassesLabels, ...options.labels }
  return entrance<Pass>(node, options, {
    name: 'passes',
    // fills by their token, the grey a fill paints in, and each text's words
    reader,
    css: CSS,
    margin: M,
    phases: { layout: 30, paint: 30, composite: 40 },
    // about 3 s for a card, 5 s for a screen
    length: (plan) => Math.min(10, Math.max(4, 2.5 + Math.sqrt(plan.w * plan.h) / 160 + plan.parts.length / 50)),
    play(run) {
      const { plan, W, H, rtl, span, ms, X, Y, dpr, lw, ts, root } = run
      const { outline, reveal, chain, both } = pen(run)
      const line = run.color('var(--color-info)')
      const grey = (n: number) => run.color(`color-mix(in oklab, var(--color-fg) ${r0(n)}%, var(--color-canvas))`)
      const greys = [grey(5), grey(12), grey(24), grey(48)]
      const text = grey(58)
      const edge = grey(22)
      const paper = run.color('var(--color-canvas)')
      const probe = document.createElement('i')
      probe.style.fontFamily = 'var(--font-mono)'
      root.append(probe)
      const mono = getComputedStyle(probe).fontFamily
      probe.remove()
      const font = `400 ${9 * ts * dpr}px ${mono}`

      const all = drawn(run, M, 2)
      const home = new Map<Part, Drawn>()
      for (const pc of all) for (const p of pc.parts) home.set(p, pc)
      const frame = all[0]!

      // ── The pass strip over the demo: each pass's name, the one running in ink with its count ──
      const strip = document.createElement('div')
      strip.className = 'yj-en-l yj-rp-pass'
      strip.dir = rtl ? 'rtl' : 'ltr'
      strip.style[rtl ? 'right' : 'left'] = `${M}px`
      const cells = (['layout', 'paint', 'composite'] as const).map((pass) => {
        const cell = document.createElement('span')
        const name = document.createElement('b')
        name.textContent = L[`renderPasses${pass[0]!.toUpperCase()}${pass.slice(1)}` as keyof RenderPassesLabels]
        const count = document.createElement('span')
        cell.append(document.createElement('i'), name, count)
        strip.append(cell)
        return { pass, cell, count }
      })
      root.append(strip)
      const started: Record<Pass, number[]> = { layout: [], paint: [], composite: [] }
      let shown = ''
      run.frame((t) => {
        let now: Pass = 'layout'
        for (const p of ['paint', 'composite'] as const) if (t >= span[p][0] && span[p][1] > span[p][0]) now = p
        const n = started[now].filter((s) => s <= t).length
        const key = `${now} ${n}`
        if (key === shown) return
        shown = key
        let done = true
        for (const c of cells) {
          const on = c.pass === now
          if (on) done = false
          c.cell.classList.toggle('yj-rp-on', on)
          c.cell.classList.toggle('yj-rp-done', done && !on)
          c.count.textContent = on ? ` ${n}/${started[now].length}` : ''
        }
      })
      run.animate(strip, [{ opacity: 0 }, { opacity: 1 }], { duration: ms('slow'), easing: run.bezier('enter') })
      run.animate(strip, [{ opacity: 1 }, { opacity: 0 }], { delay: run.T - ms('slow'), duration: ms('slow'), easing: run.bezier('exit'), fill: 'forwards' })

      // ── Layout: every box outlined, a text by its lines, with its size inside its corner when there's room ──
      const sizes = new Map<Part, Box>()
      const tag = (s: string, b: Box): Draw | undefined => {
        const c = frame.ctx
        if (!c) return undefined
        c.font = font
        const w = c.measureText(s).width / dpr + 6 * ts
        const h = 13 * ts
        if (b.w < w + 8 || b.h < h + 6) return undefined
        const x = rtl ? b.x + b.w - w - 2 : b.x + 2
        const box = { x, y: b.y + 2, w, h }
        let typed = 0
        return (ctx, q) => {
          const n = Math.ceil(s.length * q)
          if (n <= typed) return
          typed = n
          ctx.clearRect(X(box.x), Y(box.y), X(box.x + box.w) - X(box.x), Y(box.y + box.h) - Y(box.y))
          ctx.font = font
          ctx.fillStyle = line
          ctx.textBaseline = 'middle'
          ctx.textAlign = 'left'
          ctx.fillText(s.slice(0, n), X(box.x + 3 * ts), Y(box.y + h / 2) + r0(0.5 * dpr))
        }
      }
      const sized = (p: Box, s: string, part?: Part): Draw[] => {
        const draw = tag(s, p)
        if (draw && part) sizes.set(part, { x: p.x, y: p.y + 2, w: p.w, h: 13 * ts })
        return draw ? [draw] : []
      }
      const box = (p: Part): Box => (p.kind === 'text' && p.at ? p.at : p)
      const layoutOf = (p: Part): Draw => {
        const tint = (d: Draw): Draw => (ctx, q) => {
          ctx.fillStyle = line
          ctx.globalAlpha = p.kind === 'text' ? 0.5 : 0.75
          d(ctx, q)
          ctx.globalAlpha = 1
        }
        if (p.kind === 'text') return tint(chain(...p.lines!.map((l) => outline(l, 'solid'))))
        const b = box(p)
        return both(tint(outline(b, 'solid')), ...sized(b, `${r0(b.w)} × ${r0(b.h)}`, p))
      }
      const [l0, l1] = span.layout
      const lead = Math.min(ms('slow'), (l1 - l0) * 0.25)
      const outlineFrame = outline({ x: 0, y: 0, w: W, h: H }, 'solid')
      run.mark(frame.ctx, l0, lead * 1.5, (ctx, q) => {
        ctx.fillStyle = line
        outlineFrame(ctx, q)
      })
      const order = plan.parts
      spread(order, [l0 + lead, l1], (p, t, d) => {
        started.layout.push(t)
        run.mark(home.get(p)?.ctx ?? null, t, Math.max(d, ms('fast')), layoutOf(p))
      })

      // ── Paint: flat greys, square, over the layout; text, icons and charts in grey; borders as 1px grey lines ──
      const fillOf = (p: Part) => (p.tone === undefined ? undefined : greys[Math.min(3, Math.floor(p.tone * 4 + 0.6))])
      const paintOf = (p: Part): Draw => {
        const b = box(p)
        const fill = fillOf(p)
        const painted = reveal(b, fill !== undefined, (ctx) => {
          if (fill) {
            ctx.fillStyle = fill
            ctx.fillRect(b.x, b.y, b.w, b.h)
          }
          if (p.style.line && p.kind !== 'divider') {
            ctx.strokeStyle = edge
            ctx.lineWidth = 1
            ctx.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1)
          }
          if (p.kind === 'divider') {
            ctx.fillStyle = edge
            ctx.fillRect(b.x, p.edge === 'bottom' ? b.y + b.h - 1 : b.y, p.edge === 'left' || p.edge === 'right' ? 1 : b.w, p.edge === 'left' || p.edge === 'right' ? b.h : 1)
          }
          if (p.kind === 'text')
            for (const g of p.glyphs ?? []) {
              ctx.font = p.font!
              ctx.letterSpacing = p.spacing!
              ctx.direction = rtl ? 'rtl' : 'ltr'
              ctx.textAlign = rtl ? 'right' : 'left'
              ctx.textBaseline = 'alphabetic'
              ctx.fillStyle = p.light ? paper : text
              const descent = ctx.measureText(g.s).fontBoundingBoxDescent || g.h * 0.22
              ctx.fillText(g.s, rtl ? g.x + g.w : g.x, g.y + g.h - descent)
            }
          for (const sh of p.shapes ?? []) {
            ctx.save()
            ctx.transform(sh.m.a, sh.m.b, sh.m.c, sh.m.d, sh.m.e, sh.m.f)
            if (sh.fill) {
              ctx.fillStyle = text
              ctx.fill(sh.path)
            }
            if (sh.stroke) {
              ctx.lineWidth = sh.lw
              ctx.lineCap = sh.cap
              ctx.lineJoin = sh.join
              ctx.strokeStyle = text
              ctx.stroke(sh.path)
            }
            ctx.restore()
          }
        })
        // a box with no fill of its own: its layout outline and size go as it paints, unless a filled box around it on
        // the same canvas has painted over them already (erasing then would cut into that paint)
        const covered = home.get(p)?.parts.some((o) => o !== p && fillOf(o) !== undefined && o.el.contains(p.el))
        if (fill !== undefined || covered) return painted
        const size = sizes.get(p)
        let cleared = false
        return (ctx, q) => {
          if (!cleared) {
            cleared = true
            const lines = p.kind === 'text' ? p.lines! : [b]
            ctx.globalCompositeOperation = 'destination-out'
            for (const l of lines) {
              const x0 = X(l.x)
              const y0 = Y(l.y)
              const x1 = X(l.x + l.w)
              const y1 = Y(l.y + l.h)
              ctx.fillRect(x0, y0, x1 - x0, lw)
              ctx.fillRect(x0, y1 - lw, x1 - x0, lw)
              ctx.fillRect(x0, y0, lw, y1 - y0)
              ctx.fillRect(x1 - lw, y0, lw, y1 - y0)
            }
            if (size) ctx.fillRect(X(size.x), Y(size.y), X(size.x + size.w) - X(size.x), Y(size.y + size.h) - Y(size.y))
            ctx.globalCompositeOperation = 'source-over'
          }
          painted(ctx, q)
        }
      }
      const [p0, p1] = span.paint
      run.mark(
        frame.ctx,
        p0,
        lead * 1.5,
        reveal({ x: 0, y: 0, w: W, h: H }, true, (ctx) => {
          ctx.fillStyle = greys[0]!
          ctx.fillRect(0, 0, W, H)
          ctx.strokeStyle = edge
          ctx.lineWidth = 1
          ctx.strokeRect(0.5, 0.5, W - 1, H - 1)
        }),
        'linear',
      )
      // a box paints before anything inside it, as paint does (its fill would cover them): it moves up to its first
      // descendant's turn
      const first = new Map(order.map((p, i) => [p, i]))
      const depth = new Map(order.map((p) => [p, 0]))
      order.forEach((p, i) => {
        for (const o of order)
          if (o !== p && o.el.contains(p.el)) {
            first.set(o, Math.min(first.get(o)!, i))
            depth.set(p, depth.get(p)! + 1)
          }
      })
      const painting = [...order].sort((a, b) => first.get(a)! - first.get(b)! || depth.get(a)! - depth.get(b)!)
      spread(painting, [p0 + lead, p1], (p, t, d) => {
        started.paint.push(t)
        run.mark(home.get(p)?.ctx ?? null, t, Math.max(d, ms('fast')), paintOf(p), 'linear')
      })

      // ── Composite: the frame, then each piece in build order, hands over to the real part ──
      spread(all, span.composite, (pc, t, d) => {
        started.composite.push(t)
        handoff(run, pc, t, d)
      })
      for (const el of plan.floating)
        run.later(span.composite[0], () =>
          run.animate(el, [{ opacity: 0 }, { opacity: 1 }], { delay: span.composite[0], duration: ms('slow'), easing: run.bezier('enter') }),
        )
    },
  })
}
