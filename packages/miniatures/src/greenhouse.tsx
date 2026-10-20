import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/greenhouse'
import { greenhouse } from './meta/greenhouse'

export { greenhouse }
export type MiniatureGreenhouseKey = MiniatureKeyOf<typeof greenhouse>
export type MiniatureGreenhouseHandle = MiniatureHandle<MiniatureGreenhouseKey>
export interface MiniatureGreenhouseProps extends MiniatureProps {
  ref?: Ref<MiniatureGreenhouseHandle>
}

/**
 * VERDA G–14, greenhouse. A white-framed glasshouse with glazing bars, a crested ridge, gutters and a downpipe to a water butt. Inside, slatted benches hold seed trays, ferns, succulents, geraniums and herbs; tomatoes climb canes at the far end and a citrus stands by the door. Open the vents, mist, switch the grow lights and fan, and turn day to night while the plants grow.
 *
 * Keys: V vents · M mist · L grow lights · F fan · N day / night.
 */
export function MiniatureGreenhouse(props: MiniatureGreenhouseProps) {
  return <Miniature {...props} meta={greenhouse} figure={figure} />
}
