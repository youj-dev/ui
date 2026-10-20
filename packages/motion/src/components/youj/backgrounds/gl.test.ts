import { createRenderLoop, type LoopSettings } from './gl'

// jsdom has no layout, ResizeObserver or IntersectionObserver: stand-ins that record what the loop does.
class FakeObserver {
  static instances: FakeObserver[] = []
  observe = vi.fn()
  disconnect = vi.fn()
  constructor(public callback: (entries: unknown[]) => void) {
    FakeObserver.instances.push(this)
  }
}

let frames: Map<number, FrameRequestCallback>
let nextId: number

beforeEach(() => {
  FakeObserver.instances = []
  frames = new Map()
  nextId = 0
  vi.stubGlobal('ResizeObserver', FakeObserver)
  vi.stubGlobal('IntersectionObserver', FakeObserver)
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn((cb: FrameRequestCallback) => {
      frames.set(++nextId, cb)
      return nextId
    }),
  )
  vi.stubGlobal(
    'cancelAnimationFrame',
    vi.fn((id: number) => frames.delete(id)),
  )
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => false })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function sizedCanvas(width = 400, height = 200) {
  const canvas = document.createElement('canvas')
  canvas.getBoundingClientRect = () => ({ width, height, top: 0, left: 0, right: width, bottom: height, x: 0, y: 0, toJSON: () => ({}) })
  return canvas
}

function runFrame(now: number) {
  const [id, cb] = [...frames.entries()].at(-1)!
  frames.delete(id)
  cb(now)
}

function makeLoop(settings: Partial<LoopSettings> = {}) {
  const render = vi.fn()
  const s: LoopSettings = { reduced: false, timeScale: 1, speed: 1, ...settings }
  const loop = createRenderLoop({ canvas: sizedCanvas(), maxDpr: 2, staticTime: 7, settings: () => s, render })
  return { loop, render, s }
}

test('destroy cancels the pending frame, disconnects both observers and stops listening for visibility', () => {
  const { loop } = makeLoop()
  expect(requestAnimationFrame).toHaveBeenCalledTimes(1)
  expect(FakeObserver.instances).toHaveLength(2)

  loop.destroy()

  expect(cancelAnimationFrame).toHaveBeenCalledWith(1)
  expect(frames.size).toBe(0)
  for (const observer of FakeObserver.instances) expect(observer.disconnect).toHaveBeenCalled()
  document.dispatchEvent(new Event('visibilitychange'))
  expect(requestAnimationFrame).toHaveBeenCalledTimes(1)
})

const flush = () => Promise.resolve()

test('reduced motion renders exactly one static frame and never starts the loop', async () => {
  const { render, loop } = makeLoop({ reduced: true })
  loop.invalidate() // a burst of invalidations still yields one frame
  await flush()
  expect(render).toHaveBeenCalledTimes(1)
  expect(render).toHaveBeenCalledWith(7, 0, { width: 400, height: 200, dpr: 1 })
  expect(requestAnimationFrame).not.toHaveBeenCalled()

  // Prop / theme changes redraw the still frame, still without a loop.
  loop.invalidate()
  await flush()
  expect(render).toHaveBeenCalledTimes(2)
  expect(requestAnimationFrame).not.toHaveBeenCalled()
  loop.destroy()
})

test('the clock advances by elapsed × speed / timeScale', () => {
  const { render, loop } = makeLoop({ timeScale: 2, speed: 3 })
  runFrame(1000)
  runFrame(1100) // 0.1 s real → 0.1 × 3 / 2
  const [time, dt] = render.mock.calls.at(-1)!
  expect(time).toBeCloseTo(7 + 0.15)
  expect(dt).toBeCloseTo(0.05) // dt ignores speed, honors timeScale
  loop.destroy()
})

test('pauses offscreen and in hidden tabs, then resumes without a time jump', () => {
  const { render, loop } = makeLoop()
  const io = FakeObserver.instances[1]!
  runFrame(1000)

  io.callback([{ isIntersecting: false }])
  expect(frames.size).toBe(0)

  io.callback([{ isIntersecting: true }])
  expect(frames.size).toBe(1)
  runFrame(50_000) // first frame after resuming contributes no elapsed time
  expect(render.mock.calls.at(-1)![0]).toBeCloseTo(7)

  Object.defineProperty(document, 'hidden', { configurable: true, get: () => true })
  document.dispatchEvent(new Event('visibilitychange'))
  expect(frames.size).toBe(0)
  loop.destroy()
})

test('switching to reduced motion stops the loop and draws the static frame', async () => {
  const { render, loop, s } = makeLoop()
  s.reduced = true
  loop.sync()
  await flush()
  expect(frames.size).toBe(0)
  expect(render.mock.calls.at(-1)![0]).toBe(7)
  loop.destroy()
})

test('an fps cap skips early frames but keeps the clock on real time', () => {
  const { render, loop } = makeLoop({ fps: 30 })
  runFrame(1000)
  expect(render).toHaveBeenCalledTimes(1)
  runFrame(1016.7) // a 60 Hz frame: too early for 30 fps
  expect(render).toHaveBeenCalledTimes(1)
  expect(frames.size).toBe(1) // still looping
  runFrame(1033.4)
  expect(render).toHaveBeenCalledTimes(2)
  const [time, dt] = render.mock.calls.at(-1)!
  expect(dt).toBeCloseTo(0.0334)
  expect(time).toBeCloseTo(7 + 0.0334)
  loop.destroy()
})

test('without a cap every display frame renders (the high tier is unchanged)', () => {
  const { render, loop } = makeLoop()
  runFrame(1000)
  runFrame(1008.3)
  runFrame(1016.7)
  expect(render).toHaveBeenCalledTimes(3)
  loop.destroy()
})

test('a running loop redraws as soon as it is resized, so the cleared canvas never paints', () => {
  vi.stubGlobal('devicePixelRatio', 1)
  const canvas = sizedCanvas()
  const render = vi.fn()
  const s: LoopSettings = { reduced: false, timeScale: 1, speed: 1 }
  const loop = createRenderLoop({ canvas, maxDpr: 2, staticTime: 7, settings: () => s, render })
  runFrame(1000)
  render.mockClear()
  canvas.getBoundingClientRect = () => ({ width: 400, height: 260, top: 0, left: 0, right: 400, bottom: 260, x: 0, y: 0, toJSON: () => ({}) })
  const resize = FakeObserver.instances.find((o) => o.observe.mock.calls.some(([el]) => el === canvas))!
  resize.callback([])
  expect(canvas.height).toBe(260)
  expect(render).toHaveBeenCalledTimes(1)
  // The same size again draws nothing extra.
  resize.callback([])
  expect(render).toHaveBeenCalledTimes(1)
  loop.destroy()
})

test('a maxDpr override resizes the canvas on the next sync', () => {
  vi.stubGlobal('devicePixelRatio', 3)
  const canvas = sizedCanvas()
  const s: LoopSettings = { reduced: false, timeScale: 1, speed: 1 }
  const loop = createRenderLoop({ canvas, maxDpr: 2, staticTime: 7, settings: () => s, render: vi.fn() })
  expect(canvas.width).toBe(800)
  s.maxDpr = 1
  loop.sync()
  expect([canvas.width, canvas.height]).toEqual([400, 200])
  loop.destroy()
})
