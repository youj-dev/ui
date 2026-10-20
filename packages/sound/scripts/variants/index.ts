/* Every candidate, by cue. The Sound builder lists them all; packs.config.ts
 * picks one per cue for each pack. */

import { notify } from './notify.ts'
import { zephyr } from './zephyr.ts'
import { rill } from './rill.ts'
import { glyph } from './glyph.ts'
import { beacon } from './beacon.ts'
import { halo } from './halo.ts'
import { outcome } from './outcome.ts'
import { press } from './press.ts'
import { surface } from './surface.ts'
import { toggle } from './toggle.ts'
import { CUES, type Variant } from './types.ts'

export * from './types.ts'

export const variants: Variant[] = [...press, ...toggle, ...outcome, ...notify, ...surface, ...beacon, ...halo, ...rill, ...glyph, ...zephyr].sort(
  (a, b) => CUES.indexOf(a.cue) - CUES.indexOf(b.cue),
)
