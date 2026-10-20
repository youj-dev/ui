import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/lighthouse'
import { lighthouse } from './meta/lighthouse'

export { lighthouse }
export type MiniatureLighthouseKey = MiniatureKeyOf<typeof lighthouse>
export type MiniatureLighthouseHandle = MiniatureHandle<MiniatureLighthouseKey>
export interface MiniatureLighthouseProps extends MiniatureProps {
  ref?: Ref<MiniatureLighthouseHandle>
}

/**
 * KARREG POINT, lighthouse. A tall banded tower with a gallery and a glazed lantern, a keeper's cottage, a fog-signal hut, a jetty with a boat and a granite island in the surf. A tapered masonry tower with two red bands rises from a granite island. Its lantern holds a rotating Fresnel lens that sweeps two beams across the sea. A keeper's cottage with a smoking chimney, a fog-signal hut with twin trumpets and a fog detector, a jetty and a moored boat sit around it. Switch the lamp, sound the horn, bring in fog and turn day to night.
 *
 * Keys: L lamp · Space fog horn · F fog · D day / night.
 */
export function MiniatureLighthouse(props: MiniatureLighthouseProps) {
  return <Miniature {...props} meta={lighthouse} figure={figure} />
}
