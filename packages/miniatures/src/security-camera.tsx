import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/security-camera'
import { securityCamera } from './meta/security-camera'

export { securityCamera }
export type MiniatureSecurityCameraKey = MiniatureKeyOf<typeof securityCamera>
export type MiniatureSecurityCameraHandle = MiniatureHandle<MiniatureSecurityCameraKey>
export interface MiniatureSecurityCameraProps extends MiniatureProps {
  ref?: Ref<MiniatureSecurityCameraHandle>
}

/**
 * KEVRA PT–4, security camera. A pan-tilt camera on a wall bracket, watching a paved yard: a long housing under a sun shield, a dark glass front with the lens, a ring of infrared LEDs and a REC light, a yoke on a pan unit with a status ring, and a drip loop down to a junction box with a privacy key switch. It follows your pointer across the yard with a little lag, its field of view marked on the paving, and patrols left and right when the pointer leaves. A fast movement counts as motion: the lens snaps to focus, the event is logged and the floodlight comes on. The arrow keys pan and tilt it by hand, Z zooms, N switches to infrared night vision, P slides the privacy shutter over the lens and parks it, and Space takes a snapshot.
 *
 * Keys: ← ↑ ↓ → pan / tilt · Z zoom · N night vision · P privacy · Space snapshot.
 */
export function MiniatureSecurityCamera(props: MiniatureSecurityCameraProps) {
  return <Miniature {...props} meta={securityCamera} figure={figure} />
}
