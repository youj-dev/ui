import type { MiniatureMeta } from '../engine/types'

/** NIMBRE D–04, drone dock: what a showroom shows before it mounts. */
export const droneDock = {
  id: 'drone-dock',
  name: 'Drone dock',
  model: 'NIMBRE D–04',
  maker: 'NIMBRE / AERIAL WORKS',
  study: '023',
  spec: 'D–04 / QUAD ROTOR · CONTACT CHARGE · WEATHER MAST',
  label: 'Drone dock, NIMBRE D–04',
  description: 'A quadcopter on a landing pad with an LED target ring, centering bars and charge rails, a weather mast with an anemometer and beacon, and a flight controller with a live view. Take off and the centering bars retract, the rotors spin up to blur discs and the pad ring chases outward while the drone climbs and hovers with a gentle bob. Nudge it with the arrows, land it back and the bars close, the rails light and the battery fills.',
  keys: [
    { keys: ['t'], caps: ['T'], label: 'take off / land', toggle: true },
    {
      keys: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'],
      caps: ['↑ ↓ ← →'],
      label: 'nudge',
    },
    { keys: ['c'], caps: ['C'], label: 'charge', toggle: true },
  ],
  initial: { readout: '0.0 m · 64%', state: 'CHARGING', pressed: { t: false, c: true } },
  viewBox: '-187.20508075688772 -137 400.3909236273086 366',
  progress: false,
} as const satisfies MiniatureMeta
