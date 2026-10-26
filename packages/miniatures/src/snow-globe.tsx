import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/snow-globe'
import { snowGlobe } from './meta/snow-globe'

export { snowGlobe }
export type MiniatureSnowGlobeKey = MiniatureKeyOf<typeof snowGlobe>
export type MiniatureSnowGlobeHandle = MiniatureHandle<MiniatureSnowGlobeKey>
export interface MiniatureSnowGlobeProps extends MiniatureProps {
  ref?: Ref<MiniatureSnowGlobeHandle>
}

/**
 * HUSHFALL G–10, snow globe. A glass snow globe on a turned walnut base with a small brass plate and a winding key. Inside, a red log cabin with lit windows stands in the snow between pines, with a lamp post and a skater on a frozen pond. Drag the globe or press Space to shake it: the snow whirls with the water, then slowly settles, and the readout follows it. The arrow keys swirl it one way or the other. W winds the music box in the base: it plays a little waltz, the skater glides while it plays, and the tune slows as the spring runs down. At night the windows and the lamp glow.
 *
 * Keys: Space shake · or drag the globe · ← → swirl · W wind the music box.
 */
export function MiniatureSnowGlobe(props: MiniatureSnowGlobeProps) {
  return <Miniature {...props} meta={snowGlobe} figure={figure} />
}
