import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/vintage-camera'
import { vintageCamera } from './meta/vintage-camera'

export { vintageCamera }
export type MiniatureVintageCameraKey = MiniatureKeyOf<typeof vintageCamera>
export type MiniatureVintageCameraHandle = MiniatureHandle<MiniatureVintageCameraKey>
export interface MiniatureVintageCameraProps extends MiniatureProps {
  ref?: Ref<MiniatureVintageCameraHandle>
}

/**
 * AVOCET HX–2, mirrorless camera. A heritage-styled camera. Turn the dials and the aperture ring and the live view brightens or darkens; turn the focus ring and the cactus or the city lights behind it come into focus. Release the shutter, flip the screen in and out, or switch the camera off.
 *
 * Keys: O power · Space shutter · S I E dials · A aperture · ← → focus · F flip screen · ⇧ reverse.
 */
export function MiniatureVintageCamera(props: MiniatureVintageCameraProps) {
  return <Miniature {...props} meta={vintageCamera} figure={figure} />
}
