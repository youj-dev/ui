import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/film-projector'
import { filmProjector } from './meta/film-projector'

export { filmProjector }
export type MiniatureFilmProjectorKey = MiniatureKeyOf<typeof filmProjector>
export type MiniatureFilmProjectorHandle = MiniatureHandle<MiniatureFilmProjectorKey>
export interface MiniatureFilmProjectorProps extends MiniatureProps {
  ref?: Ref<MiniatureFilmProjectorHandle>
}

/**
 * NALVEN P–35, film projector. Feed and take-up reels on arms, a film path through sprockets, loops, the gate and a sound drum, a lamphouse with vents and a chimney, a long lens, a motor with belts, and a beam with drifting dust onto a screen. The reel plays by default: a countdown leader runs 5 to 1, then a train crosses a viaduct, until the end card, an automatic rewind and the next show. Run or stop the transport, switch the lamp, focus and frame the picture, rewind, or cue the countdown.
 *
 * Keys: Space run · L lamp · ← → focus · ↑ ↓ framing · R rewind · C countdown.
 */
export function MiniatureFilmProjector(props: MiniatureFilmProjectorProps) {
  return <Miniature {...props} meta={filmProjector} figure={figure} />
}
