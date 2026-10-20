import type { MiniatureMeta } from '../engine/types'

/** AUVEN H–21, thermostat & boiler: what a showroom shows before it mounts. */
export const thermostatBoiler = {
  id: 'thermostat-boiler',
  name: 'Thermostat and boiler',
  model: 'AUVEN H–21',
  maker: 'AUVEN / CLIMATE WORKS',
  study: '021',
  spec: 'H–21 / MODULATING LOOP · 16–26 °C',
  label: 'Thermostat and boiler, AUVEN H–21',
  description: 'A combi boiler with its flue and valve manifold, a round wall thermostat with a ring light, copper flow and return pipes and a column radiator with a thermostatic valve. Turn or drag the thermostat dial to set the room temperature. When the room is below target the boiler fires, heat travels along the copper flow pipe and the radiator warms column by column. Eco lowers the target by two degrees, boost fires the burner regardless, and the bleed valve lets trapped air out.',
  keys: [
    { keys: ['ArrowUp', 'ArrowDown'], caps: ['↑', '↓'], label: 'setpoint' },
    { keys: ['e'], caps: ['E'], label: 'eco', toggle: true },
    { keys: ['f'], caps: ['F'], label: 'flame', toggle: true },
    { keys: ['v'], caps: ['V'], label: 'bleed', toggle: true },
  ],
  initial: {
    readout: '19.2 °C → 19.0 °C',
    state: 'AT TEMPERATURE',
    pressed: { e: false, f: false, v: false },
  },
  viewBox: '-69.42562584220407 -264 360.5537550532244 470',
  progress: false,
} as const satisfies MiniatureMeta
