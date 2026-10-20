'use client'

import { useEffect, useRef } from 'react'
import { MiniatureFirewallAppliance, type MiniatureFirewallApplianceHandle } from '@youj/miniatures/firewall-appliance'

/** The 403's firewall in lockdown, its display on alert: traffic from outside bounces off the WAN port. */
export function Firewall() {
  const ref = useRef<MiniatureFirewallApplianceHandle>(null)
  useEffect(() => {
    ref.current?.press('l')
    ref.current?.press('a')
  }, [])
  return <MiniatureFirewallAppliance ref={ref} interactive={false} size="100%" />
}
