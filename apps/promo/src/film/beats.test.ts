import { describe, expect, it } from 'vitest'
import {
  ASSEMBLE,
  CAPTIONS,
  END,
  FILM_FRAMES,
  FPS,
  ICONS,
  ORIGIN,
  ORIGIN_BEATS,
  PARTS,
  PARTS_BEATS,
  LOOP,
  PRESETS,
  SQUARE,
  SQUARE_CAPTIONS,
  SQUARE_THEMES_SCRIPT,
  THEMES,
  THEMES_SCRIPT,
  TOKENS,
  TOKENS_BEATS,
  type ThemesScript,
} from './beats'

const chapters = [ORIGIN, TOKENS, ICONS, PARTS, ASSEMBLE, THEMES, END]

describe('the film', () => {
  it('runs about a minute and a quarter', () => {
    const seconds = FILM_FRAMES / FPS
    expect(seconds).toBeGreaterThanOrEqual(60)
    expect(seconds).toBeLessThanOrEqual(78)
  })

  it('starts each chapter while the one before is still on screen, never after it has gone', () => {
    for (let i = 1; i < chapters.length; i++) {
      const before = chapters[i - 1]!
      const next = chapters[i]!
      expect(next.from).toBeGreaterThan(before.from)
      expect(next.from).toBeLessThanOrEqual(before.from + before.duration)
    }
    expect(END.from + END.duration).toBe(FILM_FRAMES)
  })

  it('spends about 70% of its time on the foundations and 30% on the payoff', () => {
    const foundations = ASSEMBLE.from / FILM_FRAMES
    expect(foundations).toBeGreaterThan(0.65)
    expect(foundations).toBeLessThan(0.75)
  })

  it('changes the HUD caption in order, inside the film', () => {
    const at = CAPTIONS.map(([frame]) => frame)
    expect(at).toEqual([...at].sort((a, b) => a - b))
    expect(Math.max(...at)).toBeLessThan(FILM_FRAMES)
  })

  it('lets the cold open resolve before the lockup takes over, and the lockup form before it leaves', () => {
    const b = ORIGIN_BEATS
    const order = [b.grid, b.keys, b.ease, b.ease + b.draw, b.spring, b.spring + b.draw, b.resolve, b.tile, b.word, b.tagline, b.toHud]
    expect(order).toEqual([...order].sort((x, y) => x - y))
    expect(b.toHud + b.hudLength).toBeLessThanOrEqual(ORIGIN.duration)
  })

  it('holds every stop of the specimen long enough to read before it retunes again', () => {
    const stops = TOKENS_BEATS.route.map((stop) => stop.at)
    for (let i = 1; i < stops.length; i++) expect(stops[i]! - stops[i - 1]! - TOKENS_BEATS.retune).toBeGreaterThanOrEqual(1.6 * FPS)
  })

  it('visits the parts in order, each shot at least two seconds long', () => {
    const shots = Object.values(PARTS_BEATS)
    expect(shots).toEqual([...shots].sort((a, b) => a - b))
    for (let i = 1; i < shots.length; i++) expect(shots[i]! - shots[i - 1]!).toBeGreaterThanOrEqual(2 * FPS)
  })

  it('shows every preset, each held at least 1.6 seconds past its reveal', () => {
    expect(THEMES_SCRIPT.presets).toEqual(PRESETS)
    holds(THEMES_SCRIPT, THEMES.leave)
  })
})

/** Reveals in order, each held long enough to read; every preset on a product; each product's moment inside its own shot. */
function holds(script: ThemesScript, leave: number) {
  const ends = [...script.reveals, leave]
  for (let i = 0; i < script.reveals.length; i++) expect(ends[i + 1]! - ends[i]! - script.reveal).toBeGreaterThanOrEqual(1.6 * FPS)
  const seen = new Set(script.shots.flatMap((s) => s.presets))
  expect([...seen].sort()).toEqual(script.presets.map((_, i) => i))
  script.shots.forEach((shot, n) => {
    const moment = script.moments[shot.hero]
    const next = script.shots[n + 1]?.at ?? leave
    if (moment !== undefined) expect(moment).toBeGreaterThanOrEqual(shot.at)
    if (moment !== undefined) expect(moment).toBeLessThan(next)
    // A reveal happens while the product it opens on is in the window.
    for (const i of shot.presets.slice(1)) {
      expect(script.reveals[i - 1]!).toBeGreaterThan(shot.at)
      expect(script.reveals[i - 1]! + script.reveal).toBeLessThanOrEqual(next)
    }
  })
}

describe('the square cut', () => {
  it('runs 30 to 40 seconds, its chapters in order', () => {
    expect(SQUARE.frames / FPS).toBeGreaterThanOrEqual(30)
    expect(SQUARE.frames / FPS).toBeLessThanOrEqual(40)
    const starts = [SQUARE.icons.from, SQUARE.save.from, SQUARE.lanes.from, SQUARE.themes.from, SQUARE.end.from]
    expect(starts).toEqual([...starts].sort((a, b) => a - b))
    expect(SQUARE.end.from + SQUARE.end.duration).toBe(SQUARE.frames)
    const at = SQUARE_CAPTIONS.map(([frame]) => frame)
    expect(at).toEqual([...at].sort((a, b) => a - b))
  })

  it('holds each of its presets long enough to read', () => holds(SQUARE_THEMES_SCRIPT, SQUARE.themes.leave))
})

describe('the hero loop', () => {
  it('runs eleven seconds', () => expect(LOOP.frames / FPS).toBe(11))
})
