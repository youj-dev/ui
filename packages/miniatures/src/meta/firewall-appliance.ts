import type { MiniatureMeta } from '../engine/types'

/** WARDGATE F8, firewall: what a showroom shows before it mounts. */
export const firewallAppliance = {
  id: 'firewall-appliance',
  name: 'Firewall',
  model: 'WARDGATE F8',
  maker: 'WARDGATE / NETWORK SECURITY',
  study: '068',
  spec: 'F8 / 1U · 8 × 2.5GbE · STATEFUL · IPS',
  label: 'Firewall, WARDGATE F8',
  description: 'A 1U appliance with a character display and eight ports, cabled to a fibre terminal on the WAN side and a switch on the LAN side, with traffic shown as moving pulses. Green pulses are allowed and pass through to the LAN; red pulses are blocked and bounce off the WAN port. Launch an attack burst and the firewall writes a rule and raises an alert; lock down, raise the traffic or power the box off.',
  keys: [
    { keys: ['a'], caps: ['A'], label: 'attack burst' },
    { keys: ['t'], caps: ['T'], label: 'traffic' },
    { keys: ['l'], caps: ['L'], label: 'lockdown', toggle: true },
    { keys: ['c'], caps: ['C'], label: 'clear alert' },
    { keys: ['o'], caps: ['O'], label: 'power', toggle: true },
  ],
  initial: {
    readout: '0.0 Gb/s · 0 PASSED · 0 DROPPED',
    state: 'SECURE · 12 RULES',
    pressed: { l: false, o: true },
  },
  viewBox: '-241.8268590217984 -87 494.0460228890101 326',
  progress: false,
} as const satisfies MiniatureMeta
