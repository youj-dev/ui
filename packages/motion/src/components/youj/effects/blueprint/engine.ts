import { blueprintLabels } from '@youj/core/labels'
import type { MotionPersonality } from '@youj/core/lib/youj/tokens'
import { pen } from '../entrance/draw'
import { units, type Box, type Part, type Style } from '../entrance/read'
import { entrance, spread, type Draw, type Look, type Run } from '../entrance/run'
import { reader } from '../entrance/facts'

/* Blueprint: a rendered piece of UI is drafted as an architect's drawing, then built up into the real thing. A look on
 * the shared entrance runtime (../entrance/run.ts), which reads the demo, keeps the clock and ends cleanly.
 *
 * Seven stages, each advancing through the parts in build order, so the build is visibly in progress from the first
 * mark to the last: survey (paper grid, registration cross, the dotted bounds and their dimensions), layout (the main
 * regions, outside-in), detail (every part pencilled by kind, in reading order), ink (each outline traced over solid),
 * tone (filled boxes take flat greys, hatching or a screen), set (the text sets in grey, line by line, and icons and
 * charts trace their real shapes) and finish (a ruled edge sweeps down; behind it the real UI, with its colour, radii,
 * shadows and images, fades in part by part; then the numbers, columns and paper clear). Two side columns log every
 * step and the values it applies.
 *
 * The drawing is cumulative on three canvases (tone, pencil, frame). The demo itself is only ever animated: held at
 * opacity 0 while drafted, wiped in by a clip-path under the edge, its pieces faded in just behind it; the edge and
 * the pencil's wipe are transforms on the same curve. */

export type BlueprintLabels = typeof blueprintLabels

export interface BlueprintOptions {
  /** The whole run in ms, before `speed`. Default: from the demo's size and part count, about 2 s for a card, about 3.5 s for a small screen, at most about 6 s. */
  duration?: number
  /** Multiplies the pace: 2 plays twice as fast. Default 1. */
  speed?: number
  /** Each phase's share of the run, as weights (normalized, so they never change the total; a phase left out keeps its
   * default). Default `{ survey: 10, layout: 10, detail: 20, ink: 13, tone: 12, set: 13, finish: 22 }`. */
  phases?: BlueprintPhases
  /** The side columns (build log and values), shown when there is room beside the demo. Default 'auto'. */
  columns?: 'auto' | 'none'
  /** Words for the build column and the columns' titles. Default: Youj's English (translate through YoujProvider `labels`). */
  labels?: Partial<BlueprintLabels>
  /** Aborting cancels the run. */
  signal?: AbortSignal
  /** Skip the draft. Default: the provider's `--yj-motion` on the demo, else the OS setting. */
  reduced?: boolean
  /** The motion personality its timing and curves come from. Default: the demo's `data-yj-motion`, else precise. */
  personality?: MotionPersonality
  /** Holds the run at its start until `seek` moves it, instead of playing it on animation frames: for a clock of your
   *  own (a video rendered frame by frame, a scrubber). Default false. */
  paused?: boolean
}

export interface BlueprintPhases {
  /** Paper grid, registration cross, bounds and their dimensions. */
  survey?: number
  /** The main regions, outside-in. */
  layout?: number
  /** Every part, pencilled in reading order. */
  detail?: number
  /** Each outline traced over in solid ink. */
  ink?: number
  /** Filled boxes in flat greys, hatching or a screen. */
  tone?: number
  /** Text set in grey line by line; icons and charts in their real shapes. */
  set?: number
  /** The ruled edge's sweep to the real UI, and the clear that ends the run. */
  finish?: number
}

export interface BlueprintRun {
  /** Restores the demo at once and removes everything the run added. */
  cancel(): void
  /** Settles when the run ends, finished or cancelled. */
  finished: Promise<void>
  /** Shows the run at `t` ms from its start and holds it there (forwards only; see `EntranceRun`). */
  seek(t: number): void
}

/** Room beside the demo (px) a side column needs. */
const COLUMN_ROOM = 180
/** The margin around the demo the drawing uses (dimension lines, construction overrun). */
const M = 40
/** How far past the demo's box the wipe reaches, for shadows. */
const BLEED = 24
const GRID = 8
/** The band (px) behind the ink edge over which the pencil clears. */
const FADE = 28
type Stage = 'survey' | 'layout' | 'detail' | 'ink' | 'tone' | 'set' | 'finish'

const CSS = `
.yj-bp-wipe{inset:0;overflow:hidden;mask-image:linear-gradient(to bottom,transparent,white ${FADE}px)}
.yj-bp-sheet{inset:0}
.yj-bp-edge{left:${M - 24}px;right:${M - 24}px;top:0;height:9px;border-top:1px solid var(--color-fg);
background:linear-gradient(to right,var(--color-fg-muted) 1px,transparent 1px) 24px 0/32px 6px repeat-x,
linear-gradient(to right,var(--color-fg-subtle) 1px,transparent 1px) 24px 0/8px 3px repeat-x}
.yj-bp-y{top:-16px;right:0;font:500 10px/14px var(--font-mono);color:var(--color-fg);font-variant-numeric:tabular-nums;white-space:pre}
.yj-bp-col{top:0;overflow:hidden;font:10px/15px var(--font-mono);font-variant-numeric:tabular-nums;color:var(--color-fg-muted);white-space:pre;
mask-image:linear-gradient(to bottom,transparent,white 24px,white calc(100% - 32px),transparent)}
.yj-bp-h{position:relative;display:block;font-weight:500;letter-spacing:.08em;text-transform:uppercase;color:var(--color-fg-subtle);padding:8px 0 6px;border-bottom:1px solid var(--color-line)}
.yj-bp-v{position:relative;padding-top:6px}
.yj-bp-ln{clip-path:inset(0 100% 0 0);margin:0;overflow:hidden;height:15px;width:max-content;max-width:100%;unicode-bidi:plaintext}
.yj-bp-n{font-style:normal;color:var(--color-fg-subtle)}
`

const r0 = Math.round
const cut = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s)
const size = (b: Box) => `${r0(b.w)} × ${r0(b.h)}`
const quad = ([t, r, b, l]: Style['pad']) =>
  t === b && r === l ? (t === r ? `${r0(t)}` : `${r0(t)} ${r0(r)}`) : `${r0(t)} ${r0(r)} ${r0(b)} ${r0(l)}`
/** The values a box applies, for the values column: radius, padding, gap, fill, border, shadow. */
const boxVals = (s: Style) =>
  [
    s.radius && `r ${s.radius > 999 ? 'full' : r0(s.radius)}`,
    s.pad.some(Boolean) && `pad ${quad(s.pad)}`,
    s.gap && `gap ${r0(s.gap)}`,
    s.fill && `fill ${s.fill}`,
    s.line && `line ${s.line}`,
    s.shadow && 'shadow',
  ].filter(Boolean) as string[]

export function blueprint(node: HTMLElement, options: BlueprintOptions = {}): BlueprintRun {
  const L: BlueprintLabels = { ...blueprintLabels, ...options.labels }
  const look: Look<Stage> = {
    name: 'blueprint',
    reader,
    css: CSS,
    margin: M,
    phases: { survey: 10, layout: 10, detail: 20, ink: 13, tone: 12, set: 13, finish: 22 },
    length: (plan) => Math.min(10, Math.max(2.6, 1.6 + Math.sqrt(plan.w * plan.h) / 192 + plan.parts.length / 80)),
    fold: (plan) => (plan.regions.length ? {} : { layout: 'detail' }),
    play(run) {
      const { plan, W, H, rtl, T, span, ms, X, Y, dpr, lw, ts, root } = run
      const { dots, rule, chain, both, tint, outline, circle, centre, reveal, pattern } = pen(run)

      // ── Words for a part, in the build column, and the values it applies, in the values column ──
      const radiusOf = (p: { style: Style; round?: boolean }) =>
        p.style.radius ? ` r${p.style.radius > 999 || p.round ? 'full' : r0(p.style.radius)}` : ''
      const logOf = (p: Part) => {
        switch (p.kind) {
          case 'text':
            return `${L.blueprintText} "${cut(p.words!, 18)}" ${r0(p.type!.fs)}/${r0(p.type!.lh)}`
          case 'icon':
            return `${L.blueprintIcon} ${r0(Math.max(p.w, p.h))}`
          case 'chart':
            return `${L.blueprintChart} ${size(p)}`
          case 'media':
            return `${L.blueprintMedia} ${size(p)}`
          case 'field':
            return `${L.blueprintField} ${size(p)}`
          case 'row':
            return `${L.blueprintRow} ${size(p)}`
          case 'divider':
            return `${L.blueprintRule} ${r0(p.edge === 'left' || p.edge === 'right' ? p.h : p.w)}`
          case 'control':
            return `${p.link ? L.blueprintLink : p.role || (p.tag === 'button' ? L.blueprintButton : p.name === p.tag ? L.blueprintButton : p.name)} ${size(p)}${radiusOf(p)}`
          default:
            return `${p.name.replace(/^(div|span)$/, L.blueprintBox)} ${size(p)}${radiusOf(p)}`
        }
      }
      const valsOf = (p: Part) => {
        const s = p.style
        switch (p.kind) {
          case 'text':
            return [`type ${r0(p.type!.fs)}/${r0(p.type!.lh)} · ${p.type!.weight}`, ...(s.ink ? [`ink ${s.ink}`] : [])]
          case 'icon':
          case 'chart':
            return s.ink ? [`ink ${s.ink}`] : []
          case 'media':
            return s.radius ? [`r ${p.round ? 'full' : r0(s.radius)}`] : []
          case 'row':
            return s.fill ? [`fill ${s.fill}`] : []
          case 'divider':
            return s.line ? [`line ${s.line}`] : []
          case 'control':
            return [`h ${r0(p.h)}`, ...boxVals(s)]
          default:
            return boxVals(s)
        }
      }

      // ── Colours and the type of the numbers ──
      const ink = run.color('var(--color-fg)')
      const lead = run.color('var(--color-fg-muted)')
      const pencil = run.color('var(--color-fg-subtle)')
      const paper = run.color('var(--color-canvas)')
      const probe = document.createElement('i')
      probe.style.fontFamily = 'var(--font-mono)'
      root.append(probe)
      const mono = getComputedStyle(probe).fontFamily
      probe.remove()
      const font = (sz: number, weight = 400) => `${weight} ${sz * ts * dpr}px ${mono}`

      // ── The layers: under the wipe (tones, then pencil), the frame's own canvas, the ruled edge ──
      const wipe = document.createElement('div')
      wipe.className = 'yj-en-l yj-bp-wipe'
      const sheet = document.createElement('div')
      sheet.className = 'yj-en-l yj-bp-sheet'
      // under the pencil, the tones: their own layer, so a box's fill never covers the lines and type drawn over it
      const tc = run.canvas()
      const pc = run.canvas()
      if (tc && pc) sheet.append(tc.canvas, pc.canvas)
      wipe.append(sheet)
      const fc = run.canvas()
      const edge = document.createElement('div')
      edge.className = 'yj-en-l yj-bp-edge'
      const edgeY = document.createElement('span')
      edgeY.className = 'yj-en-l yj-bp-y'
      edge.append(edgeY)
      root.prepend(wipe)
      root.append(edge)

      const occupied: Box[] = []
      /** The numbers' plates: later stages draw around them, so a traced outline or a tone never runs through a label. */
      const labelled: Box[] = []
      const hits = (b: Box) => occupied.some((o) => b.x < o.x + o.w && b.x + b.w > o.x && b.y < o.y + o.h && b.y + b.h > o.y)
      const measure = (s: string, sz: number) => {
        if (!pc) return 0
        pc.font = font(sz)
        return pc.measureText(s).width / dpr
      }
      /** Mono text on a knockout; `count` makes the number climb to its value, otherwise it types in. */
      const label = (
        s: string,
        x: number,
        y: number,
        sz: number,
        style: string,
        align: 'left' | 'center' | 'right' = 'left',
        count?: number,
        weight = 400,
      ): Draw => {
        let last = ''
        return (ctx, q) => {
          const shown = count === undefined ? s.slice(0, Math.ceil(s.length * q)) : s.replace(String(count), String(r0(count * q)))
          if (shown === last) return
          last = shown
          ctx.font = font(sz, weight)
          const full = ctx.measureText(s).width
          const left = align === 'left' ? X(x) : align === 'right' ? X(x) - full : X(x) - full / 2
          const pad = 2 * dpr
          const h = r0((sz + 4) * ts * dpr)
          const top = Y(y) - r0(h / 2)
          ctx.globalAlpha = 1
          // the knockout is a hole in the drawing, so whatever the stage is (a colour, a photo) shows around the number
          ctx.globalCompositeOperation = 'destination-out'
          ctx.fillRect(Math.floor(left - pad), top, Math.ceil(full + pad * 2), h)
          ctx.globalCompositeOperation = 'source-over'
          ctx.fillStyle = style
          ctx.textBaseline = 'middle'
          ctx.textAlign = 'left'
          const tx = align === 'right' ? X(x) - ctx.measureText(shown).width : align === 'center' ? X(x) - ctx.measureText(shown).width / 2 : left
          ctx.fillText(shown, r0(tx), Y(y) + r0(0.5 * dpr))
        }
      }
      /** A label placed at the first spot that collides with nothing drawn or labelled, or nowhere. */
      const placed = (s: string, spots: [number, number][], sz = 9) => {
        if (!pc) return undefined
        // the whole drawn extent (tag, gap, knockouts) plus air, so neighbouring labels never touch
        const w = measure(s, sz) + 12 * ts
        const h = (sz + 8) * ts
        for (const [x, y] of spots) {
          const b = { x: rtl ? x - w : x, y: y - h / 2, w, h }
          if (b.x < 0 || b.x + b.w > W || b.y < 0 || b.y + b.h > H || hits(b)) continue
          occupied.push(b)
          labelled.push(b)
          return { x: rtl ? x : x + 2, y }
        }
        return undefined
      }
      /** An index tag: a pencil square with the build number inside. */
      const tag = (n: number, x: number, y: number) => {
        const s = String(n).padStart(2, '0')
        const w = 6 * ts + measure(s, 9)
        const box = rtl ? { x: x - w, y, w, h: 13 * ts } : { x, y, w, h: 13 * ts }
        const text = rtl
          ? label(s, x - 3 * ts, y + 6.5 * ts, 9, ink, 'right', undefined, 500)
          : label(s, x + 3 * ts, y + 6.5 * ts, 9, ink, 'left', undefined, 500)
        return chain(tint(lead, 1, outline(box, 'dots', 2)), tint(ink, 1, text))
      }

      // ── The timeline ──
      const surveyEnd = span.survey[1]
      const layoutEnd = span.layout[1]
      const detailEnd = span.detail[1]
      const finishStart = span.finish[0]
      // the finish is the sweep, then the clear that lands it; every part has faded in before the run ends
      const finishLen = T - finishStart
      const fade = Math.min(ms('slow'), finishLen * 0.45)
      const clear = Math.max(finishLen * 0.3, fade)
      const sweep = Math.max(1, finishLen - clear)
      const step = Math.max(ms('slow'), T * 0.07)
      const scale = ms('base') / 220
      const add = run.mark

      const logLines: { t: number; text: string; n: number }[] = []
      const valLines: { t: number; text: string }[] = []
      let steps = 0
      /** A build step gets the next number in the log's gutter; a later stage's line (`ink 031`) refers back to it. */
      const log = (t: number, text: string, vals: string[], numbered = true) => {
        logLines.push({ t, text, n: numbered ? ++steps : 0 })
        vals.forEach((v, i) => valLines.push({ t: t + i * ms('instant'), text: v }))
        return steps
      }
      // each stage logs the values it applies: geometry when drafted, fills when toned, type when set
      const TONED = /^(fill|line|shadow)\b/
      const SET = /^(type|ink)\b/

      // Survey: the grid unrolls, the cross lands on the start corner, the bounds go round with their dimensions.
      const sx = rtl ? W : 0
      const grid = pattern(pc, GRID * 8, (t, s) => {
        t.fillStyle = pencil
        for (let gy = 0; gy < 8; gy++)
          for (let gx = 0; gx < 8; gx++) {
            t.globalAlpha = gx === 0 && gy === 0 ? 0.9 : 0.42
            t.fillRect(gx * GRID * dpr, gy * GRID * dpr, lw, lw)
          }
        // a small cross every eighth line, centred on the grid point (the tile wraps, so the arms are drawn on both edges)
        t.globalAlpha = 0.85
        const arm = 2 * dpr
        t.fillRect(0, 0, arm + lw, lw)
        t.fillRect(s - arm, 0, arm, lw)
        t.fillRect(0, 0, lw, arm + lw)
        t.fillRect(0, s - arm, lw, arm)
      })
      if (grid) {
        let row = Y(0)
        add(pc, 0, surveyEnd * 0.7, (ctx, q) => {
          const to = Y(0) + r0(H * dpr * q)
          if (to <= row) return
          ctx.fillStyle = grid
          ctx.globalAlpha = 0.55
          ctx.fillRect(X(0), row, X(W) - X(0), to - row)
          ctx.globalAlpha = 1
          row = to
        })
      }
      add(fc, 0, surveyEnd * 0.35, tint(ink, 1, both(rule(sx - 9, 0, sx + 10, 0), rule(sx, -9, sx, 10), circle(sx + 0.5, 0.5, 5, 'dots'))), 'enter')
      add(fc, surveyEnd * 0.15, surveyEnd * 0.75, tint(ink, 0.9, outline(plan, 'dots')))
      // construction lines run on past the corners (only the overrun: the edge itself is the dotted bound)
      const over = 16
      add(
        fc,
        surveyEnd * 0.3,
        surveyEnd * 0.6,
        tint(
          pencil,
          0.8,
          both(
            rule(-over, 0, -2, 0, 3),
            rule(W + 1, 0, W + over, 0, 3),
            rule(-over, H - 1, -2, H - 1, 3),
            rule(W + 1, H - 1, W + over, H - 1, 3),
            rule(0, H + 1, 0, H + over, 3),
            rule(W - 1, H + 1, W - 1, H + over, 3),
          ),
        ),
      )
      // dimension lines: extension lines off the object, slash ticks, the size counting up on a knockout
      const dims = (horizontal: boolean, len: number, at: number) => {
        const a = horizontal ? { x1: 0, y1: at, x2: W - 1, y2: at } : { x1: at, y1: 0, x2: at, y2: H - 1 }
        const ext = horizontal
          ? [rule(0, -4, 0, at - 5), rule(W - 1, -4, W - 1, at - 5)]
          : [rule(at < 0 ? -4 : W + 3, 0, at < 0 ? at - 5 : at + 5, 0), rule(at < 0 ? -4 : W + 3, H - 1, at < 0 ? at - 5 : at + 5, H - 1)]
        const slash = (x: number, y: number): Draw => {
          let drawn = false
          return (ctx, q) => {
            if (q < 1 || drawn) return
            drawn = true
            ctx.lineWidth = lw
            ctx.beginPath()
            ctx.moveTo((x - 3 + run.offX) * dpr, (y + 3 + run.offY) * dpr)
            ctx.lineTo((x + 4 + run.offX) * dpr, (y - 4 + run.offY) * dpr)
            ctx.stroke()
          }
        }
        const n = r0(len)
        return tint(
          lead,
          1,
          both(
            ...ext,
            rule(a.x1, a.y1, a.x2, a.y2),
            slash(a.x1 + 0.5, a.y1 + 0.5),
            slash(a.x2 + 0.5, a.y2 + 0.5),
            label(String(n), horizontal ? W / 2 : at + 0.5, horizontal ? at + 0.5 : H / 2, 10, ink, 'center', n, 500),
          ),
        )
      }
      add(fc, surveyEnd * 0.35, surveyEnd * 0.65, dims(true, W, -20), 'emphasized')
      add(fc, surveyEnd * 0.45, surveyEnd * 0.55, dims(false, H, rtl ? W + 19 : -20), 'emphasized')
      occupied.push({ x: -M, y: -M, w: W + 2 * M, h: M - 6 }, { x: rtl ? W + 4 : -M, y: 0, w: M - 4, h: H })
      add(fc, surveyEnd * 0.85, surveyEnd * 0.3, label(`${r0(W)},${r0(H)}`, rtl ? 0 : W, H + 14, 9, lead, rtl ? 'left' : 'right'))
      add(fc, surveyEnd * 0.6, surveyEnd * 0.4, label(`${L.blueprintGrid} ${GRID} px`, rtl ? W : 0, H + 14, 9, pencil, rtl ? 'right' : 'left'))
      log(0, `${L.blueprintFrame} ${size(plan)}`, [`w ${r0(W)}`, `h ${r0(H)}`, ...boxVals(plan.style)])

      for (const p of plan.parts) if (p.kind === 'text' || p.kind === 'icon') occupied.push({ x: p.x - 2, y: p.y - 2, w: p.w + 4, h: p.h + 4 })

      // Layout: the main regions measured off inside, outside-in, each with an index, its size and its corner.
      let index = 0
      const regionStep = plan.regions.length ? (layoutEnd - surveyEnd * 0.8) / plan.regions.length : 0
      plan.regions.forEach((r, i) => {
        const t = surveyEnd * 0.8 + i * regionStep
        add(pc, t, step * 1.4, tint(pencil, 0.75, outline(r, 'dash')))
        const corner = rtl ? r.x + r.w - 3 : r.x + 3
        const spot = placed(`00 ${size(r)}  ${r0(r.x)},${r0(r.y)}`, [
          [corner, r.y + 9.5],
          [corner, r.y + r.h - 9.5],
          [corner, r.y - 9.5],
        ])
        if (spot) {
          add(pc, t + step * 0.3, step * 0.6, tag(++index, spot.x - (rtl ? 0 : 2), spot.y - 6.5 * ts))
          const off = (rtl ? -1 : 1) * (measure('00', 9) + 10 * ts)
          add(pc, t + step * 0.5, step, label(size(r), spot.x + off, spot.y, 9, lead, rtl ? 'right' : 'left'))
          const sizeW = measure(size(r), 9) + 8
          add(
            pc,
            t + step * 0.8,
            step * 0.6,
            label(`${r0(r.x)},${r0(r.y)}`, spot.x + off + (rtl ? -sizeW : sizeW), spot.y, 9, pencil, rtl ? 'right' : 'left'),
          )
        }
        log(t, `${L.blueprintRegion} ${cut(r.name, 16).replace(/^(div|span)$/, L.blueprintBox)} ${size(r)}`, [
          `w ${r0(r.w)}`,
          `h ${r0(r.h)}`,
          ...boxVals(r.style),
        ])
      })

      // Detail: every part pencilled by kind, in reading order.
      const markOf = (p: Part): Draw => {
        const cx = p.x + p.w / 2
        const cy = p.y + p.h / 2
        switch (p.kind) {
          case 'text':
            return chain(
              ...p.lines!.map((l) => {
                const base = r0(l.y + l.h - l.h * 0.2) + 0.5
                const start = rtl ? l.x + l.w : l.x
                const tick = r0(start) - (rtl ? 1 : 0)
                return both(
                  tint(pencil, 1, dots(start, base, rtl ? l.x : l.x + l.w, base, 3)),
                  tint(lead, 1, rule(tick, base - 0.5, tick, base - 0.5 - r0(l.cap))),
                )
              }),
            )
          case 'icon':
            return tint(pencil, 1, both(outline(p, 'dots', 3), centre(cx, cy)))
          case 'media':
            return p.round
              ? tint(pencil, 1, both(circle(cx, cy, p.w / 2 - 0.5, 'dots'), centre(cx, cy, 4)))
              : tint(
                  pencil,
                  1,
                  both(
                    outline(p, 'dots'),
                    dots(p.x + 0.5, p.y + 0.5, p.x + p.w - 0.5, p.y + p.h - 0.5),
                    dots(p.x + p.w - 0.5, p.y + 0.5, p.x + 0.5, p.y + p.h - 0.5),
                  ),
                )
          case 'chart': {
            const l = r0(p.x)
            const b = r0(p.y + p.h) - 1
            const ticks = Array.from({ length: 5 }, (_, i) => rule(l + r0(((i + 1) * p.w) / 6), b + 1, l + r0(((i + 1) * p.w) / 6), b + 4))
            const yTicks = Array.from({ length: 3 }, (_, i) => rule(l - 4, b - r0(((i + 1) * p.h) / 4), l, b - r0(((i + 1) * p.h) / 4)))
            return tint(lead, 1, chain(rule(l, r0(p.y), l, b + 1), rule(l, b, r0(p.x + p.w), b), both(...ticks, ...yTicks)))
          }
          case 'divider':
            return tint(pencil, 1, rail(p, 3))
          case 'row': {
            // a row is one line, on its foot, with a tick where it starts
            const y = r0(p.y + p.h) - 0.5
            const s = rtl ? p.x + p.w - 0.5 : p.x + 0.5
            return both(
              tint(pencil, 1, dots(s, y, rtl ? p.x + 0.5 : p.x + p.w - 0.5, y, 3)),
              tint(lead, 1, rule(r0(s - 0.5), y - 6.5, r0(s - 0.5), y + 0.5)),
            )
          }
          case 'field': {
            const x = r0(rtl ? p.x + p.w - 12 : p.x + 12)
            return both(tint(pencil, 1, outline(p, 'dots')), tint(ink, 1, rule(x, r0(p.y + p.h * 0.28), x, r0(p.y + p.h * 0.72))))
          }
          default:
            // a bar too thin for two rows of dots (a progress track, a meter) is one dotted line through its middle
            if (p.h <= 10) return tint(pencil, 1, dots(rtl ? p.x + p.w : p.x, r0(cy) + 0.5, rtl ? p.x : p.x + p.w, r0(cy) + 0.5, 3))
            if (p.w <= 10) return tint(pencil, 1, dots(r0(cx) + 0.5, p.y, r0(cx) + 0.5, p.y + p.h, 3))
            return tint(pencil, p.kind === 'surface' ? 0.85 : 1, outline(p, 'dots'))
        }
      }
      /** A divider's rule along its edge, in the reading direction (dashed, or solid when `dash` is 0). */
      const rail = (p: Part, dash = 0) => {
        const e = p.edge ?? 'top'
        const y = e === 'bottom' ? r0(p.y + p.h) - 1 : r0(p.y)
        const x = e === 'right' ? r0(p.x + p.w) - 1 : r0(p.x)
        return e === 'top' || e === 'bottom' ? rule(rtl ? p.x + p.w : p.x, y, rtl ? p.x : p.x + p.w, y, dash) : rule(x, p.y, x, p.y + p.h, dash)
      }
      const number = new Map<Part, number>()
      const drafted = plan.parts.filter((p) => !p.quiet)
      const each = drafted.length ? (detailEnd - layoutEnd * 0.92) / drafted.length : 0
      drafted.forEach((p, i) => {
        const t = layoutEnd * 0.92 + i * each
        add(pc, t, Math.max(step, Math.min(step * 2.2, (p.w + p.h) * 1.2 * scale)), markOf(p))
        number.set(
          p,
          log(
            t,
            logOf(p),
            valsOf(p).filter((v) => !TONED.test(v) && !SET.test(v)),
          ),
        )
        if (p.kind === 'text' || p.kind === 'divider' || p.kind === 'row' || p.kind === 'icon' || p.w < 36 || p.h < 16) return
        // a region already carries this box's number
        if (plan.regions.some((r) => Math.abs(r.x - p.x) < 1 && Math.abs(r.y - p.y) < 1 && Math.abs(r.w - p.w) < 1 && Math.abs(r.h - p.h) < 1)) return
        const start = rtl ? p.x + p.w : p.x
        const spot = placed(`00 ${size(p)}`, [
          [start, p.y - 8],
          [start, p.y + p.h + 8],
          [rtl ? p.x : p.x + p.w, p.y + p.h + 8],
        ])
        if (!spot) return
        add(pc, t + step * 0.2, step * 0.5, tag(++index, spot.x - (rtl ? 0 : 2), spot.y - 6.5 * ts))
        add(
          pc,
          t + step * 0.4,
          step * 0.8,
          label(size(p), spot.x + (rtl ? -1 : 1) * (measure('00', 9) + 10 * ts), spot.y, 9, lead, rtl ? 'right' : 'left'),
        )
      })

      // ── Ink, tone, set: the drawing builds up into the UI, part by part, each stage in build order ──
      const ref = (p: Part) => (number.has(p) ? String(number.get(p)).padStart(3, '0') : logOf(p))
      let around: Path2D | undefined
      const aroundLabels = (draw: Draw): Draw => {
        if (typeof Path2D !== 'function') return draw
        return (ctx, q) => {
          if (!around) {
            around = new Path2D()
            around.rect(0, 0, ctx.canvas.width, ctx.canvas.height)
            for (const b of labelled) around.rect(X(b.x) - 2, Y(b.y), X(b.x + b.w) - X(b.x) + 4, Y(b.y + b.h) - Y(b.y))
          }
          ctx.save()
          ctx.clip(around, 'evenodd')
          draw(ctx, q)
          ctx.restore()
        }
      }
      // ink: every drafted outline is traced over solid; type, icons and charts wait for the set
      // (a row's own controls, its badges and buttons, are inked too: the row drew them as one line, the ink gives them their shape)
      const inked = plan.parts.filter((p) => p.kind !== 'text' && p.kind !== 'icon' && p.kind !== 'chart' && (!p.quiet || p.kind === 'control'))
      spread(inked, span.ink, (p, t, d) => {
        const cy = r0(p.y + p.h / 2)
        const foot = r0(p.y + p.h) - 1
        const draw =
          p.kind === 'divider'
            ? rail(p)
            : p.kind === 'row'
              ? rule(rtl ? p.x + p.w : p.x, foot, rtl ? p.x : p.x + p.w, foot)
              : p.round
                ? circle(p.x + p.w / 2, p.y + p.h / 2, p.w / 2 - 0.5, 'solid')
                : p.h <= 10
                  ? rule(rtl ? p.x + p.w : p.x, cy, rtl ? p.x : p.x + p.w, cy)
                  : outline(p, 'solid')
        add(pc, t, d, aroundLabels(tint(ink, 0.85, draw)))
        log(t, `${L.blueprintInk} ${ref(p)}`, [], false)
      })

      // tone: filled boxes as greys, by what their fill is for; media as a screen
      const hatch = pattern(tc, 5, (x, n) => {
        x.strokeStyle = pencil
        x.lineWidth = Math.max(1, dpr * 0.75)
        x.beginPath()
        x.moveTo(-1, n + 1)
        x.lineTo(n + 1, -1)
        x.stroke()
      })
      const halftone = pattern(tc, 4, (x, n) => {
        x.fillStyle = lead
        x.beginPath()
        x.arc(n / 2, n / 2, n * 0.22, 0, Math.PI * 2)
        x.fill()
      })
      spread(
        drafted.filter((p) => p.tone !== undefined && p.kind !== 'divider'),
        span.tone,
        (p, t, d) => {
          const v = p.tone!
          // a screen for media; solid ink for a strong fill (a primary button, a badge); hatching for a well or a control;
          // a faint flat grey for the page's own surfaces (cards, panels), so the layout reads as solid shapes, never heavy
          const [fill, alpha] = p.kind === 'media' ? [halftone, 0.9] : v > 0.45 ? [ink, 0.82] : v > 0.15 ? [hatch, 0.45] : [lead, 0.07]
          if (!fill) return
          const x0 = X(p.x)
          const y0 = Y(p.y)
          const y1 = Y(p.y + p.h)
          let at = y0
          add(
            tc,
            t,
            d,
            aroundLabels((ctx, q) => {
              const to = r0(y0 + (y1 - y0) * q)
              if (to <= at) return
              ctx.fillStyle = fill
              ctx.globalAlpha = alpha
              ctx.fillRect(x0, at, X(p.x + p.w) - x0, to - at)
              ctx.globalAlpha = 1
              at = to
            }),
          )
          log(
            t,
            `${L.blueprintTone} ${logOf(p)}`,
            valsOf(p).filter((v) => TONED.test(v)),
            false,
          )
        },
      )

      // set: type sets in, line by line, wiping its pencil away as it goes; icons and charts trace their own shapes
      const settable = plan.parts.filter(
        (p) => (p.kind === 'text' && p.glyphs?.length) || ((p.kind === 'icon' || p.kind === 'chart') && p.shapes?.length),
      )
      spread(settable, span.set, (p, t, d) => {
        const words = logOf(p)
        if (p.kind === 'text') {
          const lines = p.glyphs!.map((g) =>
            reveal(g, true, (ctx) => {
              ctx.font = p.font!
              ctx.letterSpacing = p.spacing!
              ctx.direction = rtl ? 'rtl' : 'ltr'
              ctx.textAlign = rtl ? 'right' : 'left'
              ctx.textBaseline = 'alphabetic'
              ctx.fillStyle = p.light ? paper : lead
              const descent = ctx.measureText(g.s).fontBoundingBoxDescent || g.h * 0.22
              ctx.fillText(g.s, rtl ? g.x + g.w : g.x, g.y + g.h - descent)
            }),
          )
          add(pc, t, d, chain(...lines), 'linear')
          log(
            t,
            `${L.blueprintSet} ${words.slice(words.indexOf(' ') + 1)}`,
            valsOf(p).filter((v) => SET.test(v)),
            false,
          )
        } else {
          const box = p.kind === 'icon' ? { x: p.x - 2, y: p.y - 2, w: p.w + 4, h: p.h + 4 } : p
          add(pc, t, d, reveal(box, p.kind === 'icon', paintShapes(p, ink, lead, 0.55)), 'linear')
          log(
            t,
            `${L.blueprintSet} ${words}`,
            valsOf(p).filter((v) => SET.test(v)),
            false,
          )
        }
      })

      // ── Side columns: the build log and the values, typed line by line, clipped to their side ──
      if (options.columns !== 'none') columnsOf(run, logLines, valLines, clear, L)

      // ── Finish: the root wipes in under a ruled edge, its parts fade in just behind it, the pencil is wiped ──
      const e0 = M - BLEED
      const e1 = M + H + BLEED
      // an even sweep: an eased one rushes through the middle of the demo, which reads as a jump to the end
      const atEdge = (y: number) => finishStart + Math.min(1, Math.max(0, (y + M - e0) / (e1 - e0))) * sweep
      const sweepOpts = { delay: finishStart, duration: sweep, easing: 'linear' }
      const { node } = run
      /* While it's drafted the demo is held at opacity 0 (a compositor layer: its own mount animations keep running
       * without being repainted through a mask); the wipe is a clip-path, which takes over on the same frame. */
      run.animate(node, [{ opacity: 0 }, { opacity: 0 }], { duration: finishStart, fill: 'none' })
      run.animate(node, [{ clipPath: `inset(-64px -64px calc(100% + ${BLEED}px) -64px)` }, { clipPath: `inset(-64px -64px -${BLEED}px -64px)` }], {
        ...sweepOpts,
        fill: 'none',
      })
      // the pencil clears through a soft band just behind the edge (the wipe's own top fades out), not at a hard line
      run.animate(wipe, [{ transform: `translateY(${e0 - FADE}px)` }, { transform: `translateY(${e1 - FADE}px)` }], { ...sweepOpts, fill: 'both' })
      run.animate(sheet, [{ transform: `translateY(${FADE - e0}px)` }, { transform: `translateY(${FADE - e1}px)` }], { ...sweepOpts, fill: 'both' })
      run.animate(edge, [{ transform: `translateY(${e0}px)` }, { transform: `translateY(${e1}px)` }], { ...sweepOpts, fill: 'both' })
      run.animate(edge, [{ opacity: 0 }, { opacity: 1, offset: 0.08 }, { opacity: 1, offset: 0.9 }, { opacity: 0 }], {
        delay: finishStart,
        duration: sweep + clear * 0.6,
        easing: 'linear',
        fill: 'both',
      })
      for (const p of units(plan, node)) {
        const el = p.el
        // before the edge reaches its top the wipe hides it; from there it holds at 0 until its fade
        run.later(atEdge(p.y), () =>
          run.animate(el, [{ opacity: 0 }, { opacity: 1 }], {
            delay: atEdge(p.y + Math.min(p.h * 0.35, 20)),
            duration: fade,
            easing: run.bezier('standard'),
          }),
        )
      }
      for (const el of plan.floating)
        run.animate(el, [{ opacity: 0 }, { opacity: 1 }], { delay: finishStart + sweep, duration: fade, easing: run.bezier('enter') })
      if (fc)
        run.animate(fc.canvas, [{ opacity: 1 }, { opacity: 0 }], {
          delay: finishStart + sweep * 0.6,
          duration: sweep * 0.4 + clear * 0.7,
          easing: run.bezier('standard'),
          fill: 'forwards',
        })
      run.frame((t) => {
        if (t >= finishStart && t <= finishStart + sweep)
          edgeY.textContent = `y ${r0(Math.max(0, Math.min(H, e0 + ((e1 - e0) * (t - finishStart)) / sweep - M)))}`
      })
    },
  }
  return entrance(node, options, look)
}

/** An icon's or a chart's own shapes, painted in ink (strokes) and grey (fills), in the demo's CSS px. */
const paintShapes = (p: Part, strokeStyle: string, fillStyle: string, fillAlpha: number) => (ctx: CanvasRenderingContext2D) => {
  for (const sh of p.shapes!) {
    ctx.save()
    ctx.transform(sh.m.a, sh.m.b, sh.m.c, sh.m.d, sh.m.e, sh.m.f)
    if (sh.fill) {
      ctx.globalAlpha = fillAlpha
      ctx.fillStyle = fillStyle
      ctx.fill(sh.path)
      ctx.globalAlpha = 1
    }
    if (sh.stroke) {
      ctx.lineWidth = sh.lw
      ctx.lineCap = sh.cap
      ctx.lineJoin = sh.join
      ctx.strokeStyle = strokeStyle
      ctx.stroke(sh.path)
    }
    ctx.restore()
  }
}

/** The two side columns, the build log and the values, when there is room beside the demo inside whatever clips it:
 *  each line types in at its moment, and the column scrolls as it fills. */
function columnsOf(
  run: Run<Stage>,
  logLines: { t: number; text: string; n: number }[],
  valLines: { t: number; text: string }[],
  clear: number,
  L: BlueprintLabels,
) {
  const { node, root, rtl, T, ms, plan } = run
  const k = plan.scale
  const CW = run.W + 2 * M
  const CH = run.H + 2 * M
  const n = node.getBoundingClientRect()
  let lo = 0
  let hi = innerWidth
  for (let el = node.parentElement; el; el = el.parentElement) {
    const o = getComputedStyle(el)
    if (o.overflowX !== 'visible' || o.overflow === 'hidden' || o.overflow === 'clip') {
      const c = el.getBoundingClientRect()
      lo = Math.max(lo, c.left)
      hi = Math.min(hi, c.right)
      break
    }
  }
  const colH = Math.max(CH, 176)
  for (const [room, right] of [
    [(n.left - lo) / k, false],
    [(hi - n.right) / k, true],
  ] as const) {
    if (room < COLUMN_ROOM) continue
    const isLog = right === rtl
    const width = Math.min(232, room - M - 20)
    const col = document.createElement('div')
    col.className = 'yj-en-l yj-bp-col'
    col.style.cssText = `width:${width}px;height:${colH}px;top:${(CH - colH) / 2}px;left:${right ? CW + 4 : -width - 4}px`
    // the columns are code: they read left to right on either side, in any direction
    col.dir = 'ltr'
    const head = document.createElement('b')
    head.className = 'yj-bp-h'
    head.textContent = isLog ? L.blueprintBuild : L.blueprintValues
    // the lines scroll inside a viewport under the title, never over it
    const view = document.createElement('div')
    view.className = 'yj-bp-v'
    view.style.cssText = `overflow:hidden;height:${colH - 34}px`
    const stack = document.createElement('div')
    view.append(stack)
    col.append(head, view)
    root.append(col)
    const lines: { t: number; text: string; n?: number }[] = isLog ? logLines : valLines
    const cap = isLog ? 200 : 220
    const shown = lines.length > cap ? lines.filter((_, i) => i % Math.ceil(lines.length / cap) === 0) : lines
    const visible = Math.max(1, Math.floor((colH - 34 - 24) / 15))
    const moves: Keyframe[] = [{ offset: 0, transform: 'translateY(0px)' }]
    let lastMove = 0
    shown.forEach((line, i) => {
      const p = document.createElement('p')
      p.className = 'yj-bp-ln'
      if (isLog) {
        const num = document.createElement('i')
        num.className = 'yj-bp-n'
        // a later stage's line (`ink 031`) keeps the gutter blank: it refers back to a numbered step
        num.textContent = line.n ? `${String(line.n).padStart(3, '0')}  ` : '     '
        p.append(num)
      }
      p.append(line.text)
      stack.append(p)
      const chars = Math.max(4, line.text.length)
      run.later(line.t, () =>
        run.animate(p, [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], {
          delay: line.t,
          duration: Math.min(ms('slow'), chars * ms('instant') * 0.18),
          easing: `steps(${chars}, end)`,
          fill: 'forwards',
        }),
      )
      if (i >= visible) {
        const at = line.t / T
        const y = `translateY(${-(i - visible + 1) * 15}px)`
        if (at - lastMove > ms('fast') / T) {
          moves.push(
            { offset: at, transform: moves[moves.length - 1]!.transform as string },
            { offset: Math.min(1, at + ms('fast') / T), transform: y },
          )
          lastMove = at + ms('fast') / T
        } else moves[moves.length - 1]!.transform = y
      }
    })
    if (moves.length > 1) {
      moves.push({ offset: 1, transform: moves[moves.length - 1]!.transform as string })
      run.animate(stack, moves, { duration: T, easing: 'linear', fill: 'both' })
    }
    run.animate(col, [{ opacity: 1 }, { opacity: 0 }], { delay: T - clear, duration: clear, easing: run.bezier('exit'), fill: 'forwards' })
    run.animate(col, [{ opacity: 0 }, { opacity: 1 }], { duration: ms('slow'), easing: run.bezier('enter') })
  }
}
