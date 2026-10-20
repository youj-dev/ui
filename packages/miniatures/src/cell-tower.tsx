import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/cell-tower'
import { cellTower } from './meta/cell-tower'

export { cellTower }
export type MiniatureCellTowerKey = MiniatureKeyOf<typeof cellTower>
export type MiniatureCellTowerHandle = MiniatureHandle<MiniatureCellTowerKey>
export interface MiniatureCellTowerProps extends MiniatureProps {
  ref?: Ref<MiniatureCellTowerHandle>
}

/**
 * VEKTA M–3, cell tower. A tall tapered four-leg lattice tower with three antenna sectors and their radios, a cable ladder, a microwave link and aviation lights, over a fenced compound with an equipment cabinet, batteries and an ice bridge, a road with a car, and the three sector coverage areas painted on the ground. Raise or lower the traffic and the coverage rings, phones and radio lamps follow. Pick a sector, drive the car across the road to hand it over from one sector to the next, or cut the power: every sector drops, the cabinet raises its alarm and the radios come back one by one.
 *
 * Keys: ↑ ↓ traffic · H handover · O outage · 1–3 sector.
 */
export function MiniatureCellTower(props: MiniatureCellTowerProps) {
  return <Miniature {...props} meta={cellTower} figure={figure} />
}
