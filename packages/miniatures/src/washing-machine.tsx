import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/washing-machine'
import { washingMachine } from './meta/washing-machine'

export { washingMachine }
export type MiniatureWashingMachineKey = MiniatureKeyOf<typeof washingMachine>
export type MiniatureWashingMachineHandle = MiniatureHandle<MiniatureWashingMachineKey>
export interface MiniatureWashingMachineProps extends MiniatureProps {
  ref?: Ref<MiniatureWashingMachineHandle>
}

/**
 * AVELIN W–06, washing machine. Open the round glass door, load the laundry from the basket, close the door and start a wash. The detergent drawer slides out, the program dial turns, the drum lights, water fills it, clothes tumble and the timer counts down.
 *
 * Keys: O door · D drawer · L load · Space start / pause · 1–4 program.
 */
export function MiniatureWashingMachine(props: MiniatureWashingMachineProps) {
  return <Miniature {...props} meta={washingMachine} figure={figure} />
}
