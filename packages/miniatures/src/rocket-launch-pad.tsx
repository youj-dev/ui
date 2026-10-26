import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureProgressHandle, MiniatureKeyOf, MiniatureProgressProps } from './engine/types'
import { figure } from './figures/rocket-launch-pad'
import { rocketLaunchPad } from './meta/rocket-launch-pad'

export { rocketLaunchPad }
export type MiniatureRocketLaunchPadKey = MiniatureKeyOf<typeof rocketLaunchPad>
export type MiniatureRocketLaunchPadHandle = MiniatureProgressHandle<MiniatureRocketLaunchPadKey>
export interface MiniatureRocketLaunchPadProps extends MiniatureProgressProps {
  ref?: Ref<MiniatureRocketLaunchPadHandle>
}

/**
 * LOFTRA LC–7, rocket launch pad. A two-stage rocket on a mobile platform over a concrete pad, held by the two swing arms of a lattice service tower, with a flame trench through the pad, a countdown board, a water tower and the crawlerway it rolled out on. Launch and the board flips down from ten while the arms swing away and the deluge sprays; the engines ignite, steam and smoke billow out of the trench and the rocket climbs out of the frame on a long flame. A moment later a fresh rocket rolls back out to the pad. Abort the count and the arms swing back. As a progress indicator the count follows the progress, and on completion the rocket lifts off.
 *
 * Keys: Space launch · Esc abort · P progress +25% · Enter done.
 */
export function MiniatureRocketLaunchPad(props: MiniatureRocketLaunchPadProps) {
  return <Miniature {...props} meta={rocketLaunchPad} figure={figure} />
}
