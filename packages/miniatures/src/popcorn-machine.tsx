import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureProgressHandle, MiniatureKeyOf, MiniatureProgressProps } from './engine/types'
import { figure } from './figures/popcorn-machine'
import { popcornMachine } from './meta/popcorn-machine'

export { popcornMachine }
export type MiniaturePopcornMachineKey = MiniatureKeyOf<typeof popcornMachine>
export type MiniaturePopcornMachineHandle = MiniatureProgressHandle<MiniaturePopcornMachineKey>
export interface MiniaturePopcornMachineProps extends MiniatureProgressProps {
  ref?: Ref<MiniaturePopcornMachineHandle>
}

/**
 * TOVANE K–8, popcorn machine. A cinema popcorn machine on the counter: a red cabinet of glass with a steel kettle hanging from the roof, a heat lamp, a door at the front and a scoop inside, a kernel jar and a butter pump on top, and a striped box beside it. It heats and pops on its own: the first kernels pop slowly, then in a crackling rush that lifts the lids and tumbles popcorn onto the heap, and the empty kettle tips forward to dump the rest. Left running, the cabinet fills until it overflows and the door bursts open onto the counter. Space switches the kettle’s heat off and on, N drops a new batch, B drizzles butter, and S or a click on the door scoops a box. As a progress indicator the heap fills with the progress, and done pops it to the brim and over.
 *
 * Keys: Space heat on / off · N new batch · B butter · S scoop · or click the door.
 */
export function MiniaturePopcornMachine(props: MiniaturePopcornMachineProps) {
  return <Miniature {...props} meta={popcornMachine} figure={figure} />
}
