/* Which candidate each pack plays for each cue: the one file to edit to make
 * or change a pack. Pick from the ids the Sound builder shows
 * (/docs/sound/builder), then run
 *
 *   pnpm -F @youj/sound render
 *
 * which renders every candidate, and writes each pack here to
 * src/packs/<name>.ts (its loader), src/packs/<name>.data.ts (its audio) and
 * src/packs/index.ts (the exports). A new key here is a new pack. */

import { CUES, type Cue } from './scripts/variants/types.ts'

/** A pack of one family: every cue plays its `<cue>.<family>` candidate, with `swap` naming other candidates for some cues. */
const family = (name: string, swap: Partial<Record<Cue, string>> = {}): Record<Cue, string> =>
  Object.fromEntries(CUES.map((cue) => [cue, swap[cue] ?? `${cue}.${name}`])) as Record<Cue, string>

export const packs: Record<string, Record<Cue, string>> = {
  /* Beacon, the default: pure, dry sine pings with rounded onsets and a
   * natural decay. A single clear ping for a toast, two rising notes for
   * success, two gently falling ones for an error. */
  beacon: family('beacon'),
  /* The other final families, each one instrument across all ten cues. */
  halo: family('halo'),
  rill: family('rill'),
  glyph: family('glyph'),
  zephyr: family('zephyr'),
  /* Glass, the first default and still a pack to choose: everything struck
   * on glass. A bead under the fingernail for presses and choices, two quick
   * taps for a toggle, a small bell for a toast, two notes that bloom for a
   * surface, and rods ringing a fifth for success. Error keeps the first
   * palette's two falling knocks (Classic): glass has no candidate that says
   * "no" as plainly. */
  glass: family('glass', { error: 'error.classic' }),
}

/** The default pack: the base definePack falls back to. */
export const defaultPack = 'beacon'
