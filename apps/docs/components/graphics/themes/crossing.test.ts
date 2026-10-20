import { BAND, crossingAt, liftAt, passFor } from './crossing'

describe('the card’s way down through the presets', () => {
  it('starts above every plane, unpainted, and ends below the last', () => {
    expect(crossingAt(0, 5)).toEqual({ passed: 0, wipe: 0 })
    expect(crossingAt(1, 5)).toEqual({ passed: 5, wipe: 0 })
    expect(liftAt(1, 5)).toBe(-5.5)
  })

  it('wipes to a plane’s theme across the band round it', () => {
    const at = (lift: number) => -lift / 5.5
    expect(crossingAt(at(-1 + BAND), 5)).toEqual({ passed: 0, wipe: 0 })
    expect(crossingAt(at(-1), 5).wipe).toBeCloseTo(0.5)
    expect(crossingAt(at(-1 - BAND - 0.01), 5)).toEqual({ passed: 1, wipe: 0 })
  })

  it('crosses the planes in order as the pass grows', () => {
    const passed = Array.from({ length: 23 }, (_, i) => crossingAt(i / 22, 5).passed)
    expect(passed).toEqual([...passed].sort((a, b) => a - b))
    expect(new Set(passed)).toEqual(new Set([0, 1, 2, 3, 4, 5]))
  })

  it('parks the card halfway past a chosen plane, clear of every band', () => {
    for (let k = 0; k < 5; k++) expect(crossingAt(passFor(k, 5), 5)).toEqual({ passed: k + 1, wipe: 0 })
    expect(passFor(-1, 5)).toBe(0)
  })
})
