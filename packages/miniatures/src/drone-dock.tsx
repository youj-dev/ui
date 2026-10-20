import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/drone-dock'
import { droneDock } from './meta/drone-dock'

export { droneDock }
export type MiniatureDroneDockKey = MiniatureKeyOf<typeof droneDock>
export type MiniatureDroneDockHandle = MiniatureHandle<MiniatureDroneDockKey>
export interface MiniatureDroneDockProps extends MiniatureProps {
  ref?: Ref<MiniatureDroneDockHandle>
}

/**
 * NIMBRE D–04, drone dock. A quadcopter on a landing pad with an LED target ring, centering bars and charge rails, a weather mast with an anemometer and beacon, and a flight controller with a live view. Take off and the centering bars retract, the rotors spin up to blur discs and the pad ring chases outward while the drone climbs and hovers with a gentle bob. Nudge it with the arrows, land it back and the bars close, the rails light and the battery fills.
 *
 * Keys: T take off / land · ↑ ↓ ← → nudge · C charge.
 */
export function MiniatureDroneDock(props: MiniatureDroneDockProps) {
  return <Miniature {...props} meta={droneDock} figure={figure} />
}
