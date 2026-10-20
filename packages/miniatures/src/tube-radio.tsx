import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/tube-radio'
import { tubeRadio } from './meta/tube-radio'

export { tubeRadio }
export type MiniatureTubeRadioKey = MiniatureKeyOf<typeof tubeRadio>
export type MiniatureTubeRadioHandle = MiniatureHandle<MiniatureTubeRadioKey>
export interface MiniatureTubeRadioProps extends MiniatureProps {
  ref?: Ref<MiniatureTubeRadioHandle>
}

/**
 * ALDERVOSS W–58, valve radio. A 1950s table radio. Press a band key to switch on: the dial lamps light at once and the valves warm slowly. Tune through static and whistles to a station and the magic eye closes.
 *
 * Keys: O power · 1–4 band · ← → tune · S seek · ↑ ↓ volume.
 */
export function MiniatureTubeRadio(props: MiniatureTubeRadioProps) {
  return <Miniature {...props} meta={tubeRadio} figure={figure} />
}
