import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/lava-lamp'
import { lavaLamp } from './meta/lava-lamp'

export { lavaLamp }
export type MiniatureLavaLampKey = MiniatureKeyOf<typeof lavaLamp>
export type MiniatureLavaLampHandle = MiniatureHandle<MiniatureLavaLampKey>
export interface MiniatureLavaLampProps extends MiniatureProps {
  ref?: Ref<MiniatureLavaLampHandle>
}

/**
 * MORVELLE L–14, lava lamp. A tapered glass globe of wax and water between a brushed aluminum base and cap, standing on a cork coaster. Warm wax lifts off the pool on the bottom and rises in slow blobs that stretch, merge and split, then cools under the cap and sinks back. Space switches it on and off: the bulb lights at once, but the wax takes a while to warm, sluggish at first before it flows, and settles back to the bottom as it cools. The arrow keys change the colors of the wax and the water, and a click on the glass, or Enter, nudges the flow.
 *
 * Keys: Space on / off · ← → colors · Enter nudge · or click the glass.
 */
export function MiniatureLavaLamp(props: MiniatureLavaLampProps) {
  return <Miniature {...props} meta={lavaLamp} figure={figure} />
}
