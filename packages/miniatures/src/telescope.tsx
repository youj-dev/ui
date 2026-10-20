import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/telescope'
import { telescope } from './meta/telescope'

export { telescope }
export type MiniatureTelescopeKey = MiniatureKeyOf<typeof telescope>
export type MiniatureTelescopeHandle = MiniatureHandle<MiniatureTelescopeKey>
export interface MiniatureTelescopeProps extends MiniatureProps {
  ref?: Ref<MiniatureTelescopeHandle>
}

/**
 * ORVANE R–80, refractor telescope. Arrow keys slew the right ascension and declination axes. Pick the Moon, Saturn or Jupiter with 1, 2 or 3 and the mount slews to it. T engages sidereal tracking, F racks the focuser and L switches the controller and reticle to red night light.
 *
 * Keys: ← ↑ ↓ → slew · 1–3 target · T tracking · F focus · L red light.
 */
export function MiniatureTelescope(props: MiniatureTelescopeProps) {
  return <Miniature {...props} meta={telescope} figure={figure} />
}
