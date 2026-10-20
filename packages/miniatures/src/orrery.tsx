import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/orrery'
import { orrery } from './meta/orrery'

export { orrery }
export type MiniatureOrreryKey = MiniatureKeyOf<typeof orrery>
export type MiniatureOrreryHandle = MiniatureHandle<MiniatureOrreryKey>
export interface MiniatureOrreryProps extends MiniatureProps {
  ref?: Ref<MiniatureOrreryHandle>
}

/**
 * FENWICK O–6, orrery. A brass orrery on a square plinth. A side crank drives exposed gearing that turns six planet arms at their relative speeds, Earth carrying its Moon; a frosted lamp sun lights each planet's day side and a mechanical counter shows the date.
 *
 * Keys: ← → crank · Space drive · L lamp · 1 – · 6 planet · R today.
 */
export function MiniatureOrrery(props: MiniatureOrreryProps) {
  return <Miniature {...props} meta={orrery} figure={figure} />
}
