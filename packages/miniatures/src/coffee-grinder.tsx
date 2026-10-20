import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/coffee-grinder'
import { coffeeGrinder } from './meta/coffee-grinder'

export { coffeeGrinder }
export type MiniatureCoffeeGrinderKey = MiniatureKeyOf<typeof coffeeGrinder>
export type MiniatureCoffeeGrinderHandle = MiniatureHandle<MiniatureCoffeeGrinderKey>
export interface MiniatureCoffeeGrinderProps extends MiniatureProps {
  ref?: Ref<MiniatureCoffeeGrinderHandle>
}

/**
 * VORLEN B–18, coffee grinder. A glass bean hopper feeds flat burrs under a rotating grind collar. The front plate carries a grind dial, a lit dose display and a dose button; a steel chute with a cup light drops the grounds into a glass catch cup on a grilled tray.
 *
 * Keys: Space grind · ↑ ↓ size · D dose.
 */
export function MiniatureCoffeeGrinder(props: MiniatureCoffeeGrinderProps) {
  return <Miniature {...props} meta={coffeeGrinder} figure={figure} />
}
