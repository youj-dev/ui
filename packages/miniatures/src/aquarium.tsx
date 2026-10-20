import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/aquarium'
import { aquarium } from './meta/aquarium'

export { aquarium }
export type MiniatureAquariumKey = MiniatureKeyOf<typeof aquarium>
export type MiniatureAquariumHandle = MiniatureHandle<MiniatureAquariumKey>
export interface MiniatureAquariumProps extends MiniatureProps {
  ref?: Ref<MiniatureAquariumHandle>
}

/**
 * TIDEWELL A–90, planted aquarium. A 90 cm planted tank on a two-door cabinet: aqua soil, stem plants, a sword plant, driftwood and stones, a school of neon tetras and an angelfish. A heater holds the set temperature, an internal filter stirs the surface, an airstone bubbles and a suspended light bar switches between daylight and a blue moonlight.
 *
 * Keys: F feed · L night light · B air · ↑ ↓ heater.
 */
export function MiniatureAquarium(props: MiniatureAquariumProps) {
  return <Miniature {...props} meta={aquarium} figure={figure} />
}
