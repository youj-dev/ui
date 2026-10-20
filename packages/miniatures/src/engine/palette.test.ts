import { describe, expect, it } from 'vitest'
import { palette, relight } from './palette'

describe('palette', () => {
  it('relights each material as the lab brief computed it: tops ×0.86, fronts ×0.68, sides ×0.46', () => {
    const role = (name: string) => (name === 'top' || name.endsWith('-top') ? 'top' : name === 'side' || name === 'recess' || name.endsWith('-side') ? 'side' : 'front')
    const lights = new Set(['line', 'accent', 'shadow', 'screen', 'paper', 'rubber', 'rubber-top', 'rubber-side', 'off', 'glass'])
    for (const [name, [light, dark]] of Object.entries(palette)) {
      if (lights.has(name)) continue
      expect([name, relight(light, role(name))]).toEqual([name, dark])
    }
  })

  it('takes the tint off near-neutrals on fronts and sides, so cream never turns khaki', () => {
    expect(relight('#e0e0dc', 'front')).toBe('#bdbdba')
    expect(relight('#9a6a42', 'front')).toBe('#815836')
  })
})
