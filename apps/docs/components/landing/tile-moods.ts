import type { BackdropId } from '@/lib/backdrops'
import type { PillarId } from '@/lib/nav'

/* Each part on a mood of its own: the card they come from is Youj, and the parts break into the six palettes, each
 * on its backdrop's still (family.tsx) and in its palette from the start, in the card too (hero-stage.tsx). Themes and Blocks stay Youj. */
export const TILE_MOODS: Partial<Record<PillarId, BackdropId>> = {
  ui: 'sandstone',
  motion: 'seaglass',
  loaders: 'cinnabar',
  icons: 'meadow',
  illustrations: 'heather',
  sound: 'umber',
}
