import type { MiniatureMeta } from '../engine/types'

/** NIVALIS PX–30, precision cooling: what a showroom shows before it mounts. */
export const coolingUnit = {
  id: 'cooling-unit',
  name: 'Precision cooling',
  model: 'NIVALIS PX–30',
  maker: 'NIVALIS / PRECISION COOLING',
  study: '069',
  spec: 'PX–30 / 30 kW DOWNFLOW · EC FANS · 600 MM RAISED FLOOR',
  label: 'Precision cooling, NIVALIS PX–30',
  description: 'The unit blows cold air under the raised floor; it rises through perforated tiles into the rack fronts and returns hot over the racks. Raise the IT load and the fans stage up; change the supply setpoint; clog the filter to trigger an alarm; switch the unit off and watch the inlets heat up.',
  keys: [
    { keys: ['l'], caps: ['L'], label: 'IT load' },
    { keys: ['s'], caps: ['S'], label: 'setpoint' },
    { keys: ['f'], caps: ['F'], label: 'filter', toggle: true },
    { keys: ['o'], caps: ['O'], label: 'unit power', toggle: true },
  ],
  initial: {
    readout: 'SUPPLY 18.0°C · RETURN 28.0°C · LOAD 50%',
    state: 'FAN STAGE 2/3 · INLETS OK',
    pressed: { f: false, o: true },
  },
  viewBox: '-94.60254037844386 -134 289.6640275958826 300',
  progress: false,
} as const satisfies MiniatureMeta
