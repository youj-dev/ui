/// <reference types="vite/client" />
import { soundCues } from '@youj/core'
import { defaultPack, packs as config } from '../packs.config.ts'
import { CUES } from '../scripts/variants/types.ts'
import { lab } from '../lab/index'
import { candidates } from './candidates'
import * as packs from './packs'
import { beacon } from './index'

/* The packs as shipped: what packs.config.ts asked for (the render wrote
 * them), every cue, real MP3s, and within the size budgets (each file under
 * 6 KB, a pack under 40 KB). */

const MAX_FILE = 6 * 1024
const MAX_PACK = 40 * 1024
const data = import.meta.glob<{ picks: Record<string, string>; sounds: Record<string, string> }>('./packs/*.data.ts')

test('the render and the components agree on the cues', () => {
  expect([...CUES]).toEqual([...soundCues])
})

test('every pack in the config is exported, as rendered', async () => {
  expect(Object.keys(packs).sort()).toEqual(Object.keys(config).sort())
  for (const [name, picks] of Object.entries(config)) {
    const module = await data[`./packs/${name}.data.ts`]!()
    // A stale render fails here: run `pnpm -F @youj/sound render` after editing packs.config.ts.
    expect(module.picks, name).toEqual(picks)
  }
})

test('each pack has a sound for every cue, a real MP3, within budget', async () => {
  for (const pack of Object.values(packs)) {
    const sources = await pack.load()
    expect(Object.keys(sources).sort(), pack.name).toEqual([...soundCues].sort())
    let total = 0
    for (const [cue, bytes] of Object.entries(sources) as [string, Uint8Array][]) {
      // An MPEG audio frame's sync word: eleven set bits.
      expect(bytes[0], `${pack.name}.${cue}`).toBe(0xff)
      expect(bytes[1]! & 0xe0, `${pack.name}.${cue}`).toBe(0xe0)
      expect(bytes.length, `${pack.name}.${cue}`).toBeLessThanOrEqual(MAX_FILE)
      total += bytes.length
    }
    expect(total, pack.name).toBeLessThanOrEqual(MAX_PACK)
  }
})

test('the default pack is Beacon, all Beacon; Glass stays a pack to choose, with Classic’s error', () => {
  expect(defaultPack).toBe('beacon')
  expect(Object.values(config.beacon!).every((id) => id.endsWith('.beacon'))).toBe(true)
  expect(Object.keys(config)).toEqual(['beacon', 'halo', 'rill', 'glyph', 'zephyr', 'glass'])
  expect(Object.entries(config.glass!).filter(([, id]) => !id.endsWith('.glass'))).toEqual([['error', 'error.classic']])
})

test('the default pack plays the builder’s defaults, byte for byte the candidates it names', async () => {
  const sources = (await beacon.load()) as Record<string, Uint8Array>
  for (const { cue, defaultId, variants } of lab) {
    expect(defaultId, cue).toBe(config[defaultPack]![cue])
    expect(variants.map((v) => v.id), cue).toContain(defaultId)
    const family = defaultId.split('.')[1]!
    const candidate = await (candidates as Record<string, Record<string, () => Promise<Uint8Array>>>)[cue]![family]!()
    expect(sources[cue], cue).toEqual(candidate)
  }
})
