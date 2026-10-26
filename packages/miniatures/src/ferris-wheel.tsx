import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureProgressHandle, MiniatureKeyOf, MiniatureProgressProps } from './engine/types'
import { figure } from './figures/ferris-wheel'
import { ferrisWheel } from './meta/ferris-wheel'

export { ferrisWheel }
export type MiniatureFerrisWheelKey = MiniatureKeyOf<typeof ferrisWheel>
export type MiniatureFerrisWheelHandle = MiniatureProgressHandle<MiniatureFerrisWheelKey>
export interface MiniatureFerrisWheelProps extends MiniatureProgressProps {
  ref?: Ref<MiniatureFerrisWheelHandle>
}

/**
 * CORVELLE R–24, ferris wheel. A classic Ferris wheel on two lattice A-frames: a white steel wheel with laced twin rims and spokes, colorful cars that hang level as it turns, lights along the rim and spokes, a boarding deck with steps and a ticket booth with a lit marquee. Space starts or stops it and the arrow keys set its speed. Click a car to send it round to the boarding platform, where riders step on or off, and click it there to send it to the top. B brings the next car down to the platform, and L cycles the lights: twinkle, chase, starburst and rainbow. As a progress indicator the wheel turns as far round as the progress, its rim lights filling in behind car 1, and on completion car 1 comes back to the platform and every light flashes.
 *
 * Keys: Space start / stop · ↑ ↓ speed · L lights · B next car · click a car to send it round.
 */
export function MiniatureFerrisWheel(props: MiniatureFerrisWheelProps) {
  return <Miniature {...props} meta={ferrisWheel} figure={figure} />
}
