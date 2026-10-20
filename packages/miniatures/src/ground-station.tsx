import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/ground-station'
import { groundStation } from './meta/ground-station'

export { groundStation }
export type MiniatureGroundStationKey = MiniatureKeyOf<typeof groundStation>
export type MiniatureGroundStationHandle = MiniatureHandle<MiniatureGroundStationKey>
export interface MiniatureGroundStationProps extends MiniatureProps {
  ref?: Ref<MiniatureGroundStationHandle>
}

/**
 * SKARN GS–2, ground station. A nine-metre dish on an azimuth–elevation pedestal with a feed horn on four struts, a cable tray to an equipment shelter with racks behind its window and door, a signal meter, and a satellite pass arcing across the sky. Track a pass and the dish slews to the rising satellite, locks on and follows it across the sky while a beam links the feed to the satellite, the signal meter climbs, and data packets run down the pedestal and along the cable tray into the racks. Jog the dish by hand, stow it, or open the shelter door.
 *
 * Keys: Space track pass · ← → azimuth · ↑ ↓ elevation · S stow · D door.
 */
export function MiniatureGroundStation(props: MiniatureGroundStationProps) {
  return <Miniature {...props} meta={groundStation} figure={figure} />
}
