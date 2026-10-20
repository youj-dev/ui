import type { MiniatureMeta } from '../engine/types'

/** NORDLYS C–17, server cabinet: what a showroom shows before it mounts. */
export const serverCabinet = {
  id: 'server-cabinet',
  name: 'Server cabinet',
  model: 'NORDLYS C–17',
  maker: 'NORDLYS / DATA SYSTEMS',
  study: '032',
  spec: 'C–17 / 17U · 6 NODES · 24-PORT SWITCH',
  label: 'Server cabinet, NORDLYS C–17',
  description: 'An enclosed cabinet behind a smoked-glass door. Power nodes on, raise the workload, fail and recover a node, open the door or switch the room lights off.',
  keys: [
    { keys: ['1', '2', '3', '4', '5', '6'], caps: ['1–6'], label: 'power' },
    { keys: ['l'], caps: ['L'], label: 'load' },
    { keys: ['f'], caps: ['F'], label: 'fail' },
    { keys: ['r'], caps: ['R'], label: 'recover' },
    { keys: ['d'], caps: ['D'], label: 'door', toggle: true },
    { keys: ['n'], caps: ['N'], label: 'lights out', toggle: true },
  ],
  initial: {
    readout: '4/6 ONLINE · 2.5 kW · 26°C · 9.4 Gb/s',
    state: 'LOAD 45% · DOOR CLOSED',
    pressed: { d: false, n: false },
  },
  viewBox: '-125.92304845413263 -236 298.61146871262497 393',
  progress: false,
} as const satisfies MiniatureMeta
