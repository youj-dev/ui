import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureProgressHandle, MiniatureKeyOf, MiniatureProgressProps } from './engine/types'
import { figure } from './figures/wind-turbine'
import { windTurbine } from './meta/wind-turbine'

export { windTurbine }
export type MiniatureWindTurbineKey = MiniatureKeyOf<typeof windTurbine>
export type MiniatureWindTurbineHandle = MiniatureProgressHandle<MiniatureWindTurbineKey>
export interface MiniatureWindTurbineProps extends MiniatureProgressProps {
  ref?: Ref<MiniatureWindTurbineHandle>
}

/**
 * VINDRA W–36, wind turbine. A three-blade wind turbine on a grassy rise: a tapered steel tower with a door and its stair, a nacelle with a cooler, a met mast and an aviation light, a spinner and long twisted blades with red tips, and a small substation whose meter and lamp show the export. The rotor turns with the wind and the readout climbs with the power. A gust spins the blades up; turn the wind and the nacelle yaws to face it, its vane leading; raise the wind and the blades pitch to hold the rated power, and above cut-out they feather. The brake feathers the blades and stops the rotor, which restarts on its own after a hold, or at once on a second press. As a progress indicator the power follows the progress, and on completion it runs at its rated power.
 *
 * Keys: Space gust · ← → wind direction · ↑ ↓ wind speed · B brake.
 */
export function MiniatureWindTurbine(props: MiniatureWindTurbineProps) {
  return <Miniature {...props} meta={windTurbine} figure={figure} />
}
