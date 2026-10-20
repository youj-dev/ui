/* Frame-based time for the real library.
 *
 * The youj components animate on Motion's frameloop (requestAnimationFrame
 * + performance.now), on CSS transitions/animations (Base UI overlays, the
 * yj-* presets) and, in a few primitives, on their own rAF loops. Remotion
 * renders frames out of real time, so while rendering we replace the clock
 * they all read:
 *
 * - performance.now() returns virtual time, which only moves when the
 *   Simulation steps to a new frame (1000 / fps per frame), plus a
 *   microsecond for each animation frame run within that step (see below).
 * - requestAnimationFrame queues into a virtual frame that only the
 *   Simulation's steps flush, so code that counts frames sees the same
 *   frames on every render. Remotion's renderer gets real frames for its own
 *   waits. Motion captures rAF when its module is evaluated, so this file
 *   must be the entry's first import.
 * - setTimeout and setInterval run on virtual time too: a toast's
 *   auto-dismiss, a debounce or a demo's pretend network wait fires in the
 *   step whose time reaches it, whatever the machine is doing. Date.now()
 *   and new Date() read a fixed morning plus virtual time, so the example
 *   apps' relative dates are the same on every render, on any day.
 * - WAAPI is hidden from Motion, so every Motion animation runs through its
 *   JS path on the virtual frameloop instead of the real document timeline.
 * - CSS transitions/animations (and any WAAPI animation) are paused as soon
 *   as they appear and seeked to (virtual now - virtual start) every step,
 *   and finished once they pass their end, so Base UI's exit waits resolve.
 *   One that is already paused when it appears is left to the code that
 *   made it (the entrance looks, driven by their `seek`).
 * - Math.random is seeded per frame, so decoding text is identical on every
 *   render and in every render tab.
 * - The browser renders whenever it likes, even halfway through a step. So
 *   what it would report then (ResizeObserver and IntersectionObserver
 *   entries) is held until the Simulation asks for it, and styles are brought
 *   up to date after every change, so a transition never starts sooner or
 *   later because a real frame happened to fall in between.
 * - Remotion's screenshots resize the window for a moment. Resize events
 *   never reach the page, and media queries keep their first answer.
 *
 * In the Studio (not rendering) nothing is replaced: the preview plays in
 * real time, approximately. Renders are exact. */

/** True inside Remotion's headless renderer, where time is virtual. */
export const virtual = typeof window !== 'undefined' && typeof window.remotion_puppeteerTimeout !== 'undefined'

/* Some code treats a timestamp of 0 as "unset", so virtual time starts late. */
const EPOCH = 10_000

let now = EPOCH
/* A step runs several animation frames (the settle loop flushes more than
 * one), and a browser never gives two frames the same timestamp. Motion
 * relies on that: it treats work already done "at this timestamp" as done
 * for the frame, so the final render of an instant layout transition (a
 * sliding indicator under reduced motion) was skipped as a duplicate and the
 * element kept its starting transform. So each animation frame run within a
 * step reads a microsecond later than the one before. Only animation time
 * drifts: timers, dates and CSS seeking keep the step's exact time. */
let drift = 0
const DRIFT = 0.001
/** What animation code reads as the time: the step's time plus the frames it has run. */
const animationNow = () => now + drift
const realRaf = typeof window !== 'undefined' ? window.requestAnimationFrame.bind(window) : () => 0
const realCancel = typeof window !== 'undefined' ? window.cancelAnimationFrame.bind(window) : () => {}
const realNow = typeof performance !== 'undefined' ? performance.now.bind(performance) : () => 0

/** Moves virtual time to `ms` after the start of the simulation. */
export function setTime(ms: number) {
  now = EPOCH + ms
  drift = 0
}

/* ── requestAnimationFrame ──────────────────────────────────────────────── */

let queue = new Map<number, FrameRequestCallback>()
let nextId = 1
/** Virtual ids of the frames handed to the renderer, and their real ids. */
const passedOn = new Map<number, number>()

/* Remotion's renderer waits on animation frames from code it evaluates in the
 * page: setting a frame waits one, and it polls every frame for the frame
 * being ready. Those need real frames, or a render would stall between steps.
 * Puppeteer tags evaluated code with this source URL, so the stack says
 * whose request it is. */
const RENDERER_SCRIPT = '__puppeteer_evaluation_script__'

function requestFrame(callback: FrameRequestCallback) {
  const id = nextId++
  if (new Error().stack?.includes(RENDERER_SCRIPT)) {
    passedOn.set(
      id,
      realRaf((time) => {
        passedOn.delete(id)
        callback(time)
      }),
    )
  } else queue.set(id, callback)
  return id
}

function cancelFrame(id: number) {
  const real = passedOn.get(id)
  if (real === undefined) queue.delete(id)
  else {
    passedOn.delete(id)
    realCancel(real)
  }
}

/** Runs one virtual animation frame: every callback queued so far, at the current virtual time. */
export function flushFrame() {
  const callbacks = queue
  queue = new Map()
  if (callbacks.size > 0) drift += DRIFT
  for (const callback of callbacks.values()) {
    try {
      callback(animationNow())
    } catch (error) {
      console.error(error)
    }
  }
}

/* ── Timers and dates ───────────────────────────────────────────────────── */

const realSetTimeout = typeof window !== 'undefined' ? window.setTimeout.bind(window) : setTimeout
const realClearTimeout = typeof window !== 'undefined' ? window.clearTimeout.bind(window) : clearTimeout

interface Timer {
  at: number
  /** Set for an interval: its period. */
  every?: number
  /** Order among timers due at the same moment: the order they were set. */
  order: number
  run: () => void
}

let timers = new Map<number, Timer>()
/* Virtual ids live far above the browser's, so clearTimeout knows whose an id is. */
const FIRST_TIMER = 1_000_000_000
let nextTimer = FIRST_TIMER
let timerOrder = 0
/** Browsers hold a repeating timer to at least this, and so does virtual time. */
const MIN_INTERVAL = 4

const fromRenderer = () => new Error().stack?.includes(RENDERER_SCRIPT) ?? false

type Handler = TimerHandler
function schedule(handler: Handler, delay: unknown, args: unknown[], every: boolean) {
  const ms = Math.max(0, Number(delay) || 0)
  const id = nextTimer++
  // biome-ignore lint/security/noGlobalEval: the fake clock runs string handlers like the real setTimeout does (indirect eval, global scope)
  const run = typeof handler === 'function' ? () => handler(...args) : () => (0, eval)(handler)
  timers.set(id, { at: now + (every ? Math.max(MIN_INTERVAL, ms) : ms), every: every ? Math.max(MIN_INTERVAL, ms) : undefined, order: timerOrder++, run })
  return id
}

function clearTimer(id: number | undefined) {
  if (typeof id === 'number' && id >= FIRST_TIMER) timers.delete(id)
  else realClearTimeout(id)
}

/**
 * Runs every timer due by now, earliest first (those due together in the
 * order they were set), including any a callback sets that is due already.
 */
export function flushTimers() {
  for (let guard = 0; guard < 10_000; guard++) {
    let due: [number, Timer] | undefined
    for (const entry of timers) {
      const timer = entry[1]
      if (timer.at > now) continue
      if (!due || timer.at < due[1].at || (timer.at === due[1].at && timer.order < due[1].order)) due = entry
    }
    if (!due) return
    const [id, timer] = due
    if (timer.every) {
      timer.at += timer.every
      timer.order = timerOrder++
    } else timers.delete(id)
    events++
    try {
      timer.run()
    } catch (error) {
      console.error(error)
    }
  }
}

/** Drops every pending timer: a rewind starts the simulation over. */
export function clearTimers() {
  timers = new Map()
}

/** The film's morning: Tuesday 22 September 2026, 09:41 in the renderer's time zone. */
const MORNING = typeof Date === 'function' ? new Date(2026, 8, 22, 9, 41).getTime() : 0
const wallNow = () => MORNING + (now - EPOCH)

/* ── CSS and WAAPI animations ───────────────────────────────────────────── */

const starts = new WeakMap<Animation, number>()

/* How much has happened that can set more off: an animation starting or
 * finishing (a finished exit unmounts its popup), an observer being told
 * something. A step has settled when a real frame passes without any. */
let events = 0

/** A count of the animations started or finished and the observer reports delivered so far. */
export function activity() {
  return events
}

/** Pins every running animation in the document to virtual time, and finishes those past their end. */
export function seekAnimations() {
  for (const animation of document.getAnimations()) {
    if (animation.playState === 'finished' || animation.playState === 'idle') continue
    let start = starts.get(animation)
    if (start === undefined) {
      // One its own code paused as it made it is that code's to seek (an entrance run on `seek`), until it plays.
      if (animation.playState === 'paused') continue
      start = now
      starts.set(animation, start)
      animation.pause()
      events++
    }
    const elapsed = now - start
    const end = Number(animation.effect?.getComputedTiming().endTime ?? 0)
    if (Number.isFinite(end) && elapsed >= end) {
      animation.finish()
      events++
    } else animation.currentTime = elapsed
  }
}

/* ── Observers ──────────────────────────────────────────────────────────── */

type Entry = ResizeObserverEntry | IntersectionObserverEntry

/** What each observer has seen and not yet been told: its latest entry per element. */
const held = new Map<object, { deliver: (entries: Entry[]) => void; entries: Map<Element, Entry> }>()
/** What each observer was last told about each element. */
const told = new WeakMap<object, WeakMap<Element, string>>()
/** Live IntersectionObservers, and how to tell each one. */
const intersections = new Map<IntersectionObserver, (entries: Entry[]) => void>()
/** The order the observers were made in. */
const born = new WeakMap<object, number>()
let births = 0

/* Resize reports first, as the browser gives them inside the rendering
 * update, then intersection reports; each kind in the order its observers
 * were made, whatever order the reports arrived in. */
const rank = (observer: object) => (intersections.has(observer as IntersectionObserver) ? 2 ** 31 : 0) + (born.get(observer) ?? 0)

function hold(observer: object, deliver: (entries: Entry[]) => void, entries: readonly Entry[]) {
  let seen = held.get(observer)
  if (!seen) held.set(observer, (seen = { deliver, entries: new Map() }))
  for (const entry of entries) seen.entries.set(entry.target, entry)
}

function forget(observer: object, target?: Element) {
  if (target) {
    held.get(observer)?.entries.delete(target)
    told.get(observer)?.delete(target)
  } else {
    held.delete(observer)
    told.delete(observer)
  }
}

const describe = (entry: Entry) =>
  'isIntersecting' in entry
    ? `${entry.isIntersecting} ${entry.intersectionRatio}`
    : `${entry.contentRect.width} ${entry.contentRect.height} ${entry.borderBoxSize?.[0]?.inlineSize} ${entry.borderBoxSize?.[0]?.blockSize}`

/**
 * Hands every observer what it has seen since the last call, in the order
 * they reported. An element that changed and changed back (a screenshot
 * resizes the viewport for a moment) isn't news.
 */
export function deliverObservations() {
  // The browser posts an IntersectionObserver's report of a rendering update
  // as a task of its own, which can run before or after the step's wait for
  // that update ends. Take whatever is still queued, so a report always lands
  // in the step whose layout it describes.
  for (const [observer, deliver] of intersections) {
    const queued = observer.takeRecords()
    if (queued.length > 0) hold(observer, deliver, queued)
  }
  const due = [...held].sort(([a], [b]) => rank(a) - rank(b))
  held.clear()
  for (const [observer, { deliver, entries }] of due) {
    let last = told.get(observer)
    if (!last) told.set(observer, (last = new WeakMap()))
    const news = [...entries.values()].filter((entry) => last.get(entry.target) !== describe(entry))
    if (news.length === 0) continue
    for (const entry of news) last.set(entry.target, describe(entry))
    events++
    try {
      deliver(news)
    } catch (error) {
      console.error(error)
    }
  }
}

/* ── DOM changes ────────────────────────────────────────────────────────── */

/* Net changes: a node added or removed, or an attribute or text that ends up
 * different. Motion rewrites the styles it animates on every frame, and
 * rewriting the same value doesn't count. */
let structural = false
let before = new Map<Node, Map<string, string | null>>()

function note(records: MutationRecord[]) {
  for (const record of records) {
    if (record.type === 'childList') {
      structural = true
      continue
    }
    const key = record.type === 'attributes' ? record.attributeName! : '#text'
    let values = before.get(record.target)
    if (!values) before.set(record.target, (values = new Map()))
    if (!values.has(key)) values.set(key, record.oldValue)
  }
}

const changes =
  typeof MutationObserver === 'undefined'
    ? null
    : new MutationObserver((records) => {
        note(records)
        // Bring styles up to date now, at the end of the task that changed
        // them, rather than at whichever real frame comes next, and pin any
        // transition that sets off before anything can measure it moving on
        // the real clock.
        seekAnimations()
      })

const valueOf = (node: Node, key: string) => (key === '#text' ? (node as CharacterData).data : (node as Element).getAttribute(key))

/** Whether the DOM has changed since the last call. */
export function takeChanges() {
  if (changes) note(changes.takeRecords())
  let changed = structural
  for (const [node, values] of before) {
    if (changed) break
    for (const [key, old] of values) if (valueOf(node, key) !== old) changed = true
  }
  structural = false
  before = new Map()
  return changed
}

/* ── Seeded randomness ──────────────────────────────────────────────────── */

let seed = 1
/** mulberry32: small, fast and good enough for glyph noise. */
function random() {
  seed = (seed + 0x6d2b79f5) | 0
  let t = seed
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

/** Makes Math.random's sequence depend only on the frame being simulated. */
export function reseed(frame: number) {
  seed = (frame + 1) * 2654435761
}

/* ── Waiting on the real browser ────────────────────────────────────────── */

/** One real macrotask: lets React's scheduled renders and promise callbacks run. */
export function macrotask() {
  return new Promise<void>((resolve) => {
    const channel = new MessageChannel()
    channel.port1.onmessage = () => resolve()
    channel.port2.postMessage(0)
  })
}

/**
 * One real rendering update, so the observers have measured the layout the
 * step has produced so far. Under load a real frame can be late; the fallback
 * is generous, and only there so a step can never hang on one.
 */
export function realFrame() {
  return new Promise<void>((resolve) => {
    let done = false
    const finish = () => {
      if (done) return
      done = true
      resolve()
    }
    realRaf(() => realSetTimeout(finish, 0))
    realSetTimeout(finish, 1000)
  })
}

export { realNow }

/* ── Install ────────────────────────────────────────────────────────────── */

if (virtual) {
  performance.now = animationNow
  window.requestAnimationFrame = requestFrame
  window.cancelAnimationFrame = cancelFrame

  // Motion only uses WAAPI when Element.prototype owns `animate`. Moving it to
  // the concrete element classes keeps el.animate() working for everyone else.
  const animate = Element.prototype.animate
  delete (Element.prototype as Partial<Element>).animate
  HTMLElement.prototype.animate = animate
  SVGElement.prototype.animate = animate

  Math.random = random

  // Timers the renderer sets for its own waits keep the real clock; everyone else's run on virtual time.
  const realSetInterval = window.setInterval.bind(window)
  window.setTimeout = ((handler: Handler, delay?: number, ...args: unknown[]) =>
    fromRenderer() ? realSetTimeout(handler, delay, ...args) : schedule(handler, delay, args, false)) as typeof window.setTimeout
  window.setInterval = ((handler: Handler, delay?: number, ...args: unknown[]) =>
    fromRenderer() ? realSetInterval(handler, delay, ...args) : schedule(handler, delay, args, true)) as typeof window.setInterval
  window.clearTimeout = clearTimer as typeof window.clearTimeout
  window.clearInterval = clearTimer as typeof window.clearInterval

  // new Date() and Date.now() tell the film's time; a Date made from a value is untouched.
  const RealDate = Date
  function VirtualDate(this: unknown, ...args: unknown[]) {
    if (!new.target) return new RealDate(wallNow()).toString()
    return args.length === 0 ? new RealDate(wallNow()) : new (RealDate as unknown as new (...a: unknown[]) => Date)(...args)
  }
  VirtualDate.prototype = RealDate.prototype
  VirtualDate.now = wallNow
  VirtualDate.parse = RealDate.parse
  VirtualDate.UTC = RealDate.UTC
  window.Date = VirtualDate as unknown as DateConstructor

  // Like the browser's: once unobserved or disconnected, an observer hears
  // nothing more, and observing again starts with a fresh first report.
  const Resize = window.ResizeObserver
  window.ResizeObserver = class extends Resize {
    constructor(callback: ResizeObserverCallback) {
      super((entries, observer) => hold(observer, (all) => callback(all as ResizeObserverEntry[], observer), entries))
      born.set(this, births++)
    }
    override unobserve(target: Element) {
      forget(this, target)
      super.unobserve(target)
    }
    override disconnect() {
      forget(this)
      super.disconnect()
    }
  }
  const Intersection = window.IntersectionObserver
  window.IntersectionObserver = class extends Intersection {
    constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
      super((entries, observer) => hold(observer, (all) => callback(all as IntersectionObserverEntry[], observer), entries), options)
      born.set(this, births++)
      intersections.set(this, (all) => callback(all as IntersectionObserverEntry[], this))
    }
    override unobserve(target: Element) {
      forget(this, target)
      super.unobserve(target)
    }
    override disconnect() {
      forget(this)
      intersections.delete(this)
      super.disconnect()
    }
  }

  changes?.observe(document, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeOldValue: true,
    characterData: true,
    characterDataOldValue: true,
  })

  // Every screenshot Remotion takes resizes the window for a moment. Libraries
  // react to that (Base UI's scroll lock rewrites the body's style, and the
  // sidebar's phone breakpoint flips it into its sheet and back), so a frame
  // would depend on which frames a tab happened to capture before it. The
  // composition never really resizes: resize events never reach the page,
  // and every media query keeps the answer it first gave.
  for (const target of [window, window.visualViewport]) target?.addEventListener('resize', (event) => event.stopImmediatePropagation(), true)
  const matchMedia = window.matchMedia.bind(window)
  const answers = new Map<string, MediaQueryList>()
  window.matchMedia = (query) => {
    let answer = answers.get(query)
    if (!answer) {
      const { matches, media } = matchMedia(query)
      answer = {
        matches,
        media,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }
      answers.set(query, answer)
    }
    return answer
  }
}
