import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/smart-trainer'
import { smartTrainer } from './meta/smart-trainer'

export { smartTrainer }
export type MiniatureSmartTrainerKey = MiniatureKeyOf<typeof smartTrainer>
export type MiniatureSmartTrainerHandle = MiniatureHandle<MiniatureSmartTrainerKey>
export interface MiniatureSmartTrainerProps extends MiniatureProps {
  ref?: Ref<MiniatureSmartTrainerHandle>
}

/**
 * RAVELO T–1, smart trainer. The rear wheel is off and the frame's dropouts sit on the trainer's axle, with the chain on its cassette and the front wheel on a riser block. Pedal and the cranks, chain and flywheel turn while the tablet shows power, cadence and speed and the trainer's ring lights in the power zone color. Change the resistance, shift gears or turn on the fan.
 *
 * Keys: Space pedal · ↑ ↓ resistance · ← → shift · F fan.
 */
export function MiniatureSmartTrainer(props: MiniatureSmartTrainerProps) {
  return <Miniature {...props} meta={smartTrainer} figure={figure} />
}
