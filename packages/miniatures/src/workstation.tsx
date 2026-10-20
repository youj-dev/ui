import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/workstation'
import { workstation } from './meta/workstation'

export { workstation }
export type MiniatureWorkstationKey = MiniatureKeyOf<typeof workstation>
export type MiniatureWorkstationHandle = MiniatureHandle<MiniatureWorkstationKey>
export interface MiniatureWorkstationProps extends MiniatureProps {
  ref?: Ref<MiniatureWorkstationHandle>
}

/**
 * KELVIN T7, workstation. A glass-paneled tower: motherboard, tower cooler, four memory sticks, a graphics card, front and rear fans, a power supply shroud and a drive cage. Run a render to ramp the load, switch the fan profile and the lights, or power it down.
 *
 * Keys: O power · R render · S silent fans · L lights.
 */
export function MiniatureWorkstation(props: MiniatureWorkstationProps) {
  return <Miniature {...props} meta={workstation} figure={figure} />
}
