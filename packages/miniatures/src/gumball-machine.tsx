import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/gumball-machine'
import { gumballMachine } from './meta/gumball-machine'

export { gumballMachine }
export type MiniatureGumballMachineKey = MiniatureKeyOf<typeof gumballMachine>
export type MiniatureGumballMachineHandle = MiniatureHandle<MiniatureGumballMachineKey>
export interface MiniatureGumballMachineProps extends MiniatureProps {
  ref?: Ref<MiniatureGumballMachineHandle>
}

/**
 * TWILLBY G–5, gumball machine. A glass globe full of bright gumballs on a red cast-metal body, with a coin slot, a chrome turn crank and a spiral of wire that winds down round a post to a little flap door and a cup. Press Space or Enter, click the crank or drag it round: a gumball drops out under the body, rolls down the spiral, swings the flap open and lands in the cup. Each turn takes a coin: C drops one in. The globe empties as you go, D takes the gumballs from the cup and R lifts the cap to refill it. Left alone, it serves itself now and then.
 *
 * Keys: Space Enter turn the crank · C coin · D take · R refill · drag the crank.
 */
export function MiniatureGumballMachine(props: MiniatureGumballMachineProps) {
  return <Miniature {...props} meta={gumballMachine} figure={figure} />
}
