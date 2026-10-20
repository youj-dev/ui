import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/instant-camera'
import { instantCamera } from './meta/instant-camera'

export { instantCamera }
export type MiniatureInstantCameraKey = MiniatureKeyOf<typeof instantCamera>
export type MiniatureInstantCameraHandle = MiniatureHandle<MiniatureInstantCameraKey>
export interface MiniatureInstantCameraProps extends MiniatureProps {
  ref?: Ref<MiniatureInstantCameraHandle>
}

/**
 * ORLUN F–08, instant camera. An instant camera with a chrome top plate, leatherette body, telescoping lens with a knurled focus ring, flash with charge lamp, viewfinder, light meter, self-timer lamp, wrist strap and a hinged film door; prints feed out of the front slot and develop.
 *
 * Keys: Space shutter · T self-timer · F flash · Z focus · D film door · P collect print · or click it.
 */
export function MiniatureInstantCamera(props: MiniatureInstantCameraProps) {
  return <Miniature {...props} meta={instantCamera} figure={figure} />
}
