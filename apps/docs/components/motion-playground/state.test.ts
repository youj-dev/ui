// @vitest-environment node
import { motionPersonalities } from '@youj/core/lib/youj/tokens'
import {
  DEFAULT_STATE,
  easeTokenFor,
  nearestDuration,
  nearestSpring,
  parseState,
  serializeState,
  springTokenFor,
  springValues,
  tweenValues,
  type PlaygroundState,
} from './state'

const state = (patch: Partial<PlaygroundState>): PlaygroundState => ({ ...DEFAULT_STATE, ...patch })

describe('the playground link', () => {
  it('is plain for the default view', () => {
    expect(serializeState(DEFAULT_STATE)).toBe('')
    expect(parseState('')).toEqual(DEFAULT_STATE)
  })

  it('names tokens and spells custom values as numbers', () => {
    expect(serializeState(state({ tab: 'tweens', duration: 'slow', ease: 'emphasized' }))).toBe('tab=tweens&duration=slow&ease=emphasized')
    expect(serializeState(state({ spring: 'custom', springCustom: { visualDuration: 0.5, bounce: 0.2 } }))).toBe('spring=0.5,0.2')
    expect(serializeState(state({ duration: 'custom', durationCustom: 300, ease: 'custom', easeCustom: [0.3, 0, 0.2, 1] }))).toBe('duration=300&ease=0.3,0,0.2,1')
  })

  it('round-trips every view', () => {
    const views: PlaygroundState[] = [
      state({ tab: 'springs', spring: 'settle' }),
      state({ tab: 'springs', spring: 'custom', springCustom: { visualDuration: 0.72, bounce: 0.45 } }),
      state({ tab: 'tweens', duration: 'custom', durationCustom: 480, ease: 'custom', easeCustom: [0.5, -0.2, 0.3, 1.2] }),
      state({ tab: 'stagger', stagger: 'loose', order: 'center', variant: 'blur-in' }),
      state({ tab: 'personalities', moment: 'arrival' }),
      state({ tab: 'presence', preset: 'yj-sheet-end' }),
      state({ tab: 'reduced', interaction: 'menu' }),
    ]
    for (const view of views) {
      const parsed = parseState(serializeState(view))
      expect(parsed.tab).toBe(view.tab)
      expect(serializeState(parsed)).toBe(serializeState(view))
    }
  })

  it('clamps custom values into the sliders’ ranges', () => {
    expect(parseState('spring=9,4').springCustom).toEqual({ visualDuration: 1.2, bounce: 0.8 })
    expect(parseState('duration=9999').durationCustom).toBe(1000)
    expect(parseState('ease=2,9,-1,-9').easeCustom).toEqual([1, 1.5, 0, -0.5])
  })

  it('falls back to the default for anything it doesn’t know', () => {
    const parsed = parseState('tab=nope&spring=bouncy&duration=soon&ease=1,2,3&stagger=huge&order=up&preset=yj-zoom&interaction=<script>')
    expect(parsed).toEqual(DEFAULT_STATE)
    expect(parseState('spring=0.5,').spring).toBe(DEFAULT_STATE.spring)
    expect(parseState('ease=0.2,0,0,NaN').ease).toBe(DEFAULT_STATE.ease)
  })

  it('keeps the linear curve out: it is for loops, not tweens between states', () => {
    expect(parseState('ease=linear').ease).toBe(DEFAULT_STATE.ease)
  })
})

describe('tokens and custom values', () => {
  it('recognizes a token by its values, in the personality in effect', () => {
    expect(springTokenFor({ visualDuration: 0.45, bounce: 0.3 })).toBe('settle')
    expect(springTokenFor({ visualDuration: 0.45, bounce: 0.3 }, 'calm')).toBeNull()
    expect(springTokenFor({ visualDuration: 0.6, bounce: 0 }, 'calm')).toBe('settle')
    expect(easeTokenFor([0.16, 1, 0.3, 1])).toBe('enter')
    expect(easeTokenFor([0.16, 1, 0.3, 0.9])).toBeNull()
  })

  it('resolves a token through the personality, and custom values as they are', () => {
    expect(springValues(state({ spring: 'smooth' }), 'lively')).toEqual(motionPersonalities.lively.springs.smooth)
    expect(springValues(state({ spring: 'custom', springCustom: { visualDuration: 0.3, bounce: 0.1 } }), 'lively')).toEqual({ visualDuration: 0.3, bounce: 0.1 })
    expect(tweenValues(state({ duration: 'base', ease: 'enter' }), 'calm')).toEqual({ ms: 300, curve: [0.33, 1, 0.68, 1] })
  })

  it('suggests the closest token to a custom value', () => {
    expect(nearestSpring({ visualDuration: 0.5, bounce: 0.25 }, 'precise')).toBe('settle')
    expect(nearestSpring({ visualDuration: 0.22, bounce: 0 }, 'precise')).toBe('snappy')
    // On the scale's own geometric steps: 300 ms is nearer 340 than 220.
    expect(nearestDuration(300, 'precise')).toBe('slow')
    expect(nearestDuration(250, 'precise')).toBe('base')
    expect(nearestDuration(600, 'precise')).toBe('deliberate')
    expect(nearestDuration(90, 'precise')).toBe('instant')
  })
})
