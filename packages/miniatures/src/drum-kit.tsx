import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/drum-kit'
import { drumKit } from './meta/drum-kit'

export { drumKit }
export type MiniatureDrumKitKey = MiniatureKeyOf<typeof drumKit>
export type MiniatureDrumKitHandle = MiniatureHandle<MiniatureDrumKitKey>
export interface MiniatureDrumKitProps extends MiniatureProps {
  ref?: Ref<MiniatureDrumKitHandle>
}

/**
 * KARVELL S–5, acoustic drum kit. A lacquered drum kit on a round rug: a kick drum with the maker’s plate on its front head, a snare, rack toms on the kick, a floor tom, a hi-hat on its pedal stand, crash and ride cymbals on their stands, and the stool. Press a key or click a drum to hit it: heads dip and ring, the kick pedal thumps, cymbals wobble on their felts and the hi-hat opens and closes. Space plays an original groove, the arrows set its tempo, and the readout shows the tempo and the last hit.
 *
 * Keys: K kick · S snare · T Y F toms · H O hi-hat closed / open · C R crash / ride · Space groove · ↑ ↓ ← → tempo.
 */
export function MiniatureDrumKit(props: MiniatureDrumKitProps) {
  return <Miniature {...props} meta={drumKit} figure={figure} />
}
