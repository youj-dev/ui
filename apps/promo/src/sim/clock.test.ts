import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/* clock.ts installs itself when its module is evaluated, and only inside
 * Remotion's renderer (window.remotion_puppeteerTimeout is set by it before
 * any script runs). Each test evaluates a fresh copy. */

type Clock = typeof import('./clock')

/** The renderer's flag, writable and deletable here. */
const flags = window as { remotion_puppeteerTimeout?: number }

const originals = {
  now: performance.now,
  raf: window.requestAnimationFrame,
  caf: window.cancelAnimationFrame,
  random: Math.random,
  animate: Object.getOwnPropertyDescriptor(Element.prototype, 'animate'),
  resize: window.ResizeObserver,
  intersection: window.IntersectionObserver,
  matchMedia: window.matchMedia,
  setTimeout: window.setTimeout,
  setInterval: window.setInterval,
  clearTimeout: window.clearTimeout,
  clearInterval: window.clearInterval,
  Date: window.Date,
}

/** Stands in for the browser's observers (jsdom has none): `report()` calls every one back, as a rendering update would. */
const observed: ((entries: object[]) => void)[] = []
class FakeObserver {
  /** A report the browser has computed but not yet sent (an IntersectionObserver's comes in a task of its own). */
  queued: object[] = []
  constructor(callback: (entries: object[], observer: unknown) => void) {
    observed.push((entries) => callback(entries, this))
  }
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return this.queued.splice(0)
  }
}
const report = (entries: object[] = []) => observed.forEach((run) => run(entries))

/** The browser's own animation frames (jsdom has none). The clock hands some requests on to them. */
const realRaf = vi.fn((_: FrameRequestCallback) => 7)
const realCancel = vi.fn()

/** Stands in for the browser's media queries (jsdom has none): the viewport is `viewport.width` wide. */
const viewport = { width: 960 }
const realMatchMedia = (query: string) => {
  const max = Number(query.match(/max-width:\s*(\d+)px/)?.[1] ?? Infinity)
  return { matches: viewport.width <= max, media: query } as MediaQueryList
}

async function load(rendering: boolean): Promise<Clock> {
  vi.resetModules()
  realRaf.mockClear()
  realCancel.mockClear()
  observed.length = 0
  window.requestAnimationFrame = realRaf
  window.cancelAnimationFrame = realCancel
  viewport.width = 960
  window.matchMedia = realMatchMedia
  window.ResizeObserver = FakeObserver as unknown as typeof ResizeObserver
  window.IntersectionObserver = FakeObserver as unknown as typeof IntersectionObserver
  if (!Object.getOwnPropertyDescriptor(Element.prototype, 'animate')) {
    Object.defineProperty(Element.prototype, 'animate', { value: () => ({}), configurable: true, writable: true })
  }
  if (rendering) flags.remotion_puppeteerTimeout = 30_000
  else delete flags.remotion_puppeteerTimeout
  return import('./clock')
}

afterEach(() => {
  performance.now = originals.now
  window.requestAnimationFrame = originals.raf
  window.cancelAnimationFrame = originals.caf
  window.ResizeObserver = originals.resize
  window.IntersectionObserver = originals.intersection
  window.matchMedia = originals.matchMedia
  window.setTimeout = originals.setTimeout
  window.setInterval = originals.setInterval
  window.clearTimeout = originals.clearTimeout
  window.clearInterval = originals.clearInterval
  window.Date = originals.Date
  Math.random = originals.random
  if (originals.animate) Object.defineProperty(Element.prototype, 'animate', originals.animate)
  delete flags.remotion_puppeteerTimeout
})

describe('while rendering', () => {
  let clock: Clock
  beforeEach(async () => {
    clock = await load(true)
  })

  it('makes performance.now virtual: it only moves when the simulation sets the time', () => {
    clock.setTime(0)
    const start = performance.now()
    expect(performance.now()).toBe(start)
    clock.setTime(1000 / 60)
    expect(performance.now() - start).toBeCloseTo(1000 / 60)
  })

  it('queues animation frames until the simulation flushes one, at virtual time', () => {
    clock.setTime(500)
    const seen: number[] = []
    window.requestAnimationFrame((t) => seen.push(t))
    expect(seen).toEqual([])
    clock.flushFrame()
    expect(seen).toEqual([performance.now()])
  })

  it('gives each animation frame within a step its own timestamp, and starts the next step exactly on time', () => {
    clock.setTime(500)
    const start = performance.now()
    const seen: number[] = []
    window.requestAnimationFrame((t) => seen.push(t))
    clock.flushFrame()
    window.requestAnimationFrame((t) => seen.push(t))
    clock.flushFrame()
    // Two frames, two timestamps, both within a microsecond or two of the step's time.
    expect(seen[1]).toBeGreaterThan(seen[0]!)
    expect(seen[1]! - start).toBeLessThan(0.01)
    // An empty flush is not a frame.
    const before = performance.now()
    clock.flushFrame()
    expect(performance.now()).toBe(before)
    clock.setTime(500 + 1000 / 60)
    expect(performance.now() - start).toBeCloseTo(1000 / 60, 9)
  })

  it('keeps timers on the step’s exact time, whatever frames it has run', () => {
    clock.setTime(0)
    const fired: number[] = []
    window.setTimeout(() => fired.push(1), 100)
    for (let i = 0; i < 5; i++) {
      window.requestAnimationFrame(() => {})
      clock.flushFrame()
    }
    clock.setTime(100)
    clock.flushTimers()
    expect(fired).toEqual([1])
  })

  it('runs a frame requested during a flush in the next flush, like the browser', () => {
    let second = 0
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => second++))
    clock.flushFrame()
    expect(second).toBe(0)
    clock.flushFrame()
    expect(second).toBe(1)
  })

  it('cancels a queued frame', () => {
    const callback = vi.fn()
    const id = window.requestAnimationFrame(callback)
    window.cancelAnimationFrame(id)
    clock.flushFrame()
    expect(callback).not.toHaveBeenCalled()
  })

  it("gives the renderer's own waits real frames, and nothing else", () => {
    // Code the renderer evaluates in the page carries Puppeteer's source URL.
    const fromRenderer = new Function('callback', 'return window.requestAnimationFrame(callback)\n//# sourceURL=pptr://__puppeteer_evaluation_script__') as (
      callback: FrameRequestCallback,
    ) => number
    const renderer = vi.fn()
    const library = vi.fn()
    const id = fromRenderer(renderer)
    window.requestAnimationFrame(library)
    expect(realRaf).toHaveBeenCalledOnce()
    clock.flushFrame()
    expect(library).toHaveBeenCalledOnce()
    expect(renderer).not.toHaveBeenCalled()
    realRaf.mock.calls[0]![0](0)
    expect(renderer).toHaveBeenCalledOnce()
    window.cancelAnimationFrame(fromRenderer(renderer))
    expect(realCancel).toHaveBeenCalledWith(7)
    expect(id).not.toBe(window.requestAnimationFrame(library))
  })

  it('holds what observers see until the simulation hands it over, the latest entry per element', () => {
    const resized = vi.fn()
    const intersected = vi.fn()
    const resize = new ResizeObserver(resized)
    new IntersectionObserver(intersected)
    const target = document.createElement('div')
    const delivered = () => {
      const before = clock.activity()
      clock.deliverObservations()
      return clock.activity() - before
    }
    report([{ target, contentRect: { width: 10, height: 1 } }])
    report([{ target, contentRect: { width: 10, height: 2 } }])
    expect(resized).not.toHaveBeenCalled()
    expect(delivered()).toBe(2)
    expect(resized).toHaveBeenCalledExactlyOnceWith([{ target, contentRect: { width: 10, height: 2 } }], resize)
    expect(intersected).toHaveBeenCalledOnce()
    expect(delivered()).toBe(0)

    // A size that changed and changed back since the last delivery isn't news.
    report([{ target, contentRect: { width: 10, height: 9 } }])
    report([{ target, contentRect: { width: 10, height: 2 } }])
    expect(delivered()).toBe(0)
    expect(resized).toHaveBeenCalledOnce()

    // Like the browser, a disconnected observer hears nothing more.
    report([{ target, contentRect: { width: 10, height: 3 } }])
    resize.disconnect()
    delivered()
    expect(resized).toHaveBeenCalledOnce()
  })

  it('takes an intersection report the browser has queued but not yet sent, so it lands in the step it describes', () => {
    const intersected = vi.fn()
    const observer = new IntersectionObserver(intersected)
    const entry = { target: document.createElement('div'), isIntersecting: true, intersectionRatio: 1 }
    ;(observer as unknown as FakeObserver).queued.push(entry)
    clock.deliverObservations()
    expect(intersected).toHaveBeenCalledExactlyOnceWith([entry], observer)
    // The browser's own delivery then finds nothing left to send.
    expect(observer.takeRecords()).toEqual([])
  })

  it('tells resize observers first, then intersection observers, each in the order they were made', () => {
    const told: string[] = []
    new IntersectionObserver(() => told.push('intersection 1'))
    new ResizeObserver(() => told.push('resize 1'))
    new IntersectionObserver(() => told.push('intersection 2'))
    new ResizeObserver(() => told.push('resize 2'))
    const entry = { target: document.createElement('div'), contentRect: { width: 1, height: 1 }, isIntersecting: true, intersectionRatio: 1 }
    // Reported in the opposite order, as a busier machine might.
    for (const run of [...observed].reverse()) run([entry])
    clock.deliverObservations()
    expect(told).toEqual(['resize 1', 'resize 2', 'intersection 1', 'intersection 2'])
  })

  it("keeps every media query's first answer, so a screenshot's resize can't flip a breakpoint", () => {
    const phone = window.matchMedia('(max-width: 767px)')
    expect(phone.matches).toBe(false)
    const changed = vi.fn()
    phone.addEventListener('change', changed)
    viewport.width = 400
    expect(window.matchMedia('(max-width: 767px)').matches).toBe(false)
    expect(changed).not.toHaveBeenCalled()
  })

  it('keeps resize events from the page', () => {
    const resized = vi.fn()
    window.addEventListener('resize', resized)
    window.dispatchEvent(new Event('resize'))
    expect(resized).not.toHaveBeenCalled()
    window.removeEventListener('resize', resized)
  })

  it('seeds Math.random per frame, so decoding text is the same on every render', () => {
    clock.reseed(42)
    const a = [Math.random(), Math.random()]
    clock.reseed(43)
    const b = [Math.random(), Math.random()]
    clock.reseed(42)
    expect([Math.random(), Math.random()]).toEqual(a)
    expect(b).not.toEqual(a)
  })

  it('runs timers on virtual time: each fires in the first flush that reaches it, earliest first', () => {
    clock.setTime(0)
    const fired: string[] = []
    window.setTimeout(() => fired.push('late'), 300)
    window.setTimeout(() => fired.push('first'), 100)
    window.setTimeout(() => fired.push('second'), 100)
    const dropped = window.setTimeout(() => fired.push('cleared'), 50)
    window.clearTimeout(dropped)
    clock.flushTimers()
    expect(fired).toEqual([])
    clock.setTime(200)
    clock.flushTimers()
    expect(fired).toEqual(['first', 'second'])
    clock.setTime(1000)
    clock.flushTimers()
    expect(fired).toEqual(['first', 'second', 'late'])
  })

  it('runs a zero-delay timer set by a callback in the same flush, and repeats intervals at their period until cleared', () => {
    clock.setTime(0)
    const fired: string[] = []
    window.setTimeout(() => window.setTimeout(() => fired.push('chained')), 10)
    let ticks = 0
    const interval = window.setInterval(() => ticks++, 250)
    clock.setTime(20)
    clock.flushTimers()
    expect(fired).toEqual(['chained'])
    clock.setTime(1000)
    clock.flushTimers()
    expect(ticks).toBe(4)
    window.clearInterval(interval)
    clock.setTime(2000)
    clock.flushTimers()
    expect(ticks).toBe(4)
  })

  it("keeps the renderer's own timers on the real clock", () => {
    const real = vi.fn((..._: unknown[]) => 7)
    window.setTimeout = real as unknown as typeof window.setTimeout
    return load(true).then((fresh) => {
      const fromRenderer = new Function('callback', 'return window.setTimeout(callback, 5)\n//# sourceURL=pptr://__puppeteer_evaluation_script__') as (
        callback: () => void,
      ) => number
      const renderer = vi.fn()
      expect(fromRenderer(renderer)).toBe(7)
      expect(real).toHaveBeenCalledOnce()
      const library = vi.fn()
      window.setTimeout(library, 5)
      expect(real).toHaveBeenCalledOnce()
      fresh.setTime(10)
      fresh.flushTimers()
      expect(library).toHaveBeenCalledOnce()
      expect(renderer).not.toHaveBeenCalled()
    })
  })

  it('drops every pending timer on a rewind', () => {
    clock.setTime(0)
    const callback = vi.fn()
    window.setTimeout(callback, 10)
    clock.clearTimers()
    clock.setTime(100)
    clock.flushTimers()
    expect(callback).not.toHaveBeenCalled()
  })

  it('tells the film’s time from Date.now() and new Date(), and leaves a Date made from a value alone', () => {
    clock.setTime(0)
    const morning = Date.now()
    expect(new Date(morning).getHours()).toBe(9)
    expect(new Date().getTime()).toBe(morning)
    clock.setTime(60_000)
    expect(Date.now() - morning).toBe(60_000)
    expect(new Date(0).getTime()).toBe(0)
    expect(new Date() instanceof Date).toBe(true)
    expect(typeof Date()).toBe('string')
  })

  it('hides WAAPI from Motion but keeps el.animate() working for everything else', () => {
    expect(Object.hasOwn(Element.prototype, 'animate')).toBe(false)
    expect(typeof document.createElement('div').animate).toBe('function')
  })

  it('pins CSS and WAAPI animations to virtual time and finishes them at their end', () => {
    const animation = {
      playState: 'running' as AnimationPlayState,
      currentTime: null as number | null,
      pause: vi.fn(),
      finish: vi.fn(),
      effect: { getComputedTiming: () => ({ endTime: 220 }) },
    }
    document.getAnimations = () => [animation as unknown as Animation]
    // Starting and finishing count as activity: either can set more off.
    const seek = () => {
      const before = clock.activity()
      clock.seekAnimations()
      return clock.activity() - before
    }
    clock.setTime(1000)
    expect(seek()).toBe(1)
    expect(animation.pause).toHaveBeenCalledOnce()
    expect(animation.currentTime).toBe(0)
    clock.setTime(1100)
    expect(seek()).toBe(0)
    expect(animation.currentTime).toBe(100)
    expect(animation.finish).not.toHaveBeenCalled()
    clock.setTime(1220)
    expect(seek()).toBe(1)
    expect(animation.finish).toHaveBeenCalledOnce()
  })

  it('leaves an animation paused by the code that made it to that code, until it plays', () => {
    const animation = {
      playState: 'paused' as AnimationPlayState,
      currentTime: 40 as number | null,
      pause: vi.fn(),
      finish: vi.fn(),
      effect: { getComputedTiming: () => ({ endTime: 220 }) },
    }
    document.getAnimations = () => [animation as unknown as Animation]
    clock.setTime(1000)
    clock.seekAnimations()
    clock.setTime(1500)
    clock.seekAnimations()
    expect(animation.currentTime).toBe(40)
    expect(animation.pause).not.toHaveBeenCalled()
    expect(animation.finish).not.toHaveBeenCalled()
    animation.playState = 'running'
    clock.seekAnimations()
    expect(animation.pause).toHaveBeenCalledOnce()
    expect(animation.currentTime).toBe(0)
  })

  it('reports net DOM changes, not styles rewritten to the value they had', () => {
    const box = document.createElement('div')
    box.setAttribute('style', 'opacity: 0.5')
    document.body.append(box)
    expect(clock.takeChanges()).toBe(true)
    expect(clock.takeChanges()).toBe(false)
    box.setAttribute('style', 'opacity: 0.6')
    box.setAttribute('style', 'opacity: 0.5')
    expect(clock.takeChanges()).toBe(false)
    box.setAttribute('style', 'opacity: 0.7')
    expect(clock.takeChanges()).toBe(true)
    box.firstChild?.remove()
    box.textContent = 'Deployed'
    expect(clock.takeChanges()).toBe(true)
    box.remove()
  })
})

describe('in the Studio', () => {
  it('leaves the real clock alone, so the preview plays in real time', async () => {
    const clock = await load(false)
    expect(clock.virtual).toBe(false)
    expect(performance.now).toBe(originals.now)
    expect(Object.hasOwn(Element.prototype, 'animate')).toBe(true)
    expect(window.setTimeout).toBe(originals.setTimeout)
    expect(window.Date).toBe(originals.Date)
  })
})
