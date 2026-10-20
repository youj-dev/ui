import { describe, expect, it } from 'vitest'
import { BOARD, CUTS, FLASHES, LOOKS, TEASER_FPS, TEASER_FRAMES, cutAt } from './beats'

describe('the teaser', () => {
  it('runs 12 to 18 seconds', () => {
    const seconds = TEASER_FRAMES / TEASER_FPS
    expect(seconds).toBeGreaterThanOrEqual(12)
    expect(seconds).toBeLessThanOrEqual(18)
  })

  it('cuts in order, and every glitch state holds for whole frame pairs (a 30 fps re-encode keeps them)', () => {
    for (let i = 1; i < CUTS.length; i++) expect(CUTS[i]!.at).toBeGreaterThan(CUTS[i - 1]!.at)
    for (const cut of CUTS) expect(cut.at % 2).toBe(0)
    for (const flash of FLASHES) expect([flash.at % 2, flash.length % 2]).toEqual([0, 0])
  })

  it('flips between dark and light at most three times a second (photosensitive safety)', () => {
    const scheme = (frame: number) => {
      const whole = FLASHES.find((f) => f.coverage >= 1 && frame >= f.at && frame < f.at + f.length)
      const shot = whole?.shot ?? cutAt(frame).shot
      const look = shot.split(':')[1] as keyof typeof LOOKS | undefined
      return look && look in LOOKS ? LOOKS[look].scheme : 'dark'
    }
    const flips: number[] = []
    for (let f = 1; f < TEASER_FRAMES; f++) if (scheme(f) !== scheme(f - 1)) flips.push(f)
    for (let i = 0; i < flips.length; i++) expect(flips.filter((f) => f >= flips[i]! && f < flips[i]! + TEASER_FPS).length).toBeLessThanOrEqual(6)
  })

  it('boards a dozen frames inside the film', () => {
    expect(BOARD.length).toBe(12)
    for (const { frame } of BOARD) expect(frame).toBeLessThan(TEASER_FRAMES)
  })
})
