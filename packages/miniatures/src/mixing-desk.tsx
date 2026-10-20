import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/mixing-desk'
import { mixingDesk } from './meta/mixing-desk'

export { mixingDesk }
export type MiniatureMixingDeskKey = MiniatureKeyOf<typeof mixingDesk>
export type MiniatureMixingDeskHandle = MiniatureHandle<MiniatureMixingDeskKey>
export interface MiniatureMixingDeskProps extends MiniatureProps {
  ref?: Ref<MiniatureMixingDeskHandle>
}

/**
 * MERRAN M–4, mixing desk. Sloped four-channel analog mixing desk with gain, EQ and pan knobs, mute and solo keys, long-throw faders and LED meters per channel, a master section with a stereo meter bridge, and two small studio monitors on stands behind it.
 *
 * Keys: Space play · 1 – · 4 channel · ↑ ↓ fader · M mute · S solo.
 */
export function MiniatureMixingDesk(props: MiniatureMixingDeskProps) {
  return <Miniature {...props} meta={mixingDesk} figure={figure} />
}
