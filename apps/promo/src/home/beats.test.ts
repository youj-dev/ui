import { describe, expect, it } from 'vitest'
import { FPS } from '../film/beats'
import { HOME, HOME_BEATS as B, HOME_CUTS, HOME_TITLE } from './beats'

describe('the home film', () => {
  it('runs twenty to thirty seconds, simulated from a pre-roll', () => {
    expect(HOME.frames / FPS).toBeGreaterThanOrEqual(20)
    expect(HOME.frames / FPS).toBeLessThanOrEqual(30)
    expect(HOME.preroll).toBeGreaterThan(0)
  })

  it('comes in both schemes, each with its own name and composition', () => {
    expect(HOME_CUTS.map((c) => c.scheme).sort()).toEqual(['dark', 'light'])
    expect(new Set(HOME_CUTS.map((c) => c.name)).size).toBe(2)
    expect(new Set(HOME_CUTS.map((c) => c.composition)).size).toBe(2)
  })

  it('says what it shows in words, never numbers', () => {
    expect(HOME_TITLE).not.toMatch(/\d/)
  })

  it('drafts the card before it plays, and plays before the theme passes through it', () => {
    expect(B.undo).toBeGreaterThan(B.dive)
    expect(B.build).toBeGreaterThan(B.undo)
    const parts = Object.values(B.parts)
    expect(parts).toEqual([...parts].sort((a, b) => a - b))
    // The icon's close-up: in, the morph, out, all while the card drafts.
    expect(B.morph).toBeGreaterThanOrEqual(B.iconPush + B.iconPushLength)
    expect(B.iconPull).toBeGreaterThanOrEqual(B.morph + B.morphLength)
    expect(B.namesOut).toBeGreaterThan(B.build + Math.max(...parts))
    expect(B.switchOn).toBeGreaterThan(B.namesOut)
    expect(B.press).toBeGreaterThan(B.reach)
    expect(B.resolve).toBeGreaterThanOrEqual(B.press)
    expect(B.themeIn).toBeGreaterThan(B.resolve + B.resolveLength)
  })

  it('pulls back once the theme has landed, and turns it back after the card has reset', () => {
    expect(B.pull).toBeGreaterThanOrEqual(B.themeIn + B.themeInLength)
    expect(B.wave).toBeGreaterThan(B.pull)
    expect(B.reset).toBeGreaterThan(B.pull + B.pullLength)
    expect(B.themeOut).toBeGreaterThan(B.reset + B.resolveLength)
  })

  it('comes to rest with over two seconds to spare, so the seam is a still frame', () => {
    const last = Math.max(B.themeOut + B.themeOutLength, B.reset + 20 + 30, B.playhead + B.playheadLength * 1.25, ...B.glides.map((at) => at + 60))
    expect(HOME.frames - last).toBeGreaterThanOrEqual(2 * FPS)
  })
})
