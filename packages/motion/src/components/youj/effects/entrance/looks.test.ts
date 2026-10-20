import { blueprint } from '../blueprint/engine'
import { generate } from '../generate/engine'
import { inspector } from '../inspector/engine'
import { layers } from '../layers/engine'
import { renderPasses } from '../passes/engine'
import { prism } from '../prism/engine'
import { trace } from '../trace/engine'
import { entrance, spread } from './run'

/* Every look on the shared runtime keeps the same contract (jsdom has no layout, canvas or Web Animations, so this
 * holds the contract; the looks themselves are checked in Chromium): an aria-hidden overlay beside the demo, nothing
 * left behind when cancelled or finished, the demo's markup exactly as it was, nothing at all under reduced motion. */

let animations: { el: Element; cancelled: boolean; paused: boolean; currentTime: number | null }[] = []
let frames: FrameRequestCallback[] = []
beforeEach(() => {
  animations = []
  frames = []
  Element.prototype.animate = function (this: Element) {
    const a = {
      el: this,
      cancelled: false,
      paused: false,
      startTime: null as number | null,
      currentTime: null as number | null,
      cancel() {
        this.cancelled = true
      },
      pause() {
        this.paused = true
      },
    }
    animations.push(a)
    return a as unknown as Animation
  }
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => frames.push(cb))
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
})
afterEach(() => {
  delete (Element.prototype as Partial<Element>).animate
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

function demo() {
  const host = document.createElement('div')
  host.innerHTML =
    '<form style="padding:24px"><h2>Sign in</h2><p style="color:red">Welcome back.</p><input aria-label="Email"><button type="submit">Sign in</button></form>'
  document.body.append(host)
  return { host, node: host.firstElementChild as HTMLElement }
}

const looks = { blueprint, generate, inspector, layers, renderPasses, prism, trace }
const attr: Record<string, string> = { renderPasses: 'passes' }

describe.each(Object.entries(looks))('%s', (name, play) => {
  it('adds one aria-hidden overlay, and cancel leaves the demo exactly as it was', async () => {
    const { host, node } = demo()
    const before = host.innerHTML
    const run = play(node, { reduced: false })
    const overlay = host.querySelector(`[data-yj-${attr[name] ?? name}]`)!
    expect(overlay).toHaveAttribute('aria-hidden', 'true')
    run.cancel()
    expect(host.innerHTML).toBe(before)
    expect(animations.every((a) => a.cancelled)).toBe(true)
    await expect(run.finished).resolves.toBeUndefined()
  })

  it('ends on its own clock with nothing left behind', () => {
    const { host, node } = demo()
    const before = host.innerHTML
    play(node, { reduced: false, duration: 1000 })
    frames.shift()!(0)
    frames.shift()!(5000)
    expect(host.innerHTML).toBe(before)
  })

  it('holds still when paused, shows the moment it is moved to, and ends at its end', () => {
    const { host, node } = demo()
    const before = host.innerHTML
    const run = play(node, { reduced: false, paused: true, duration: 1000 })
    expect(frames).toHaveLength(0)
    run.seek(500)
    expect(host.querySelector(`[data-yj-${attr[name] ?? name}]`)).not.toBeNull()
    expect(animations.length).toBeGreaterThan(0)
    expect(animations.every((a) => a.paused && a.currentTime === 500)).toBe(true)
    run.seek(1000)
    expect(host.innerHTML).toBe(before)
  })

  it('does nothing under reduced motion', () => {
    const { host, node } = demo()
    play(node, { reduced: true })
    expect(host.children).toHaveLength(1)
    expect(animations).toHaveLength(0)
  })
})

test('a stage given no share is left out, and the others share the run', () => {
  const { node } = demo()
  const spans: Record<string, [number, number]> = {}
  entrance(
    node,
    { reduced: false, duration: 1000, phases: { b: 0 } },
    {
      name: 't',
      margin: 0,
      phases: { a: 1, b: 1, c: 2 },
      length: () => 1,
      play: (run) => Object.assign(spans, run.span),
    },
  ).cancel()
  expect(spans).toEqual({ a: [0, 1000 / 3], b: [1000 / 3, 1000 / 3], c: [1000 / 3, 1000] })
  const calls: number[] = []
  spread([1, 2, 3], spans.b!, () => calls.push(1))
  expect(calls).toHaveLength(0)
})

test('seek draws marks forwards only, and makes what is due by then at once', () => {
  const { node } = demo()
  const drawn: number[] = []
  const made: number[] = []
  const run = entrance(
    node,
    { reduced: false, duration: 1000, paused: true },
    {
      name: 't',
      margin: 0,
      phases: { a: 1 },
      length: () => 1,
      play(r) {
        r.mark({} as CanvasRenderingContext2D, 0, 1000, (_, q) => drawn.push(q), 'linear')
        for (let at = 0; at < 1000; at += 50) r.later(at, () => made.push(at))
      },
    },
  )
  run.seek(400)
  expect(drawn).toHaveLength(1)
  expect(drawn[0]).toBeCloseTo(0.4, 4)
  // everything due by 400 ms (made a moment ahead, as when playing) comes in that one seek, however many
  expect(made).toEqual([0, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700])
  run.seek(200)
  expect(drawn).toHaveLength(1)
  run.seek(800)
  expect(drawn).toHaveLength(2)
  expect(drawn[1]).toBeCloseTo(0.8, 4)
  run.cancel()
})

test('seek takes over a run playing on its own clock', () => {
  const { host, node } = demo()
  const before = host.innerHTML
  const run = trace(node, { reduced: false, duration: 1000 })
  expect(frames).toHaveLength(1)
  run.seek(300)
  expect(animations.every((a) => a.paused && a.currentTime === 300)).toBe(true)
  run.seek(1000)
  expect(host.innerHTML).toBe(before)
})
