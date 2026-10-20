import type { MiniatureMeta } from '../engine/types'

/** ORRIS S8–X, network switch: what a showroom shows before it mounts. */
export const networkSwitch = {
  id: 'network-switch',
  name: 'Network switch',
  model: 'ORRIS S8–X',
  maker: 'ORRIS / NETWORK SYSTEMS',
  study: '041',
  spec: 'S8–X / 8 × 2.5G · 2 × SFP+ · 10" 4U',
  label: 'Network switch, ORRIS S8–X',
  description: 'A four-unit open rack: a twelve-port keystone patch panel, a D-ring cable manager, an eight-port switch with two SFP+ cages and a power strip with an ammeter. Patch ports, change the traffic load, fail a port and watch it recover.',
  keys: [
    { keys: ['o'], caps: ['O'], label: 'power' },
    { keys: ['1', '2', '3', '4', '5', '6', '7', '8'], caps: ['1–8'], label: 'patch' },
    { keys: ['t'], caps: ['T'], label: 'traffic' },
    { keys: ['f'], caps: ['F'], label: 'fail a port' },
  ],
  initial: { readout: '5/8 UP · 0.00 Gb/s', state: 'FORWARDING', pressed: {  } },
  viewBox: '-96.2102355330306 -129 227.92751262122317 249.5',
  progress: false,
} as const satisfies MiniatureMeta
