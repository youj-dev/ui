import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureProgressHandle, MiniatureKeyOf, MiniatureProgressProps } from './engine/types'
import { figure } from './figures/satellite'
import { satellite } from './meta/satellite'

export { satellite }
export type MiniatureSatelliteKey = MiniatureKeyOf<typeof satellite>
export type MiniatureSatelliteHandle = MiniatureProgressHandle<MiniatureSatelliteKey>
export interface MiniatureSatelliteProps extends MiniatureProgressProps {
  ref?: Ref<MiniatureSatelliteHandle>
}

/**
 * TALMIRA CS–7, satellite. A communications satellite on a display stand: a gold-foil bus with a white radiator, folding solar wings, a dish on a boom with its feed on struts, an omni mast and thruster pods on the top deck. The dish beams down to a ground point on the floor, with data packets running down the beam and replies running back up. Space stows the wings against the bus and deploys them again, panel by panel, and on battery the link drops to a beacon. The arrow keys slew the dish and move the ground point (or click the floor to beam there), and T fires the thrusters. As a progress indicator it shows a sync: a ring fills around the ground point, and on completion the link goes quiet.
 *
 * Keys: Space deploy / stow wings · ← ↑ ↓ → slew dish · T thrusters · P sync +25%.
 */
export function MiniatureSatellite(props: MiniatureSatelliteProps) {
  return <Miniature {...props} meta={satellite} figure={figure} />
}
