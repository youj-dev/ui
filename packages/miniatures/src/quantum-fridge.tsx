import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/quantum-fridge'
import { quantumFridge } from './meta/quantum-fridge'

export { quantumFridge }
export type MiniatureQuantumFridgeKey = MiniatureKeyOf<typeof quantumFridge>
export type MiniatureQuantumFridgeHandle = MiniatureHandle<MiniatureQuantumFridgeKey>
export interface MiniatureQuantumFridgeProps extends MiniatureProps {
  ref?: Ref<MiniatureQuantumFridgeHandle>
}

/**
 * QELVA DR–5, dilution refrigerator. A gold five-stage chandelier hanging from a frame, a cut-away vacuum can on a scissor lift, a gas handling cabinet and a control rack with a monitor. Raise the vacuum can, cool the stages from room temperature to ten millikelvin, then send microwave pulses down the coax lines to read out and flip a superconducting qubit.
 *
 * Keys: O vacuum can · C cool down · W warm up · Space readout pulse · X π-pulse.
 */
export function MiniatureQuantumFridge(props: MiniatureQuantumFridgeProps) {
  return <Miniature {...props} meta={quantumFridge} figure={figure} />
}
