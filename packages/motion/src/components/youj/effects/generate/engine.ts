import type { Box, Part } from '../entrance/read'
import { entrance, spread, type EntranceOptions, type EntranceRun } from '../entrance/run'

/* Generate: the demo builds itself in, part by part, in its real colours. First the frame: the demo's own box and its
 * main regions are dragged out from their reading corner, each with a selection outline (and, when a script names it,
 * its name on a tab). Then every part arrives in build order, each its own way: a surface drags out, text types in line
 * by line, a control pops, an icon draws its strokes, a chart and an image wipe in, a rule extends, a row slides up.
 * A look on the shared entrance runtime (../entrance/run.ts).
 *
 * Waiting parts are held by their inline opacity (no animation, so no compositor layer while they wait) and each
 * arrives as a Web Animation made just before its moment; both are put back exactly at the end. */

export interface GeneratePhases {
  frame?: number
  build?: number
  settle?: number
}

export type GenerateRun = EntranceRun

export interface GenerateOptions extends EntranceOptions {
  /** Each stage's share of the run: the frame dragged out, the parts arriving, the settle. Default `{ frame: 16, build: 72, settle: 12 }`. */
  phases?: GeneratePhases
  /** Selectors for the regions to drag out first, in this order (default: the demo's largest boxes). */
  order?: string[]
  /** A name for a region (by its selector in `order`), shown on its tab while it's dragged out. */
  names?: Record<string, string>
}

const M = 24
const CSS = `
.yj-gn-sel{border:1px solid var(--color-accent);border-radius:2px;will-change:clip-path,opacity}
.yj-gn-sel::after{content:'';position:absolute;right:-3px;bottom:-3px;width:5px;height:5px;background:var(--color-canvas);border:1px solid var(--color-accent)}
.yj-gn-sel[dir=rtl]::after{right:auto;left:-3px}
.yj-gn-tab{position:absolute;bottom:100%;left:-1px;margin-bottom:3px;padding:1px 5px;border-radius:2px;font:500 10px/14px var(--font-mono);white-space:nowrap;
color:var(--color-accent-contrast);background:var(--color-accent)}
.yj-gn-sel[dir=rtl] .yj-gn-tab{left:auto;right:-1px}
`

export function generate(node: HTMLElement, options: GenerateOptions = {}): GenerateRun {
  return entrance(node, options, {
    name: 'generate',
    css: CSS,
    margin: M,
    phases: { frame: 16, build: 72, settle: 12 },
    // about 2 s for a button, 3 s for a card, 5 s for a screen
    length: (plan) => Math.min(9, Math.max(3, 1.5 + Math.sqrt(plan.w * plan.h) / 200 + plan.parts.length / 60)),
    play(run) {
      const { node, plan, rtl, span, ms, root } = run
      const enter = run.bezier('enter')
      const standard = run.bezier('standard')
      const emphasized = run.bezier('emphasized')

      /** Arrives at `t` over `d`: the hold goes as the animation that replaces it starts, so it never shows early. */
      const arrive = (el: Element, t: number, frames: Keyframe[], d: number, easing = standard) =>
        run.later(t, () => {
          run.animate(el, frames, { delay: t, duration: d, easing })
          run.release(el)
        })
      /** A box dragged out from its reading corner (and the selection outline that drags it, with its name). */
      const drag = (el: Element, box: Box, t: number, d: number, name?: string, outline = false) => {
        const from = rtl ? 'inset(0 0 100% 100%)' : 'inset(0 100% 100% 0)'
        arrive(
          el,
          t,
          [
            { clipPath: from, opacity: 0 },
            { opacity: 1, offset: 0.25 },
            { clipPath: 'inset(0 0 0 0)', opacity: 1 },
          ],
          d,
          emphasized,
        )
        if (!outline) return
        const sel = document.createElement('div')
        sel.className = 'yj-en-l yj-gn-sel'
        sel.dir = rtl ? 'rtl' : 'ltr'
        sel.style.cssText = `left:${M + box.x - 1}px;top:${M + box.y - 1}px;width:${box.w + 2}px;height:${box.h + 2}px`
        if (name) {
          const tab = document.createElement('span')
          tab.className = 'yj-gn-tab'
          tab.textContent = name
          sel.append(tab)
        }
        root.append(sel)
        run.animate(sel, [{ clipPath: from.replace(/100%/g, 'calc(100% - 8px)') }, { clipPath: 'inset(-24px -8px -8px -8px)' }], {
          delay: t,
          duration: d,
          easing: emphasized,
          fill: 'both',
        })
        run.animate(sel, [{ opacity: 0 }, { opacity: 1, offset: 0.1 }, { opacity: 1, offset: 0.7 }, { opacity: 0 }], {
          delay: t,
          duration: d * 1.6,
          easing: 'linear',
          fill: 'both',
        })
      }

      // ── The frame: the demo's own box, then its main regions (a script's, in its order, else the largest boxes) ──
      const [f0, f1] = span.frame
      const regions: { el: Element; box: Box; name?: string }[] = []
      for (const sel of options.order ?? []) {
        const el = node.querySelector(sel)
        if (!el) continue
        const r = el.getBoundingClientRect()
        const n = node.getBoundingClientRect()
        const k = plan.scale
        regions.push({ el, box: { x: (r.left - n.left) / k, y: (r.top - n.top) / k, w: r.width / k, h: r.height / k }, name: options.names?.[sel] })
      }
      if (!regions.length)
        for (const r of plan.regions) {
          const p = plan.parts.find((q) => q.kind === 'surface' && Math.abs(q.x - r.x) < 1 && Math.abs(q.y - r.y) < 1 && Math.abs(q.w - r.w) < 1)
          if (p) regions.push({ el: p.el, box: p })
        }
      const frameD = Math.max(ms('slow'), (f1 - f0) * 0.7)
      // the root is clipped to nothing until its own drag: whatever isn't a part (a wrapper's paint) comes with it, and so
      // does a part the regions sit in (the card's own panel), so the frame is never an empty box
      drag(node, plan, f0, frameD, undefined, true)
      const pending = new Set(plan.parts.filter((p) => !p.quiet && !regions.some((r) => r.el !== p.el && p.el.contains(r.el))).map((p) => p.el))
      const opens = new Map<Element, number>()
      regions.forEach((r, i) => {
        const t = f0 + ((f1 - f0) * (i + 1)) / (regions.length + 1)
        pending.delete(r.el)
        opens.set(r.el, t)
        run.hold(r.el)
        drag(r.el, r.box, t, frameD, r.name, true)
      })

      // ── The parts, in build order: they start while the frame is still being dragged out, each once its region is
      // half open, so something is always arriving ──
      for (const el of pending) run.hold(el)
      const parts = plan.parts.filter((p) => pending.has(p.el))
      const seen = new Set<Element>()
      const b0 = Math.min(span.build[0], f0 + frameD * 0.5)
      const after = (el: Element) => {
        for (const [r, t] of opens) if (r.contains(el)) return t + frameD * 0.5
        return b0
      }
      spread(
        parts.filter((p) => !seen.has(p.el) && seen.add(p.el)),
        [b0, span.build[1]],
        (p, t, d) => partIn(p, Math.max(t, after(p.el)), Math.max(d, ms('base'))),
      )
      function partIn(p: Part, t: number, d: number) {
        const el = p.el
        switch (p.kind) {
          case 'surface':
          case 'field':
            return drag(el, p, t, d)
          case 'text':
            return arrive(el, t, typed(p), Math.max(d, ms('slow')), 'linear')
          case 'control':
            return arrive(
              el,
              t,
              [
                { opacity: 0, transform: 'scale(0.86)' },
                { opacity: 1, offset: 0.4 },
                { opacity: 1, transform: 'none' },
              ],
              d,
              enter,
            )
          case 'icon': {
            // its strokes draw on; fills and the icon itself fade in under them
            for (const s of p.shapes ?? [])
              if (s.len)
                run.later(t, () =>
                  run.animate(
                    s.el,
                    [
                      { strokeDasharray: `${s.len} ${s.len}`, strokeDashoffset: s.len },
                      { strokeDasharray: `${s.len} ${s.len}`, strokeDashoffset: 0 },
                    ],
                    {
                      delay: t,
                      duration: d,
                      easing: standard,
                    },
                  ),
                )
            return arrive(el, t, [{ opacity: 0 }, { opacity: 1, offset: 0.3 }, { opacity: 1 }], d)
          }
          case 'chart':
            return arrive(
              el,
              t,
              [
                { clipPath: rtl ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)', opacity: 0 },
                { opacity: 1, offset: 0.2 },
                { clipPath: 'inset(0 0 0 0)', opacity: 1 },
              ],
              d * 1.4,
            )
          case 'media':
            return arrive(
              el,
              t,
              [
                { clipPath: 'inset(0 0 100% 0)', opacity: 0 },
                { opacity: 1, offset: 0.2 },
                { clipPath: 'inset(0 0 0 0)', opacity: 1 },
              ],
              d * 1.2,
            )
          case 'divider':
            return p.own
              ? arrive(
                  el,
                  t,
                  [
                    { transform: 'scaleX(0)', transformOrigin: rtl ? '100% 50%' : '0 50%', opacity: 1 },
                    { transform: 'scaleX(1)', transformOrigin: rtl ? '100% 50%' : '0 50%', opacity: 1 },
                  ],
                  d,
                )
              : drag(el, p, t, d)
          case 'row':
            return arrive(
              el,
              t,
              [
                { opacity: 0, transform: 'translateY(6px)' },
                { opacity: 1, transform: 'none' },
              ],
              d,
              enter,
            )
        }
      }
      /** Text types in line by line: a polygon that shows the lines done and the current one up to its caret, stepping a
       *  character at a time. */
      function typed(p: Part): Keyframe[] {
        const at = p.at ?? p
        const lines = p.lines ?? []
        if (!lines.length) return [{ opacity: 0 }, { opacity: 1 }]
        const total = lines.reduce((a, l) => a + l.w, 0) || 1
        const chars = Math.max(1, (p.words ?? '').length)
        const W = at.w + 8
        const frames: Keyframe[] = []
        let done = 0
        lines.forEach((l, i) => {
          const y0 = l.y - at.y
          const y1 = i === lines.length - 1 ? at.h + 8 : l.y + l.h - at.y
          const a = (rtl ? l.x + l.w : l.x) - at.x
          const b = (rtl ? l.x : l.x + l.w) - at.x
          const shape = (x: number) => `polygon(-8px -8px, ${W}px -8px, ${W}px ${y0}px, ${x}px ${y0}px, ${x}px ${y1}px, ${rtl ? W : -8}px ${y1}px)`
          const steps = Math.max(1, Math.round((chars * l.w) / total))
          frames.push({ offset: done / total, clipPath: shape(a), easing: `steps(${steps}, end)` })
          done += l.w
          frames.push({ offset: Math.min(1, done / total), clipPath: shape(b) })
        })
        frames[frames.length - 1]!.clipPath = 'polygon(-8px -8px, 9999px -8px, 9999px 9999px, -8px 9999px, -8px 9999px, -8px 9999px)'
        return frames.map((f, i) => (i ? f : { ...f, opacity: 1 }))
      }

      // ── The settle: what floats (an open popover) fades in last ──
      for (const el of plan.floating) arrive(el, span.settle[0], [{ opacity: 0 }, { opacity: 1 }], ms('slow'), enter)
    },
  })
}
