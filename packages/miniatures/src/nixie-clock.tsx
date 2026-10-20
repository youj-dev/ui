import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/nixie-clock'
import { nixieClock } from './meta/nixie-clock'

export { nixieClock }
export type MiniatureNixieClockKey = MiniatureKeyOf<typeof nixieClock>
export type MiniatureNixieClockHandle = MiniatureHandle<MiniatureNixieClockKey>
export interface MiniatureNixieClockProps extends MiniatureProps {
  ref?: Ref<MiniatureNixieClockHandle>
}

/**
 * CATHODA N6, nixie clock. Six glowing number tubes and two neon colon bulbs on a walnut base with brass buttons and a small exposed control board. Six side-view Nixie tubes show the live time in orange neon. Set the hours and minutes, run the slot-machine cathode cycle, switch between 12 and 24 hours, and dim the tubes or turn the room lights out.
 *
 * Keys: S set · ↑ ↓ adjust · C cycle · D dim / night · H 12 / 24.
 */
export function MiniatureNixieClock(props: MiniatureNixieClockProps) {
  return <Miniature {...props} meta={nixieClock} figure={figure} />
}
