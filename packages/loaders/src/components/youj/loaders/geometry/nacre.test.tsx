import { motionPersonalities } from '@youj/core/lib/youj/tokens'
import { bezier } from '../field'
import { describeLoader, marksAt, testView } from '../testing'
import { LoaderNacre, meta, scene } from './nacre'

describeLoader(LoaderNacre, meta, scene)

describe('Nacre scene budgets', () => {
  it('caps the drawing at every detail level, including the large showroom sizes', () => {
    for (const [size, budget] of [[24, 72], [31, 72], [32, 240], [40, 240], [64, 240], [79, 240], [80, 400], [320, 400], [400, 400]] as const) {
      const view = testView(size)
      for (let i = 0; i < 60; i++) {
        const marks = marksAt(scene, i / 60, view)
        expect(marks.length, `${size}px at ${i / 60}`).toBeLessThanOrEqual(budget)
        // Larger CSS stroke widths must never push the sculpture outside
        // its square, even though the common contract stops at 160px.
        if (size < 80) continue
        expect(marks.every((mark) => {
          const coordinates = mark.kind === 'face' || mark.kind === 'poly' || mark.kind === 'path'
            ? (mark.d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number)
            : mark.kind === 'line' ? mark.v.slice(0, 4) : mark.v.slice(0, 2)
          return coordinates.every((v) => Number.isFinite(v) && v > 0 && v < 100)
        })).toBe(true)
      }
    }
  })

  it('reserves the accent for one short bond, including in the reduced-motion peak', () => {
    for (const size of [24, 40, 64, 320]) {
      const view = testView(size)
      const accented = (t: number) => marksAt(scene, t, view).filter((m) => m.kind === 'path' && m.stroke.tone === 'accent')
      expect(accented(scene.still).length).toBeGreaterThan(0)
      for (let i = 0; i < 60; i++) {
        const t = i / 60
        const bond = accented(t)
        expect(bond.length).toBeLessThanOrEqual(5)
        if (t <= 0.425 || t >= 0.72) expect(bond).toHaveLength(0)
      }
    }
  })

  it('keeps exact seam frames after interleaving sizes, with every motion personality', () => {
    for (const personality of Object.values(motionPersonalities)) {
      for (const size of [24, 40, 64, 320, 400]) {
        const view = testView(size)
        view.ease = {
          standard: bezier(personality.easings.standard), enter: bezier(personality.easings.enter),
          exit: bezier(personality.easings.exit), emphasized: bezier(personality.easings.emphasized),
        }
        const start = marksAt(scene, 0, view)
        marksAt(scene, scene.still, testView(size === 24 ? 400 : 24))
        expect(marksAt(scene, 1, view)).toEqual(start)
      }
    }
  })
})
