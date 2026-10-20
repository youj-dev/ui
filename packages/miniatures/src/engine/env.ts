import { createAudioGate } from './audio'
import { createClock } from './clock'
import { adaptCss, HOST_CSS, ROOT } from './css'
import { SHARED_DEFS } from './defs'
import { belongsToPage, keyEvent, normalizeKey } from './keys'
import { createKit } from './kit'
import { answer, isDark, type MediaAnswer, PROVIDER_SCOPE, providerMotion } from './media'
import { NS } from './projection'
import type { SnapshotStore } from './store'
import type { FigureEnv, FigureModule, MiniatureKeyboard, MiniatureReducedMotion, MiniatureMode } from './types'

/* Mounts a ported lab figure into a host. The figure's script expects a whole
 * page to itself: an <svg id="machine">, a caption with a readout and key
 * buttons, document-wide key listeners, window.AudioContext, matchMedia, a
 * requestAnimationFrame loop that runs forever. This module gives it that
 * page, per instance, inside the host's shadow root:
 *
 *   the page                      →  in a miniature
 *   <html> (:root)                →  the shadow root's wrapper, .yjm-root (its tokens, its modes)
 *   #machine, #drawing            →  the wrapper's <svg> and the drawing group in it
 *   #readout, #state              →  the snapshot store (onStateChange, getSnapshot)
 *   #announcement                 →  a polite live region in the wrapper
 *   .hint [data-k] buttons        →  stand-ins that record aria-pressed in the snapshot
 *   document keydown / keyup      →  routed by the `keyboard` prop (never the page's keys)
 *   window pointerdown, click     →  the host (a first gesture is a gesture on the miniature)
 *   window.AudioContext           →  nothing until `sound` is on and someone interacted
 *   window.figure = {setProgress} →  the handle's setProgress() and done()
 *   matchMedia, the stylesheet's  →  this host's mode and reduced motion (the props, the
 *     dark and reduced blocks          page's theme, the OS), as data-dark / data-reduced
 *   requestAnimationFrame, timers →  a clock that holds offscreen and stops on unmount
 *
 * The shadow root keeps the figure's ids and classes apart from the page and
 * from other miniatures. Everything else passes through to the real document
 * and window. */

export interface Settings {
  mode: MiniatureMode
  keyboard: MiniatureKeyboard
  sound: boolean
  reducedMotion: MiniatureReducedMotion
  interactive: boolean
}

export interface MountOptions {
  /** The host element: the shadow root's host. */
  host: HTMLElement
  /** The figure's id: the stylesheet is built once per figure (and document). */
  id: string
  figure: FigureModule
  /** The viewBox until the figure frames itself. */
  viewBox: string
  store: SnapshotStore
  /** The props now (read on demand, so changing one never remounts). */
  settings: () => Settings
  autoPlay: boolean
}

export interface MountedFigure {
  press(key: string): void
  pause(): void
  play(): void
  setProgress(progress: number | null): void
  done(): void
  /** The props changed: re-read the mode, motion and sound. */
  update(): void
  destroy(): void
}

type Listener = EventListenerOrEventListenerObject
type KeyListener = { fn: Listener; once: boolean; from: 'document' | 'window' }
type Win = Window & typeof globalThis

/** Events a figure listens for on the window to catch the first gesture; on a miniature they mean a gesture on it. */
const GESTURES = new Set(['pointerdown', 'mousedown', 'touchstart', 'click', 'dblclick'])

/** The adapted stylesheet text per figure, and one constructed sheet per figure and document, shared by every instance. */
const texts = new Map<string, string>()
const sheets = new WeakMap<Document, Map<string, CSSStyleSheet>>()
function styleFor(id: string, figure: FigureModule) {
  let text = texts.get(id)
  if (text === undefined) texts.set(id, (text = HOST_CSS + adaptCss(figure.css)))
  return text
}
function adopt(shadow: ShadowRoot, win: Win, id: string, figure: FigureModule) {
  const text = styleFor(id, figure)
  if ('adoptedStyleSheets' in shadow && typeof win.CSSStyleSheet === 'function' && 'replaceSync' in win.CSSStyleSheet.prototype) {
    const doc = win.document
    let byId = sheets.get(doc)
    if (!byId) sheets.set(doc, (byId = new Map()))
    let sheet = byId.get(id)
    if (!sheet) {
      sheet = new win.CSSStyleSheet()
      sheet.replaceSync(text)
      byId.set(id, sheet)
    }
    shadow.adoptedStyleSheets = [sheet]
    return null
  }
  const style = win.document.createElement('style')
  style.textContent = text
  return style
}

const call = (fn: Listener, self: unknown, event: Event) => (typeof fn === 'function' ? fn.call(self, event) : fn.handleEvent(event))
const noClasses = { add() {}, remove() {}, toggle: () => false, contains: () => false, replace: () => false }

/** Stands in for the caption's #readout / #state: writes land in the snapshot. */
function captionLine(read: () => string, write: (value: string) => void) {
  const text = { get: read, set: (value: unknown) => write(String(value ?? '')) }
  return Object.defineProperties(
    { classList: noClasses, style: {}, dataset: {}, setAttribute() {}, removeAttribute() {}, getAttribute: () => null, toggleAttribute: () => false },
    { textContent: text, innerText: text, innerHTML: text, value: text },
  )
}

/** Stands in for a caption key button (`<button data-k="d" aria-pressed>`): its pressed state lands in the snapshot. */
function captionButton(k: string, store: SnapshotStore) {
  const key = normalizeKey(k)
  const attrs = new Map<string, string>([['data-k', k]])
  const pressed = () => store.get().pressed[key]
  const setPressed = (value: unknown) => store.press(key, String(value) === 'true')
  return {
    dataset: { k },
    tagName: 'BUTTON',
    getAttribute: (name: string) => (name === 'aria-pressed' ? (pressed() === undefined ? null : String(pressed())) : (attrs.get(name) ?? null)),
    hasAttribute: (name: string) => (name === 'aria-pressed' ? pressed() !== undefined : attrs.has(name)),
    setAttribute: (name: string, value: unknown) => (name === 'aria-pressed' ? setPressed(value) : attrs.set(name, String(value))),
    removeAttribute: (name: string) => (name === 'aria-pressed' ? store.press(key, false) : attrs.delete(name)),
    toggleAttribute: () => false,
    get ariaPressed() {
      return pressed() === undefined ? null : String(pressed())
    },
    set ariaPressed(value: unknown) {
      setPressed(value)
    },
    addEventListener() {},
    removeEventListener() {},
    closest: () => null,
    matches: () => false,
    contains: () => false,
    focus() {},
    blur() {},
    classList: noClasses,
    style: {},
  }
}

export function mountFigure(o: MountOptions): MountedFigure {
  const { host, figure, store, settings } = o
  const doc = host.ownerDocument
  const win = doc.defaultView as Win
  const undo: (() => void)[] = []
  const on = (target: EventTarget, type: string, fn: Listener, options?: AddEventListenerOptions | boolean) => {
    target.addEventListener(type, fn, options)
    undo.push(() => target.removeEventListener(type, fn, options))
  }
  const { interactive } = settings()

  /* The page, in the shadow root: the stylesheet, the root wrapper, the svg with its defs and drawing group, a live region. */
  const shadow = host.shadowRoot ?? host.attachShadow({ mode: 'open' })
  const style = adopt(shadow, win, o.id, figure)
  const root = doc.createElement('div')
  root.className = ROOT
  const svg = doc.createElementNS(NS, 'svg') as SVGSVGElement
  svg.setAttribute('viewBox', o.viewBox)
  if (figure.svgClass) svg.setAttribute('class', figure.svgClass)
  if (interactive) svg.setAttribute('role', 'none')
  else svg.setAttribute('aria-hidden', 'true')
  const defs = doc.createElementNS(NS, 'defs')
  defs.innerHTML = (figure.sharedDefs === false ? '' : `${SHARED_DEFS}\n`) + figure.defs
  const drawing = doc.createElementNS(NS, 'g')
  svg.append(defs, drawing)
  root.append(svg)
  const live = doc.createElement('span')
  if (interactive) {
    live.setAttribute('role', 'status')
    live.setAttribute('aria-live', 'polite')
    root.append(live)
  }
  shadow.replaceChildren(...(style ? [style] : []), root)

  /* Clock: holds while offscreen, while paused, and (autoPlay off) until someone interacts, after one first frame. */
  let hold: 'interaction' | 'handle' | null = o.autoPlay ? null : 'interaction'
  let firstFrame = hold !== null
  let visible = true
  let destroyed = false
  const clock = createClock(
    win,
    () => visible && (hold === null || firstFrame),
    () => {
      firstFrame = false
    },
  )
  const audio = createAudioGate(
    win,
    () => settings().sound,
    () => settings().sound && visible && hold === null && !destroyed,
  )
  const play = () => {
    hold = null
    clock.wake()
    audio.sync()
  }
  const pause = () => {
    hold = 'handle'
    audio.sync()
  }
  /** Someone interacted with the miniature: sound may start, and a miniature waiting for interaction starts. */
  const gesture = (trusted: boolean) => {
    if (trusted) audio.unlock()
    if (hold === 'interaction') play()
  }
  if (typeof win.IntersectionObserver === 'function') {
    const io = new win.IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1]
        if (!entry) return
        visible = entry.isIntersecting
        clock.wake()
        audio.sync()
      },
      { rootMargin: '160px' },
    )
    io.observe(host)
    undo.push(() => io.disconnect())
  }

  /* Scheme and reduced motion: resolved here, written on the wrapper for the stylesheet, answered to matchMedia for the script. */
  const answers = new Set<MediaAnswer>()
  const osReduced = win.matchMedia?.('(prefers-reduced-motion: reduce)')
  const osDark = win.matchMedia?.('(prefers-color-scheme: dark)')
  const reduced = () => {
    const setting = settings().reducedMotion
    if (setting !== 'user') return setting === 'always'
    const provider = providerMotion(host)
    return provider ? provider === 'reduced' : Boolean(osReduced?.matches)
  }
  const dark = () => isDark(host, settings().mode, Boolean(osDark?.matches))
  let scope: Element | null | undefined
  let scopeWatch: MutationObserver | undefined
  const refresh = () => {
    // The provider's scope can change under a mounted miniature (its `reducedMotion` prop flips): watch the nearest one.
    const nearest = host.parentElement?.closest(PROVIDER_SCOPE) ?? null
    if (scopeWatch && nearest !== scope) {
      scopeWatch.disconnect()
      if (nearest) scopeWatch.observe(nearest, { attributes: true, attributeFilter: ['style', 'data-yj-reduced'] })
      scope = nearest
    }
    root.toggleAttribute('data-dark', dark())
    root.toggleAttribute('data-reduced', reduced())
    answers.forEach((a) => a.refresh())
  }
  if (typeof win.MutationObserver === 'function') {
    scopeWatch = new win.MutationObserver(refresh)
    undo.push(() => scopeWatch?.disconnect())
  }
  refresh()
  for (const mq of [osReduced, osDark]) if (mq && typeof mq.addEventListener === 'function') on(mq, 'change', refresh)
  if (typeof win.MutationObserver === 'function') {
    // The page's theme: a class or data-theme on <html> or <body> (next-themes, Storybook, most apps).
    const theme = new win.MutationObserver(refresh)
    for (const el of [doc.documentElement, doc.body]) if (el) theme.observe(el, { attributes: true, attributeFilter: ['class', 'data-theme'] })
    undo.push(() => theme.disconnect())
  }
  function matchMedia(query: string): MediaQueryList {
    const q = query.replace(/\s+/g, '')
    let a: MediaAnswer
    if (q.includes('prefers-reduced-motion')) a = answer(query, q.includes('no-preference') ? () => !reduced() : reduced)
    else if (q.includes('prefers-color-scheme')) a = answer(query, q.includes('light') ? () => !dark() : dark)
    else if (win.matchMedia) {
      const real = win.matchMedia(query)
      a = answer(query, () => real.matches)
      if (typeof real.addEventListener === 'function') on(real, 'change', () => a.refresh())
    } else a = answer(query, () => false)
    answers.add(a)
    return a
  }

  /* Listeners: keys go to the bus below; first-gesture events to the host; the rest to the real target. */
  const keys: Record<'keydown' | 'keyup', KeyListener[]> = { keydown: [], keyup: [] }
  const placed: [EventTarget, string, Listener, AddEventListenerOptions | boolean | undefined][] = []
  const targetFor = (from: 'document' | 'window', type: string): EventTarget => (GESTURES.has(type) ? host : from === 'document' ? doc : win)
  function listen(from: 'document' | 'window', type: string, fn: Listener | null, options?: AddEventListenerOptions | boolean) {
    if (!fn) return
    if (type === 'keydown' || type === 'keyup') {
      keys[type].push({ fn, once: typeof options === 'object' && Boolean(options.once), from })
      return
    }
    const target = targetFor(from, type)
    target.addEventListener(type, fn, options)
    placed.push([target, type, fn, options])
  }
  function unlisten(from: 'document' | 'window', type: string, fn: Listener | null, options?: AddEventListenerOptions | boolean) {
    if (!fn) return
    if (type === 'keydown' || type === 'keyup') {
      keys[type] = keys[type].filter((l) => l.fn !== fn)
      return
    }
    const target = targetFor(from, type)
    target.removeEventListener(type, fn, options)
    const i = placed.findIndex((p) => p[0] === target && p[1] === type && p[2] === fn)
    if (i >= 0) placed.splice(i, 1)
  }
  /** Hands a key event to the figure's listeners: the document's, then the window's, as the event would have bubbled. */
  function deliver(event: KeyboardEvent) {
    const type = event.type as 'keydown' | 'keyup'
    const list = keys[type]
    if (!list?.length) return
    for (const l of [...list.filter((l) => l.from === 'document'), ...list.filter((l) => l.from === 'window')]) {
      if (l.once) keys[type] = keys[type].filter((x) => x !== l)
      call(l.fn, l.from === 'document' ? documentStandIn : windowStandIn, event)
    }
  }

  /* Keyboard scope. Focus inside the miniature: always its own (unless keyboard is off).
   * Elsewhere: `global` takes it unless it's the page's (typing, a control's own keys);
   * `scoped` takes it only while hovered and nothing else has focus. Keys from inside
   * the shadow root are caught there, where the figure sees their real target. */
  const synthetic = new WeakSet<Event>()
  let hovered = false
  const held = new Set<string>()
  const own = (e: Event) => synthetic.has(e) || (settings().interactive && settings().keyboard !== 'off')
  const onInnerKey = (event: Event) => {
    if (!own(event)) return
    gesture(true)
    deliver(event as KeyboardEvent)
  }
  const onHostKey = (event: Event) => {
    if (event.composedPath()[0] !== host || !own(event)) return
    if (!synthetic.has(event)) gesture(true)
    deliver(event as KeyboardEvent)
  }
  const onPageKey = (event: Event) => {
    const e = event as KeyboardEvent
    if (e.composedPath().includes(host)) return
    const { keyboard } = settings()
    if (keyboard === 'off') return
    const releasing = e.type === 'keyup' && held.has(e.key)
    if (keyboard === 'scoped') {
      const nothingFocused = e.target === doc.body || e.target === doc.documentElement || e.target === doc
      if (!releasing && !(hovered && nothingFocused)) return
    } else if (!releasing && belongsToPage(e.key, e.target)) return
    if (e.type === 'keydown') held.add(e.key)
    else held.delete(e.key)
    gesture(true)
    deliver(e)
  }
  on(host, 'keydown', onHostKey)
  on(host, 'keyup', onHostKey)
  if (interactive) {
    on(shadow, 'keydown', onInnerKey)
    on(shadow, 'keyup', onInnerKey)
    on(doc, 'keydown', onPageKey)
    on(doc, 'keyup', onPageKey)
    on(host, 'pointerenter', () => (hovered = true))
    on(host, 'pointerleave', () => (hovered = false))
    on(host, 'pointerdown', () => gesture(true), true)
  }

  /* The caption's stand-ins, and the document a figure sees. */
  const readout = captionLine(
    () => store.get().readout,
    (v) => store.line('readout', v),
  )
  const stateLine = captionLine(
    () => store.get().state,
    (v) => store.line('state', v),
  )
  const buttons = new Map(figure.hints.map((k) => [k, captionButton(k, store)]))
  const known: Record<string, unknown> = { machine: svg, drawing, readout, state: stateLine, announcement: live }
  const documentOwn: Record<PropertyKey, unknown> = {
    documentElement: root,
    getElementById: (id: string) => (id in known ? known[id] : shadow.getElementById(id)),
    querySelector(selector: string) {
      const k = selector.match(/\[data-k=(["'])(.*?)\1\]/)
      if (k) return buttons.get(k[2]!) ?? null
      if (selector === '#machine' || selector === 'svg') return svg
      return shadow.querySelector(selector)
    },
    querySelectorAll: (selector: string) => (selector.includes('[data-k]') ? [...buttons.values()] : [...shadow.querySelectorAll(selector)]),
    addEventListener: (type: string, fn: Listener | null, options?: AddEventListenerOptions | boolean) => listen('document', type, fn, options),
    removeEventListener: (type: string, fn: Listener | null, options?: AddEventListenerOptions | boolean) => unlisten('document', type, fn, options),
  }
  const documentStandIn = new Proxy(doc, {
    get(target, prop) {
      if (Object.hasOwn(documentOwn, prop)) return documentOwn[prop]
      // Focus inside the shadow root reads as the host on the real document.
      if (prop === 'activeElement') return shadow.activeElement ?? target.activeElement
      const value = Reflect.get(target, prop, target)
      return typeof value === 'function' ? value.bind(target) : value
    },
  })

  /* window: the progress API, gated audio, the clock, scoped listeners; globals a figure sets stay in its sandbox. */
  let progressApi: { setProgress?: (p: number | null) => void; done?: () => void } | null = null
  const sandbox = new Map<PropertyKey, unknown>()
  const windowListen = (type: string, fn: Listener | null, options?: AddEventListenerOptions | boolean) => listen('window', type, fn, options)
  const windowUnlisten = (type: string, fn: Listener | null, options?: AddEventListenerOptions | boolean) => unlisten('window', type, fn, options)
  const windowOwn: Record<PropertyKey, () => unknown> = {
    document: () => documentStandIn,
    figure: () => progressApi,
    AudioContext: () => audio.ctor(),
    webkitAudioContext: () => audio.ctor(),
    matchMedia: () => matchMedia,
    requestAnimationFrame: () => clock.requestAnimationFrame,
    cancelAnimationFrame: () => clock.cancelAnimationFrame,
    setTimeout: () => clock.setTimeout,
    clearTimeout: () => clock.clearTimeout,
    setInterval: () => clock.setInterval,
    clearInterval: () => clock.clearInterval,
    addEventListener: () => windowListen,
    removeEventListener: () => windowUnlisten,
  }
  const windowStandIn = new Proxy(win, {
    get(target, prop) {
      const own = windowOwn[prop]
      if (own) return own()
      if (sandbox.has(prop)) return sandbox.get(prop)
      const value = Reflect.get(target, prop, target)
      // Bind methods (getComputedStyle), not constructors (DOMPoint, OfflineAudioContext).
      return typeof value === 'function' && !/^[A-Z]/.test(String(prop)) ? value.bind(target) : value
    },
    set(_target, prop, value) {
      if (prop === 'figure') progressApi = value
      else sandbox.set(prop, value)
      return true
    },
  }) as Win

  const env: FigureEnv = {
    document: documentStandIn,
    window: windowStandIn,
    matchMedia,
    requestAnimationFrame: clock.requestAnimationFrame,
    cancelAnimationFrame: clock.cancelAnimationFrame,
    setTimeout: clock.setTimeout,
    clearTimeout: clock.clearTimeout,
    setInterval: clock.setInterval,
    clearInterval: clock.clearInterval,
    addEventListener: windowListen as FigureEnv['addEventListener'],
    removeEventListener: windowUnlisten as FigureEnv['removeEventListener'],
    kit: (getRoot) => createKit(svg, getRoot),
  }

  figure.draw(env)
  // A still picture: nothing in it takes focus.
  if (!interactive) for (const el of svg.querySelectorAll('[tabindex]')) el.removeAttribute('tabindex')

  function press(key: string) {
    const init = keyEvent(normalizeKey(key))
    const active = (win.navigator as Navigator & { userActivation?: { isActive: boolean } }).userActivation?.isActive ?? true
    gesture(active)
    for (const type of ['keydown', 'keyup']) {
      // Dispatched on the host and not bubbling: the page never sees a key it didn't press.
      const event = new win.KeyboardEvent(type, { ...init, cancelable: true })
      synthetic.add(event)
      host.dispatchEvent(event)
    }
  }

  return {
    press,
    pause,
    play,
    setProgress(progress) {
      if (hold === 'interaction') play()
      progressApi?.setProgress?.(progress)
    },
    done() {
      if (hold === 'interaction') play()
      progressApi?.done?.()
    },
    update() {
      refresh()
      audio.sync()
    },
    destroy() {
      destroyed = true
      clock.stop()
      undo.forEach((f) => f())
      for (const [target, type, fn, options] of placed) target.removeEventListener(type, fn, options)
      placed.length = 0
      keys.keydown = []
      keys.keyup = []
      answers.clear()
      audio.close()
      shadow.replaceChildren()
      store.reset()
    },
  }
}
