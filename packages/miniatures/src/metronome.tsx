import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/metronome'
import { metronome } from './meta/metronome'

export { metronome }
export type MiniatureMetronomeKey = MiniatureKeyOf<typeof metronome>
export type MiniatureMetronomeHandle = MiniatureHandle<MiniatureMetronomeKey>
export interface MiniatureMetronomeProps extends MiniatureProps {
  ref?: Ref<MiniatureMetronomeHandle>
}

/**
 * TALVEN P–04, metronome. A pyramid case with a sliding-weight pendulum over a tempo scale, a winding key, a spring gauge, an escapement window and a bar bell, beside a practice pad with a beat ring light and two drumsticks. Start the pendulum, slide the weight to change the tempo, wind the spring and set the bar bell. Tap the practice pad: its ring light sweeps with each beat and flashes green on the beat or amber when early or late.
 *
 * Keys: Space start/stop · ↑ ↓ tempo · W wind · P tap · B bell.
 */
export function MiniatureMetronome(props: MiniatureMetronomeProps) {
  return <Miniature {...props} meta={metronome} figure={figure} />
}
