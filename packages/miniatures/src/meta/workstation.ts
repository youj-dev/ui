import type { MiniatureMeta } from '../engine/types'

/** KELVIN T7, workstation: what a showroom shows before it mounts. */
export const workstation = {
  id: 'workstation',
  name: 'Workstation',
  model: 'KELVIN T7',
  maker: 'KELVIN / COMPUTE',
  study: '045',
  spec: 'T7 / 24-CORE · 24 GB GPU · 128 GB · 1000 W',
  label: 'Workstation, KELVIN T7',
  description: 'A glass-paneled tower: motherboard, tower cooler, four memory sticks, a graphics card, front and rear fans, a power supply shroud and a drive cage. Run a render to ramp the load, switch the fan profile and the lights, or power it down.',
  keys: [
    { keys: ['o'], caps: ['O'], label: 'power' },
    { keys: ['r'], caps: ['R'], label: 'render' },
    { keys: ['s'], caps: ['S'], label: 'silent fans' },
    { keys: ['l'], caps: ['L'], label: 'lights' },
  ],
  initial: { readout: 'CPU 36°C · GPU 33°C · 92 W', state: 'IDLE', pressed: {  } },
  viewBox: '-94.47818472546172 -152 244.38199529312752 290',
  progress: false,
} as const satisfies MiniatureMeta
