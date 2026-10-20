import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/espresso'
import { espresso } from './meta/espresso'

export { espresso }
export type MiniatureEspressoKey = MiniatureKeyOf<typeof espresso>
export type MiniatureEspressoHandle = MiniatureHandle<MiniatureEspressoKey>
export interface MiniatureEspressoProps extends MiniatureProps {
  ref?: Ref<MiniatureEspressoHandle>
}

/**
 * VORLEN E–09, espresso machine. Espresso machine with a cup warmer and two cups on top, a lever group head with cup lights, a pressure gauge, twin spouts over a cup on its saucer, a steam wand and a reservoir window.
 *
 * Keys: O power · 1 single · 2 double · S steam · R refill · C cup.
 */
export function MiniatureEspresso(props: MiniatureEspressoProps) {
  return <Miniature {...props} meta={espresso} figure={figure} />
}
