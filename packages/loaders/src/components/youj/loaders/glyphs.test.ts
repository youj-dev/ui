import { tittle, wordmarkLetters, WORDMARK_WIDTH } from '@youj/core/docs/brand/logo'
import { O_BOX, O_INNER, O_OUTER, TITTLE, WORDMARK, WORDMARK_BOX, flatten, sampleOutline } from './glyphs'

describe('the letterforms', () => {
  it('are the wordmark’s own o: its outline, then its counter', () => {
    expect(O_OUTER + O_INNER).toBe(wordmarkLetters.find((l) => l.letter === 'o')!.d)
    const xs = flatten(O_OUTER).map(([x]) => x)
    const ys = flatten(O_OUTER).map(([, y]) => y)
    expect(Math.min(...xs)).toBeCloseTo(O_BOX.x)
    expect(Math.max(...xs)).toBeCloseTo(O_BOX.x + O_BOX.w)
    expect(Math.min(...ys)).toBeCloseTo(O_BOX.y)
    expect(Math.max(...ys)).toBeCloseTo(O_BOX.y + O_BOX.h)
  })

  it('are the whole word, letter for letter, with its tittle', () => {
    expect(WORDMARK.map((l) => l.letter)).toEqual(wordmarkLetters.map((l) => l.letter))
    WORDMARK.forEach((l, i) => expect(l.outlines.join('')).toBe(wordmarkLetters[i]!.d))
    expect(TITTLE).toEqual(tittle.display)
    expect(WORDMARK_BOX.w).toBe(WORDMARK_WIDTH)
  })

  it('samples an outline evenly, starting where it starts', () => {
    const pts = sampleOutline(O_OUTER, 40)
    expect(pts).toHaveLength(40)
    expect(pts[0]![0]).toBeCloseTo(14.24)
    expect(pts[0]![1]).toBeCloseTo(8.57)
    const gaps = pts.map((p, i) => Math.hypot(p[0] - pts[(i + 1) % 40]![0], p[1] - pts[(i + 1) % 40]![1]))
    expect(Math.max(...gaps) / Math.min(...gaps)).toBeLessThan(1.15)
  })
})
