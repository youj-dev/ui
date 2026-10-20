import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/drum-machine'
import { drumMachine } from './meta/drum-machine'

export { drumMachine }
export type MiniatureDrumMachineKey = MiniatureKeyOf<typeof drumMachine>
export type MiniatureDrumMachineHandle = MiniatureHandle<MiniatureDrumMachineKey>
export interface MiniatureDrumMachineProps extends MiniatureProps {
  ref?: Ref<MiniatureDrumMachineHandle>
}

/**
 * MOTRIK SQ–16, drum machine. A long two-tier step sequencer between walnut cheeks with sixteen color-grouped step buttons and LEDs, eight instrument channels with level and tune knobs, a tempo knob with a red LED display, a swing knob, a pattern screen and a pair of small studio monitors behind it. Press play and a light runs along the sixteen steps while the monitors thump. Pick one of eight instruments, toggle its steps, change the tempo and the swing, or clear a track.
 *
 * Keys: Space play · Q–I A–K steps · 1–8 instrument · ↑ ↓ tempo · ← → swing · ⌫ clear.
 */
export function MiniatureDrumMachine(props: MiniatureDrumMachineProps) {
  return <Miniature {...props} meta={drumMachine} figure={figure} />
}
