import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/crt-television'
import { crtTelevision } from './meta/crt-television'

export { crtTelevision }
export type MiniatureCrtTelevisionKey = MiniatureKeyOf<typeof crtTelevision>
export type MiniatureCrtTelevisionHandle = MiniatureHandle<MiniatureCrtTelevisionKey>
export interface MiniatureCrtTelevisionProps extends MiniatureProps {
  ref?: Ref<MiniatureCrtTelevisionHandle>
}

/**
 * ORBITONE 23–C, television. A walnut cabinet on splayed legs with a curved picture tube, a channel dial, a volume knob, a speaker and a rabbit-ear antenna. A 1960s console television. Power on and a bright dot grows into the picture; click through channels of test card, news, a rocket launch, cartoons, a western and snow; turn the antenna to clear the picture.
 *
 * Keys: O power · ← → channel · A antenna · ↑ ↓ volume.
 */
export function MiniatureCrtTelevision(props: MiniatureCrtTelevisionProps) {
  return <Miniature {...props} meta={crtTelevision} figure={figure} />
}
