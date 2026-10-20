import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { angleOf, dialLayout, polar, ringRadius, segmentPath } from './geometry'

const near = (a: number, b: number) => expect(a).toBeCloseTo(b, 6)

describe('week dial geometry', () => {
  test('nine hours sweep three quarters: nine at the left, twelve on top, three on the right, six at the bottom', () => {
    const [from, to] = [9 * 60, 18 * 60]
    expect(angleOf(from, from, to)).toBe(-90)
    expect(angleOf(12 * 60, from, to)).toBe(0)
    expect(angleOf(15 * 60, from, to)).toBe(90)
    expect(angleOf(to, from, to)).toBe(180)
    // 13:20 is 4h20m in: just before the half way mark of the sweep.
    near(angleOf(13 * 60 + 20, from, to), -90 + (260 / 540) * 270)
  })

  test("points run clockwise from twelve o'clock", () => {
    const top = polar(100, 100, 50, 0)
    near(top.x, 100)
    near(top.y, 50)
    const right = polar(100, 100, 50, 90)
    near(right.x, 150)
    near(right.y, 100)
    const left = polar(100, 100, 50, -90)
    near(left.x, 50)
    near(left.y, 100)
  })

  test('rings divide the space between the middle and the margin, outermost first', () => {
    const layout = dialLayout(380, 5, 26)
    expect(layout).toMatchObject({ cx: 190, cy: 190, outer: 164 })
    near(layout.outer - layout.inner, layout.step * 5)
    expect(layout.width).toBeLessThan(layout.step)
    expect(ringRadius(layout, 0)).toBeGreaterThan(ringRadius(layout, 4))
    near(ringRadius(layout, 0) + layout.width / 2 + (layout.step - layout.width) / 2, layout.outer)
    near(ringRadius(layout, 4) - layout.width / 2 - (layout.step - layout.width) / 2, layout.inner)
    // Seven rings are thinner; no rings or no room is still a finite layout.
    expect(dialLayout(380, 7, 26).width).toBeLessThan(layout.width)
    expect(dialLayout(0, 5, 26)).toMatchObject({ outer: 0, width: 0 })
    expect(dialLayout(380, 0, 26).step).toBe(0)
  })

  test('a segment path is a closed outline of finite numbers, even for a sliver of a minute', () => {
    for (const [from, to] of [
      [-90, 180],
      [0, 30],
      [10, 10.2],
    ] as const) {
      const d = segmentPath(190, 190, 140, 17, from, to, 4)
      expect(d).toMatch(/^M[\d. -]+A[\d. -]+L[\d. -]+A[\d. -]+Z$/)
      expect(d).not.toMatch(/NaN|Infinity/)
    }
    // A segment of more than half a turn takes the long way round.
    expect(segmentPath(190, 190, 140, 17, -90, 180, 4)).toContain(' 0 1 1 ')
    expect(segmentPath(190, 190, 140, 17, 0, 30, 4)).toContain(' 0 0 1 ')
  })

  test('Week dial keeps the same model and summary as Week blocks', () => {
    // Only the block's own name differs between the two copies.
    const same = (file: string, dir: string) => readFileSync(join(import.meta.dirname, dir, file), 'utf8').replace(/week-(blocks|dial)/g, 'week-x').replace(/Week(Blocks|Dial)/g, 'WeekX')
    for (const file of ['model.ts', 'summary.tsx']) expect(same(file, '.')).toBe(same(file, '../week-blocks'))
  })
})
