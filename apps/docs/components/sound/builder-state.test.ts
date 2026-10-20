// @vitest-environment node
import { labPacks } from '@youj/sound/lab'
import { DEFAULTS, PACKS, lab, packFile, picksQuery, readPicks, readme } from './builder-state'

/* The builder's link holds the built-in picks that differ from the default,
 * and its export names them as candidates and each file by its path. */

const link = 'https://www.youj.dev/docs/sound/builder?tap=halo'

test('reads the picks a link names, ignores anything else, and writes back only what differs', () => {
  // Wood is an earlier material, out of the builder: ignored like nonsense.
  const picks = readPicks('?tap=halo&error=nonsense&open=rill&select=wood&id=sound-builder')
  expect(picks).toEqual({ ...DEFAULTS, tap: 'tap.halo', open: 'open.rill' })
  expect(picksQuery(picks)).toBe('tap=halo&open=rill')
  // Other parameters in the address (a story's id, say) stay.
  expect(picksQuery({ ...DEFAULTS, tick: 'tick.glyph' }, '?id=sound-builder&tap=halo')).toBe('id=sound-builder&tick=glyph')
  expect(picksQuery(DEFAULTS)).toBe('')
})

test('exports a definePack that names built-in picks as candidates and files by their path', () => {
  const code = packFile({ picks: { ...DEFAULTS, tap: 'tap.halo', notify: 'notify.zephyr' }, files: ['error'], install: 'package', link })
  expect(code).toContain("import { candidates, definePack } from '@youj/sound'")
  expect(code).toContain('    tap: candidates.tap.halo,\n')
  expect(code).toContain('    notify: candidates.notify.zephyr,\n')
  expect(code).toContain("    error: '/sounds/error.wav',\n")
  expect(code).not.toContain('select:')
  expect(code).toContain(link)
})

test('imports from the copied source in an app on the registry, and only what it uses', () => {
  const code = packFile({ picks: DEFAULTS, files: ['tap'], install: 'source', link })
  expect(code).toContain("import { definePack } from '@/lib/youj/sound'")
  expect(packFile({ picks: DEFAULTS, files: [], install: 'package', link })).toContain('  sounds: {},\n')
})

test('says in the README where the files go, when there are any', () => {
  expect(readme({ files: ['tap'], link })).toContain('`public/sounds/`')
  expect(readme({ files: [], link })).not.toContain('public/sounds')
  expect(readme({ files: [], link })).toContain('<YoujProvider sound={sounds}>')
})

test('names every built-in pack in a line, and shows only what they play: the default first, then the packs in order', () => {
  expect(labPacks.map((pack) => pack.name)).toEqual(['beacon', 'halo', 'rill', 'glyph', 'zephyr', 'glass'])
  expect(Object.keys(PACKS).sort()).toEqual(labPacks.map((pack) => pack.name).sort())
  expect(DEFAULTS.tap).toBe('tap.beacon')
  expect(packFile({ picks: DEFAULTS, files: [], install: 'package', link })).toContain('the Beacon pack')
  const families = (cue: string) => lab.find((entry) => entry.cue === cue)!.variants.map((v) => v.family)
  expect(families('tap')).toEqual(['beacon', 'halo', 'rill', 'glyph', 'zephyr', 'glass'])
  // Glass's error is Classic's.
  expect(families('error')).toEqual(['beacon', 'halo', 'rill', 'glyph', 'zephyr', 'classic'])
})
