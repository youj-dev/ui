import type { ComponentType } from 'react'
import { render } from '@testing-library/react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { FlowField } from './flow-field'
import { ParticleConstellation } from './particle-constellation'
import { Swarm } from './swarm'

class FakeObserver {
  observe = vi.fn()
  disconnect = vi.fn()
}

/** A 2D context that records the geometry it is asked to draw. */
function fakeCanvas2D() {
  const path: number[] = []
  const calls = { stroke: 0, fill: 0 }
  const ctx = new Proxy(
    {},
    {
      get: (_, key) => {
        if (key === 'moveTo' || key === 'lineTo') return (x: number, y: number) => void path.push(Math.round(x * 100), Math.round(y * 100))
        if (key === 'getImageData') return () => ({ data: [128, 128, 128, 255] })
        if (key === 'stroke') return () => void calls.stroke++
        if (key === 'fill') return () => void calls.fill++
        return () => {}
      },
      set: () => true,
    },
  )
  return { ctx, path, calls }
}

const PIECES: [string, ComponentType][] = [
  ['FlowField', FlowField],
  ['Swarm', Swarm],
]

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', FakeObserver)
  vi.stubGlobal('IntersectionObserver', FakeObserver)
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(
    { width: 800, height: 600, top: 0, left: 0, right: 800, bottom: 600, x: 0, y: 0, toJSON: () => ({}) },
  )
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

async function reducedFrame(Piece: ComponentType) {
  const fake = fakeCanvas2D()
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(fake.ctx as never)
  const { unmount } = render(
    <YoujProvider reducedMotion="always">
      <Piece />
    </YoujProvider>,
  )
  await Promise.resolve()
  unmount()
  return fake
}

test.each(PIECES)('%s under reduced motion draws one fixed, identical composition and starts no loop', async (_, Piece) => {
  const first = await reducedFrame(Piece)
  const second = await reducedFrame(Piece)

  expect(first.path.length).toBeGreaterThan(0)
  expect(first.path).toEqual(second.path)
  expect(requestAnimationFrame).not.toHaveBeenCalled()
})

test.each(PIECES)('%s draws and releases its loop on unmount', (_, Piece) => {
  const { ctx, calls } = fakeCanvas2D()
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
  expect(canvas.isConnected).toBe(false)
  expect(calls.stroke + calls.fill).toBe(0) // nothing is drawn before the first rAF tick
})

test('FlowField keeps the streak count inside its cap on a huge canvas', async () => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(
    { width: 8000, height: 6000, top: 0, left: 0, right: 8000, bottom: 6000, x: 0, y: 0, toJSON: () => ({}) },
  )
  const { path } = await reducedFrame(FlowField)
  // Each streak draws at most 31 trail segments of 2 points; one buffer entry is x and y.
  expect(path.length / 2).toBeLessThanOrEqual(800 * 31 * 2)
})

test('Swarm keeps the flock inside its cap on a huge canvas', async () => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(
    { width: 8000, height: 6000, top: 0, left: 0, right: 8000, bottom: 6000, x: 0, y: 0, toJSON: () => ({}) },
  )
  const { path } = await reducedFrame(Swarm)
  // Per boid: a tail (2 points) and a dart (4 points), one entry per point coordinate pair.
  expect(path.length / 2).toBeLessThanOrEqual(480 * 6)
})

test('ParticleConstellation signals draw nothing extra under reduced motion and start no loop', async () => {
  const plain = await reducedFrame(ParticleConstellation)
  const fake = fakeCanvas2D()
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(fake.ctx as never)
  const { unmount } = render(
    <YoujProvider reducedMotion="always">
      <ParticleConstellation signals />
    </YoujProvider>,
  )
  await Promise.resolve()
  unmount()

  expect(fake.path).toEqual(plain.path)
  expect(fake.calls.stroke).toBe(plain.calls.stroke)
  expect(requestAnimationFrame).not.toHaveBeenCalled()
})
