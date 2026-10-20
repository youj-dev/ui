import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/desk-fan'
import { deskFan } from './meta/desk-fan'

export { deskFan }
export type MiniatureDeskFanKey = MiniatureKeyOf<typeof deskFan>
export type MiniatureDeskFanHandle = MiniatureHandle<MiniatureDeskFanKey>
export interface MiniatureDeskFanProps extends MiniatureProps {
  ref?: Ref<MiniatureDeskFanHandle>
}

/**
 * VENTORA 12, desk fan. A cream enamel base and motor, a domed chrome cage around four brass blades, and paper streamers tied to the cage. Turn the speed knob from off through three speeds and the brass blades blur; pull the oscillation knob and the head sweeps from side to side; tilt the head; the paper streamers lift and flutter with the airflow.
 *
 * Keys: 1–3 speed · 0 off · O oscillate · ↑ ↓ tilt.
 */
export function MiniatureDeskFan(props: MiniatureDeskFanProps) {
  return <Miniature {...props} meta={deskFan} figure={figure} />
}
