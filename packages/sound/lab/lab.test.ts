import { soundCues } from '@youj/core'
import { candidates } from '../src/candidates'
import { variants as recipes } from '../scripts/variants/index.ts'
import { cueInfo, lab } from './index'

/* The builder's data: every cue and registered recipe, levelled to
 * the cue's loudness, and a candidate module in the package for every one, so
 * the builder plays (and a pack references) exactly what ships. */

const loaders = candidates as Record<string, Record<string, () => Promise<Uint8Array>>>

test('lists every cue, in order, with every registered candidate exactly once', () => {
  expect(lab.map((entry) => entry.cue)).toEqual([...soundCues])
  for (const { cue, variants } of lab) {
    expect(variants.map((v) => v.id), cue).toEqual(recipes.filter((v) => v.cue === cue).map((v) => v.id))
    expect(new Set(variants.map((v) => v.family)).size, cue).toBe(variants.length)
    expect(cueInfo[cue].label, cue).toBeTruthy()
  }
})

test('levels every candidate to its cue’s loudness, so the builder compares character, not level', () => {
  for (const { cue, level, variants } of lab) {
    for (const sound of variants) expect(Math.abs(sound.lufs - level), sound.id).toBeLessThanOrEqual(0.2)
    expect(level, cue).toBeLessThan(-18)
  }
})

test('has a candidate in the package for every sound, and no other', async () => {
  expect(Object.keys(candidates)).toEqual([...soundCues])
  for (const { cue, variants } of lab) {
    expect(Object.keys(loaders[cue]!).sort(), cue).toEqual(variants.map((v) => v.family).sort())
    for (const sound of variants) {
      const bytes = await loaders[cue]![sound.family]!()
      expect(bytes.length, sound.id).toBe(sound.bytes)
      expect(bytes.length, sound.id).toBeLessThanOrEqual(6 * 1024)
      // An MPEG audio frame's sync word: eleven set bits.
      expect(bytes[0], sound.id).toBe(0xff)
      expect(bytes[1]! & 0xe0, sound.id).toBe(0xe0)
      expect(sound.wave, sound.id).toHaveLength(48)
      expect(sound.spectrum, sound.id).toHaveLength(28)
      expect(sound.truePeak, sound.id).toBeLessThanOrEqual(-1)
    }
  }
})
