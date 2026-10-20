import { describe, expect, it } from 'vitest'
import { BRAND, splitAfterComma } from './brand'

describe('brand', () => {
  it('sets the tagline and the promise in two parts, split after the last comma', () => {
    expect(splitAfterComma(BRAND.tagline)).toEqual(['Components, motion and icons,', 'designed as one.'])
    expect(splitAfterComma(BRAND.promise)).toEqual(['Take all of it,', 'or just what you need.'])
  })

  it('derives every module, package and install line from one name, one scope and one CLI', () => {
    const scope = BRAND.packages.ui.split('/')[0]!
    expect(BRAND.packages.motion.startsWith(`${scope}/`)).toBe(true)
    expect(BRAND.packages.icons.startsWith(`${scope}/`)).toBe(true)
    expect(BRAND.install.all).toBe(`npx ${BRAND.cli} init`)
    expect(BRAND.install.one.startsWith(`npx ${BRAND.cli} add `)).toBe(true)
    for (const module of [BRAND.modules.ui, BRAND.modules.motion, BRAND.modules.icons]) expect(module.startsWith(BRAND.name)).toBe(true)
  })
})
