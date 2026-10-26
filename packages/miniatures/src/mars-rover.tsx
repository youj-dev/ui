import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/mars-rover'
import { marsRover } from './meta/mars-rover'

export { marsRover }
export type MiniatureMarsRoverKey = MiniatureKeyOf<typeof marsRover>
export type MiniatureMarsRoverHandle = MiniatureHandle<MiniatureMarsRoverKey>
export interface MiniatureMarsRoverProps extends MiniatureProps {
  ref?: Ref<MiniatureMarsRoverHandle>
}

/**
 * SOLRAN PX–6, mars rover. A six-wheeled rover on a patch of dusty red ground: a white body under a solar deck, a mast with stereo camera eyes, a dish and a whip antenna, a robotic arm folded at its nose, and a rocker-bogie that lets each wheel ride over rocks on its own. The up and down arrows drive it and the ground rolls by under its wheels; left and right turn it on the spot, its corner wheels steering in. The mast follows your pointer. Space unfolds the arm to the nearest rock, drills a core in a puff of dust and stows it; P sweeps the mast for a panorama and fires the flash. Left alone, it drives, samples and looks around by itself.
 *
 * Keys: ↑ ↓ ← → drive / steer · Space sample · P panorama.
 */
export function MiniatureMarsRover(props: MiniatureMarsRoverProps) {
  return <Miniature {...props} meta={marsRover} figure={figure} />
}
