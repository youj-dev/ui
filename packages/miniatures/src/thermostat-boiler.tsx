import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/thermostat-boiler'
import { thermostatBoiler } from './meta/thermostat-boiler'

export { thermostatBoiler }
export type MiniatureThermostatBoilerKey = MiniatureKeyOf<typeof thermostatBoiler>
export type MiniatureThermostatBoilerHandle = MiniatureHandle<MiniatureThermostatBoilerKey>
export interface MiniatureThermostatBoilerProps extends MiniatureProps {
  ref?: Ref<MiniatureThermostatBoilerHandle>
}

/**
 * AUVEN H–21, thermostat and boiler. A combi boiler with its flue and valve manifold, a round wall thermostat with a ring light, copper flow and return pipes and a column radiator with a thermostatic valve. Turn or drag the thermostat dial to set the room temperature. When the room is below target the boiler fires, heat travels along the copper flow pipe and the radiator warms column by column. Eco lowers the target by two degrees, boost fires the burner regardless, and the bleed valve lets trapped air out.
 *
 * Keys: ↑ ↓ setpoint · E eco · F flame · V bleed.
 */
export function MiniatureThermostatBoiler(props: MiniatureThermostatBoilerProps) {
  return <Miniature {...props} meta={thermostatBoiler} figure={figure} />
}
