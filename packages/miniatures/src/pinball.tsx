import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/pinball'
import { pinball } from './meta/pinball'

export { pinball }
export type MiniaturePinballKey = MiniatureKeyOf<typeof pinball>
export type MiniaturePinballHandle = MiniatureHandle<MiniaturePinballKey>
export interface MiniaturePinballProps extends MiniatureProps {
  ref?: Ref<MiniaturePinballHandle>
}

/**
 * KESTREL STARLINE, pinball. A pinball cabinet on four legs. Under the glass, a ball rolls on a tilted playfield; flippers, a spring plunger, lit pop bumpers, slingshots, drop-in lanes, stand-up targets and a clear ramp score points on the dot-matrix display in the backbox.
 *
 * Keys: Z M flippers · Space hold, release to launch · N new game · T nudge.
 */
export function MiniaturePinball(props: MiniaturePinballProps) {
  return <Miniature {...props} meta={pinball} figure={figure} />
}
