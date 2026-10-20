import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/cuckoo-clock'
import { cuckooClock } from './meta/cuckoo-clock'

export { cuckooClock }
export type MiniatureCuckooClockKey = MiniatureKeyOf<typeof cuckooClock>
export type MiniatureCuckooClockHandle = MiniatureHandle<MiniatureCuckooClockKey>
export interface MiniatureCuckooClockProps extends MiniatureProps {
  ref?: Ref<MiniatureCuckooClockHandle>
}

/**
 * WALDEGG K–12, cuckoo clock. A chalet cuckoo clock with a shingled roof, fretwork bargeboards, a carved bird finial, a dial in a leaf wreath, a shuttered side window with a flower box, two pine-cone weights and a swinging leaf pendulum. On the hour the door opens and the bird calls.
 *
 * Keys: H next hour · Space stop · W wind · F fast ×60.
 */
export function MiniatureCuckooClock(props: MiniatureCuckooClockProps) {
  return <Miniature {...props} meta={cuckooClock} figure={figure} />
}
