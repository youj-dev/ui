import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/cooling-unit'
import { coolingUnit } from './meta/cooling-unit'

export { coolingUnit }
export type MiniatureCoolingUnitKey = MiniatureKeyOf<typeof coolingUnit>
export type MiniatureCoolingUnitHandle = MiniatureHandle<MiniatureCoolingUnitKey>
export interface MiniatureCoolingUnitProps extends MiniatureProps {
  ref?: Ref<MiniatureCoolingUnitHandle>
}

/**
 * NIVALIS PX–30, precision cooling. The unit blows cold air under the raised floor; it rises through perforated tiles into the rack fronts and returns hot over the racks. Raise the IT load and the fans stage up; change the supply setpoint; clog the filter to trigger an alarm; switch the unit off and watch the inlets heat up.
 *
 * Keys: L IT load · S setpoint · F filter · O unit power.
 */
export function MiniatureCoolingUnit(props: MiniatureCoolingUnitProps) {
  return <Miniature {...props} meta={coolingUnit} figure={figure} />
}
