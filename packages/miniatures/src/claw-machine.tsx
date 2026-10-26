import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/claw-machine'
import { clawMachine } from './meta/claw-machine'

export { clawMachine }
export type MiniatureClawMachineKey = MiniatureKeyOf<typeof clawMachine>
export type MiniatureClawMachineHandle = MiniatureHandle<MiniatureClawMachineKey>
export interface MiniatureClawMachineProps extends MiniatureProps {
  ref?: Ref<MiniatureClawMachineHandle>
}

/**
 * LARKWELL CR–3, claw machine. An arcade claw machine: a glass case piled with plush toys, a gantry and a three-prong claw on a cable, a lit marquee, a joystick, a big drop button, a coin slot and a prize door. Steer the claw with the arrow keys or the pointer over the glass, then press Space or the button: it drops, closes, lifts and carries its catch home to the chute. Lined up well, it holds; off center, it may slip on the way; off target, it misses. A win tumbles down to the prize door while the marquee flashes. C adds a credit, P takes the prize, and left alone it plays itself.
 *
 * Keys: ← → ↑ ↓ steer the claw · Space drop · C coin · P take the prize.
 */
export function MiniatureClawMachine(props: MiniatureClawMachineProps) {
  return <Miniature {...props} meta={clawMachine} figure={figure} />
}
