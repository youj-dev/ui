import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/home-battery'
import { homeBattery } from './meta/home-battery'

export { homeBattery }
export type MiniatureHomeBatteryKey = MiniatureKeyOf<typeof homeBattery>
export type MiniatureHomeBatteryHandle = MiniatureHandle<MiniatureHomeBatteryKey>
export interface MiniatureHomeBatteryProps extends MiniatureProps {
  ref?: Ref<MiniatureHomeBatteryHandle>
}

/**
 * HEARTHCELL HC–13, home battery. A wall-mounted battery, hybrid inverter, backup gateway and utility meter on a house wall, a ground-mounted solar panel and an air-conditioner, with energy flows drawn between them. A day and night cycle drives the solar panel. Energy flows between the panel, the battery, the house and the grid; the battery bar fills and drains, and the meter disc turns forwards or backwards. Cut the grid and the gateway islands the house on the battery.
 *
 * Keys: N skip 6 h · G grid outage · L air conditioner · P pause clock.
 */
export function MiniatureHomeBattery(props: MiniatureHomeBatteryProps) {
  return <Miniature {...props} meta={homeBattery} figure={figure} />
}
