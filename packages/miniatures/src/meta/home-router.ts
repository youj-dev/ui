import type { MiniatureMeta } from '../engine/types'

/** ARC 7, home router: what a showroom shows before it mounts. */
export const homeRouter = {
  id: 'home-router',
  name: 'Home router',
  model: 'ARC 7',
  maker: 'ARC / HOME NETWORKS',
  study: '044',
  spec: 'ARC 7 / TRI-BAND WI-FI 7 · 1 Gb/s FIBER',
  label: 'Home router, ARC 7',
  description: 'An ARC 7 Wi-Fi router with four antennas, a fiber ONT, a laptop, a phone and a smart speaker. A Wi-Fi router fed by a fiber ONT, with a laptop, phone and speaker around it. Join or drop devices, cut and restore the fiber, or reboot the router and watch everything reconnect.',
  keys: [
    { keys: ['1'], caps: ['1'], label: 'laptop' },
    { keys: ['2'], caps: ['2'], label: 'phone' },
    { keys: ['3'], caps: ['3'], label: 'speaker' },
    { keys: ['f'], caps: ['F'], label: 'fiber' },
    { keys: ['r'], caps: ['R'], label: 'reboot' },
  ],
  initial: { readout: '3 DEVICES · 0 Mb/s', state: 'ONLINE', pressed: {  } },
  viewBox: '-101.13843876330611 -69 330.44863728670913 265',
  progress: false,
} as const satisfies MiniatureMeta
