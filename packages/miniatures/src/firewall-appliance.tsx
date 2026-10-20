import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/firewall-appliance'
import { firewallAppliance } from './meta/firewall-appliance'

export { firewallAppliance }
export type MiniatureFirewallApplianceKey = MiniatureKeyOf<typeof firewallAppliance>
export type MiniatureFirewallApplianceHandle = MiniatureHandle<MiniatureFirewallApplianceKey>
export interface MiniatureFirewallApplianceProps extends MiniatureProps {
  ref?: Ref<MiniatureFirewallApplianceHandle>
}

/**
 * WARDGATE F8, firewall. A 1U appliance with a character display and eight ports, cabled to a fibre terminal on the WAN side and a switch on the LAN side, with traffic shown as moving pulses. Green pulses are allowed and pass through to the LAN; red pulses are blocked and bounce off the WAN port. Launch an attack burst and the firewall writes a rule and raises an alert; lock down, raise the traffic or power the box off.
 *
 * Keys: A attack burst · T traffic · L lockdown · C clear alert · O power.
 */
export function MiniatureFirewallAppliance(props: MiniatureFirewallApplianceProps) {
  return <Miniature {...props} meta={firewallAppliance} figure={figure} />
}
