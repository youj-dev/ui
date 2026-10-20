import { describeLoader, marksAt, testView } from '../testing'
import { LoaderBanyan, meta, scene } from './banyan'
import type { Pen } from '../field'

describeLoader(LoaderBanyan, meta, scene)

// Measure the centre of each five-sample ribbon directly from the live Pen:
// the SVG recording pen rounds to .01 units, masking sub-pixel movement.
function drawnLength(t: number, size: number) {
  let length = 0
  const pen: Pen = {
    poly(xy) {
      if (xy.length !== 20 && xy.length !== 34) return // Exclude ground and the trunk's lit side.
      let x = (xy[0]! + xy[xy.length - 2]!) / 2
      let y = (xy[1]! + xy[xy.length - 1]!) / 2
      for (let j = 1; j < 5; j++) {
        const opposite = xy.length - 2 - j * 2
        const nextX = (xy[j * 2]! + xy[opposite]!) / 2
        const nextY = (xy[j * 2 + 1]! + xy[opposite + 1]!) / 2
        length += Math.hypot(nextX - x, nextY - y)
        x = nextX; y = nextY
      }
    },
    path() {}, square() {}, dot() {}, line() {}, face() {},
  }
  scene.draw(pen, t, testView(size))
  return length * size / 100
}

describe('Banyan hero canopy', () => {
  it('extends in one continuous flow across 240 grow-phase frames', () => {
    for (const size of [40, 160, 400, 720, 900]) {
      const lengths = Array.from({ length: 240 }, (_, frame) => drawnLength(0.012 + 0.428 * frame / 239, size))
      const increments = lengths.slice(1).map((length, i) => length - lengths[i]!)
      const sorted = [...increments].sort((a, b) => a - b)
      const median = sorted[Math.floor(sorted.length / 2)]!
      expect(Math.min(...increments), `no growth plateau at ${size}px`).toBeGreaterThan(0)
      expect(Math.max(...increments), `no growth jump at ${size}px; median ${median}`).toBeLessThan(median * 2)
    }
  })

  it('returns from the tips to the root without pauses or jumps', () => {
    const lengths = Array.from({ length: 240 }, (_, frame) => drawnLength(0.78 + 0.20 * frame / 239, 720))
    const decrements = lengths.slice(1).map((length, i) => lengths[i]! - length)
    const sorted = [...decrements].sort((a, b) => a - b)
    expect(Math.min(...decrements)).toBeGreaterThan(0)
    expect(Math.max(...decrements)).toBeLessThan(sorted[Math.floor(sorted.length / 2)]! * 2)
  })

  it('keeps a bounded detail budget with a richer crown at hero sizes', () => {
    const budgets = [[24, 30], [40, 60], [160, 125], [400, 320], [720, 620], [900, 620]]
    let previous = 0
    for (const [size, budget] of budgets) {
      const view = testView(size!)
      let peak = marksAt(scene, scene.still, view).length
      for (let frame = 0; frame < 60; frame++) peak = Math.max(peak, marksAt(scene, frame / 60, view).length)
      expect(peak).toBeGreaterThanOrEqual(previous)
      expect(peak).toBeLessThanOrEqual(budget!)
      previous = peak
    }
  })

  it('takes the sap from the root into the canopy, then keeps lit tips in the still', () => {
    const view = testView(720)
    const root = marksAt(scene, 0.515, view).filter((m) => m.kind === 'path' && m.stroke.tone === 'accent')
    const crown = marksAt(scene, 0.62, view).filter((m) => m.kind === 'path' && m.stroke.tone === 'accent')
    const still = marksAt(scene, scene.still, view)
    expect(root.length).toBeGreaterThan(0)
    expect(crown.length).toBeGreaterThan(root.length)
    expect(still.filter((m) => m.kind === 'square' && m.tone === 'accent')).toHaveLength(128)
    expect(still.some((m) => m.kind === 'path' && m.stroke.tone === 'accent')).toBe(false)
  })

  it('is deterministic even when another size and phase use the scratch buffers', () => {
    const first = marksAt(scene, 0.58, testView(900))
    marksAt(scene, 0.23, testView(24))
    marksAt(scene, 0.94, testView(900))
    expect(marksAt(scene, 0.58, testView(900))).toEqual(first)
    expect(marksAt(scene, 1, testView(900))).toEqual(marksAt(scene, 0, testView(900)))
  })

  it('keeps the crown, wind and perspective inside a full-bleed hero', () => {
    for (const size of [400, 720, 900]) {
      for (let frame = 0; frame <= 60; frame++) {
        for (const mark of marksAt(scene, frame / 60, testView(size))) {
          const xy = mark.kind === 'path' || mark.kind === 'poly' || mark.kind === 'face'
            ? (mark.d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number)
            : mark.v.slice(0, 2)
          expect(xy.every((v) => Number.isFinite(v) && v >= 0 && v <= 100), `at ${size}px, frame ${frame}`).toBe(true)
        }
      }
    }
  })
})
