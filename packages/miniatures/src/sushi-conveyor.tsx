import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureProgressHandle, MiniatureKeyOf, MiniatureProgressProps } from './engine/types'
import { figure } from './figures/sushi-conveyor'
import { sushiConveyor } from './meta/sushi-conveyor'

export { sushiConveyor }
export type MiniatureSushiConveyorKey = MiniatureKeyOf<typeof sushiConveyor>
export type MiniatureSushiConveyorHandle = MiniatureProgressHandle<MiniatureSushiConveyorKey>
export interface MiniatureSushiConveyorProps extends MiniatureProgressProps {
  ref?: Ref<MiniatureSushiConveyorHandle>
}

/**
 * MAKIRO K–8, sushi conveyor. A conveyor-belt sushi counter: a crescent-slat belt loops round a stainless island, carrying colored plates of nigiri, maki and gunkan past a wooden counter with an order screen, and the kitchen sends fresh plates out from under the noren of its window. Click a plate, or press Space for the one in front of you, to take it off: your stack of empty plates grows, and the order screen tallies them and the bill, priced by plate color. The arrows slow the belt down or speed it up, O orders a fresh plate from the kitchen and C asks for the check. As a progress indicator your stack fills with the progress; on completion the check comes.
 *
 * Keys: Space take the front plate · click any plate · ← → belt speed · O order a fresh plate · C check, please.
 */
export function MiniatureSushiConveyor(props: MiniatureSushiConveyorProps) {
  return <Miniature {...props} meta={sushiConveyor} figure={figure} />
}
