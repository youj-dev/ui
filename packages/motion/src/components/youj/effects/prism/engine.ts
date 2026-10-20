import type { MotionPersonality } from '@youj/core/lib/youj/tokens'
import { reader } from '../entrance/facts'
import { pieces } from '../entrance/pieces'
import type { Box, Part } from '../entrance/read'
import { entrance, spread, type EntranceRun } from '../entrance/run'

/* Prism: the demo locks in piece by piece out of its colour channels. Each piece arrives as three faint copies, one per
 * channel, offset a few px in three directions; they slide together, hang a hair apart, then snap into register and
 * the real piece takes their place. First four registration marks lock off the frame's corners and the frame itself
 * (its outline and the panels too big to be a piece) registers, then the pieces in build order, then the marks clear.
 *
 * The copies are the piece's own colours split into channels: red, green and blue light that add up (screen) on a dark
 * theme, cyan, magenta and yellow ink that multiply down on a light one. Either way three copies in register are
 * exactly the piece's colours again, so the snap hands over to the real piece without a change of colour. A look on
 * the shared entrance runtime (../entrance/run.ts).
 *
 * A piece is redrawn once, from what the reading found (its boxes, its words in their own face, its icons' shapes), on
 * three small canvases made just before its moment; from there only their transform and their group's opacity move.
 * The demo is only held by its inline opacity while it waits and faded in by a Web Animation. */

export interface PrismOptions {
  /** The whole run in ms, before `speed`. Default: from the demo's size and part count, about 2 s for a card, about 3.5 s for a small screen. */
  duration?: number
  /** Multiplies the pace: 2 plays twice as fast. Default 1. */
  speed?: number
  /** Each stage's share of the run, as weights (normalized, so they never change the total; a stage left out keeps
   * its default, and 0 skips it). Default `{ frame: 16, build: 72, settle: 12 }`. */
  phases?: PrismPhases
  /** Registration marks off the frame's corners while it builds. Default true. */
  marks?: boolean
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

export interface PrismPhases {
  /** The registration marks and the frame (its outline and its large panels) lock in. */
  frame?: number
  /** The pieces lock in, in build order. */
  build?: number
  /** The marks clear and anything floating (an open popover) fades in. */
  settle?: number
}

export type PrismRun = EntranceRun

const M = 32
/** The registration marks: their centre's distance out from the frame's corner, and their size. */
const MARK = 16
const MARK_R = 4
const MARK_ARM = 8
/** How far apart the copies still are just before the snap, as a share of where they started. */
const NEAR = 0.2
/** The three channels' directions (screen px, y down): up-left, up-right, down. */
const DIRS = [
  [-Math.cos(Math.PI / 6), -0.5],
  [Math.cos(Math.PI / 6), -0.5],
  [0, 1],
] as const

const CSS = `
.yj-pm-g{opacity:0;isolation:isolate}
.yj-pm-c{left:0;top:0}
.yj-pm-dark .yj-pm-c{mix-blend-mode:screen}
.yj-pm-light .yj-pm-c{mix-blend-mode:multiply}
.yj-pm-b{position:absolute;box-sizing:border-box}
.yj-pm-k{opacity:0}
`

type RGB = [number, number, number]
const clamp = (lo: number, hi: number, x: number) => Math.max(lo, Math.min(hi, x))
const paint = ([r, g, b]: RGB) => `rgb(${r} ${g} ${b})` // youj-allow: a theme colour, read at run time, split into one channel
const radiusOf = (p: Box & { round?: boolean; style?: { radius: number } }) =>
  p.round ? Math.min(p.w, p.h) / 2 : Math.min(p.style?.radius ?? 0, p.w / 2, p.h / 2)

/** CSS colours' red, green and blue (0–255), read off a pixel: computed colours may be in any space. */
function channelReader() {
  const c = document.createElement('canvas')
  c.width = c.height = 1
  const ctx = c.getContext('2d', { willReadFrequently: true })
  return (color: string): RGB => {
    if (!ctx) return [0, 0, 0]
    ctx.clearRect(0, 0, 1, 1)
    ctx.fillStyle = color
    ctx.fillRect(0, 0, 1, 1)
    const [r = 0, g = 0, b = 0] = ctx.getImageData(0, 0, 1, 1).data
    return [r, g, b]
  }
}

/** A piece redrawn in its own colours from what the reading found: its boxes filled and outlined, its rules, its words
 *  in their own face, its icons' and charts' shapes. In the demo's CSS px. */
function redraw(parts: Part[], rtl: boolean, color: (token?: string) => string | undefined, ink: string) {
  return (ctx: CanvasRenderingContext2D) => {
    ctx.lineWidth = 1
    // boxes first (largest first), then what sits on them
    const order = (p: Part) => (p.kind === 'text' ? 3 : p.kind === 'icon' || p.kind === 'chart' ? 2 : p.kind === 'divider' ? 1 : 0)
    for (const p of [...parts].sort((a, b) => order(a) - order(b))) {
      const own = color(p.style.ink) ?? ink
      ctx.globalAlpha = 1
      ctx.fillStyle = ctx.strokeStyle = own
      switch (p.kind) {
        case 'text':
          ctx.font = p.font ?? ''
          ctx.letterSpacing = p.spacing ?? '0px'
          ctx.direction = rtl ? 'rtl' : 'ltr'
          ctx.textAlign = rtl ? 'right' : 'left'
          ctx.textBaseline = 'alphabetic'
          for (const g of p.glyphs ?? []) {
            const descent = ctx.measureText(g.s).fontBoundingBoxDescent || g.h * 0.22
            ctx.fillText(g.s, rtl ? g.x + g.w : g.x, g.y + g.h - descent)
          }
          break
        case 'icon':
        case 'chart':
          for (const s of p.shapes ?? []) {
            ctx.save()
            ctx.transform(s.m.a, s.m.b, s.m.c, s.m.d, s.m.e, s.m.f)
            if (s.fill) {
              ctx.globalAlpha = p.kind === 'chart' ? 0.6 : 1
              ctx.fill(s.path)
              ctx.globalAlpha = 1
            }
            if (s.stroke) {
              ctx.lineWidth = s.lw
              ctx.lineCap = s.cap
              ctx.lineJoin = s.join
              ctx.stroke(s.path)
            }
            ctx.restore()
          }
          break
        case 'divider': {
          const v = p.edge === 'left' || p.edge === 'right'
          ctx.fillStyle = color(p.style.line) ?? ink
          ctx.fillRect(p.edge === 'right' ? p.x + p.w - 1 : p.x, p.edge === 'bottom' ? p.y + p.h - 1 : p.y, v ? 1 : p.w, v ? p.h : 1)
          break
        }
        case 'media':
          ctx.globalAlpha = 0.35
          ctx.fillStyle = ink
          ctx.beginPath()
          ctx.roundRect(p.x, p.y, p.w, p.h, radiusOf(p))
          ctx.fill()
          break
        default: {
          const fill = color(p.style.fill)
          if (fill || p.tone) {
            // a fill the theme names is drawn as it is; one it doesn't (a mix, a tint) as ink, as strong as it reads
            ctx.fillStyle = fill ?? ink
            ctx.globalAlpha = fill ? 1 : (p.tone ?? 0)
            ctx.beginPath()
            ctx.roundRect(p.x, p.y, p.w, p.h, radiusOf(p))
            ctx.fill()
            ctx.globalAlpha = 1
          }
          const line = color(p.style.line)
          if (line) {
            ctx.strokeStyle = line
            ctx.beginPath()
            ctx.roundRect(p.x + 0.5, p.y + 0.5, p.w - 1, p.h - 1, Math.max(0, radiusOf(p) - 0.5))
            ctx.stroke()
          }
        }
      }
    }
    ctx.globalAlpha = 1
  }
}

/** A registration mark: a ring with a cross through it. */
const markAt = (cx: number, cy: number, ink: string) => (ctx: CanvasRenderingContext2D) => {
  ctx.fillStyle = ctx.strokeStyle = ink
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.arc(cx, cy, MARK_R, 0, Math.PI * 2)
  ctx.stroke()
  ctx.fillRect(cx - MARK_ARM, cy - 0.5, MARK_ARM * 2, 1)
  ctx.fillRect(cx - 0.5, cy - MARK_ARM, 1, MARK_ARM * 2)
}

export function prism(node: HTMLElement, options: PrismOptions = {}): PrismRun {
  return entrance(node, options, {
    name: 'prism',
    css: CSS,
    // its copies are drawn in the pieces' own colours, words and tones
    reader,
    margin: M,
    phases: { frame: 16, build: 72, settle: 12 },
    // about 2 s for a card, 3.5 s for a small screen
    length: (plan) => Math.min(9, Math.max(3, 1.4 + Math.sqrt(plan.w * plan.h) / 220 + plan.parts.length / 50)),
    play(run) {
      const { plan, W, H, rtl, span, ms, root, dpr } = run
      const enter = run.bezier('enter')

      // ── Colours: every token the parts use, read now (not mid-run), and how a colour splits into channels ──
      const read = channelReader()
      const [r, g, b] = read(run.color('var(--color-canvas)'))
      const dark = 0.299 * r + 0.587 * g + 0.114 * b < 128
      root.classList.add(dark ? 'yj-pm-dark' : 'yj-pm-light')
      const tokens = new Map<string, string>()
      for (const p of plan.parts)
        for (const t of [p.style.ink, p.style.fill, p.style.line]) if (t && !tokens.has(t)) tokens.set(t, run.color(`var(--color-${t})`))
      for (const t of [plan.style.fill, plan.style.line]) if (t && !tokens.has(t)) tokens.set(t, run.color(`var(--color-${t})`))
      const color = (t?: string) => (t ? tokens.get(t) : undefined)
      const ink = run.color('var(--color-fg)')
      const pencil = run.color('var(--color-fg-subtle)')
      /** One channel of a colour: its red, green or blue alone as light (dark theme), or as the ink that leaves only it (light theme). */
      const split = (c: RGB, i: number): RGB =>
        dark ? [i === 0 ? c[0] : 0, i === 1 ? c[1] : 0, i === 2 ? c[2] : 0] : [i === 0 ? c[0] : 255, i === 1 ? c[1] : 255, i === 2 ? c[2] : 255]
      // copies are faint while they travel, and whole in register
      const FAINT = dark ? 0.6 : 0.75

      /** Where a box's copies sit: on whole device pixels in the overlay, with room for their offset. */
      const frameFor = (box: Box, pad: number) => {
        const l = Math.floor((run.offX + box.x - pad) * dpr)
        const t = Math.floor((run.offY + box.y - pad) * dpr)
        return { l, t, w: Math.ceil((run.offX + box.x + box.w + pad) * dpr) - l, h: Math.ceil((run.offY + box.y + box.h + pad) * dpr) - t }
      }
      type Frame = ReturnType<typeof frameFor>
      /** A canvas over `f` with `draw` (in the demo's CSS px) painted on it once. */
      const sheet = (f: Frame, draw: (ctx: CanvasRenderingContext2D) => void, className = 'yj-pm-c') => {
        const c = document.createElement('canvas')
        c.width = f.w
        c.height = f.h
        c.className = `yj-en-l ${className}`
        c.style.cssText = `left:${f.l / dpr}px;top:${f.t / dpr}px;width:${f.w / dpr}px;height:${f.h / dpr}px`
        const ctx = c.getContext('2d')
        ctx?.setTransform(dpr, 0, 0, dpr, run.offX * dpr - f.l, run.offY * dpr - f.t)
        if (ctx) draw(ctx)
        return c
      }
      /** Channel `i` of a drawing: its colours keep only that channel, as light or as ink; its shape (alpha) stays. */
      const channel = (from: HTMLCanvasElement, i: number) => {
        const c = from.cloneNode() as HTMLCanvasElement
        c.style.left = c.style.top = '0px'
        const ctx = c.getContext('2d')
        if (ctx) {
          ctx.drawImage(from, 0, 0)
          ctx.globalCompositeOperation = dark ? 'multiply' : 'screen'
          ctx.fillStyle = paint(split(dark ? [255, 255, 255] : [0, 0, 0], i))
          ctx.fillRect(0, 0, c.width, c.height)
          ctx.globalCompositeOperation = 'destination-in'
          ctx.drawImage(from, 0, 0)
        }
        return c
      }

      const spent: { at: number; el: Element }[] = []
      /** Three channel copies of `box` (made by `copy`) slide in over `d` from `D` px apart, snap into register, and
       *  fade as what they stand for appears. Returns the moment of the snap. */
      const ghost = (box: Box, D: number, t: number, d: number, copy: (f: Frame, i: number) => HTMLElement) => {
        const lock = clamp(0.5, 0.85, 1 - ms('base') / d)
        run.later(t, () => {
          const f = frameFor(box, Math.ceil(D) + 2)
          const group = document.createElement('div')
          group.className = 'yj-en-l yj-pm-g'
          group.style.cssText = `left:${f.l / dpr}px;top:${f.t / dpr}px;width:${f.w / dpr}px;height:${f.h / dpr}px`
          for (let i = 0; i < 3; i++) {
            const el = copy(f, i)
            const [vx, vy] = DIRS[i]!
            const dx = (rtl ? -vx : vx) * D
            const dy = vy * D
            group.append(el)
            run.animate(
              el,
              [
                { offset: 0, transform: `translate(${dx.toFixed(2)}px,${dy.toFixed(2)}px)`, easing: enter },
                { offset: lock, transform: `translate(${(dx * NEAR).toFixed(2)}px,${(dy * NEAR).toFixed(2)}px)` },
                // the snap: from a hair apart into register in one frame
                { offset: lock, transform: 'none' },
                { offset: 1, transform: 'none' },
              ],
              { delay: t, duration: d },
            )
          }
          run.animate(
            group,
            [
              { offset: 0, opacity: 0 },
              { offset: lock * 0.3, opacity: FAINT },
              { offset: lock, opacity: FAINT },
              { offset: lock, opacity: 1 },
              { offset: 1, opacity: 0 },
            ],
            { delay: t, duration: d, easing: 'linear' },
          )
          root.append(group)
          spent.push({ at: t + d, el: group })
        })
        return t + d * lock
      }
      /** A piece's copies are canvases: drawn once, then split. */
      const drawn = (draw: (ctx: CanvasRenderingContext2D) => void) => {
        let base: HTMLCanvasElement | undefined
        return (f: Frame, i: number) => channel((base ??= sheet(f, draw)), i)
      }
      /** The real element appears at the snap: held until then, then a short fade that replaces the hold. */
      const appear = (el: Element, at: number) => {
        run.hold(el)
        run.later(at, () => {
          run.animate(el, [{ opacity: 0 }, { opacity: 1 }], { delay: at, duration: ms('fast'), easing: enter })
          run.release(el)
        })
      }

      const { pieces: list, shells, within } = pieces(plan, node)
      const [f0, f1] = span.frame

      // ── The marks: a ring and cross off each corner, locking in first and staying (in pencil) until the settle ──
      if (options.marks !== false) {
        const d = Math.max(ms('slow'), (f1 - f0) * 0.55)
        const corners = [
          [-MARK, -MARK],
          [W + MARK, -MARK],
          [-MARK, H + MARK],
          [W + MARK, H + MARK],
        ] as const
        corners.forEach(([cx, cy], i) => {
          const box = { x: cx - MARK_ARM - 1, y: cy - MARK_ARM - 1, w: MARK_ARM * 2 + 2, h: MARK_ARM * 2 + 2 }
          const t = f0 + i * Math.min(ms('instant'), (f1 - f0) * 0.08)
          const at = ghost(box, 5, t, d, drawn(markAt(cx, cy, ink)))
          run.later(at, () => {
            const kept = sheet(frameFor(box, 1), markAt(cx, cy, pencil), 'yj-pm-k')
            root.append(kept)
            run.animate(kept, [{ opacity: 0 }, { opacity: 1, offset: 0.04 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], {
              delay: at,
              duration: Math.max(1, run.T - at),
              easing: 'linear',
            })
          })
        })
      }

      // ── The frame: its outline and the panels too big to be a piece, as boxes (they're large, so not canvases) ──
      const shellBoxes = shells
        .filter((p) => p.kind !== 'text' && p.kind !== 'divider')
        .map((p) => ({ x: p.x, y: p.y, w: p.w, h: p.h, r: radiusOf(p), fill: color(p.style.fill), line: color(p.style.line) }))
      const frameLine = color(plan.style.line) ?? pencil
      // panels sit inside the frame's border and, when the demo clips (rounded corners), inside its corners too
      const clips = getComputedStyle(node).overflow !== 'visible'
      const box = (b: Box & { r: number; fill?: string; line?: string }, x: number, y: number, i: number) => {
        const el = document.createElement('i')
        el.className = 'yj-pm-b'
        el.style.cssText = `left:${x.toFixed(2)}px;top:${y.toFixed(2)}px;width:${b.w.toFixed(2)}px;height:${b.h.toFixed(2)}px;border-radius:${b.r}px`
        if (b.line) el.style.border = `1px solid ${paint(split(read(b.line), i))}`
        if (b.fill) el.style.background = paint(split(read(b.fill), i))
        return el
      }
      const frameD = (f1 - f0) * 0.85
      const frameLock = ghost(plan, clamp(6, 12, Math.sqrt(W * H) / 40), f1 - frameD, frameD, (f, i) => {
        const el = document.createElement('div')
        el.className = 'yj-en-l yj-pm-c'
        el.style.cssText = `width:${f.w / dpr}px;height:${f.h / dpr}px`
        const frame = box(
          { ...plan, r: Math.min(plan.style.radius, W / 2, H / 2), fill: color(plan.style.fill), line: frameLine },
          f.l / -dpr + run.offX,
          f.t / -dpr + run.offY,
          i,
        )
        if (clips) frame.style.overflow = 'hidden'
        for (const b of shellBoxes) frame.append(box(b, b.x - 1, b.y - 1, i))
        el.append(frame)
        return el
      })
      // the demo itself (its own paint, its panels, whatever isn't a piece) appears with the frame
      run.animate(node, [{ opacity: 0 }, { opacity: 1 }], { delay: frameLock, duration: ms('fast'), easing: enter })

      // ── The pieces, in build order ──
      spread(list, span.build, (p, t, d) => {
        const dd = Math.max(d, ms('slow') * 1.6)
        const D = clamp(3, 9, Math.sqrt(p.w * p.h) / 14)
        appear(p.el, ghost(p, D, t, dd, drawn(redraw(within(p), rtl, color, ink))))
      })

      // ── The settle: what floats (an open popover) fades in last ──
      for (const el of plan.floating)
        run.animate(el, [{ opacity: 0 }, { opacity: 1 }], { delay: span.settle[0], duration: ms('slow'), easing: enter })

      // groups whose copies are spent leave the overlay, with their canvases
      run.frame((t) => {
        for (let i = spent.length - 1; i >= 0; i--)
          if (spent[i]!.at < t) {
            spent[i]!.el.remove()
            spent.splice(i, 1)
          }
      })
    },
  })
}
