import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/vinyl-jukebox'
import { vinylJukebox } from './meta/vinyl-jukebox'

export { vinylJukebox }
export type MiniatureVinylJukeboxKey = MiniatureKeyOf<typeof vinylJukebox>
export type MiniatureVinylJukeboxHandle = MiniatureHandle<MiniatureVinylJukeboxKey>
export interface MiniatureVinylJukeboxProps extends MiniatureProps {
  ref?: Ref<MiniatureVinylJukeboxHandle>
}

/**
 * CARILLON M–100, jukebox. An arched jukebox with color-cycling light pipes and bubble tubes. Behind the window ten records stand in a magazine; choosing one sends a gripper to lift it, flip it onto the turntable and lower the tone arm while the lights cycle with the beat.
 *
 * Keys: 1–0 pick a song · Space reject · C coin · ↑ ↓ volume.
 */
export function MiniatureVinylJukebox(props: MiniatureVinylJukeboxProps) {
  return <Miniature {...props} meta={vinylJukebox} figure={figure} />
}
