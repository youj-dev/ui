import { motionPersonalities, type DurationToken, type EasingToken, type MotionPersonality } from '@youj/core/lib/youj/tokens'
import { read, type Plan, type Reader } from './read'

/* The entrances' shared runtime: everything an entrance does that isn't its look. A look (Blueprint, Generate, Code,
 * Prism) describes what it draws and when; this decides whether it plays at all (reduced motion), how long it
 * runs (the demo's size, `duration`, `speed`, the provider's time scale, `phases`), places the overlay beside the demo
 * without moving it, reads the demo once (./read.ts), runs one clock for the marks drawn on canvases and the Web
 * Animations on the demo, and ends cleanly: at its end, on cancel(), on an aborted signal, on a press or focus in the
 * demo, or when the demo leaves the page. Whatever the run touched on the demo (an animation, a held style) is put
 * back exactly, so the end is the demo as it would be with no entrance at all. A run can also be driven by a clock of
 * its own (`paused`, then `seek`), so a video renderer or a scrubber gets the same picture for the same time. */

export interface EntranceOptions {
  /** The whole run in ms, before `speed`. Default: from the demo's size and part count. */
  duration?: number
  /** Multiplies the pace: 2 plays twice as fast. Default 1. */
  speed?: number
  /** Each stage's share of the run, as weights (normalized, so they never change the total; a stage left out keeps its default, and 0 skips it). */
  phases?: object
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

export interface EntranceRun {
  /** Restores the demo at once and removes everything the run added. */
  cancel(): void
  /** Settles when the run ends, finished or cancelled. */
  finished: Promise<void>
  /** Shows the run at `t` ms from its start and holds it there: its animations paused at `t`, its marks drawn up to
   *  `t`. It stops playing on its own clock; a `t` at or past its end ends it. Marks only draw forwards, so a `t`
   *  earlier than the last is held at the last (to go back, start a new run and seek it). */
  seek(t: number): void
}

export type Draw = (ctx: CanvasRenderingContext2D, q: number) => void

export interface Look<S extends string> {
  /** Names the overlay (`data-yj-<name>`). */
  name: string
  /** The look's stylesheet; every rule should end on a class of its own, so adding or removing it restyles only the overlay. */
  css?: string
  /** How far (CSS px) the overlay reaches past the demo on every side. */
  margin: number
  /** The stages in order, with their default shares of the run. */
  phases: Record<S, number>
  /** The default run length, in units of the `deliberate` duration token. */
  length(plan: Plan): number
  /** Shares a stage the demo can't use out to another (Blueprint's layout goes to detail when there are no regions). */
  fold?(plan: Plan): Partial<Record<S, S>>
  /** Schedules the look: its marks, animations and per-frame work. */
  play(run: Run<S>): void
  /** What the look reads beyond the parts (Blueprint's token names, tones and glyphs); `probeHost` takes a probe element. */
  reader?(probeHost: Element): Reader
}

export interface Run<S extends string> {
  node: HTMLElement
  plan: Plan
  /** The demo's width and height in its own CSS px; the overlay's origin is (−margin, −margin) of it. */
  W: number
  H: number
  rtl: boolean
  /** The whole run, ms. */
  T: number
  /** Each stage's [start, end], ms. */
  span: Record<S, [number, number]>
  ms(token: DurationToken): number
  ease(token: EasingToken): (x: number) => number
  /** A token's curve as CSS, for Web Animations. */
  bezier(token: EasingToken): string
  /** The overlay: absolutely placed over the demo and `margin` past it, aria-hidden, never under the pointer. */
  root: HTMLElement
  /** A canvas the size of the overlay, on whole device pixels. */
  canvas(className?: string): CanvasRenderingContext2D | null
  /** Canvas pixels per CSS px of the demo. */
  dpr: number
  /** A 1 CSS px line, in canvas pixels. */
  lw: number
  /** Demo CSS px to canvas pixels (rounded to whole pixels). */
  X(x: number): number
  Y(y: number): number
  /** The demo's offset in the overlay (the margin, plus the sub-pixel part of the demo's position). */
  readonly offX: number
  readonly offY: number
  /** Type keeps a readable size on screen when the demo is shown scaled down: multiply label sizes by it. */
  ts: number
  /** A CSS colour (a token: `var(--color-fg)`) as the overlay sees it. */
  color(css: string): string
  /** A Web Animation on the clock's zero (`delay` is from the run's start), cancelled at the end. */
  animate(el: Element, frames: Keyframe[], opts: KeyframeAnimationOptions): Animation
  /** Runs `fn` just before `at`: for animations that would cost a compositor layer the whole run if made up front. */
  later(at: number, fn: () => void): void
  /** A mark: `draw` is called with its progress (eased) from `t` for `d` ms, and draws only what's new. */
  mark(ctx: CanvasRenderingContext2D | null, t: number, d: number, draw: Draw, ease?: EasingToken): void
  /** Called every frame with the run's time. */
  frame(fn: (t: number) => void): void
  /** Runs when the run ends, however it ends. */
  ended(fn: () => void): void
  /** Holds an element hidden by its inline opacity (no animation, so no compositor layer while it waits). */
  hold(el: Element): void
  /** Puts its style attribute back exactly as it was; everything held is released when the run ends. */
  release(el: Element): void
}

const sheets = new Map<string, { n: number; el: HTMLStyleElement }>()
const BASE =
  '.yj-en{position:absolute;pointer-events:none;contain:layout style;user-select:none}.yj-en-l{position:absolute;box-sizing:border-box;margin:0}'
/** How long (ms) before its moment a late animation is created. */
const AHEAD = 300

/** A cubic-bezier as a function of progress (bisection: exact enough for pixels, and small). */
export function curve([x1, y1, x2, y2]: readonly [number, number, number, number]) {
  const b = (a: number, c: number, t: number) => 3 * a * (1 - t) * (1 - t) * t + 3 * c * (1 - t) * t * t + t * t * t
  return (x: number) => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    let lo = 0
    let hi = 1
    let t = x
    for (let i = 0; i < 18; i++) {
      t = (lo + hi) / 2
      if (b(x1, x2, t) < x) lo = t
      else hi = t
    }
    return Math.min(1, Math.max(0, b(y1, y2, t)))
  }
}

const done: EntranceRun = { cancel() {}, finished: Promise.resolve(), seek() {} }

export function entrance<S extends string>(node: HTMLElement, options: EntranceOptions, look: Look<S>): EntranceRun {
  const { signal } = options
  if (signal?.aborted || !node.isConnected) return done
  const cs = getComputedStyle(node)
  const reduced = options.reduced ?? (cs.getPropertyValue('--yj-motion').trim() === '0' || matchMedia('(prefers-reduced-motion: reduce)').matches)
  if (reduced) return done

  const named = (options.personality ?? node.closest('[data-yj-motion]')?.getAttribute('data-yj-motion')) as MotionPersonality
  const tokens = motionPersonalities[named] ?? motionPersonalities.precise
  const scale = (Number.parseFloat(cs.getPropertyValue('--yj-time-scale')) || 1) / Math.max(options.speed ?? 1, 0.05)
  const M = look.margin

  // ── The overlay beside the demo; inserting it must move nothing (a `:last-child` rule could), else it goes elsewhere ──
  const before = node.getBoundingClientRect()
  const parentBefore = node.parentElement?.getBoundingClientRect()
  const root = document.createElement('div')
  root.className = `yj-en yj-${look.name}`
  root.setAttribute(`data-yj-${look.name}`, '')
  root.setAttribute('aria-hidden', 'true')
  const z = Number.parseInt(cs.zIndex, 10)
  root.style.zIndex = String(Number.isNaN(z) ? 1 : z + 1)
  const same = (a?: DOMRect, b?: DOMRect) => !a || !b || (a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height)
  const still = () => same(before, node.getBoundingClientRect()) && same(parentBefore, node.parentElement?.getBoundingClientRect())
  node.after(root)
  if (!still()) {
    node.before(root)
    if (!still()) document.body.append(root)
  }
  const css = BASE + (look.css ?? '')
  let entry = sheets.get(look.name)
  if (!entry) {
    const el = document.createElement('style')
    el.textContent = css
    document.head.append(el)
    sheets.set(look.name, (entry = { n: 0, el }))
  }
  entry.n++

  const plan = read(node, root, look.reader?.(root))
  const { w: W, h: H, rtl } = plan
  // canvas pixels per CSS px of the demo: the screen's density, times the demo's own scale when it's shown zoomed
  const k = plan.scale
  const screen = Math.min(Math.max(devicePixelRatio || 1, 1), 2)
  const dpr = screen * k
  const CW = W + 2 * M
  const CH = H + 2 * M
  // the overlay sits on whole device pixels, so a 1px line on an element's edge lands on that edge's pixels
  let offX = 0
  let offY = 0
  const place = () => {
    const n = node.getBoundingClientRect()
    root.style.left = '0px'
    root.style.top = '0px'
    const o = root.getBoundingClientRect()
    const left = Math.floor((n.left - M * k) * screen) / screen
    const top = Math.floor((n.top - M * k) * screen) / screen
    root.style.left = `${(left - o.left) / k}px`
    root.style.top = `${(top - o.top) / k}px`
    offX = (n.left - left) / k
    offY = (n.top - top) / k
  }
  root.style.width = `${CW}px`
  root.style.height = `${CH}px`
  place()
  let view = 1
  try {
    const f = window.frameElement
    if (f) view = f.getBoundingClientRect().width / innerWidth || 1
  } catch {}

  // ── Time: the length from the demo, then each stage's share of it ──
  const T = (options.duration ?? tokens.durations.deliberate * look.length(plan)) * scale
  const order = Object.keys(look.phases) as S[]
  const weight = (n: number | undefined) => (Number.isFinite(n) && n! > 0 ? n! : 0)
  const share = Object.fromEntries(
    order.map((s) => [s, weight(({ ...look.phases, ...options.phases } as Record<string, number | undefined>)[s])]),
  ) as Record<S, number>
  for (const [from, to] of Object.entries(look.fold?.(plan) ?? {}) as [S, S][]) {
    share[to] += share[from]
    share[from] = 0
  }
  const total = order.reduce((sum, s) => sum + share[s], 0) || 1
  const span = {} as Record<S, [number, number]>
  let sofar = 0
  for (const s of order) {
    span[s] = [(T * sofar) / total, (T * (sofar + share[s])) / total]
    sofar += share[s]
  }

  const probe = document.createElement('i')
  const anims: Animation[] = []
  const zero = document.timeline?.currentTime ?? null
  // driven by `seek`: the animations are paused and set to the run's time, `at`, instead of following the timeline
  let manual = options.paused ?? false
  let at = 0
  const queue: { at: number; fn: () => void }[] = []
  const marks: { t: number; d: number; ease: (x: number) => number; ctx: CanvasRenderingContext2D; p: number; draw: Draw }[] = []
  const frames: ((t: number) => void)[] = []
  const endings: (() => void)[] = []
  const held = new Map<Element, string | null>()
  const run: Run<S> = {
    node,
    plan,
    W,
    H,
    rtl,
    T,
    span,
    ms: (t) => tokens.durations[t] * scale,
    ease: (t) => curve(tokens.easings[t]),
    bezier: (t) => `cubic-bezier(${tokens.easings[t].join(',')})`, // youj-allow: the CSS form of the token's own curve
    root,
    canvas(className = '') {
      const c = document.createElement('canvas')
      c.className = `yj-en-l ${className}`
      // measurements read left to right in any language
      c.dir = 'ltr'
      c.width = Math.round(CW * dpr)
      c.height = Math.round(CH * dpr)
      c.style.cssText = `left:0;top:0;width:${c.width / dpr}px;height:${c.height / dpr}px`
      const ctx = c.getContext('2d')
      // a canvas's backing store is made on its first draw: now, with the rest of the setup, not in the middle of the run
      ctx?.clearRect(0, 0, 1, 1)
      root.append(c)
      return ctx
    },
    dpr,
    lw: Math.max(1, Math.round(dpr)),
    X: (x) => Math.round((x + offX) * dpr),
    Y: (y) => Math.round((y + offY) * dpr),
    get offX() {
      return offX
    },
    get offY() {
      return offY
    },
    ts: Math.min(1.6, Math.max(1, 1 / (k * view))),
    color(v) {
      if (!probe.isConnected) root.append(probe)
      probe.style.color = v
      return getComputedStyle(probe).color
    },
    animate(el, keyframes, opts) {
      const a = el.animate(keyframes, { fill: 'backwards', ...opts })
      if (manual) {
        a.pause()
        a.currentTime = at
      } else if (zero !== null) a.startTime = zero
      anims.push(a)
      return a
    },
    later: (at, fn) => queue.push({ at, fn }),
    mark(ctx, t, d, draw, e = 'standard') {
      if (ctx) marks.push({ t, d: Math.max(d, 1), ease: run.ease(e), ctx, p: 0, draw })
    },
    frame: (fn) => frames.push(fn),
    ended: (fn) => endings.push(fn),
    hold(el) {
      if (held.has(el)) return
      held.set(el, el.getAttribute('style'))
      ;(el as HTMLElement).style.setProperty('opacity', '0')
    },
    release(el) {
      if (!held.has(el)) return
      const v = held.get(el)!
      held.delete(el)
      // (read first: Chrome writes a style changed this task back to the attribute lazily, as style="", after a removal)
      el.getAttribute('style')
      if (v === null) el.removeAttribute('style')
      else el.setAttribute('style', v)
    },
  }
  look.play(run)
  probe.remove()

  // ── The clock ──
  let raf = 0
  let start = -1
  let ended = false
  let settle!: () => void
  const finished = new Promise<void>((resolve) => {
    settle = resolve
  })
  const stop = () => {
    if (ended) return
    ended = true
    cancelAnimationFrame(raf)
    // the overlay leaves first, so cancelling its held animations restyles nothing on screen
    root.remove()
    for (const a of anims) a.cancel()
    for (const fn of endings) fn()
    for (const el of [...held.keys()]) run.release(el)
    resize.disconnect()
    node.removeEventListener('focusin', cancel)
    node.removeEventListener('pointerdown', cancel)
    signal?.removeEventListener('abort', cancel)
    if (entry && !--entry.n) {
      entry.el.remove()
      sheets.delete(look.name)
    }
    settle()
  }
  const cancel = () => stop()
  queue.sort((x, y) => x.at - y.at)
  marks.sort((x, y) => x.t - y.t)
  let queued = 0
  let settled = 0
  /** Brings the run to `t`: the animations due by then made (a few a frame at most when playing, so parts that start
   *  together never land in one long frame), the marks drawn up to it, the per-frame work done. */
  const advance = (t: number, most: number) => {
    for (let n = 0; n < most && queued < queue.length && queue[queued]!.at <= t + AHEAD; n++) queue[queued++]!.fn()
    // marks are in start order: skip the finished ones at the front, stop at the first not yet due
    while (settled < marks.length && marks[settled]!.p >= 1) settled++
    for (let i = settled; i < marks.length; i++) {
      const m = marks[i]!
      if (t < m.t) break
      if (m.p >= 1) continue
      const q = m.ease(Math.min(1, (t - m.t) / m.d))
      if (q > m.p || q === 1) {
        m.draw(m.ctx, q)
        m.p = q
      }
    }
    for (const fn of frames) fn(t)
  }
  const tick = (now: number) => {
    if (!node.isConnected) return stop()
    if (start < 0) start = now
    const t = now - start
    advance(t, 8)
    if (t >= T) return stop()
    raf = requestAnimationFrame(tick)
  }
  const seek = (t: number) => {
    if (ended) return
    if (!node.isConnected) return stop()
    if (!manual) {
      manual = true
      cancelAnimationFrame(raf)
    }
    at = Math.max(at, Number.isFinite(t) ? t : 0)
    advance(at, Infinity)
    for (const a of anims) {
      a.pause()
      a.currentTime = at
    }
    if (at >= T) stop()
  }
  // every animation starts on the same frame as the clock, so what's drawn and what's animated agree
  if (!manual)
    raf = requestAnimationFrame((now) => {
      start = typeof zero === 'number' ? zero : now
      tick(now)
    })
  const resize = new ResizeObserver(place)
  resize.observe(node)
  // the demo stays live: reaching into it (focus, a press) ends the entrance and shows it as it is
  node.addEventListener('focusin', cancel)
  node.addEventListener('pointerdown', cancel)
  signal?.addEventListener('abort', cancel, { once: true })
  return { cancel, finished, seek }
}

/** Spreads a stage's items over its span, each starting in turn. One takes up to a third of the span, and less on a
 *  busy screen, so about eight are ever in flight: the work per frame stays small however many there are. A stage
 *  given no share is left out. */
export function spread<T>(list: T[], [from, to]: [number, number], fn: (item: T, t: number, d: number) => void) {
  if (to <= from) return
  const d = Math.max(Math.min((to - from) * 0.34, ((to - from) * 8) / Math.max(1, list.length)), 1)
  list.forEach((item, i) => fn(item, from + ((to - from - d) * i) / Math.max(1, list.length - 1), d))
}
