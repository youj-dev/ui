import { afterEach, describe, expect, it, vi } from 'vitest'
import { blend, canvasPen, faceInk, onTick, palette } from './field'

/* jsdom has no canvas, so a small stand-in records what's painted and reads
 * back the rgb()/rgba() color last filled, as a browser's canvas would. */

type Fill = { style: string; alpha: number }

function fakeContext() {
  const fills: Fill[] = []
  let pixel = [0, 0, 0, 0]
  const ctx = {
    fills,
    reads: 0,
    fillStyle: '' as string,
    globalAlpha: 1,
    clearRect: () => (pixel = [0, 0, 0, 0]),
    fillRect() {
      const m = /rgba?\(([^)]+)\)/.exec(ctx.fillStyle)
      if (!m) return
      const [r = 0, g = 0, b = 0, a = 1] = m[1]!.split(',').map(Number)
      pixel = [r, g, b, Math.round(a * 255)]
    },
    getImageData: () => {
      ctx.reads++
      return { data: Uint8ClampedArray.from(pixel) }
    },
    beginPath() {},
    moveTo() {},
    lineTo() {},
    closePath() {},
    fill: () => fills.push({ style: ctx.fillStyle, alpha: ctx.globalAlpha }),
  }
  return ctx
}

const reader = fakeContext()
HTMLCanvasElement.prototype.getContext = (() => reader) as never

const rgbaOf = (css: string) => css.match(/[\d.]+/g)!.map(Number)
const LIGHT = { ink: 'rgb(20, 20, 20)', accent: 'rgb(230, 90, 20)', paper: 'rgb(250, 250, 250)' }
const square = [0, 0, 10, 0, 10, 10, 0, 10]

describe('the palette', () => {
  it('premixes a solid as its tone laid on the paper at its share, opaque', () => {
    const colors = palette(LIGHT, 0)
    expect(rgbaOf(colors.solid('ink', 0))).toEqual([250, 250, 250, 1])
    expect(rgbaOf(colors.solid('ink', 1))).toEqual([20, 20, 20, 1])
    const [r, g, b, a] = rgbaOf(colors.solid('accent', 0.5))
    expect(a).toBe(1)
    expect(r).toBeCloseTo((230 + 250) / 2, -0.5)
    expect(g).toBeCloseTo((90 + 250) / 2, -0.5)
    expect(b).toBeCloseTo((20 + 250) / 2, -0.5)
  })

  it('keeps a see-through paper see-through', () => {
    const [r, g, b, a] = rgbaOf(palette({ ...LIGHT, paper: 'rgba(0, 0, 0, 0)' }, 0).solid('ink', 0.4))
    expect([r, g, b]).toEqual([20, 20, 20])
    expect(a).toBeCloseTo(0.4, 2)
  })

  it('reads its colors once, and mixes each share once', () => {
    const before = reader.reads
    const colors = palette(LIGHT, 1)
    const first = colors.solid('ink', 0.3)
    for (let i = 0; i < 50; i++) colors.solid('ink', 0.3)
    colors.solid('accent', 0.8)
    expect(colors.solid('ink', 0.3)).toBe(first)
    expect(reader.reads - before).toBe(3)
  })
})

describe('the canvas pen', () => {
  it('paints a lit face and a solid plane as one opaque fill each, so shared edges blend once', () => {
    const ctx = fakeContext()
    const colors = palette(LIGHT, 0)
    const pen = canvasPen(ctx as unknown as CanvasRenderingContext2D, colors)
    pen.face(square, 0.7)
    pen.poly(square, 0.4, 'accent', true)
    expect(ctx.fills).toEqual([
      { style: colors.solid('ink', faceInk(0.7, 0)), alpha: 1 },
      { style: colors.solid('accent', 0.4), alpha: 1 },
    ])
  })

  it('paints an extra tone in its own color, the ink where none is given, its faces lit as a color’s', () => {
    const ctx = fakeContext()
    const colors = palette({ ...LIGHT, c1: 'rgb(20, 200, 90)' }, 0)
    expect(colors.css.c2).toBe(LIGHT.ink)
    const pen = canvasPen(ctx as unknown as CanvasRenderingContext2D, colors)
    pen.face(square, 0.7, 'c1')
    pen.poly(square, 0.3, 'c1')
    expect(ctx.fills).toEqual([
      { style: colors.solid('c1', faceInk(0.7, 0, 'accent')), alpha: 1 },
      { style: 'rgb(20, 200, 90)', alpha: 0.3 },
    ])
    expect(rgbaOf(colors.solid('c1', 1))).toEqual([20, 200, 90, 1])
  })

  it('mixes a blend from its two tones once, and keeps it', () => {
    const colors = palette({ ...LIGHT, c1: 'rgb(20, 200, 90)' }, 0)
    const half = blend('ink', 'c1', 0.5)
    expect(blend('ink', 'c1', 0.5)).toBe(half)
    expect(blend('ink', 'c1', 0)).toBe('ink')
    expect(blend('ink', 'c1', 1)).toBe('c1')
    // Mixed in Oklab, as CSS's color-mix does by default: between the two, keeping the color's hue.
    const [r, g, b, a] = rgbaOf(colors.paint(half))
    expect(a).toBe(1)
    expect(g).toBeGreaterThan(60)
    expect(g).toBeLessThan(200)
    expect(g).toBeGreaterThan(r! + 40)
    expect(b).toBeLessThan(g!)
    expect(colors.paint(half)).toBe(colors.paint(blend('ink', 'c1', 0.5)))
    expect(colors.lit(blend('ink', 'c1', 0.3))).toBe('ink')
    expect(colors.lit(blend('ink', 'c1', 0.7))).toBe('accent')
  })

  it('puts aliased tones back in what they stand in for, blends between them included (the default look)', () => {
    const colors = palette({ ...LIGHT, c1: 'rgb(20, 200, 90)', c2: 'rgb(90, 20, 200)' }, 0, { c1: 'ink', c2: 'accent' })
    expect(colors.paint('c1')).toBe(LIGHT.ink)
    expect(colors.paint('c2')).toBe(LIGHT.accent)
    expect(colors.paint(blend('ink', 'c1', 0.4))).toBe(LIGHT.ink)
    expect(colors.solid('c1', 0.5)).toBe(colors.solid('ink', 0.5))
    expect(colors.lit('c1')).toBe('ink')
    expect(colors.lit('c2')).toBe('accent')
  })

  it('still lays a see-through plane over what is beneath at its alpha', () => {
    const ctx = fakeContext()
    canvasPen(ctx as unknown as CanvasRenderingContext2D, palette(LIGHT, 0)).poly(square, 0.25)
    expect(ctx.fills).toEqual([{ style: LIGHT.ink, alpha: 0.25 }])
  })
})

describe('the shared ticker', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('drops a scene that throws and keeps every other loader running', () => {
    let frame: FrameRequestCallback = () => {}
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => ((frame = callback), 1))
    vi.stubGlobal('cancelAnimationFrame', () => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const broken = vi.fn(() => {
      throw new Error('scene bug')
    })
    const healthy = vi.fn()
    const stops = [onTick(broken), onTick(healthy)]
    frame(performance.now() + 16)
    frame(performance.now() + 32)
    expect(broken).toHaveBeenCalledTimes(1)
    expect(healthy).toHaveBeenCalledTimes(2)
    expect(error).toHaveBeenCalledTimes(1)
    stops.forEach((stop) => stop())
    error.mockRestore()
  })
})
