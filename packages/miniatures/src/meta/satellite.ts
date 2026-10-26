import type { MiniatureMeta } from '../engine/types'

/** TALMIRA CS–7, communications satellite: what a showroom shows before it mounts. */
export const satellite = {
  id: 'satellite',
  name: 'Satellite',
  model: 'TALMIRA CS–7',
  maker: 'TALMIRA / SPACE SEGMENT',
  study: '057',
  spec: 'CS–7 / KU-BAND RELAY · 2.4 M DISH · FOLDING WINGS',
  label: 'Communications satellite, TALMIRA CS–7',
  description:
    'A communications satellite on a display stand: a gold-foil bus with a white radiator, folding solar wings, a dish on a boom with its feed on struts, an omni mast and thruster pods on the top deck. The dish beams down to a ground point on the floor, with data packets running down the beam and replies running back up. Space stows the wings against the bus and deploys them again, panel by panel, and on battery the link drops to a beacon. The arrow keys slew the dish and move the ground point (or click the floor to beam there), and T fires the thrusters. As a progress indicator it shows a sync: a ring fills around the ground point, and on completion the link goes quiet.',
  keys: [
    { keys: [' '], caps: ['Space'], label: 'deploy / stow wings' },
    {
      keys: ['ArrowLeft', 'ArrowUp', 'ArrowDown', 'ArrowRight'],
      caps: ['← ↑ ↓ →'],
      label: 'slew dish',
    },
    { keys: ['t'], caps: ['T'], label: 'thrusters' },
    { keys: ['p'], caps: ['P'], label: 'sync +25%' },
  ],
  initial: { readout: 'LINK 98% · 12.4 MB/S', state: 'LINK UP · SOLAR POWER', pressed: {} },
  viewBox: '-73.81793068761733 -109 147.63586137523467 156',
  progress: true,
} as const satisfies MiniatureMeta
