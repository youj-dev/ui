import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/campfire'
import { campfire } from './meta/campfire'

export { campfire }
export type MiniatureCampfireKey = MiniatureKeyOf<typeof campfire>
export type MiniatureCampfireHandle = MiniatureHandle<MiniatureCampfireKey>
export interface MiniatureCampfireProps extends MiniatureProps {
  ref?: Ref<MiniatureCampfireHandle>
}

/**
 * ASKELD T–2, campfire and tent. A canvas ridge tent and a stone-ringed campfire on a patch of turf, with a log seat and a roasting stick. The fire crackles and sends sparks up, and burns down slowly to embers; Space adds a log, and it flares up, then settles. Click the tent to light or dim the storm lantern hanging in its door. Drag the stick to the fire, or press T, to toast the marshmallow from golden to burnt; M puts on a fresh one. At night the fire lights the camp and the stars come out.
 *
 * Keys: Space add a log · L lantern · T toast · M fresh marshmallow.
 */
export function MiniatureCampfire(props: MiniatureCampfireProps) {
  return <Miniature {...props} meta={campfire} figure={figure} />
}
