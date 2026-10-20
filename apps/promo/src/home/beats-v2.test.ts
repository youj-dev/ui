import { describe, expect, it } from 'vitest'
import { FPS } from '../film/beats'
import { HOME_V2 as HOME, HOME_V2_BEATS as B, HOME_V2_CUTS, HOME_V2_TITLE } from './beats-v2'
import { HOME_CUTS } from './beats'
import { durations } from '@youj/core'
import { scene as offshoot } from '@youj/loaders/offshoot'

describe('the home film, v2', () => {
  it('runs twenty to twenty-six seconds, simulated from a pre-roll', () => {
    expect(HOME.frames / FPS).toBeGreaterThanOrEqual(20)
    expect(HOME.frames / FPS).toBeLessThanOrEqual(26)
    expect(HOME.preroll).toBeGreaterThan(0)
  })

  it('comes in both schemes, named apart from the first film so the two can be compared', () => {
    expect(HOME_V2_CUTS.map((c) => c.scheme).sort()).toEqual(['dark', 'light'])
    const names = [...HOME_V2_CUTS, ...HOME_CUTS].map((c) => c.name)
    const compositions = [...HOME_V2_CUTS, ...HOME_CUTS].map((c) => c.composition)
    expect(new Set(names).size).toBe(names.length)
    expect(new Set(compositions).size).toBe(compositions.length)
  })

  it('says what it shows in words, never numbers', () => {
    expect(HOME_V2_TITLE).not.toMatch(/\d/)
  })

  it('drafts the card before it ships, and ships before the theme passes through it', () => {
    expect(B.undo).toBeGreaterThan(B.dive)
    expect(B.build).toBeGreaterThan(B.undo)
    const parts = Object.values(B.parts)
    expect(parts).toEqual([...parts].sort((a, b) => a - b))
    // The scene assembles before the camera leaves the card for the icon's close-up.
    expect(B.iconPush).toBeGreaterThan(B.build + B.parts.scene)
    expect(B.morph).toBeGreaterThanOrEqual(B.iconPush + B.iconPushLength)
    expect(B.iconPull).toBeGreaterThanOrEqual(B.morph + B.morphLength)
    expect(B.namesOut).toBeGreaterThan(B.build + Math.max(...parts))
    expect(B.lean).toBeGreaterThan(B.namesOut)
    expect(B.press).toBeGreaterThan(B.reach)
    expect(B.resolve).toBeGreaterThan(B.press)
    expect(B.notify).toBeGreaterThan(B.resolve)
    expect(B.unlean).toBeGreaterThan(B.notify)
    expect(B.themeIn).toBeGreaterThanOrEqual(B.unlean + B.unleanLength - 10)
  })

  it('deploys for at least one whole loop of the canvas animation, clear of its fades in and out', () => {
    const loop = ((offshoot.beats * durations.deliberate) / 1000) * FPS
    expect(B.resolve - 6 - (B.press + 18)).toBeGreaterThanOrEqual(loop)
  })

  it('pulls back once the theme has landed, and turns it back after the card has reset', () => {
    expect(B.pull).toBeGreaterThanOrEqual(B.themeIn + B.themeInLength)
    expect(B.playhead).toBeGreaterThan(B.pull)
    expect(B.reset).toBeGreaterThan(B.pull + B.pullLength)
    expect(B.themeOut).toBeGreaterThan(B.reset + B.resolveLength)
  })

  it('comes to rest with two seconds to spare, so the seam is a still frame', () => {
    const last = Math.max(B.themeOut + B.themeOutLength, B.reset + 50, B.playhead + B.playheadLength * 1.25, ...B.glides.map((at) => at + 60))
    expect(HOME.frames - last).toBeGreaterThanOrEqual(2 * FPS)
  })
})
