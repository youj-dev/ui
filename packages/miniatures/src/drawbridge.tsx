import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureProgressHandle, MiniatureKeyOf, MiniatureProgressProps } from './engine/types'
import { figure } from './figures/drawbridge'
import { drawbridge } from './meta/drawbridge'

export { drawbridge }
export type MiniatureDrawbridgeKey = MiniatureKeyOf<typeof drawbridge>
export type MiniatureDrawbridgeHandle = MiniatureProgressHandle<MiniatureDrawbridgeKey>
export interface MiniatureDrawbridgeProps extends MiniatureProgressProps {
  ref?: Ref<MiniatureDrawbridgeHandle>
}

/**
 * VAARDEN BK–2, drawbridge. A white double-leaf bascule bridge over a canal: balance beams and their counterweights on its portals, road barriers with signals, red and green span lamps, a brick control tower, and a sailing boat whose mast is too tall for the closed bridge. Press Space or click the tower to approve: the barriers come down and the road signals turn red, the leaves rise as the counterweights swing down, the span lamps turn green and the boat passes, then everything returns and the next boat comes up. Escape denies: the boat holds and sounds its horn, and an opening still under way comes back down. As a progress indicator the opening follows the progress, and on completion the boat passes.
 *
 * Keys: Space approve · Esc deny · P progress +25%.
 */
export function MiniatureDrawbridge(props: MiniatureDrawbridgeProps) {
  return <Miniature {...props} meta={drawbridge} figure={figure} />
}
