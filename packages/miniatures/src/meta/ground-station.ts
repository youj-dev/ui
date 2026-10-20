import type { MiniatureMeta } from '../engine/types'

/** SKARN GS–2, ground station: what a showroom shows before it mounts. */
export const groundStation = {
  id: 'ground-station',
  name: 'Ground station',
  model: 'SKARN GS–2',
  maker: 'SKARN / GROUND SEGMENT',
  study: '034',
  spec: 'GS–2 / 9 M X-BAND · AZ/EL PEDESTAL · NOVA–7 PASS',
  label: 'Ground station, SKARN GS–2',
  description: 'A nine-metre dish on an azimuth–elevation pedestal with a feed horn on four struts, a cable tray to an equipment shelter with racks behind its window and door, a signal meter, and a satellite pass arcing across the sky. Track a pass and the dish slews to the rising satellite, locks on and follows it across the sky while a beam links the feed to the satellite, the signal meter climbs, and data packets run down the pedestal and along the cable tray into the racks. Jog the dish by hand, stow it, or open the shelter door.',
  keys: [
    { keys: [' '], caps: ['Space'], label: 'track pass', toggle: true },
    { keys: ['ArrowLeft', 'ArrowRight'], caps: ['← →'], label: 'azimuth' },
    { keys: ['ArrowUp', 'ArrowDown'], caps: ['↑ ↓'], label: 'elevation' },
    { keys: ['s'], caps: ['S'], label: 'stow' },
    { keys: ['d'], caps: ['D'], label: 'door', toggle: true },
  ],
  initial: {
    readout: 'AZ 45.0° · EL 90.0° · SNR 0.0 dB',
    state: 'STOWED · SPACE FOR NEXT PASS',
    pressed: { ' ': false, d: false },
  },
  viewBox: '-182.27687752661222 -98 347.23324697753566 264',
  progress: false,
} as const satisfies MiniatureMeta
