import type { MiniatureMeta } from '../engine/types'

/** HEARTHCELL HC–13, home battery: what a showroom shows before it mounts. */
export const homeBattery = {
  id: 'home-battery',
  name: 'Home battery',
  model: 'HEARTHCELL HC–13',
  maker: 'HEARTHCELL / HOME ENERGY',
  study: '070',
  spec: 'HC–13 / 13.5 kWh · 5 kW HYBRID INVERTER · 400 W PANEL · BACKUP GATEWAY',
  label: 'Home battery, HEARTHCELL HC–13',
  description: 'A wall-mounted battery, hybrid inverter, backup gateway and utility meter on a house wall, a ground-mounted solar panel and an air-conditioner, with energy flows drawn between them. A day and night cycle drives the solar panel. Energy flows between the panel, the battery, the house and the grid; the battery bar fills and drains, and the meter disc turns forwards or backwards. Cut the grid and the gateway islands the house on the battery.',
  keys: [
    { keys: ['n'], caps: ['N'], label: 'skip 6 h' },
    { keys: ['g'], caps: ['G'], label: 'grid outage', toggle: true },
    { keys: ['l'], caps: ['L'], label: 'air conditioner', toggle: true },
    { keys: ['p'], caps: ['P'], label: 'pause clock', toggle: true },
  ],
  initial: {
    readout: '10:00 · SOLAR 4.2 kW · HOME 0.9 kW · BATTERY 52%',
    state: 'CHARGING',
    pressed: { g: false, l: false, p: false },
  },
  viewBox: '-155.22431864335456 -194 336.4293994002423 347',
  progress: false,
} as const satisfies MiniatureMeta
