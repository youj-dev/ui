import type { MiniatureMeta } from '../engine/types'

/** VINDRA W–36, wind turbine: what a showroom shows before it mounts. */
export const windTurbine = {
  id: 'wind-turbine',
  name: 'Wind turbine',
  model: 'VINDRA W–36',
  maker: 'VINDRA / WIND POWER',
  study: '051',
  spec: 'W–36 / 3.6 MW · 120 M ROTOR · 92 M HUB · CUT-IN 3 M/S',
  label: 'Wind turbine, VINDRA W–36',
  description:
    'A three-blade wind turbine on a grassy rise: a tapered steel tower with a door and its stair, a nacelle with a cooler, a met mast and an aviation light, a spinner and long twisted blades with red tips, and a small substation whose meter and lamp show the export. The rotor turns with the wind and the readout climbs with the power. A gust spins the blades up; turn the wind and the nacelle yaws to face it, its vane leading; raise the wind and the blades pitch to hold the rated power, and above cut-out they feather. The brake feathers the blades and stops the rotor, which restarts on its own after a hold, or at once on a second press. As a progress indicator the power follows the progress, and on completion it runs at its rated power.',
  keys: [
    { keys: [' '], caps: ['Space'], label: 'gust' },
    { keys: ['ArrowLeft', 'ArrowRight'], caps: ['←', '→'], label: 'wind direction' },
    { keys: ['ArrowUp', 'ArrowDown'], caps: ['↑', '↓'], label: 'wind speed' },
    { keys: ['b'], caps: ['B'], label: 'brake' },
  ],
  initial: { readout: '1.8 MW · 10 M/S', state: 'GENERATING · WIND SSW · 11 RPM', pressed: {} },
  viewBox: '-84.29 -163.43 168.58 186.66',
  progress: true,
} as const satisfies MiniatureMeta
