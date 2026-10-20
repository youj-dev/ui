import { act, render } from '@testing-library/react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Atmosphere, atmosphereStill } from './atmosphere'

class FakeObserver {
  observe = vi.fn()
  disconnect = vi.fn()
}

/** A WebGL2 stand-in that compiles everything and records the uniforms set and the draws. */
function fakeWebGL2() {
  const uniforms = new Map<string, number[]>()
  const calls = { drawArrays: 0 }
  const gl = new Proxy(
    {},
    {
      get: (_, key) => {
        if (key === 'drawArrays') return () => void calls.drawArrays++
        if (key === 'getUniformLocation') return (_program: unknown, name: string) => name
        if (key === 'uniform1f') return (name: string, x: number) => uniforms.set(name, [x])
        if (key === 'uniform3fv') return (name: string, v: Float32Array) => uniforms.set(name, [...v])
        if (key === 'getExtension') return () => ({ loseContext: () => {} })
        if (key === 'isContextLost') return () => false
        if (typeof key === 'string' && /^[A-Z0-9_]+$/.test(key)) return 0
        return () => ({})
      },
    },
  )
  return { gl, uniforms, calls }
}

/** The page's canvas token, as the colour probe reads it; any other colour reads as itself. */
let canvasColor = 'rgb(250, 249, 247)'
const realStyle = window.getComputedStyle
function stubProbe() {
  vi.spyOn(window, 'getComputedStyle').mockImplementation((el: Element) => {
    const color = (el as HTMLElement).style?.color ?? ''
    if (color.startsWith('var(')) return { color: canvasColor } as CSSStyleDeclaration
    return color ? ({ color } as CSSStyleDeclaration) : realStyle(el)
  })
}

let frames: FrameRequestCallback[] = []
beforeEach(() => {
  canvasColor = 'rgb(250, 249, 247)'
  frames = []
  vi.stubGlobal('ResizeObserver', FakeObserver)
  vi.stubGlobal('IntersectionObserver', FakeObserver)
  vi.stubGlobal('requestAnimationFrame', vi.fn((cb: FrameRequestCallback) => frames.push(cb)))
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => false })
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ width: 800, height: 500, top: 0, left: 0, right: 800, bottom: 500, x: 0, y: 0, toJSON: () => ({}) })
  stubProbe()
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.documentElement.removeAttribute('data-theme')
})

const webgl = () => {
  const fake = fakeWebGL2()
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(((type: string) => (type === 'webgl2' ? fake.gl : null)) as never)
  return fake
}

/** Runs the queued animation frames once, at `now` ms. */
const tick = (now: number) => {
  const queued = frames
  frames = []
  for (const cb of queued) cb(now)
}

test('draws the scene in its light palette on a light page and its dark one on a dark page', async () => {
  const { uniforms } = webgl()
  const { unmount } = render(
    <YoujProvider reducedMotion="always">
      <Atmosphere scene="meadow" />
    </YoujProvider>,
  )
  await act(async () => {})
  // The first colour is the sky: Salvia Blue by day, a slate blue at night.
  expect(uniforms.get('uPalette')![0]).toBeCloseTo(0.8, 2)
  expect(uniforms.get('uDark')).toEqual([0])
  unmount()

  canvasColor = 'rgb(20, 19, 18)'
  const dark = webgl()
  render(
    <YoujProvider reducedMotion="always">
      <Atmosphere scene="meadow" />
    </YoujProvider>,
  )
  await act(async () => {})
  expect(dark.uniforms.get('uPalette')![0]).toBeCloseTo(0.34, 2)
  expect(dark.uniforms.get('uDark')).toEqual([1])
})

test('re-reads the mode when the theme flips, and redraws the still frame', async () => {
  const { uniforms, calls } = webgl()
  render(
    <YoujProvider reducedMotion="always">
      <Atmosphere scene="umber" />
    </YoujProvider>,
  )
  await act(async () => {})
  expect(uniforms.get('uDark')).toEqual([0])
  const drawn = calls.drawArrays
  canvasColor = 'rgb(20, 19, 18)'
  await act(async () => document.documentElement.setAttribute('data-theme', 'dark'))
  expect(uniforms.get('uDark')).toEqual([1])
  expect(calls.drawArrays).toBeGreaterThan(drawn)
})

test('takes your colours in place of the scene palette', async () => {
  const { uniforms } = webgl()
  render(
    <YoujProvider reducedMotion="always">
      <Atmosphere scene="sandstone" colors={['rgb(255, 255, 255)', 'rgb(0, 0, 0)']} />
    </YoujProvider>,
  )
  await act(async () => {})
  const palette = uniforms.get('uPalette')!
  expect(palette).toHaveLength(15)
  // White, then black, then white again: five slots from two colours.
  expect([palette[0], palette[3], palette[6]].map((l) => Number(l!.toFixed(2)))).toEqual([1, 0, 1])
})

test('caps the clock at 24 frames a second', async () => {
  const { calls } = webgl()
  render(
    <YoujProvider reducedMotion="never" quality="high">
      <Atmosphere scene="cinnabar" />
    </YoujProvider>,
  )
  for (let i = 0; i <= 60; i++) tick(1000 + i * (1000 / 60))
  // A second of 60 Hz display frames draws at most 24 of them (every third one there), and keeps drawing.
  expect(calls.drawArrays).toBeGreaterThanOrEqual(18)
  expect(calls.drawArrays).toBeLessThanOrEqual(24)
})

test('halves the grain under reduced motion', async () => {
  const { uniforms } = webgl()
  render(
    <YoujProvider reducedMotion="always">
      <Atmosphere scene="meadow" grain={0.8} />
    </YoujProvider>,
  )
  await act(async () => {})
  expect(uniforms.get('uGrain')![0]).toBeCloseTo(0.4)
})

test('a new scene is a new shader: the host says which it draws', async () => {
  webgl()
  const { container, rerender } = render(<Atmosphere scene="meadow" />)
  expect(container.firstElementChild).toHaveAttribute('data-yj-scene', 'meadow')
  rerender(<Atmosphere scene="umber" />)
  expect(container.firstElementChild).toHaveAttribute('data-yj-scene', 'umber')
  expect(container.querySelectorAll('canvas')).toHaveLength(1)
})

test('without WebGL2 it is a still in the palette of the page’s mode, and is decorative', async () => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
  canvasColor = 'rgb(20, 19, 18)'
  const { container } = render(<Atmosphere scene="cinnabar" />)
  await act(async () => {})
  const host = container.firstElementChild as HTMLElement
  expect(host).toHaveAttribute('aria-hidden', 'true')
  expect(host).toHaveAttribute('data-yj-fallback', 'true')
  expect(host.style.backgroundImage).toBe(atmosphereStill('cinnabar', 'dark').backgroundImage)
  expect(host.style.backgroundImage).not.toBe(atmosphereStill('cinnabar', 'light').backgroundImage)
})
