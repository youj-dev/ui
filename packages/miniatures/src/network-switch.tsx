import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/network-switch'
import { networkSwitch } from './meta/network-switch'

export { networkSwitch }
export type MiniatureNetworkSwitchKey = MiniatureKeyOf<typeof networkSwitch>
export type MiniatureNetworkSwitchHandle = MiniatureHandle<MiniatureNetworkSwitchKey>
export interface MiniatureNetworkSwitchProps extends MiniatureProps {
  ref?: Ref<MiniatureNetworkSwitchHandle>
}

/**
 * ORRIS S8–X, network switch. A four-unit open rack: a twelve-port keystone patch panel, a D-ring cable manager, an eight-port switch with two SFP+ cages and a power strip with an ammeter. Patch ports, change the traffic load, fail a port and watch it recover.
 *
 * Keys: O power · 1–8 patch · T traffic · F fail a port.
 */
export function MiniatureNetworkSwitch(props: MiniatureNetworkSwitchProps) {
  return <Miniature {...props} meta={networkSwitch} figure={figure} />
}
