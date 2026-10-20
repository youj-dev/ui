import { layersLabels } from '@youj/core/labels'
import { pen } from '../entrance/draw'
import { reader } from '../entrance/facts'
import type { Box, Part } from '../entrance/read'
import { entrance, spread, type EntranceOptions, type EntranceRun } from '../entrance/run'

/* Layers: the demo starts as an exploded isometric stack of its layers, the way a view-hierarchy debugger shows a
 * screen: the frame at the bottom, its regions above it, the boxes above those and the content (text, icons) on top,
 * each a thin outlined plane with its depth label. The planes come up one by one and their parts draw onto them in
 * build order; then the camera settles from the isometric angle to flat while the gaps close layer by layer, and each
 * plane hands over to the real parts it holds, the frame first. A look on the shared entrance runtime
 * (../entrance/run.ts).
 *
 * The planes are canvases in one preserve-3d stage on the overlay, moved by transform and opacity only; the parts are
 * drawn from the plan in their real fills, radii, borders, type and shapes, so the flat stack is already close to the
 * UI it hands over to. */

export type LayersLabels = typeof layersLabels

export interface LayersOptions extends EntranceOptions {
  /** Each stage's share of the run: the stack built up, its collapse to flat, the hand-over to the real parts. Default
   *  `{ stack: 45, collapse: 33, resolve: 22 }`. */
  phases?: { stack?: number; collapse?: number; resolve?: number }
  /** The layers' names on their depth labels. Default: Youj's English (translate through YoujProvider `labels`). */
  labels?: Partial<LayersLabels>
}

const M = 40
/** The lane (CSS px) on the leading side of the stack where the depth labels sit, clear of every plane. */
const LANE = 104
/** The camera: tilted back, turned a little, like an axonometric drawing. */
const TILT = 55
const TURN = 36
type Stage = 'stack' | 'collapse' | 'resolve'

const CSS = `
.yj-ly-stage,.yj-ly-plane{position:absolute;left:0;top:0;transform-style:preserve-3d;will-change:transform}
.yj-ly-plane{width:0;height:0}
.yj-ly-plane{will-change:transform,opacity}
.yj-ly-tag{position:absolute;font:500 10px/14px var(--font-mono);font-variant-numeric:tabular-nums;color:var(--color-fg-muted);white-space:pre;margin-top:-7px}
.yj-ly-tag b{font-weight:500;color:var(--color-fg)}
`

const r0 = Math.round

export function layers(node: HTMLElement, options: LayersOptions = {}): EntranceRun {
  const L: LayersLabels = { ...layersLabels, ...options.labels }
  return entrance<Stage>(node, options, {
    name: 'layers',
    // fills by their token, the grey a fill paints in, and each text's words
    reader,
    css: CSS,
    margin: M,
    phases: { stack: 45, collapse: 33, resolve: 22 },
    // about 3 s for a card, 5 s for a screen
    length: (plan) => Math.min(10, Math.max(5, 3 + Math.sqrt(plan.w * plan.h) / 180 + plan.parts.length / 60)),
    play(run) {
      const { node, plan, W, H, rtl, span, ms, dpr, root } = run
      const { reveal } = pen(run)
      const CW = W + 2 * M
      const CH = H + 2 * M
      const tokenColor = (name?: string) => (name ? run.color(`var(--color-${name})`) : undefined)
      const outline = run.color('var(--color-fg-subtle)')
      const ink = run.color('var(--color-fg)')
      const tone = (n: number) => run.color(`color-mix(in oklab, var(--color-fg) ${r0(n * 60)}%, var(--color-canvas))`)

      // ── The layers: the frame, the regions (by the surface that paints each, if one does), the boxes, the content ──
      const same = (a: Box, b: Box) => Math.abs(a.x - b.x) < 1 && Math.abs(a.y - b.y) < 1 && Math.abs(a.w - b.w) < 1 && Math.abs(a.h - b.h) < 1
      const regionParts = plan.parts.filter((p) => p.kind === 'surface' && plan.regions.some((r) => same(r, p)))
      const content = plan.parts.filter((p) => p.kind === 'text' || p.kind === 'icon')
      const boxes = plan.parts.filter((p) => !regionParts.includes(p) && !content.includes(p))
      const stack = [
        { name: L.layersFrame, count: `${r0(W)} × ${r0(H)}`, parts: [] as Part[], frame: true },
        { name: L.layersRegions, count: String(plan.regions.length), parts: regionParts, frame: false },
        { name: L.layersBoxes, count: String(boxes.length), parts: boxes, frame: false },
        { name: L.layersContent, count: String(content.length), parts: content, frame: false },
      ].filter((l, i) => l.frame || (i === 1 ? plan.regions.length : l.parts.length))
      const n = stack.length

      // ── The camera and the gap between planes, fitted so the exploded stack stays inside the overlay ──
      const gap = Math.max(36, Math.min(110, Math.min(W, H) * 0.2))
      const P = Math.max(W, H) * 3
      const turn = rtl ? TURN : -TURN
      const project = (s: number) => {
        // without DOMMatrix (a test DOM) the stack just stays at full size
        if (typeof DOMMatrix !== 'function') return { w: CW - 16, h: CH - 16, cx: 0, cy: 0 }
        const m = new DOMMatrix().scaleSelf(s, s, s).rotateSelf(TILT, 0, 0).rotateSelf(0, 0, turn)
        let x0 = Infinity
        let y0 = Infinity
        let x1 = -Infinity
        let y1 = -Infinity
        for (const z of [0, (n - 1) * gap])
          for (const [x, y] of [
            [-W / 2, -H / 2],
            [W / 2, -H / 2],
            [W / 2, H / 2],
            [-W / 2, H / 2],
          ]) {
            const p = m.transformPoint(new DOMPoint(x, y, z))
            const k = P / (P - p.z)
            x0 = Math.min(x0, p.x * k)
            x1 = Math.max(x1, p.x * k)
            y0 = Math.min(y0, p.y * k)
            y1 = Math.max(y1, p.y * k)
          }
        return { w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 }
      }
      let s = 1
      for (let i = 0; i < 3; i++) {
        const b = project(s)
        s *= Math.min((CW - 16 - LANE) / b.w, (CH - 16) / b.h)
      }
      s = Math.min(1, s)
      const fit = project(s)
      // the stack moves off the lane by half its width, so stack and labels together sit centred
      const dx = (rtl ? -LANE : LANE) / 2 - fit.cx
      const camera = (on: number) =>
        `translate(${(dx * on).toFixed(2)}px, ${(-fit.cy * on).toFixed(2)}px) perspective(${r0(P)}px) scale3d(${1 + (s - 1) * on}, ${1 + (s - 1) * on}, ${1 + (s - 1) * on}) rotateX(${TILT * on}deg) rotateZ(${turn * on}deg)`

      const stage = document.createElement('div')
      stage.className = 'yj-ly-stage'
      stage.style.cssText = `width:${CW}px;height:${CH}px;transform-origin:${M + W / 2}px ${M + H / 2}px`
      root.append(stage)

      // ── Each plane: its canvas, a faint sheet with a 1px edge, its parts in their real fills, type and shapes ──
      const planes = stack.map((layer) => {
        const el = document.createElement('div')
        el.className = 'yj-ly-plane'
        stage.append(el)
        // each plane's canvas covers the demo only (not the overlay's margin): four planes in 3D are the run's biggest
        // cost to composite, so every pixel left out of them counts
        const x0 = run.X(0) - 1
        const y0 = run.Y(0) - 1
        const c = document.createElement('canvas')
        c.className = 'yj-en-l'
        c.dir = 'ltr'
        c.width = run.X(W) + 1 - x0
        c.height = run.Y(H) + 1 - y0
        c.style.cssText = `left:${x0 / dpr}px;top:${y0 / dpr}px;width:${c.width / dpr}px;height:${c.height / dpr}px`
        const ctx = c.getContext('2d')
        ctx?.translate(-x0, -y0)
        if (ctx) el.append(c)
        return { ...layer, el, ctx }
      })

      // ── The depth labels, flat, in their own lane: each beside its plane's leading corner, where no plane reaches ──
      const corner = (z: number) => {
        let best: [number, number] | undefined
        if (typeof DOMMatrix !== 'function') return [M, M] as const
        const m = new DOMMatrix().scaleSelf(s, s, s).rotateSelf(TILT, 0, 0).rotateSelf(0, 0, turn)
        for (const [x, y] of [
          [-W / 2, -H / 2],
          [W / 2, -H / 2],
          [W / 2, H / 2],
          [-W / 2, H / 2],
        ]) {
          const p = m.transformPoint(new DOMPoint(x, y, z))
          const k = P / (P - p.z)
          const at: [number, number] = [M + W / 2 + dx + p.x * k, M + H / 2 - fit.cy + p.y * k]
          if (!best || (rtl ? at[0] > best[0] : at[0] < best[0])) best = at
        }
        return best!
      }
      const tags = stack.map((layer, i) => {
        const tag = document.createElement('span')
        tag.className = 'yj-en-l yj-ly-tag'
        tag.dir = rtl ? 'rtl' : 'ltr'
        const [x, y] = corner(i * gap)
        tag.style.top = `${y.toFixed(1)}px`
        if (rtl) tag.style.left = `${(x + 10).toFixed(1)}px`
        else tag.style.right = `${(CW - x + 10).toFixed(1)}px`
        const zi = document.createElement('b')
        zi.textContent = `z${i}`
        tag.append(zi, `  ${layer.name}  ${layer.count}`)
        root.append(tag)
        return tag
      })

      const rounded = (ctx: CanvasRenderingContext2D, b: Box, r: number) => {
        ctx.beginPath()
        ctx.roundRect(b.x, b.y, b.w, b.h, Math.min(r, b.w / 2, b.h / 2))
      }
      const sheet = (ctx: CanvasRenderingContext2D, solid: boolean) => {
        ctx.fillStyle = solid ? (tokenColor(plan.style.fill) ?? run.color('var(--color-canvas)')) : ink
        ctx.globalAlpha = solid ? 1 : 0.03
        rounded(ctx, { x: 0, y: 0, w: W, h: H }, plan.style.radius)
        ctx.fill()
        ctx.globalAlpha = 1
        rounded(ctx, { x: 0.5 / dpr, y: 0.5 / dpr, w: W - 1 / dpr, h: H - 1 / dpr }, plan.style.radius)
        ctx.strokeStyle = outline
        ctx.lineWidth = 1 / dpr
        ctx.stroke()
      }
      /** A part as the UI paints it, in the demo's CSS px. */
      const paint = (p: Part) => (ctx: CanvasRenderingContext2D) => {
        if (p.kind === 'text') {
          ctx.font = p.font!
          ctx.letterSpacing = p.spacing!
          ctx.direction = rtl ? 'rtl' : 'ltr'
          ctx.textAlign = rtl ? 'right' : 'left'
          ctx.textBaseline = 'alphabetic'
          ctx.fillStyle = tokenColor(p.style.ink) ?? ink
          for (const g of p.glyphs ?? []) {
            const descent = ctx.measureText(g.s).fontBoundingBoxDescent || g.h * 0.22
            ctx.fillText(g.s, rtl ? g.x + g.w : g.x, g.y + g.h - descent)
          }
          return
        }
        const fill = p.kind === 'media' ? tone(0.25) : (tokenColor(p.style.fill) ?? (p.tone !== undefined ? tone(p.tone) : undefined))
        const line = tokenColor(p.style.line)
        if (p.kind === 'divider') {
          ctx.fillStyle = line ?? outline
          const across = p.edge === 'left' || p.edge === 'right'
          ctx.fillRect(p.edge === 'right' ? p.x + p.w - 1 : p.x, p.edge === 'bottom' ? p.y + p.h - 1 : p.y, across ? 1 : p.w, across ? p.h : 1)
          return
        }
        const radius = p.round ? p.w / 2 : p.style.radius
        if (fill) {
          rounded(ctx, p, radius)
          ctx.fillStyle = fill
          ctx.fill()
        }
        if (line) {
          rounded(ctx, { x: p.x + 0.5, y: p.y + 0.5, w: p.w - 1, h: p.h - 1 }, Math.max(0, radius - 0.5))
          ctx.strokeStyle = line
          ctx.lineWidth = 1
          ctx.stroke()
        }
        const stroke = tokenColor(p.style.ink) ?? ink
        for (const sh of p.shapes ?? []) {
          ctx.save()
          ctx.transform(sh.m.a, sh.m.b, sh.m.c, sh.m.d, sh.m.e, sh.m.f)
          if (sh.fill) {
            // a chart's many fills sit lighter than its ink (the plan keeps no opacity), as most charts draw them
            ctx.globalAlpha = p.kind === 'chart' ? 0.5 : 1
            ctx.fillStyle = stroke
            ctx.fill(sh.path)
            ctx.globalAlpha = 1
          }
          if (sh.stroke) {
            ctx.lineWidth = sh.lw
            ctx.lineCap = sh.cap
            ctx.lineJoin = sh.join
            ctx.strokeStyle = stroke
            ctx.stroke(sh.path)
          }
          ctx.restore()
        }
      }

      // ── Stack: the planes come up one by one, each drawing its parts in build order as it arrives ──
      const [s0, s1] = span.stack
      const [c0, c1] = span.collapse
      const step = n > 1 ? (s1 - s0) / (n * 0.7 + 0.3) : s1 - s0
      const rise = Math.min(ms('slow'), step * 0.8)
      const z = (i: number) => i * gap
      planes.forEach((pl, i) => {
        const a = s0 + i * step * 0.7
        const draws = Math.max(a + rise * 0.4, a + step)
        if (pl.ctx) {
          const b = { x: 0, y: 0, w: W, h: H }
          run.mark(pl.ctx, a, rise, reveal(b, false, (ctx) => sheet(ctx, pl.frame)), 'standard')
          spread(pl.parts, [a + rise * 0.4, Math.min(s1, draws)], (p, t, d) => {
            const box = p.kind === 'text' && p.at ? { x: p.at.x - 2, y: p.at.y - 2, w: p.at.w + 4, h: p.at.h + 4 } : { x: p.x - 1, y: p.y - 1, w: p.w + 2, h: p.h + 2 }
            run.mark(pl.ctx, t, Math.max(d, ms('fast')), reveal(box, false, paint(p)), 'standard')
          })
        }
        // one transform animation per plane, from rising into place to landing flat: gaps close bottom first, one per
        // stretch of the collapse, so the stack folds down layer by layer
        const T = c1 - a
        const at = (t: number) => Math.min(1, Math.max(0, (t - a) / T))
        const seg = n > 1 ? (c1 - c0) / (n - 1) : c1 - c0
        const frames: Keyframe[] = [
          { offset: 0, opacity: 0, transform: `translateZ(${z(i) - gap * 0.5}px)` },
          { offset: at(a + rise), opacity: 1, transform: `translateZ(${z(i)}px)`, easing: 'linear' },
          { offset: at(c0), transform: `translateZ(${z(i)}px)`, easing: run.bezier('standard') },
        ]
        for (let j = 1; j < n; j++) frames.push({ offset: at(c0 + j * seg), transform: `translateZ(${z(Math.max(0, i - j))}px)`, easing: run.bezier('standard') })
        frames[1]!.easing = run.bezier('enter')
        frames[frames.length - 1]!.offset = 1
        run.animate(pl.el, frames, { delay: a, duration: T, fill: 'both' })
        run.animate(tags[i]!, [{ opacity: 0 }, { opacity: 1 }], { delay: a + rise, duration: ms('base'), easing: run.bezier('enter') })
        run.animate(tags[i]!, [{ opacity: 1 }, { opacity: 0 }], { delay: c0, duration: ms('fast'), easing: run.bezier('exit'), fill: 'forwards' })
      })
      // the camera settles from the isometric angle to flat across the collapse
      run.animate(stage, [{ transform: camera(1) }, { transform: camera(1) }], { duration: c0, fill: 'backwards' })
      run.animate(stage, [{ transform: camera(1) }, { transform: camera(0) }], { delay: c0, duration: c1 - c0, easing: run.bezier('standard'), fill: 'forwards' })

      // ── Resolve: each plane, the frame first, hands over to the real parts it holds ──
      const layerOf = new Map<Element, number>([[node, 0]])
      planes.forEach((pl, i) => {
        for (const p of pl.parts) if (!layerOf.has(p.el)) layerOf.set(p.el, i)
      })
      for (const el of layerOf.keys()) run.hold(el)
      const [r0_, r1] = span.resolve
      const each = (r1 - r0_) / n
      planes.forEach((pl, i) => {
        const t0 = r0_ + i * each
        const els = [...layerOf].filter(([, l]) => l === i).map(([el]) => el)
        // its parts arrive over the first part of its turn, then the plane fades off them: never both half there
        spread(els, [t0, t0 + each * 0.6], (el, t, d) =>
          run.later(t, () => {
            run.animate(el, [{ opacity: 0 }, { opacity: 1 }], { delay: t, duration: d, easing: run.bezier('enter') })
            run.release(el)
          }),
        )
        run.animate(pl.el, [{ opacity: 1 }, { opacity: 0 }], { delay: t0 + each * 0.55, duration: each * 0.45, easing: run.bezier('standard'), fill: 'forwards' })
      })
      for (const el of plan.floating)
        run.later(r1 - ms('slow'), () => run.animate(el, [{ opacity: 0 }, { opacity: 1 }], { delay: r1 - ms('slow'), duration: ms('slow'), easing: run.bezier('enter') }))
    },
  })
}
