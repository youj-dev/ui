import type { ComponentType } from 'react'
import { render } from '@testing-library/react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Atmosphere } from './atmosphere'
import { Aurora } from './aurora'
import { DotMatrixWave } from './dot-matrix-wave'
import { MagneticField } from './magnetic-field'
import { MeshGradient } from './mesh-gradient'
import { NoiseField } from './noise-field'
import { FlowField } from './flow-field'
import { ParticleConstellation } from './particle-constellation'
import { RipplePond } from './ripple-pond'
import { WarpGrid } from './warp-grid'
import { Swarm } from './swarm'

class FakeObserver {
  static instances: FakeObserver[] = []
  observe = vi.fn()
  disconnect = vi.fn()
  constructor() {
    FakeObserver.instances.push(this)
  }
}

// Just enough of a WebGL2 context to compile, link and draw: every method is a no-op
// that reports success, and the calls we care about are counted.
function fakeWebGL2() {
  const calls = { drawArrays: 0, loseContext: 0 }
  const gl = new Proxy(
    {},
    {
      get: (_, key) => {
        if (key === 'drawArrays') return () => void calls.drawArrays++
        if (key === 'getExtension') return () => ({ loseContext: () => void calls.loseContext++ })
        if (key === 'isContextLost') return () => false
        if (typeof key === 'string' && /^[A-Z0-9_]+$/.test(key)) return 0
        return () => ({})
      },
    },
  )
  return { gl, calls }
}

const SHADER_PIECES: [string, ComponentType][] = [
  ['MeshGradient', MeshGradient],
  ['NoiseField', NoiseField],
  ['Aurora', Aurora],
  ['DotMatrixWave', DotMatrixWave],
  ['Atmosphere', Atmosphere],
]
/** The DPR a piece renders at on the high tier, where it caps lower than the default 2 (Atmosphere is soft: 1.5 is plenty). */
const HIGH_DPR: Record<string, number> = { Atmosphere: 1.5 }
const CANVAS_PIECES: [string, ComponentType][] = [
  ['ParticleConstellation', ParticleConstellation],
  ['MagneticField', MagneticField],
  ['RipplePond', RipplePond],
  ['WarpGrid', WarpGrid],
  ['FlowField', FlowField],
  ['Swarm', Swarm],
]
const ALL_PIECES: [string, ComponentType][] = [...SHADER_PIECES, ...CANVAS_PIECES]

beforeEach(() => {
  FakeObserver.instances = []
  vi.stubGlobal('ResizeObserver', FakeObserver)
  vi.stubGlobal('IntersectionObserver', FakeObserver)
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => false })
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(
    { width: 800, height: 600, top: 0, left: 0, right: 800, bottom: 600, x: 0, y: 0, toJSON: () => ({}) },
  )
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

test.each(ALL_PIECES)('%s falls back to a static CSS gradient when the context is unavailable', (_, Piece) => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
  const { container } = render(<Piece />)
  const host = container.firstElementChild as HTMLElement

  expect(host).toHaveAttribute('aria-hidden', 'true')
  // The older pieces mark it data-fallback (surface-baseline.json); Atmosphere, data-yj-fallback.
  expect(host.dataset.fallback ?? host.dataset.yjFallback).toBe('true')
  expect(host.style.backgroundImage).toContain('radial-gradient')
  expect(host.querySelector('canvas')).toBeNull()
  expect(requestAnimationFrame).not.toHaveBeenCalled()
})

test.each(SHADER_PIECES)('%s under reduced motion draws a single frame and starts no loop', async (_, Piece) => {
  const { gl, calls } = fakeWebGL2()
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(((type: string) =>
    type === 'webgl2' ? gl : null) as never)

  const { container } = render(
    <YoujProvider reducedMotion="always">
      <Piece />
    </YoujProvider>,
  )

  await Promise.resolve()
  expect(container.querySelector('canvas')).not.toBeNull()
  expect(calls.drawArrays).toBe(1)
  expect(requestAnimationFrame).not.toHaveBeenCalled()
})

test.each(SHADER_PIECES)('%s releases its loop, observers and GL context on unmount', (_, Piece) => {
  const { gl, calls } = fakeWebGL2()
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(((type: string) =>
    type === 'webgl2' ? gl : null) as never)

  const { container, unmount } = render(
    <YoujProvider reducedMotion="never">
      <Piece />
    </YoujProvider>,
  )
  expect(requestAnimationFrame).toHaveBeenCalled()
  const canvas = container.querySelector('canvas')!

  unmount()

  expect(cancelAnimationFrame).toHaveBeenCalled()
  expect(FakeObserver.instances.length).toBeGreaterThanOrEqual(2)
  for (const observer of FakeObserver.instances) expect(observer.disconnect).toHaveBeenCalled()
  expect(calls.loseContext).toBe(1)
  expect(canvas.isConnected).toBe(false)
})

test('a theme change re-reads the colours once, in the next frame, however many mutations it makes', async () => {
  const { gl } = fakeWebGL2()
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(((type: string) =>
    type === 'webgl2' ? gl : null) as never)
  const queued: FrameRequestCallback[] = []
  vi.stubGlobal('requestAnimationFrame', vi.fn((cb: FrameRequestCallback) => queued.push(cb)))
  const { unmount } = render(
    <YoujProvider reducedMotion="never" quality="high">
      <MeshGradient />
    </YoujProvider>,
  )
  const styles = vi.spyOn(window, 'getComputedStyle')
  const html = document.documentElement
  html.setAttribute('data-theme', 'light')
  await Promise.resolve()
  html.setAttribute('data-yj-theme', 'brutal')
  await Promise.resolve()
  expect(styles).not.toHaveBeenCalled()

  queued.shift()!(1000)
  expect(styles).toHaveBeenCalledTimes(2) // canvas + accent, once
  queued.shift()!(1016)
  expect(styles).toHaveBeenCalledTimes(2)
  unmount()
  html.removeAttribute('data-theme')
  html.removeAttribute('data-yj-theme')
})

test.each(SHADER_PIECES)('%s on the low tier caps its canvas at DPR 1', (name, Piece) => {
  const { gl } = fakeWebGL2()
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(((type: string) =>
    type === 'webgl2' ? gl : null) as never)
  vi.stubGlobal('devicePixelRatio', 2)
  const { container, rerender } = render(
    <YoujProvider reducedMotion="never" quality="high">
      <Piece />
    </YoujProvider>,
  )
  const canvas = container.querySelector('canvas')!
  expect(canvas.width).toBe(800 * (HIGH_DPR[name] ?? 2))
  rerender(
    <YoujProvider reducedMotion="never" quality="low">
      <Piece />
    </YoujProvider>,
  )
  expect([canvas.width, canvas.height]).toEqual([800, 600])
})

/** A 2D context whose calls are counted: every method is a no-op, `setTransform` (once per frame), `fill` and `stroke` are tallied. */
function fakeContext2D() {
  const calls = { frames: 0, fill: 0, stroke: 0 }
  const ctx = new Proxy(
    {},
    {
      get: (_, key) => {
        if (key === 'setTransform') return () => void calls.frames++
        if (key === 'fill') return () => void calls.fill++
        if (key === 'stroke') return () => void calls.stroke++
        if (key === 'getImageData') return () => ({ data: [128, 128, 128, 255] })
        return () => {}
      },
      set: () => true,
    },
  )
  return { ctx, calls }
}

const GRID_PIECES = CANVAS_PIECES.filter(([name]) => name !== 'ParticleConstellation')

describe.each(GRID_PIECES)('%s', (_, Piece) => {
  beforeEach(() => {
    vi.stubGlobal('Path2D', class { moveTo() {} lineTo() {} arc() {} })
  })

  test('under reduced motion draws one still frame and starts no loop', async () => {
    const { ctx, calls } = fakeContext2D()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as never)
    const { container } = render(
      <YoujProvider reducedMotion="always">
        <Piece />
      </YoujProvider>,
    )

    await Promise.resolve()
    expect(container.querySelector('canvas')).not.toBeNull()
    expect(calls.frames).toBe(1)
    expect(calls.fill + calls.stroke).toBeGreaterThan(0)
    expect(requestAnimationFrame).not.toHaveBeenCalled()
  })

  test('releases its loop, observers and canvas on unmount', () => {
    const { ctx } = fakeContext2D()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as never)
    const { container, unmount } = render(
      <YoujProvider reducedMotion="never">
        <Piece />
      </YoujProvider>,
    )
    expect(requestAnimationFrame).toHaveBeenCalled()
    const canvas = container.querySelector('canvas')!

    unmount()

    expect(cancelAnimationFrame).toHaveBeenCalled()
    for (const observer of FakeObserver.instances) expect(observer.disconnect).toHaveBeenCalled()
    expect(canvas.isConnected).toBe(false)
  })

  test('on the low tier caps its canvas at DPR 1', () => {
    const { ctx } = fakeContext2D()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as never)
    vi.stubGlobal('devicePixelRatio', 2)
    const { container, rerender } = render(
      <YoujProvider reducedMotion="never" quality="high">
        <Piece />
      </YoujProvider>,
    )
    const canvas = container.querySelector('canvas')!
    expect(canvas.width).toBe(1600)
    rerender(
      <YoujProvider reducedMotion="never" quality="low">
        <Piece />
      </YoujProvider>,
    )
    expect([canvas.width, canvas.height]).toEqual([800, 600])
  })
})
