import { motionPersonalities, type MotionPersonality } from '@youj/core/lib/youj/tokens'
import type { Plan } from '@youj/motion/components/youj/effects/entrance/read'
import { curve, entrance, type EntranceRun, type Run } from '@youj/motion/components/youj/effects/entrance/run'
import { hasJsx, mapParts, shapeCode, shownText, type PartInfo, type Shown } from './code-map'

/** A box in the demo's frame, on screen pixels, with a corner radius. */
type Box = { x: number; y: number; w: number; h: number; r: number }
/** A text line: its left and right, top and bottom, in the demo's frame. */
type Line = { x: number; x2: number; top: number; bottom: number }

/* Docs site only: the Code entrance, a look on the shared entrance runtime (@youj/motion entrance/run.ts), which
 * reads the demo, keeps the clock and ends the run however it ends. The demo's own source types itself out in an editor panel beside it (or, with no
 * room beside it, over the stage's corner), and as each JSX line is written its parts "compile" into the demo: a
 * code-coloured ghost of the part flashes and the real part comes in under it, each kind its own way (a surface's
 * paint scales in, text types in, an icon draws, a button pops). Then "Compiled", the panel goes, and the demo is
 * exactly as it was.
 *
 * It reads the demo through the runtime (its kinds and its build order), and ./code-map.ts trims the source and
 * pairs lines with parts. The panel is one canvas (redrawn each frame while it types: a few dozen fillText calls),
 * the ghosts and the line-to-part links another; the demo only ever gets inline opacity, transform, clip-path and
 * paint, all put back. It runs on the runtime's clock; layout is read once, before anything is written. */

const MIN_SCALE = 0.72 // how small the demo may get to make room for the panel beside it

type Kind = 'surface' | 'text' | 'icon' | 'chart' | 'media' | 'pop' | 'divider' | 'glyph' | 'label'
type Part = {
  kind: Kind
  el: HTMLElement | SVGElement
  box: Box // in the demo's frame, on screen pixels
  info: PartInfo
  /** The part it can't come before (its surface, its button). */
  after?: Part
  lines?: Line[]
  line: number
  at: number
  dur: number
  done?: boolean
  /** A surface's paint copy, an icon's strokes, a divider's lines. */
  copy?: HTMLDivElement
  strokes?: SVGGeometryElement[]
  from?: number
  color: string
}

export interface CodeSource {
  code: string
  /** The highlighted markup the Code tabs show (lib/code-files.ts): a `<span class="line">` a line, a class per colour. */
  html: string
  /** Its name in the panel's tab. */
  file: string
}

export interface CodeRun {
  finished: Promise<void>
  cancel: () => void
}

const clamp = (x: number) => Math.max(0, Math.min(1, x))
const lerp = (a: number, b: number, p: number) => a + (b - a) * p
const win = (t: number, a: number, b: number) => clamp((t - a) / (b - a))
const smooth = (t: number, a: number, b: number) => {
  const q = win(t, a, b)
  return q * q * (3 - 2 * q)
}
const f2 = (n: number) => (+n).toFixed(2)

/** The token classes the highlighter writes (lib/code-theme.ts TOKEN_CLASS) and the colour each stands for. */
const TOKENS: Record<string, string> = {
  ck: 'keyword',
  cs: 'string',
  cn: 'number',
  cf: 'function',
  ct: 'type',
  cp: 'property',
  cc: 'comment',
  cu: 'punctuation',
  cd: 'danger',
}

/** The highlighted markup as tokens per line, `[text, colour name]`; null when it doesn't line up with the source. */
function tokens(html: string, count: number): [string, string][][] | null {
  const tpl = document.createElement('template')
  tpl.innerHTML = html
  const lines = [...tpl.content.querySelectorAll('.line')]
  if (lines.length !== count) return null
  return lines.map((line) => {
    const out: [string, string][] = []
    const walk = (n: Node, colour: string) => {
      for (const c of n.childNodes) {
        if (c.nodeType === 3) {
          if (c.nodeValue) out.push([c.nodeValue, colour])
        } else if (c instanceof Element) {
          const cls = [...c.classList].find((k) => TOKENS[k])
          walk(c, cls ? TOKENS[cls]! : colour)
        }
      }
    }
    walk(line, 'fg')
    return out
  })
}

/** A colour any CSS can write, as the canvas's rgb (a theme may write oklch or color-mix). */
function rgb(ctx: CanvasRenderingContext2D | null, css: string, fallback: string) {
  if (!ctx || !css) return fallback
  ctx.clearRect(0, 0, 1, 1)
  ctx.fillStyle = 'transparent'
  ctx.fillStyle = css
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
  return a ? `rgb(${r},${g},${b})` : fallback
}

export function compile(host: HTMLElement, root: HTMLElement, { speed = 1, source }: { speed?: number; source: CodeSource }): CodeRun {
  let END = 0
  let begin: ((run: Run<'run'>) => void) | undefined
  return entrance(
    root,
    { speed },
    {
      name: 'code',
      margin: 0,
      phases: { run: 1 },
      // the run's length is the typing's: work it out from the demo and its source, then play what was worked out
      length(plan) {
        const set = setup(host, root, plan, source)
        if (!set) return 0
        END = set.END
        begin = set.begin
        const named = root.closest('[data-yj-motion]')?.getAttribute('data-yj-motion') as MotionPersonality
        return END / (motionPersonalities[named] ?? motionPersonalities.precise).durations.deliberate
      },
      play(run) {
        begin?.(run)
      },
    },
  ) satisfies EntranceRun
}

/** Reads the demo and its source and times the run (no write before the last read); `begin` lays the run out. */
function setup(host: HTMLElement, root: HTMLElement, plan: Plan, source: CodeSource) {
  // A frame's page is drawn scaled down in the docs (a 1440 px screen in a 700 px frame): the panel grows by as much,
  // so its code reads at the size it would on the page.
  let z = 1
  try {
    const shown = window.frameElement?.getBoundingClientRect().width
    if (shown) z = Math.min(2.2, Math.max(1, innerWidth / shown))
  } catch {}
  const LH = 20 * z // the panel's line height
  const FS = 13 * z // and its font size
  const PAD = 10 * z
  const HEAD = 32 * z
  const GAP = 24 * z // between the panel and the demo
  const EDGE = 14 * z // the panel's margin inside the stage
  // ─── what's changed on the demo, to put back ───
  const touched = new Map<HTMLElement | SVGElement, Map<string, string>>()
  const attrs = new Map<Element, Map<string, string | null>>()
  // (an element without a style attribute gets none back, not an empty one)
  const bare = new Set<Element>()
  const set = (el: HTMLElement | SVGElement, prop: string, value: string) => {
    let saved = touched.get(el)
    if (!saved) {
      touched.set(el, (saved = new Map()))
      if (!el.hasAttribute('style')) bare.add(el)
    }
    if (!saved.has(prop)) saved.set(prop, el.style.getPropertyValue(prop))
    if (el.style.getPropertyValue(prop) !== value) el.style.setProperty(prop, value)
  }
  const setAttr = (el: Element, name: string, value: string) => {
    let saved = attrs.get(el)
    if (!saved) attrs.set(el, (saved = new Map()))
    if (!saved.has(name)) saved.set(name, el.getAttribute(name))
    el.setAttribute(name, value)
  }
  /** Puts an element's `props` back as they were (all of them, and its attributes, without a list). */
  const restore = (el: Element, props?: string[]) => {
    const saved = touched.get(el as HTMLElement)
    if (saved)
      for (const [prop, v] of saved) {
        if (props && !props.includes(prop)) continue
        ;(el as HTMLElement).style.setProperty(prop, v)
        saved.delete(prop)
      }
    if (bare.has(el) && el.getAttribute('style') === '') el.removeAttribute('style')
    if (props) return
    touched.delete(el as HTMLElement)
    const a = attrs.get(el)
    if (a) for (const [name, v] of a) v === null ? el.removeAttribute(name) : el.setAttribute(name, v)
    attrs.delete(el)
  }
  const SHOWN = ['opacity', 'transition', 'visibility']
  const rest = new Map<Element, number>()
  const fade = (el: HTMLElement | SVGElement, v: number) => {
    set(el, 'transition', 'none')
    set(el, 'opacity', f2(v * (rest.get(el) ?? 1)))
    set(el, 'visibility', v <= 0 ? 'hidden' : '')
  }
  const layers: HTMLElement[] = []
  let watch: MutationObserver | null = null
  const finish = () => {
    watch?.disconnect()
    for (const l of layers) l.remove()
    for (const el of [...touched.keys(), ...attrs.keys()]) restore(el)
  }

  // ─── 1. read: the demo, its stage, every style the run needs (no write before the last read) ───
  const H = host.getBoundingClientRect()
  const R = root.getBoundingClientRect()
  const k = plan.scale
  const N = root.getBoundingClientRect()
  const rtl = getComputedStyle(root).direction === 'rtl'
  const stageEl = root.closest<HTMLElement>('[data-preview-stage]')
  // the stage the panel may use (a frame's is its window), in the host's frame
  const S0 = stageEl?.getBoundingClientRect() ?? new DOMRect(0, 0, innerWidth, innerHeight)
  const S = { x: S0.left - H.left, y: S0.top - H.top, w: S0.width, h: S0.height }
  const D = { x: R.left - H.left, y: R.top - H.top, w: R.width, h: R.height }
  const posable = getComputedStyle(root).transform === 'none'
  // a bare demo's plate (the card the docs draw behind it, components/docs/preview-live.tsx) steps aside with it
  const plate = host.parentElement?.querySelector<HTMLElement>(':scope > [data-plate]') ?? null
  const plateBox = plate?.getBoundingClientRect()
  const hostStyle = getComputedStyle(host)
  const cssColour = (name: string) => hostStyle.getPropertyValue(`--code-${name}`).trim()
  const ENTER = curve([0.16, 1, 0.3, 1])
  const MOVE = curve([0.65, 0, 0.35, 1])
  const SPRING = curve([0.34, 1.45, 0.64, 1])

  const raw = source.code.replace(/\r/g, '').split('\n')
  const shown: Shown[] = shapeCode(source.code)
  const lineTokens = tokens(source.html, raw.length)
  // (a file with nothing to show: the demo is just there)
  if (!shown.some((s) => 'src' in s)) return undefined

  // the parts, in build order (the runtime's): each surface before what sits on it, a control before its icon and label
  const parts: Part[] = []
  const text = (el: Element) => (el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 120)
  const slotsOf = (el: Element) => {
    const out: string[] = []
    for (let x: Element | null = el; x; x = x.parentElement) {
      out.push(x.getAttribute('data-slot') ?? '')
      if (x === root) break
    }
    return out
  }
  const infoOf = (el: Element, extra: Partial<PartInfo> = {}): PartInfo => ({
    slots: slotsOf(el),
    tag: el.tagName.toLowerCase(),
    role: el.getAttribute('role') ?? undefined,
    icon: el.getAttribute('data-icon') ?? undefined,
    ...extra,
  })
  const box = (b: { x: number; y: number; w: number; h: number }): Box => ({ x: b.x * k, y: b.y * k, w: b.w * k, h: b.h * k, r: 0 })
  const made = new Map<unknown, Part>()
  // the demo's own paint (a card's fill, border and shadow) compiles first
  const s0 = plan.style
  if (s0.fill || s0.line || s0.shadow)
    made.set(
      root,
      parts[parts.push({ kind: 'surface', el: root, box: box(plan), info: infoOf(root), line: -1, at: 0, dur: 460, color: 'type' }) - 1]!,
    )
  const rootPart = made.get(root)
  for (const u of plan.parts) {
    const after = u.host ? made.get(u.host) : rootPart
    const el = u.el as HTMLElement
    let part: Part | undefined
    if (u.kind === 'surface' || u.kind === 'field' || (u.kind === 'row' && u.style.fill)) {
      const input = /^(input|textarea|select)$/.test(u.tag) ? (el as HTMLInputElement) : null
      part = {
        kind: 'surface',
        el,
        box: box(u),
        info: infoOf(el, input ? { text: input.value || input.placeholder } : {}),
        after,
        line: -1,
        at: 0,
        dur: 460,
        color: 'type',
      }
    } else if (u.kind === 'control')
      part = { kind: 'pop', el, box: box(u), info: infoOf(el, { text: text(el), weakText: true }), after, line: -1, at: 0, dur: 380, color: 'type' }
    else if (u.kind === 'text') {
      const lines = (u.lines ?? []).map((l) => ({ x: l.x * k, x2: (l.x + l.w) * k, top: l.y * k, bottom: (l.y + l.h) * k }))
      // a control's own words are its label: they come in with it, as its line writes them
      const kind = after?.kind === 'pop' && after.el === el ? 'label' : 'text'
      part = {
        kind,
        el,
        box: box(u.at ?? u),
        lines,
        info: kind === 'label' ? { slots: [], tag: '', text: text(el) } : infoOf(el, { text: text(el) }),
        after,
        line: -1,
        at: 0,
        dur: kind === 'label' ? 280 : 300,
        color: 'string',
      }
    } else if (u.kind === 'icon')
      part = { kind: after?.kind === 'pop' ? 'glyph' : 'icon', el, box: box(u), info: infoOf(el), after, line: -1, at: 0, dur: 420, color: 'type' }
    else if (u.kind === 'chart' || u.kind === 'media')
      part = { kind: u.kind, el, box: box(u), info: infoOf(el), after, line: -1, at: 0, dur: u.kind === 'chart' ? 700 : 600, color: 'type' }
    else if (u.kind === 'divider') {
      const y = u.edge === 'bottom' ? u.y + u.h - 1 : u.y
      const x = u.edge === 'right' ? u.x + u.w - 1 : u.x
      const line = u.edge === 'left' || u.edge === 'right' ? { x, y: u.y, w: 1, h: u.h } : { x: u.x, y, w: u.w, h: 1 }
      part = { kind: 'divider', el, box: box(line), info: infoOf(el), after, line: -1, at: 0, dur: 340, color: 'type' }
      ;(part as Part & { rule: { own: boolean } }).rule = { own: !!u.own }
    }
    if (!part) continue
    parts.push(part)
    if (part.kind === 'surface' || part.kind === 'pop') made.set(u, part)
  }
  // the demo's own words (a lone button's "Share")
  if ([...root.childNodes].some((n) => n.nodeType === 3 && n.nodeValue?.trim()))
    parts.splice(rootPart ? 1 : 0, 0, {
      kind: 'label',
      el: root,
      box: box(plan),
      info: { slots: [], tag: '', text: text(root) },
      after: rootPart,
      line: -1,
      at: 0,
      dur: 280,
      color: 'string',
    })

  // which line each part compiles with; a button's icon or label on its button's own line comes with it
  const texts = shown.map((s) => shownText(raw, s))
  const map = mapParts(
    texts,
    parts.map((p) => p.info),
  )
  parts.forEach((p, i) => (p.line = map[i]!))
  const live = parts.filter((p) => !((p.kind === 'glyph' || p.kind === 'label') && p.after && p.line <= p.after.line))

  // reads the run needs on each part: resting opacity, a transform of its own, an icon's stroked shapes, surface paint
  const placed = new Set<Element>()
  for (const p of live) {
    if (p.kind === 'label') continue
    const cs = getComputedStyle(p.el)
    rest.set(p.el, Number.parseFloat(cs.opacity) || 0)
    if (cs.transform !== 'none') placed.add(p.el)
    if (p.kind === 'icon' || p.kind === 'glyph')
      p.strokes = [...p.el.querySelectorAll<SVGGeometryElement>('path, circle, rect, line, polyline, polygon, ellipse')]
        .filter((g) => !g.closest('defs, clipPath, mask, symbol') && getComputedStyle(g).stroke !== 'none')
        .slice(0, 12)
  }
  const PAINT_SET = ['background-color', 'background-image', 'box-shadow', 'backdrop-filter', 'border-color']
  const PAINT = [
    'background-color',
    'background-image',
    'background-size',
    'background-position',
    'background-repeat',
    'box-shadow',
    'backdrop-filter',
  ]
  const SIDES = ['top', 'right', 'bottom', 'left']
  const CORNERS = ['top-left', 'top-right', 'bottom-right', 'bottom-left']
  const paint = new Map<Part, Map<string, string>>()
  for (const p of live) {
    if (p.kind !== 'surface') continue
    const cs = getComputedStyle(p.el)
    const k = (p.el as HTMLElement).offsetWidth ? p.box.w / (p.el as HTMLElement).offsetWidth : 1
    const m = new Map(PAINT.map((x) => [x, cs.getPropertyValue(x)]))
    for (const s of SIDES) {
      m.set(`border-${s}-style`, cs.getPropertyValue(`border-${s}-style`))
      m.set(`border-${s}-color`, cs.getPropertyValue(`border-${s}-color`))
      m.set(`border-${s}-width`, `${(Number.parseFloat(cs.getPropertyValue(`border-${s}-width`)) || 0) * k}px`)
    }
    m.set('border-radius', CORNERS.map((c) => `${(Number.parseFloat(cs.getPropertyValue(`border-${c}-radius`)) || 0) * k}px`).join(' '))
    paint.set(p, m)
    p.box = { ...p.box, r: (Number.parseFloat(cs.borderTopLeftRadius) || 0) * k }
  }
  for (const p of live) if (p.kind === 'pop') p.box = { ...p.box, r: Number.parseFloat(getComputedStyle(p.el).borderTopLeftRadius) || 0 }

  // ─── 2. timing: lines type in turn (a line that compiles something pauses to show it), parts compile as theirs ends ───
  const busy = new Set(live.map((p) => p.line))
  const typed = shown.map((s, i) => {
    const t = texts[i]!
    const indent = t.match(/^\s*/)![0].length
    return { indent, chars: 'fold' in s ? 0 : t.length - indent }
  })
  // the setup before the JSX (data, hooks) runs by in a blink, so the JSX is being written within half a second
  const firstJsx = Math.max(
    0,
    texts.findIndex((t, i) => hasJsx(t) || busy.has(i)),
  )
  const START = 220
  const preChars = typed.slice(0, firstJsx).reduce((a, x) => a + x.chars + 2, 0)
  const PRE = Math.min(280, preChars * 1.2)
  // (and what follows the last line that compiles something only closes up, quickly too)
  const lastBusy = Math.max(...busy)
  const idle = (x: { chars: number }, i: number) => (i > lastBusy ? x.chars * 0.08 + 0.3 : x.chars * 0.25 + 1)
  const weight = typed.map((x, i) => (i < firstJsx ? 0 : busy.has(i) ? x.chars + 18 : idle(x, i)))
  const sum = weight.reduce((a, b) => a + b, 0)
  const TYPE = Math.min(2900, Math.max(2300, sum * 11)) // a short file types no faster than a run of about 4 s allows
  const unit = TYPE / Math.max(1, sum)
  const lineAt: { start: number; typed: number; end: number }[] = []
  let clock = START
  typed.forEach((x, i) => {
    const span = i < firstJsx ? (PRE * (x.chars + 2)) / Math.max(1, preChars) : weight[i]! * unit
    const typing = i < firstJsx ? span : (busy.has(i) ? x.chars : idle(x, i)) * unit
    lineAt.push({ start: clock, typed: clock + typing, end: clock + span })
    clock += span
  })
  const TYPED = clock
  const perLine = new Map<number, Part[]>()
  for (const p of live) perLine.set(p.line, [...(perLine.get(p.line) ?? []), p])
  for (const p of live) {
    const mates = perLine.get(p.line)!
    const k = mates.indexOf(p)
    const base = p.line >= 0 ? lineAt[p.line]!.typed : START
    p.at = base + k * Math.min(70, 420 / mates.length)
    if (p.kind === 'text') p.dur = Math.min(620, 220 + (p.lines ?? []).reduce((a, l) => a + (l.x2 - l.x), 0) * 1.2)
  }
  // nothing before what it sits on (parts are in build order, so a surface is timed before what's on it)
  for (const p of live) if (p.after && live.includes(p.after)) p.at = Math.max(p.at, p.after.at + 90)
  const COMPILED = Math.max(TYPED, ...live.map((p) => p.at + p.dur)) + 120
  const OUT = COMPILED + 760
  const END = OUT + 520

  // ─── 3. where the panel goes ───
  const ctx0 = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
  const minIndent = Math.min(...typed.filter((_, i) => !('fold' in shown[i]!)).map((x) => x.indent))
  const longest = Math.max(20, ...typed.map((x) => x.chars + x.indent - minIndent))
  const CW = FS * 0.6 // a monospace cell, close enough for sizing (the real one is measured below)
  const gutter = String(raw.length).length * CW + 18 * z
  const ideal = Math.min(560 * z, Math.max(300 * z, gutter + longest * CW + PAD * 2))
  const contentH = HEAD + PAD * 2 + shown.length * LH
  let mode: 'side' | 'stack' | 'over' = 'over'
  let panel = { x: 0, y: 0, w: 0, h: 0 }
  let pose = { s: 1, dx: 0, dy: 0 }
  const fitH = (h: number) => Math.min(contentH, Math.max(170 * z, h))
  const widths = [...new Set([ideal, Math.min(ideal, 420 * z), Math.min(ideal, 340 * z)])]
  const h = fitH(S.h - 2 * EDGE)
  const y = Math.max(S.y + EDGE, Math.min(S.y + S.h - EDGE - h, D.y + D.h / 2 - h / 2))
  // what the panel keeps clear of: the demo, and its plate
  const B = plateBox
    ? (() => {
        const x = Math.min(D.x, plateBox.left - H.left)
        const y = Math.min(D.y, plateBox.top - H.top)
        return { x, y, w: Math.max(D.x + D.w, plateBox.right - H.left) - x, h: Math.max(D.y + D.h, plateBox.bottom - H.top) - y }
      })()
    : D
  const roomStart = B.x - S.x - EDGE - GAP
  const roomEnd = S.x + S.w - (B.x + B.w) - EDGE - GAP
  const fits = (w: number, s: number) => posable && S.w - 2 * EDGE - GAP - w >= s * B.w
  // beside the demo where it is (before it: code reads first; else after it), or with it moved over a little
  let moved: number | undefined
  for (const w of widths) {
    const [first, second] = rtl ? [roomEnd, roomStart] : [roomStart, roomEnd]
    if (first >= w || second >= w) {
      const left = first >= w !== rtl
      mode = 'side'
      panel = { x: left ? B.x - GAP - w : B.x + B.w + GAP, y, w, h }
      break
    }
    if (fits(w, 1)) {
      moved = w
      break
    }
  }
  // else the demo steps aside (and shrinks a little if it must) for the run, and comes back
  if (mode === 'over' && posable)
    for (const w of moved ? [moved] : widths) {
      const s = Math.min(1, (S.w - 2 * EDGE - GAP - w) / B.w)
      if (s < MIN_SCALE) continue
      const total = w + GAP + s * B.w
      const left = S.x + (S.w - total) / 2
      const boxLeft = rtl ? left : left + w + GAP
      mode = 'side'
      panel = { x: rtl ? left + s * B.w + GAP : left, y, w, h }
      // (the demo scales about its own middle: where its kept-clear box lands decides the shift)
      const mid = D.x + D.w / 2
      pose = { s, dx: boxLeft - (mid + s * (B.x - mid)), dy: 0 }
      break
    }
  // no room beside it (a narrow stage): the panel above it, the demo shrunk a little under it for the run
  const HMIN = HEAD + PAD * 2 + 6 * LH
  if (mode === 'over' && posable) {
    const s = Math.min(1, (S.h - 2 * EDGE - GAP - HMIN) / B.h, (S.w - 2 * EDGE) / B.w)
    if (s >= 0.6) {
      const w = Math.min(S.w - 2 * EDGE, Math.max(ideal, s * B.w))
      const ph = Math.min(contentH, S.h - 2 * EDGE - GAP - s * B.h)
      const top = S.y + (S.h - (ph + GAP + s * B.h)) / 2
      const mid = { x: D.x + D.w / 2, y: D.y + D.h / 2 }
      mode = 'stack'
      panel = { x: Math.max(S.x + EDGE, Math.min(S.x + S.w - EDGE - w, mid.x - w / 2)), y: top, w, h: ph }
      pose = { s, dx: 0, dy: top + ph + GAP - (mid.y + s * (B.y - mid.y)) }
    }
  }
  if (mode === 'over') {
    const w = Math.min(ideal, S.w - 2 * EDGE, 420 * z)
    const h = fitH(Math.min(S.h - 2 * EDGE, Math.max(200, S.h * 0.55)))
    panel = { x: rtl ? S.x + S.w - EDGE - w : S.x + EDGE, y: S.y + EDGE, w, h }
  }
  const cx = D.x + D.w / 2
  const cy = D.y + D.h / 2
  /** A point of the demo's frame where the reader sees it, with the demo posed at `k` (1: aside, 0: home). */
  const seen = (x: number, y: number, k: number): [number, number] => {
    const s = lerp(1, pose.s, k)
    return [cx + s * (D.x + x - cx) + pose.dx * k, cy + s * (D.y + y - cy) + pose.dy * k]
  }
  /** The transform that poses an element whose box starts at (ex, ey) in the host, with origin 0 0. */
  const poseCss = (ex: number, ey: number, k: number) => {
    const s = lerp(1, pose.s, k)
    return `translate(${f2((1 - s) * (cx - ex) + pose.dx * k)}px, ${f2((1 - s) * (cy - ey) + pose.dy * k)}px) scale(${f2(s)})`
  }
  const posed = pose.s !== 1 || pose.dx !== 0 || pose.dy !== 0

  const begin = (run: Run<'run'>) => {
    // ─── 4. layers ───
    // the surface copies sit under the demo, in its host; the panel and the ghosts on the stage, above anything inside it
    // that scrolls or clips (a docs stage scrolls a tall demo in a box of its own)
    const top = stageEl ?? host
    const offset = stageEl ? { x: S.x, y: S.y } : { x: 0, y: 0 }
    const layer = (cls: string, box: { x: number; y: number; w: number; h: number }, parent: HTMLElement = top) => {
      const el = document.createElement('div')
      el.className = cls
      el.setAttribute('aria-hidden', 'true')
      const o = parent === top ? offset : { x: 0, y: 0 }
      Object.assign(el.style, { left: `${f2(box.x - o.x)}px`, top: `${f2(box.y - o.y)}px`, width: `${f2(box.w)}px`, height: `${f2(box.h)}px` })
      parent.appendChild(el)
      layers.push(el)
      return el
    }
    const under = layer('t-code-under', D, host)
    const fxBox = { x: S.x, y: S.y, w: S.w, h: S.h }
    const fxDpr = Math.min(fxBox.w * fxBox.h > 700_000 ? 1.25 : 2, devicePixelRatio || 1)
    const fxCanvas = document.createElement('canvas')
    fxCanvas.className = 't-code-fx'
    fxCanvas.setAttribute('aria-hidden', 'true')
    fxCanvas.width = Math.round(fxBox.w * fxDpr)
    fxCanvas.height = Math.round(fxBox.h * fxDpr)
    Object.assign(fxCanvas.style, {
      left: `${f2(fxBox.x - offset.x)}px`,
      top: `${f2(fxBox.y - offset.y)}px`,
      width: `${f2(fxBox.w)}px`,
      height: `${f2(fxBox.h)}px`,
    })
    top.appendChild(fxCanvas)
    layers.push(fxCanvas)
    const fx = fxCanvas.getContext('2d')

    const box = layer(`t-code-panel${mode === 'over' ? ' is-over' : ''}`, panel)
    box.style.setProperty('--z', String(z))
    box.innerHTML = '<div class="t-code-head"><span class="t-code-file"></span><span class="t-code-status"><i></i><b>Compiling…</b></span></div>'
    const fileEl = box.querySelector<HTMLElement>('.t-code-file')!
    const slash = source.file.lastIndexOf('/')
    fileEl.innerHTML = slash > 0 ? '<em></em><span></span>' : '<span></span>'
    if (slash > 0) fileEl.firstElementChild!.textContent = source.file.slice(0, slash + 1)
    fileEl.lastElementChild!.textContent = source.file.slice(slash + 1)
    const status = box.querySelector<HTMLElement>('.t-code-status')!
    const bodyW = panel.w
    const bodyH = panel.h - HEAD
    const dpr = Math.min(2, devicePixelRatio || 1)
    const canvas = document.createElement('canvas')
    canvas.className = 't-code-body'
    canvas.width = Math.round(bodyW * dpr)
    canvas.height = Math.round(bodyH * dpr)
    Object.assign(canvas.style, { width: `${f2(bodyW)}px`, height: `${f2(bodyH)}px` })
    box.appendChild(canvas)
    const g = canvas.getContext('2d')

    // the colours and the face, now that the panel is in (one style pass)
    const panelStyle = getComputedStyle(box)
    const C: Record<string, string> = {}
    C.fg = rgb(ctx0, panelStyle.color, panelStyle.color)
    for (const name of ['keyword', 'string', 'number', 'function', 'type', 'property', 'comment', 'punctuation', 'danger'])
      C[name] = rgb(ctx0, cssColour(name), C.fg)
    // (the fade at a long line's end is drawn in the panel's own colour: known as rgb, else left out)
    const bg = rgb(ctx0, panelStyle.backgroundColor, '')
    const face = `400 ${FS}px ${panelStyle.fontFamily}`
    if (g) g.font = face
    const cw = g?.measureText('M').width || CW
    const x0 = gutter + 4

    // display tokens a line: the highlighter's, a long string shortened ("…"), a fold in place as its own mark
    type Tok = [string, string]
    const display: Tok[][] = shown.map((s) => {
      if ('fold' in s)
        return [
          [' '.repeat(Math.max(0, s.indent - minIndent)), 'fg'],
          [`⋯ ${s.fold}`, 'fold'],
        ]
      const take = (i: number, trimStart: boolean): Tok[] => {
        const toks: Tok[] = lineTokens?.[i] ?? [[raw[i]!, 'fg']]
        const out: Tok[] = []
        let skip = trimStart ? 0 : minIndent
        for (const [t0, c] of toks) {
          let t = t0
          if (trimStart) t = out.length ? t : t.trimStart()
          else if (skip > 0) {
            const cut = Math.min(skip, t.match(/^\s*/)![0].length)
            t = t.slice(cut)
            skip -= cut
          }
          if (c === 'string' && t.length > 30) t = `${t.slice(0, 22)}…${t.at(-1)}`
          if (t) out.push([t, c])
        }
        return out
      }
      const out = take(s.src, false)
      if (s.tail !== undefined) out.push([' ', 'fg'], ['⋯', 'fold'], [' ', 'fg'], ...take(s.tail, true))
      return out
    })
    const lengths = display.map((d) => d.reduce((n, [t]) => n + t.length, 0))
    const indents = display.map((d) => d[0]?.[0].match(/^\s*/)?.[0].length ?? 0)

    // ─── 5. hide what compiles; surfaces' paint moves to copies under the demo ───
    if (posed) {
      set(root, 'transform-origin', '0 0')
      set(root, 'transform', poseCss(N.left - H.left, N.top - H.top, 1))
      if (plate && plateBox) {
        set(plate, 'transform-origin', '0 0')
        set(plate, 'transform', poseCss(plateBox.left - H.left, plateBox.top - H.top, 1))
      }
      under.style.transformOrigin = '0 0'
      under.style.transform = poseCss(D.x, D.y, 1)
    }
    for (const p of live) {
      if (p.kind === 'surface') {
        const m = paint.get(p)!
        const d = document.createElement('div')
        d.className = 't-code-surface'
        Object.assign(d.style, { left: `${f2(p.box.x)}px`, top: `${f2(p.box.y)}px`, width: `${f2(p.box.w)}px`, height: `${f2(p.box.h)}px` })
        for (const [k, v] of m) d.style.setProperty(k, v)
        under.appendChild(d)
        p.copy = d
        for (const k of PAINT_SET) set(p.el, k, k === 'background-image' || k === 'box-shadow' || k === 'backdrop-filter' ? 'none' : 'transparent')
      } else if (p.kind === 'divider') {
        const rule = (p as Part & { rule: { own: boolean } }).rule
        if (rule.own) fade(p.el, 0)
        else set(p.el, 'border-color', 'transparent')
      } else if (p.kind === 'label') set(p.el, '-webkit-text-fill-color', 'transparent')
      else fade(p.el, 0)
      for (const s of p.strokes ?? []) {
        setAttr(s, 'pathLength', '1')
        set(s, 'stroke-dasharray', '1 1')
        set(s, 'stroke-dashoffset', '1')
      }
    }
    for (const el of plan.floating) fade(el as HTMLElement, 0)
    // what the demo adds while it compiles waits for the end
    const late = [...plan.floating] as HTMLElement[]
    watch = new MutationObserver((records) => {
      for (const r of records)
        for (const n of r.addedNodes)
          if (n instanceof HTMLElement && !layers.includes(n) && !n.closest('.t-code-under, .t-code-panel')) {
            late.push(n)
            fade(n, 0)
          }
    })
    watch.observe(root, { childList: true, subtree: true })

    // ─── 6. one frame ───
    const lineY = (i: number, scroll: number) => PAD + i * LH - scroll
    let scroll = 0
    let fxDrawn = false
    let statusDone = false
    const rr = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
      c.beginPath()
      c.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2)))
    }

    const drawPanel = (t: number) => {
      if (!g) return
      // where the typing is
      let li = 0
      while (li < shown.length - 1 && t >= lineAt[li]!.typed && t >= lineAt[li + 1]!.start) li++
      const L = lineAt[li]!
      const into = clamp((t - L.start) / Math.max(1, L.typed - L.start))
      // (a fold is there at once; a line's indent too, only what follows it is typed)
      const typedTo = t >= TYPED || 'fold' in shown[li]! ? lengths[li]! : indents[li]! + Math.round(into * (lengths[li]! - indents[li]!))
      // scroll so the line being typed sits two-thirds down
      const maxScroll = Math.max(0, PAD * 2 + shown.length * LH - bodyH)
      const want = Math.max(0, Math.min(maxScroll, li * LH - bodyH * 0.62))
      scroll += (want - scroll) * 0.18
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
      g.clearRect(0, 0, bodyW, bodyH)
      g.font = face
      g.textBaseline = 'middle'
      const first = Math.max(0, Math.floor((scroll - PAD) / LH))
      const last = Math.min(shown.length - 1, Math.ceil((scroll + bodyH) / LH))
      for (let i = first; i <= last && i <= li; i++) {
        const y = lineY(i, scroll)
        // a line that compiled something holds a band while its parts come in
        const mates = perLine.get(i)
        if (mates && t >= lineAt[i]!.typed) {
          const until = Math.max(...mates.map((p) => p.at + p.dur))
          const a = smooth(t, lineAt[i]!.typed, lineAt[i]!.typed + 90) * (1 - smooth(t, until, until + 380))
          if (a > 0) {
            g.globalAlpha = a * 0.26
            g.fillStyle = C[mates[0]!.color]!
            g.fillRect(0, y, bodyW, LH)
            g.globalAlpha = a
            g.fillRect(0, y + 1, 3 * z, LH - 2)
          }
        }
        g.globalAlpha = 0.55
        g.fillStyle = C.comment!
        g.textAlign = 'right'
        const s = shown[i]!
        if ('src' in s) g.fillText(String(s.src + 1), gutter - 8, y + LH / 2)
        g.textAlign = 'left'
        g.globalAlpha = 1
        const upTo = i < li ? lengths[i]! : typedTo
        let col = 0
        for (const [tx, c] of display[i]!) {
          if (col >= upTo) break
          const piece = tx.slice(0, upTo - col)
          if (c === 'fold') {
            // a fold: a quiet pill, as an editor draws one
            g.fillStyle = C.comment!
            rr(g, x0 + col * cw - 3, y + 3, piece.length * cw + 6, LH - 6, 4)
            g.globalAlpha = 0.16
            g.fill()
            g.globalAlpha = 0.85
            g.fillText(piece, x0 + col * cw, y + LH / 2 + 0.5)
            g.globalAlpha = 1
          } else if (piece.trim()) {
            g.fillStyle = C[c] ?? C.fg!
            g.fillText(piece, x0 + col * cw, y + LH / 2 + 0.5)
          }
          col += piece.length
        }
        // the caret: solid while typing, blinking once it's all written
        if (i === li) {
          const blink = t < TYPED || Math.floor((t - TYPED) / 480) % 2 === 0
          if (blink && t < OUT) {
            g.fillStyle = C.fg!
            g.fillRect(x0 + col * cw + 1, y + 3 * z, 1.6 * z, LH - 6 * z)
          }
        }
      }
      // a long line runs under the panel's edge, fading
      if (bg) {
        const fadeW = 28 * z
        const grad = g.createLinearGradient(bodyW - fadeW, 0, bodyW, 0)
        grad.addColorStop(0, bg.replace('rgb(', 'rgba(').replace(')', ',0)'))
        grad.addColorStop(1, bg)
        g.fillStyle = grad
        g.fillRect(bodyW - fadeW, 0, fadeW, bodyH)
      }
      return { li, scroll }
    }

    /** Where the link from a line to its part leaves the panel: the panel's edge facing the part, at the line. */
    const port = (i: number, sc: number, p: Part): [number, number] => {
      // (stacked, the demo is below: the link leaves the bottom edge under the line's end)
      if (mode === 'stack') return [at.x + Math.min(bodyW - 12, x0 + lengths[i]! * cw + 6), at.y + panel.h]
      const y = at.y + HEAD + lineY(i, sc) + LH / 2
      const [px] = seen(p.box.x + p.box.w / 2, 0, posed ? 1 : 0)
      const x = px >= at.x + panel.w / 2 ? at.x + panel.w : at.x
      return [x, Math.max(at.y + HEAD + 4, Math.min(at.y + panel.h - 4, y))]
    }

    const ghost = (p: Part, q: number, k: number, from: [number, number] | null) => {
      if (!fx) return
      const [ax, ay] = seen(p.box.x, p.box.y, k)
      const s = lerp(1, pose.s, k)
      const w = p.box.w * s
      const h = p.box.h * s
      const col = C[p.color]!
      const a = 1 - smooth(q, 0.3, 1)
      if (a <= 0) return
      fx.globalAlpha = a * 0.95
      fx.strokeStyle = col
      fx.lineWidth = 1.5 * z
      const grow = (1 - ENTER(clamp(q * 2.5))) * 4
      if (p.kind === 'divider') {
        fx.beginPath()
        fx.moveTo(ax, ay + h / 2)
        fx.lineTo(ax + w * ENTER(clamp(q * 2)), ay + h / 2)
        fx.stroke()
      } else {
        rr(fx, ax - grow - 1, ay - grow - 1, w + grow * 2 + 2, h + grow * 2 + 2, (p.box.r || 4) * s + grow)
        fx.stroke()
        fx.globalAlpha = a * (p.kind === 'text' || p.kind === 'label' ? 0.12 : 0.08)
        fx.fillStyle = col
        fx.fill()
      }
      // the link from the line that wrote it
      if (from) {
        const tx = Math.abs(from[0] - ax) < Math.abs(from[0] - (ax + w)) ? ax : from[0] < ax ? ax : ax + w
        const ty = ay + h / 2
        const reach = ENTER(clamp(q * 2.2))
        const mx = (from[0] + tx) / 2
        fx.globalAlpha = a * 0.7
        fx.lineWidth = 1.2 * z
        fx.setLineDash([2 * z, 3 * z])
        fx.beginPath()
        fx.moveTo(from[0], from[1])
        const ex = lerp(from[0], tx, reach)
        const ey = lerp(from[1], ty, reach)
        fx.bezierCurveTo(lerp(from[0], mx, reach), from[1], lerp(from[0], mx, reach), ey, ex, ey)
        fx.stroke()
        fx.setLineDash([])
        fx.globalAlpha = a
        fx.fillStyle = col
        fx.beginPath()
        fx.arc(from[0], from[1], 2 * z, 0, Math.PI * 2)
        fx.fill()
      }
    }

    const docks =
      mode === 'over'
        ? [
            { x: panel.x, y: panel.y },
            { x: rtl ? S.x + EDGE : S.x + S.w - EDGE - panel.w, y: S.y + S.h - EDGE - panel.h },
          ]
        : [{ x: panel.x, y: panel.y }]
    let dock = 0
    let veil = 1
    const at = { x: panel.x, y: panel.y }
    /** Whether a part, where the reader sees it, is under the panel at `d`. */
    const meets = (p: Part, d: { x: number; y: number }) => {
      const [ax, ay] = seen(p.box.x, p.box.y, posed ? 1 : 0)
      const s = posed ? pose.s : 1
      return ax < d.x + panel.w && ax + p.box.w * s > d.x && ay < d.y + panel.h && ay + p.box.h * s > d.y
    }

    const frame = (t: number) => {
      // the pose: aside while it compiles, home at the end
      const k = posed ? 1 - MOVE(win(t, OUT, END - 20)) : 0
      if (posed && t >= OUT) {
        set(root, 'transform', poseCss(N.left - H.left, N.top - H.top, k))
        if (plate && plateBox) set(plate, 'transform', poseCss(plateBox.left - H.left, plateBox.top - H.top, k))
        under.style.transform = poseCss(D.x, D.y, k)
      }
      // over the stage, the panel keeps off what's compiling: to the other corner, or nearly clear if both are in the way
      if (docks.length > 1) {
        // (a part as big as much of the stage can't be kept clear of: its ghost shows around the panel)
        const soon = live.filter((p) => !p.done && t >= p.at - 240 && t < p.at + p.dur && p.box.w * p.box.h < S.w * S.h * 0.3)
        const hit = (d: { x: number; y: number }) => soon.some((p) => meets(p, d))
        if (hit(docks[dock]!) && !hit(docks[1 - dock]!)) dock = 1 - dock
        const target = docks[dock]!
        at.x += (target.x - at.x) * 0.2
        at.y += (target.y - at.y) * 0.2
        veil += ((hit(target) ? 0.14 : 1) - veil) * 0.25
      }
      // the panel in and out
      const pin = ENTER(win(t, 0, 320))
      const pout = smooth(t, OUT, OUT + 380)
      const shift = (rtl ? 1 : -1) * ((1 - pin) * 14 + pout * 18)
      box.style.opacity = f2(pin * (1 - pout) * veil)
      box.style.transform = `translate(${f2(at.x - panel.x + shift)}px, ${f2(at.y - panel.y)}px)`
      if (!statusDone && t >= COMPILED) {
        statusDone = true
        status.classList.add('is-done')
        status.lastElementChild!.textContent = `Compiled in ${(((COMPILED / END) * run.T) / 1000).toFixed(1)}s`
      }
      const view = t < OUT + 400 ? drawPanel(t) : null

      // the parts
      if (fx && fxDrawn) {
        fx.setTransform(1, 0, 0, 1, 0, 0)
        fx.clearRect(0, 0, fxCanvas.width, fxCanvas.height)
        fxDrawn = false
      }
      if (fx) fx.setTransform(fxDpr, 0, 0, fxDpr, -fxBox.x * fxDpr, -fxBox.y * fxDpr)
      const links = new Map<number, number>()
      for (const p of live) {
        if (p.done || t < p.at) continue
        const q = win(t, p.at, p.at + p.dur)
        const el = p.el
        if (p.kind === 'surface') {
          const st = p.copy!.style
          st.opacity = f2(smooth(q, 0, 0.6))
          st.transform = `scale(${f2(lerp(0.965, 1, ENTER(q)))})`
        } else if (p.kind === 'text') {
          fade(el, smooth(q, 0, 0.25))
          const ls = p.lines ?? []
          const total = ls.reduce((a, l) => a + (l.x2 - l.x), 0)
          let e = ENTER(q) * total
          let i = 0
          while (i < ls.length - 1 && e > ls[i]!.x2 - ls[i]!.x) {
            e -= ls[i]!.x2 - ls[i]!.x
            i++
          }
          const L = ls[i]
          if (L && q < 1) {
            const b = p.box
            const W = b.w + 8
            const y0 = L.top - b.y
            const y1 = L.bottom - b.y
            const cxr = (rtl ? L.x2 - e : L.x + e) - b.x
            set(
              el,
              'clip-path',
              rtl
                ? `polygon(-4px -4px, ${f2(W)}px -4px, ${f2(W)}px ${f2(y1)}px, ${f2(cxr - 6)}px ${f2(y1)}px, ${f2(cxr - 6)}px ${f2(y0)}px, -4px ${f2(y0)}px)`
                : `polygon(-4px -4px, ${f2(W)}px -4px, ${f2(W)}px ${f2(y0)}px, ${f2(cxr + 6)}px ${f2(y0)}px, ${f2(cxr + 6)}px ${f2(y1)}px, -4px ${f2(y1)}px)`,
            )
          }
        } else if (p.kind === 'pop') {
          fade(el, smooth(q, 0, 0.45))
          if (!placed.has(el)) set(el, 'transform', `scale(${f2(lerp(0.7, 1, SPRING(q)))})`)
        } else if (p.kind === 'icon' || p.kind === 'glyph') {
          fade(el, smooth(q, 0.05, 0.4))
          for (const s of p.strokes ?? []) set(s, 'stroke-dashoffset', f2(1 - ENTER(clamp(q * 1.15))))
        } else if (p.kind === 'chart' || p.kind === 'media') {
          fade(el, smooth(q, 0, 0.3))
          const w = ENTER(q)
          set(
            el,
            'clip-path',
            p.kind === 'media'
              ? `inset(0 0 ${f2((1 - w) * 100)}% 0)`
              : rtl
                ? `inset(0 0 0 ${f2((1 - w) * 100)}%)`
                : `inset(0 ${f2((1 - w) * 100)}% 0 0)`,
          )
        } else if (p.kind === 'divider') {
          if ((p as Part & { rule: { own: boolean } }).rule.own) fade(el, smooth(q, 0.2, 0.7))
          else if (q > 0.35) restore(el, ['border-color'])
        } else if (p.kind === 'label') {
          set(el, '-webkit-text-fill-color', `color-mix(in srgb, currentColor ${f2(smooth(q, 0, 0.8) * 100)}%, transparent)`)
        }
        if (fx && q < 1) {
          let from: [number, number] | null = null
          const n = links.get(p.line) ?? 0
          if (view && p.line >= 0 && n < 8) {
            links.set(p.line, n + 1)
            from = port(p.line, view.scroll, p)
          }
          ghost(p, q, posed ? 1 : 0, from)
          fxDrawn = true
        }
        if (q >= 1) {
          // compiled: the part is itself again
          p.done = true
          if (p.kind === 'surface') {
            restore(el, PAINT_SET)
            p.copy!.style.display = 'none'
          } else if (p.kind === 'label') restore(el, ['-webkit-text-fill-color'])
          else if (p.kind === 'divider') restore(el, [...SHOWN, 'border-color'])
          else {
            for (const s of p.strokes ?? []) restore(s)
            restore(el, [...SHOWN, 'transform', 'clip-path'])
          }
        }
      }
      if (t >= COMPILED) {
        for (const el of late) fade(el, smooth(t, COMPILED, COMPILED + 300))
      }
      if (fx) fx.globalAlpha = 1
    }

    // the runtime keeps the clock (speed, the time scale, cancel): its run is this one's END ms, stretched
    run.frame((t) => frame(Math.min(END, (t * END) / run.T)))
    run.ended(finish)
    frame(0)
  }
  return { END, begin }
}
