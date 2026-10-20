import { clamp, hump, mix, span, type View } from './field'

/* The shown label's motion, on the drawing's own clock (kit.tsx calls a
 * label's paint after every frame it draws, with the loop's progress).
 *
 * A label is one run of text per label, all stacked in one cell, so the
 * label is as wide as its widest and nothing around it moves as they turn.
 * The first shows, static, until the effect can join the loop at a moment
 * that looks just like it (so nothing jumps when the script arrives); from
 * then on each label shows for `every` loops and the next takes over at the
 * seam, the effect carrying the change: the light dips through it (pulse),
 * the letters lift away and rise into place (wave), the caret clears one
 * and types the next (type), the letters break into noise and the next
 * resolve out of it (scramble), or the line rolls up (slide).
 *
 * The text stays one run, so joined scripts keep their shapes: clips cut it
 * at the letters' measured edges, and where letters move one by one they're
 * drawn in a layer over it, each where it sits in the run. Those per-letter
 * effects (wave's lift, scramble's noise) apply only to scripts whose
 * letters keep their shapes on their own; elsewhere (Arabic, the Indic
 * scripts) wave falls back to the light and scramble to a plain reveal. */

export type LoaderLabelEffect = 'pulse' | 'wave' | 'type' | 'scramble' | 'slide' | 'none'

/** Paints the shown label at loop progress `t` (0–1), or its static look (`null`). */
export type LabelPaint = (t: number | null) => void

type Ease = View['ease']

export interface LabelParts {
  /** One run of text per label, in order, stacked in one cell. */
  runs: HTMLElement[]
  /** type's caret. */
  caret: HTMLElement | null
  /** The layer scramble and wave draw single letters in. */
  glyphs: HTMLElement | null
}

/* Every timing is loop progress (0–1), so a label holds when its drawing
 * holds and keeps its pace through `speed` and the time scale. */

/** pulse: the light crosses during the first part of the loop (`emphasized`: a slow start and a long landing, both off the text), then rests. */
const SWEEP_END = 0.68
/** A change of label under the light: the old one fades out over the loop's last stretch, the new one in over the first, while the light is off the word. */
const DIP = 0.06

/**
 * type: the first letter lands at `start`; each takes `letter` of the loop
 * (a long label is squeezed into `typing`, a short one stretched to it, at
 * an even cadence); the caret blinks whole blinks of about `blink`; at
 * `erase` it glides back (`emphasized`), taking each letter as it reaches
 * it, and is home, the label empty, at `home`, so the seam falls on an
 * empty line. Between two labels it moves to where the next one starts.
 */
const TYPE = { start: 0.05, letter: 0.04, typing: [0.2, 0.5], erase: 0.8, home: 0.93, blink: 0.36 } as const

/**
 * scramble: the line fills with noise from the first letter to the last
 * (`fill`); from `from` the letters lock in, one at a time at an even
 * cadence (`letter`, a long label squeezed into `locking`), each cycling
 * through noise (`steps` glyphs a loop) until it does; the word holds;
 * from `out` each letter breaks back into noise, first to last, over
 * `breaking`, and its noise clears `linger` later, so the seam falls on an
 * empty line, as type's does.
 */
const SCRAMBLE = { fill: [0.04, 0.12], from: 0.1, letter: 0.03, locking: [0.18, 0.34], out: 0.8, breaking: 0.08, linger: 0.04, steps: 40 } as const

/**
 * wave: a lift travels from the first letter to the last (its crest from
 * `from` to `to`, each letter rising and settling within `reach` of its
 * moment, `lift` em at most, no overshoot), then rests. A change of label
 * lifts the old letters away (`rise` em, fading) from `out`, first to last
 * over `stagger`, each in `moving`, and brings the new ones up into place
 * the same way from the seam. It may join the loop during `rest`.
 */
const WAVE = { from: 0.22, to: 0.6, reach: 0.13, lift: 0.18, out: 0.84, stagger: 0.06, moving: 0.08, rise: 0.55, rest: [0.75, 0.84] } as const

/** slide: at the seam the line rolls up within `end` (`emphasized`), like a counter: the old label rises `rise` em, out through the top of the line's window, as the new one rises into place from below it. */
const SLIDE = { end: 0.15, rise: 1.5 } as const

/* ── The clock ────────────────────────────────────────────────────────── */

/** A loop's labels: the one it shows, the one before it and the one after, and whether it starts a label's turn. */
interface Turn {
  run: number
  prev: number
  next: number
  /** This loop starts a label's turn (with one label too: slide rolls it over). */
  fresh: boolean
}

interface Painter {
  /** A moment the effect looks just like the static label: it joins the loop there. */
  rest(t: number, run: number): boolean
  /** Paints loop progress `t` of `at`, or (`null`) the static first label. */
  paint(t: number | null, at: Turn): void
}

const STILL: Turn = { run: 0, prev: 0, next: 0, fresh: false }

export interface LabelClock {
  paint: LabelPaint
  /** Takes every style it set back off. */
  dispose: () => void
}

/**
 * The label's clock: which of `count` labels a loop shows, and the effect
 * that moves it. `onShow` hears each change of label (the status decides
 * what to announce). Without parts it only keeps count: the status turns
 * through the labels when none is shown.
 */
export function labelClock(parts: LabelParts | null, effect: LoaderLabelEffect, ease: Ease, count: number, every: number, onShow?: (index: number) => void): LabelClock {
  const painter = parts ? painterFor(effect, parts, ease) : null
  const per = Math.max(1, Math.round(every) || 1)
  const labelAt = (turn: number) => (count > 1 && turn > 0 ? Math.floor(turn / per) % count : 0)
  let joined = false
  let turns = 0
  let last = 1
  let shown = 0
  return {
    paint(t) {
      if (t === null || (!joined && painter && !painter.rest(t, 0))) {
        painter?.paint(null, STILL)
        return
      }
      // A seam passed since the last frame: the loop came round.
      if (joined && t < last) turns++
      joined = true
      last = t
      const run = labelAt(turns)
      if (run !== shown) {
        shown = run
        onShow?.(run)
      }
      painter?.paint(t, { run, prev: labelAt(turns - 1), next: labelAt(turns + 1), fresh: turns > 0 && turns % per === 0 })
    },
    dispose() {
      if (!parts) return
      for (const run of parts.runs) clear(run, 'visibility', 'opacity', 'transform', 'clip-path', '--yj-anim-band')
      if (parts.caret) clear(parts.caret, 'transform', 'opacity')
      parts.glyphs?.replaceChildren()
    },
  }
}

function painterFor(effect: LoaderLabelEffect, parts: LabelParts, ease: Ease): Painter {
  if (effect === 'pulse') return pulse(parts, ease)
  if (effect === 'wave') return wave(parts, ease)
  if (effect === 'type') return type(parts, ease)
  if (effect === 'scramble') return scramble(parts)
  if (effect === 'slide') return slide(parts, ease)
  return still(parts)
}

/* ── Painting ─────────────────────────────────────────────────────────── */

/* Each element's inline styles as last written: a label paints every frame, and writes only what changed. */
const written = new WeakMap<HTMLElement, Map<string, string>>()

function put(el: HTMLElement, prop: string, value: string) {
  let mine = written.get(el)
  if (!mine) written.set(el, (mine = new Map()))
  if ((mine.get(prop) ?? '') === value) return
  mine.set(prop, value)
  if (value) el.style.setProperty(prop, value)
  else el.style.removeProperty(prop)
}

function clear(el: HTMLElement, ...props: string[]) {
  for (const prop of props) put(el, prop, '')
}

/** Shows these runs only; the rest keep their place in the cell, hidden. One label needs nothing. */
function showOnly(runs: HTMLElement[], a: number, b = a) {
  if (runs.length > 1) runs.forEach((run, i) => put(run, 'visibility', i === a || i === b ? 'visible' : 'hidden'))
}

/* ── Measuring ────────────────────────────────────────────────────────── */

/** Where each letter ends, as offsets into the text: a user-perceived character (an accented letter, an emoji) is one. */
export function letterEnds(text: string): number[] {
  const ends: number[] = []
  if (typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function') {
    for (const { index, segment } of new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text)) ends.push(index + segment.length)
    return ends
  }
  let end = 0
  for (const char of text) ends.push((end += char.length))
  return ends
}

/**
 * Scripts whose letters keep their shapes drawn one at a time: no joining,
 * no conjuncts. Only these get per-letter effects; a label in any other
 * script (Arabic, the Indic and Southeast Asian scripts) takes the nearest
 * whole-word one.
 */
const SEPARABLE =
  /^[\p{Script=Latin}\p{Script=Greek}\p{Script=Cyrillic}\p{Script=Armenian}\p{Script=Georgian}\p{Script=Hebrew}\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Bopomofo}\p{Script=Common}\p{Script=Inherited}]*$/u

/** The text of a run as one node, and a range to measure its letters with (null where nothing is laid out, as in a test's DOM). */
function measurable(text: HTMLElement): { node: Text; range: Range } | null {
  const node = text.firstChild
  const range = document.createRange()
  return node instanceof Text && node.length > 0 && typeof range.getBoundingClientRect === 'function' ? { node, range } : null
}

/** Whether the word reads right to left: its first letter sits nearer the right edge (an English word on an Arabic page still reads left to right). */
function startsRight(text: HTMLElement): boolean {
  const run = measurable(text)
  if (run) {
    run.range.setStart(run.node, 0)
    run.range.setEnd(run.node, letterEnds(run.node.data)[0]!)
    const first = run.range.getBoundingClientRect()
    const box = text.getBoundingClientRect()
    if (first.width) return first.left - box.left > box.right - first.right
  }
  return getComputedStyle(text).direction === 'rtl'
}

interface Metrics {
  /** Each measure's own number: a painter repaints whenever its letters were measured again. */
  id: number
  text: string
  /** Where each letter starts and ends, as offsets into the text. */
  starts: number[]
  ends: number[]
  /** The run's box, in layout px (unrounded; offsetWidth is whole px, which would misplace every edge a little). */
  width: number
  rtl: boolean
  /** Where the text shows up to after 0…n letters, in px from the box's left: `edges[0]` is where it starts. */
  edges: number[]
  /** Each letter's own left and right. */
  boxes: [number, number][]
  /** Half the tracking: a clip cuts there, between two letters, clear of both. */
  half: number
  /** How far past a letter a caret stands. */
  gap: number
  /** offsetWidth when it was measured: any other means measure again. */
  seen: number
  /** The fonts as they were (`fontsLoaded`): a font arriving moves the letters, even where the width stays. */
  fonts: number
  separable: boolean
}

/** How many times the page's fonts have finished loading: a subset that arrives late (a script's glyphs) re-lays the text. */
let fontsLoaded = 0
let listening = false
function watchFonts() {
  if (listening || typeof document === 'undefined' || !document.fonts?.addEventListener) return
  listening = true
  document.fonts.addEventListener('loadingdone', () => fontsLoaded++)
}

let measures = 0

function measure(run: HTMLElement): Metrics {
  const text = run.textContent ?? ''
  const ends = letterEnds(text)
  const starts = ends.map((_, i) => (i ? ends[i - 1]! : 0))
  const n = ends.length
  const seen = run.offsetWidth
  const look = getComputedStyle(run)
  const width = parseFloat(look.width) || seen
  const box = run.getBoundingClientRect()
  // In a scaled ancestor the rects are scaled and the layout isn't: work in layout px.
  const scale = box.width && width ? box.width / width : 1
  const laid = measurable(run)
  const rect = (from: number, to: number) => {
    if (!laid) return null
    laid.range.setStart(laid.node, from)
    laid.range.setEnd(laid.node, to)
    return laid.range.getBoundingClientRect()
  }
  const x = (v: number) => clamp((v - box.left) / scale, 0, width)
  const rtl = startsRight(run)
  const first = n ? rect(0, ends[0]!) : null
  const edges = [first?.width ? x(rtl ? first.right : first.left) : rtl ? width : 0]
  for (const end of ends) {
    const r = rect(0, end)
    edges.push(r ? x(rtl ? r.left : r.right) : rtl ? 0 : width)
  }
  const boxes = starts.map((start, i): [number, number] => {
    const r = rect(start, ends[i]!)
    if (r?.width) return [x(r.left), x(r.right)]
    const a = (width * i) / n
    const b = (width * (i + 1)) / n
    return rtl ? [width - b, width - a] : [a, b]
  })
  return {
    id: ++measures,
    text,
    starts,
    ends,
    width,
    rtl,
    edges,
    boxes,
    half: (parseFloat(look.letterSpacing) || 0) / 2,
    gap: (parseFloat(look.fontSize) || 11) * 0.04,
    seen,
    fonts: fontsLoaded,
    separable: SEPARABLE.test(text),
  }
}

/** Each run's metrics, measured again whenever its width changes or a font arrives. */
function metricsOf() {
  watchFonts()
  const cache = new Map<HTMLElement, Metrics>()
  return (run: HTMLElement) => {
    let m = cache.get(run)
    if (!m || run.offsetWidth !== m.seen || m.fonts !== fontsLoaded) cache.set(run, (m = measure(run)))
    return m
  }
}

/** Where a clip cuts after `k` letters: in the middle of the tracking that follows them. */
const cut = (m: Metrics, k: number) => m.edges[k]! + (m.rtl ? m.half : -m.half)

/** A clip showing letters `from` to `to` of a run, reaching past its box on every other side so ascenders, descenders and overhangs stay whole; empty, it takes everything. */
function clipRange(m: Metrics, from: number, to: number): string {
  const n = m.ends.length
  if (to <= from) return 'inset(50%)'
  if (from <= 0 && to >= n) return ''
  const left = m.rtl ? (to < n ? cut(m, to) : null) : from > 0 ? cut(m, from) : null
  const right = m.rtl ? (from > 0 ? cut(m, from) : null) : to < n ? cut(m, to) : null
  return `inset(-1em ${right === null ? '-1em' : `${(m.width - right).toFixed(2)}px`} -1em ${left === null ? '-1em' : `${left.toFixed(2)}px`})`
}

/** The single letters scramble and wave draw, in the layer over the label, each at its letter's measured place. */
function letterLayer(layer: HTMLElement | null) {
  let spans: HTMLElement[] = []
  let of: Metrics | null = null
  return {
    /** The layer's letters for `m`: empty, or (`own`) each holding its letter. */
    build(m: Metrics, own: boolean) {
      if (!layer || of === m) return spans
      of = m
      spans = m.boxes.map(([left, right], k) => {
        const el = document.createElement('span')
        el.style.left = `${left.toFixed(2)}px`
        el.style.width = `${(right - left).toFixed(2)}px`
        // Always one text node, so a later change rewrites its data rather than inserting a node (an insertion makes the page re-match its :has() rules).
        el.append(own ? m.text.slice(m.starts[k], m.ends[k]) : '')
        return el
      })
      layer.replaceChildren(...spans)
      return spans
    },
    clear() {
      if (!of) return
      of = null
      spans = []
      layer?.replaceChildren()
    },
  }
}

/* ── The effects ──────────────────────────────────────────────────────── */

/** none: the label holds still; several change at the seam. */
function still({ runs }: LabelParts): Painter {
  return {
    rest: () => true,
    paint: (_, at) => showOnly(runs, at.run),
  }
}

/** pulse: a soft light crosses the label from its first letter to its last once a loop, then rests. A change of label dips through the seam. */
function pulse({ runs }: LabelParts, ease: Ease): Painter {
  const right = new Map<HTMLElement, boolean>()
  let last = 1
  return {
    rest: (t) => t >= SWEEP_END && t < 1 - DIP,
    paint(t, at) {
      const run = runs[at.run]!
      showOnly(runs, at.run)
      let band = 1
      let fade = 1
      if (t !== null) {
        // Each sweep reads the word's direction afresh, so it follows a change of language or of the page's direction.
        if (t < last) right.delete(run)
        last = t
        band = ease.emphasized(span(t, 0, SWEEP_END))
        if (at.next !== at.run && t >= 1 - DIP) fade = 1 - ease.exit(span(t, 1 - DIP, 1))
        else if (at.prev !== at.run && t < DIP) fade = ease.enter(span(t, 0, DIP))
      }
      if (!right.has(run)) right.set(run, startsRight(run))
      put(run, '--yj-anim-band', (right.get(run) ? 1 - band : band).toFixed(4))
      put(run, 'opacity', fade < 1 ? fade.toFixed(3) : '')
    },
  }
}

/**
 * type: the label typed a letter at a time behind the caret, held while the
 * caret blinks, then cleared by the caret gliding home, each letter going
 * as the caret reaches it (a clip shows the typed part, cut at the letters'
 * measured edges). The next label is typed in the next loop.
 */
function type({ runs, caret }: LabelParts, ease: Ease): Painter {
  const metrics = metricsOf()
  const typed = (m: Metrics) => TYPE.start + clamp(m.ends.length * TYPE.letter, TYPE.typing[0], TYPE.typing[1])
  const blinks = (m: Metrics) => Math.max(1, Math.round((TYPE.erase - typed(m)) / TYPE.blink))
  const between = 1 - TYPE.home + TYPE.start
  let painted = ''
  let sized: Metrics | null = null
  let caretWidth = 0
  return {
    rest(t, run) {
      const m = metrics(runs[run]!)
      return t >= typed(m) && t < TYPE.erase
    },
    paint(t, at) {
      const run = runs[at.run]!
      const m = metrics(run)
      const n = m.ends.length
      showOnly(runs, at.run)
      // How much shows (letters, or how far the caret has carried it back) and whether the caret is lit.
      let shown = n
      let back = 0
      let lit = true
      if (t !== null) {
        if (t < TYPE.start || t >= TYPE.home) shown = 0
        else if (t < typed(m)) shown = Math.min(n, Math.floor(span(t, TYPE.start, typed(m)) * n) + 1)
        else if (t < TYPE.erase) lit = (span(t, typed(m), TYPE.erase) * blinks(m)) % 1 < 0.5
        else back = ease.emphasized(span(t, TYPE.erase, TYPE.home))
      }
      let x = back ? mix(m.edges[n]!, m.edges[0]!, back) : m.edges[shown]!
      // Gliding home, the caret takes a letter whole as soon as it reaches it: no letter is ever cut in half.
      if (back) while (shown > 0 && (m.rtl ? m.edges[shown]! < x - 0.01 : m.edges[shown]! > x + 0.01)) shown--
      // On the empty line between two labels, the caret moves from where one starts to where the next does (one label: nowhere).
      if (t !== null && (t >= TYPE.home || t < TYPE.start)) {
        const before = t >= TYPE.home
        const from = before ? m : metrics(runs[at.prev]!)
        const to = before ? metrics(runs[at.next]!) : m
        x = mix(from.edges[0]!, to.edges[0]!, ease.emphasized(((before ? t : t + 1) - TYPE.home) / between))
      }
      if (sized !== m && caret) {
        sized = m
        caretWidth = parseFloat(getComputedStyle(caret).width) || caret.offsetWidth
      }
      const state = `${m.id}|${shown}|${x.toFixed(2)}|${lit}`
      if (state === painted) return
      painted = state
      put(run, 'clip-path', clipRange(m, 0, shown))
      if (!caret) return
      put(caret, 'transform', `translateX(${(m.rtl ? x - m.gap - caretWidth : x + m.gap).toFixed(2)}px)`)
      put(caret, 'opacity', lit ? '1' : '0')
    },
  }
}

const NOISE = { lower: 'abcdefghijklmnopqrstuvwxyz', upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', digits: '0123456789' }

/** A noise glyph for letter `k` at noise step `step`: from its own kind (a lowercase letter, a capital, a digit), else from the label's own letters, never the letter itself; a space stays a space. Seeded, so a frame is a pure function of the loop. */
function noiseFor(m: Metrics, k: number, step: number, salt: number): string {
  const letter = m.text.slice(m.starts[k], m.ends[k])
  if (!letter.trim()) return letter
  const pool = /^[a-z]$/.test(letter)
    ? NOISE.lower
    : /^[A-Z]$/.test(letter)
      ? NOISE.upper
      : /^\d$/.test(letter)
        ? NOISE.digits
        : m.starts.map((s, i) => m.text.slice(s, m.ends[i])).filter((l) => l.trim())
  let h = Math.imul(k + 1, 0x9e3779b1) ^ Math.imul(step + 1, 0x85ebca6b) ^ Math.imul(salt + 1, 0xc2b2ae35)
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d) >>> 0
  const pick = pool[h % pool.length]!
  return pick === letter && pool.length > 1 ? pool[(h + 1) % pool.length]! : pick
}

/**
 * scramble: the line fills with noise, the letters resolve out of it one at
 * a time from the first, the word holds, then it breaks back into noise
 * that clears before the seam; the next label resolves in the next loop.
 * The letters that are themselves are the run, clipped; the noise is drawn
 * over the rest, each glyph centred on its letter's place. A script whose
 * letters can't stand alone gets no noise: it resolves and clears as a plain
 * reveal.
 */
function scramble({ runs, glyphs }: LabelParts): Painter {
  const metrics = metricsOf()
  const layer = letterLayer(glyphs)
  const locked = (m: Metrics) => SCRAMBLE.from + clamp(m.ends.length * SCRAMBLE.letter, SCRAMBLE.locking[0], SCRAMBLE.locking[1])
  const gone = SCRAMBLE.out + SCRAMBLE.breaking + SCRAMBLE.linger
  let painted = ''
  return {
    rest(t, run) {
      return t >= locked(metrics(runs[run]!)) && t < SCRAMBLE.out
    },
    paint(t, at) {
      const run = runs[at.run]!
      const m = metrics(run)
      const n = m.ends.length
      showOnly(runs, at.run)
      // The letters drawn as themselves (from…to, of the run) and those showing noise (noise[0]…noise[1]).
      let from = 0
      let to = n
      let noise: [number, number] = [0, 0]
      if (t !== null) {
        if (t < SCRAMBLE.fill[0] || t >= gone) to = 0
        else if (t < locked(m)) {
          to = Math.floor(span(t, SCRAMBLE.from, locked(m)) * n)
          noise = [to, Math.max(to, Math.ceil(span(t, SCRAMBLE.fill[0], SCRAMBLE.fill[1]) * n))]
        } else if (t >= SCRAMBLE.out) {
          from = Math.ceil(span(t, SCRAMBLE.out, SCRAMBLE.out + SCRAMBLE.breaking) * n)
          noise = [Math.ceil(span(t, SCRAMBLE.out + SCRAMBLE.linger, gone) * n), from]
        }
      }
      const step = t === null ? 0 : Math.floor(t * SCRAMBLE.steps)
      const state = `${m.id}|${from}|${to}|${noise[0]}|${noise[1]}|${step}`
      if (state === painted) return
      painted = state
      put(run, 'clip-path', clipRange(m, from, to))
      if (!m.separable || noise[1] <= noise[0]) {
        layer.clear()
        return
      }
      const spans = layer.build(m, false)
      spans.forEach((el, k) => {
        const on = k >= noise[0] && k < noise[1]
        const glyph = on ? noiseFor(m, k, step, at.run) : ''
        const text = el.firstChild as Text
        if (text.data !== glyph) text.data = glyph
      })
    },
  }
}

/**
 * wave: a gentle lift travels through the label, first letter to last, once
 * a loop; a change of label lifts the old letters away at the end of the
 * loop and brings the new ones up into place from the seam. The letters are
 * drawn one by one over the run (which keeps the line's place). Where they
 * can't stand alone, the light passes through the word instead (pulse).
 */
function wave(parts: LabelParts, ease: Ease): Painter {
  const { runs, glyphs } = parts
  const metrics = metricsOf()
  const layer = letterLayer(glyphs)
  const light = pulse(parts, ease)
  const drawn = (m: Metrics) => m.separable && glyphs !== null
  let painted = ''
  return {
    rest(t, run) {
      return drawn(metrics(runs[run]!)) ? t >= WAVE.rest[0] && t < WAVE.rest[1] : light.rest(t, run)
    },
    paint(t, at) {
      const run = runs[at.run]!
      const m = metrics(run)
      if (t === null || !drawn(m)) {
        layer.clear()
        put(run, 'opacity', '')
        painted = ''
        if (!drawn(m)) light.paint(t, at)
        else showOnly(runs, at.run)
        return
      }
      showOnly(runs, at.run)
      const letters = layer.build(m, true)
      put(run, 'opacity', '0')
      const n = letters.length
      const moves: string[] = []
      for (let k = 0; k < n; k++) {
        // Its place along the word, first letter to last.
        const c = n > 1 ? k / (n - 1) : 0.5
        const crest = mix(WAVE.from, WAVE.to, c)
        let y = -WAVE.lift * hump(span(t, crest - WAVE.reach, crest + WAVE.reach))
        let o = 1
        const off = c * WAVE.stagger
        if (at.next !== at.run && t >= WAVE.out) {
          const p = ease.exit(span(t, WAVE.out + off, WAVE.out + off + WAVE.moving))
          y -= WAVE.rise * p
          o = 1 - p
        } else if (at.prev !== at.run && t < WAVE.stagger + WAVE.moving) {
          const p = ease.emphasized(span(t, off, off + WAVE.moving))
          y += WAVE.rise * (1 - p)
          o = p
        }
        moves.push(`${y.toFixed(3)}|${o.toFixed(3)}`)
      }
      const state = `${m.id}|${moves.join(',')}`
      if (state === painted) return
      painted = state
      letters.forEach((el, k) => {
        const [y, o] = moves[k]!.split('|').map(Number) as [number, number]
        put(el, 'transform', y ? `translateY(${y.toFixed(3)}em)` : '')
        put(el, 'opacity', o < 1 ? o.toFixed(3) : '')
      })
    },
  }
}

/**
 * slide: a change of label rolls the line up at the seam, as a counter
 * turns: the old label leaves through the top of a window the height of the
 * line (kit.tsx masks it, its edges soft) as the new one arrives from below
 * it; each also fades, so the roll stays in the line wherever masks aren't
 * drawn. One label rolls over to itself.
 */
function slide({ runs }: LabelParts, ease: Ease): Painter {
  const place = (run: HTMLElement, y: number, o: number) => {
    put(run, 'transform', Math.abs(y) > 0.0005 ? `translateY(${y.toFixed(3)}em)` : '')
    put(run, 'opacity', o < 0.9995 ? o.toFixed(3) : '')
  }
  return {
    rest: (t) => t >= SLIDE.end,
    paint(t, at) {
      const run = runs[at.run]!
      if (t === null || !at.fresh || t >= SLIDE.end) {
        showOnly(runs, at.run)
        for (const r of runs) place(r, 0, 1)
        return
      }
      const p = t / SLIDE.end
      if (at.prev === at.run) {
        // Up and out, accelerating away, then up into place from below, decelerating into it.
        showOnly(runs, at.run)
        const q = p < 0.5 ? ease.exit(p * 2) : ease.enter(p * 2 - 1)
        place(run, p < 0.5 ? -SLIDE.rise * q : SLIDE.rise * (1 - q), p < 0.5 ? 1 - q : q)
        return
      }
      // The two labels move as one strip.
      showOnly(runs, at.prev, at.run)
      const q = ease.emphasized(p)
      place(runs[at.prev]!, -SLIDE.rise * q, 1 - q)
      place(run, SLIDE.rise * (1 - q), q)
    },
  }
}
